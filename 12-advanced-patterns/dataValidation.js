/**
 * TOPIC: DATA VALIDATION AND MIGRATION
 * DESCRIPTION:
 * Patterns for ensuring data quality, validating documents,
 * and safely migrating data in MongoDB.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. DATA QUALITY CHECKS
// -------------------------------------------------------------------------------------------

async function dataQualityChecks() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Find documents with missing required fields
        const missingEmail = await collection.find({
            $or: [
                { email: { $exists: false } },
                { email: null },
                { email: '' }
            ]
        }).toArray();
        
        // Find documents with wrong types
        const wrongTypes = await collection.find({
            $or: [
                { age: { $type: 'string' } },      // Age should be number
                { email: { $not: { $type: 'string' } } }
            ]
        }).toArray();
        
        // Find duplicates
        const duplicates = await collection.aggregate([
            { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } }
        ]).toArray();
        
        // Find outliers
        const outliers = await collection.find({
            $or: [
                { age: { $lt: 0 } },
                { age: { $gt: 150 } }
            ]
        }).toArray();
        
        return { missingEmail, wrongTypes, duplicates, outliers };
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. DATA CLEANUP
// -------------------------------------------------------------------------------------------

async function dataCleanup() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Fix type mismatches
        await collection.updateMany(
            { age: { $type: 'string' } },
            [{ $set: { age: { $toInt: '$age' } } }]
        );
        
        // Trim whitespace from strings
        await collection.updateMany(
            {},
            [{ $set: { email: { $trim: { input: '$email' } } } }]
        );
        
        // Set defaults for missing fields
        await collection.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'active' } }
        );
        
        // Remove empty optional fields
        await collection.updateMany(
            { middleName: '' },
            { $unset: { middleName: '' } }
        );
        
        console.log('Data cleanup complete');
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. SCHEMA MIGRATION
// -------------------------------------------------------------------------------------------

async function schemaMigration() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Add schemaVersion field to track migrations
        await collection.updateMany(
            { schemaVersion: { $exists: false } },
            { $set: { schemaVersion: 1 } }
        );
        
        // Migration v1 -> v2: Split name into firstName/lastName
        await collection.updateMany(
            { schemaVersion: 1, name: { $exists: true } },
            [
                {
                    $set: {
                        firstName: { $arrayElemAt: [{ $split: ['$name', ' '] }, 0] },
                        lastName: { $arrayElemAt: [{ $split: ['$name', ' '] }, 1] },
                        schemaVersion: 2
                    }
                },
                { $unset: 'name' }
            ]
        );
        
        // Migration v2 -> v3: Add timestamps
        await collection.updateMany(
            { schemaVersion: 2 },
            {
                $set: {
                    schemaVersion: 3,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );
        
        console.log('Migration complete');
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. BATCH MIGRATION (Large Collections)
// -------------------------------------------------------------------------------------------

async function batchMigration() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('largeCollection');
        
        const batchSize = 1000;
        let lastId = null;
        let totalProcessed = 0;
        
        while (true) {
            // Get next batch
            const query = lastId
                ? { _id: { $gt: lastId }, schemaVersion: { $lt: 3 } }
                : { schemaVersion: { $lt: 3 } };
            
            const batch = await collection.find(query)
                .sort({ _id: 1 })
                .limit(batchSize)
                .toArray();
            
            if (batch.length === 0) break;
            
            // Process batch
            const bulkOps = batch.map(doc => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { schemaVersion: 3, migratedAt: new Date() } }
                }
            }));
            
            await collection.bulkWrite(bulkOps);
            
            lastId = batch[batch.length - 1]._id;
            totalProcessed += batch.length;
            
            console.log(`Processed ${totalProcessed} documents`);
            
            // Throttle to prevent overload
            await new Promise(r => setTimeout(r, 100));
        }
        
        console.log(`Migration complete: ${totalProcessed} documents`);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. VALIDATION RULES
// -------------------------------------------------------------------------------------------

async function addValidationRules() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Add validation to existing collection
        await db.command({
            collMod: 'users',
            validator: {
                $jsonSchema: {
                    required: ['email', 'firstName'],
                    properties: {
                        email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
                        firstName: { bsonType: 'string', minLength: 1 },
                        age: { bsonType: 'int', minimum: 0 }
                    }
                }
            },
            validationLevel: 'moderate',  // Only validate new/modified docs
            validationAction: 'warn'      // Log warnings, don't reject
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * DATA VALIDATION:
 * 
 * 1. Run quality checks before migration
 * 2. Use schemaVersion for tracking
 * 3. Batch process large collections
 * 4. Use 'moderate' validation during migration
 * 
 * BEST PRACTICES:
 * - Backup before migrations
 * - Test on staging first
 * - Use batching for large datasets
 * - Monitor performance during migration
 * - Add validation rules after migration
 */

module.exports = {
    dataQualityChecks,
    dataCleanup,
    schemaMigration,
    batchMigration,
    addValidationRules
};
