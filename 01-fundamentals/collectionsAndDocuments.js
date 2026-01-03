/**
 * TOPIC: COLLECTIONS AND DOCUMENTS
 * DESCRIPTION:
 * Collections are groups of MongoDB documents, similar to tables in
 * relational databases. Documents are the basic unit of data in MongoDB.
 */

// -------------------------------------------------------------------------------------------
// 1. UNDERSTANDING DOCUMENTS
// -------------------------------------------------------------------------------------------

/**
 * Document Characteristics:
 * - BSON format (Binary JSON)
 * - Maximum size: 16MB
 * - Must have _id field (auto-generated if not provided)
 * - Dynamic schema (fields can differ between documents)
 */

const userDocuments = [
    {
        _id: 1,
        name: "Alice",
        email: "alice@example.com",
        age: 28,
        roles: ["user", "admin"]
    },
    {
        _id: 2,
        name: "Bob",
        email: "bob@example.com",
        department: "Engineering",  // Different fields allowed
        roles: ["user"]
    }
];

console.log("User Documents:", JSON.stringify(userDocuments, null, 2));

// -------------------------------------------------------------------------------------------
// 2. COLLECTION TYPES
// -------------------------------------------------------------------------------------------

/**
 * COLLECTION TYPES:
 * - Regular: Standard collections
 * - Capped: Fixed size, FIFO order
 * - Time Series: Optimized for time-series data (5.0+)
 * - Views: Read-only, computed from aggregation
 */

const { MongoClient } = require('mongodb');

async function createCollections() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Regular collection with validation
        await db.createCollection('users', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['name', 'email'],
                    properties: {
                        name: { bsonType: 'string' },
                        email: { bsonType: 'string' }
                    }
                }
            }
        });
        
        // Capped collection for logs
        await db.createCollection('logs', {
            capped: true,
            size: 10485760,  // 10MB
            max: 10000       // Max 10000 docs
        });
        
        // Time series collection
        await db.createCollection('sensorData', {
            timeseries: {
                timeField: 'timestamp',
                metaField: 'sensorId',
                granularity: 'minutes'
            },
            expireAfterSeconds: 604800  // 7 days
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. COLLECTION MANAGEMENT
// -------------------------------------------------------------------------------------------

async function manageCollections() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // List collections
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));
        
        // Check if exists
        const exists = await db.listCollections({ name: 'users' }).hasNext();
        console.log("Users exists:", exists);
        
        // Rename collection
        await db.collection('oldName').rename('newName');
        
        // Drop collection
        await db.collection('tempCollection').drop();
        
        // Collection stats
        const stats = await db.collection('users').stats();
        console.log("Stats:", {
            count: stats.count,
            size: stats.size,
            avgObjSize: stats.avgObjSize
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. DOCUMENT OPERATIONS
// -------------------------------------------------------------------------------------------

async function documentOperations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Insert one
        const result = await collection.insertOne({
            name: "John",
            email: "john@example.com",
            createdAt: new Date()
        });
        console.log("Inserted:", result.insertedId);
        
        // Insert many
        await collection.insertMany([
            { name: "Alice", email: "alice@example.com" },
            { name: "Bob", email: "bob@example.com" }
        ]);
        
        // Find
        const user = await collection.findOne({ name: "John" });
        const users = await collection.find({}).toArray();
        
        // Update
        await collection.updateOne(
            { name: "John" },
            { $set: { verified: true } }
        );
        
        // Delete
        await collection.deleteOne({ name: "Bob" });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * KEY POINTS:
 * 1. Documents: BSON format, 16MB limit, must have _id
 * 2. Collections: Created implicitly or explicitly
 * 3. Capped collections: Fixed size, FIFO order, for logs
 * 4. Time series: Optimized for temporal data
 * 5. Views: Read-only computed collections
 * 
 * BEST PRACTICES:
 * - Use validation for data integrity
 * - Consistent naming conventions
 * - Monitor collection sizes
 * - Use expireAfterSeconds for auto-cleanup
 */

module.exports = { createCollections, manageCollections, documentOperations };
