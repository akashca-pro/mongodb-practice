/**
 * TOPIC: ELEMENT OPERATORS
 * DESCRIPTION:
 * Element operators query documents by field existence and type.
 * Use $exists and $type to filter based on schema characteristics.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. $EXISTS OPERATOR
// -------------------------------------------------------------------------------------------

async function existsOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Field exists (regardless of value, including null)
        const hasEmail = await collection.find({
            email: { $exists: true }
        }).toArray();
        
        // Field does not exist
        const noPhone = await collection.find({
            phone: { $exists: false }
        }).toArray();
        
        // Exists AND has value (not null)
        const hasValidEmail = await collection.find({
            email: { $exists: true, $ne: null }
        }).toArray();
        
        // Common pattern: Find documents missing required field
        const incomplete = await collection.find({
            $or: [
                { name: { $exists: false } },
                { email: { $exists: false } }
            ]
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. $TYPE OPERATOR
// -------------------------------------------------------------------------------------------

async function typeOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('mixed');
        
        // By type name (string alias)
        const strings = await collection.find({ value: { $type: "string" } }).toArray();
        const numbers = await collection.find({ value: { $type: "number" } }).toArray();
        const arrays = await collection.find({ value: { $type: "array" } }).toArray();
        const objects = await collection.find({ value: { $type: "object" } }).toArray();
        const dates = await collection.find({ value: { $type: "date" } }).toArray();
        const booleans = await collection.find({ value: { $type: "bool" } }).toArray();
        const nulls = await collection.find({ value: { $type: "null" } }).toArray();
        const objectIds = await collection.find({ value: { $type: "objectId" } }).toArray();
        
        // By BSON type number
        const stringsByNum = await collection.find({ value: { $type: 2 } }).toArray();
        
        // Multiple types
        const stringOrInt = await collection.find({
            value: { $type: ["string", "int", "double"] }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. BSON TYPE REFERENCE
// -------------------------------------------------------------------------------------------

/**
 * BSON TYPES:
 * 
 * Type Number | Alias         | Description
 * ------------|---------------|-------------------
 * 1           | "double"      | 64-bit floating point
 * 2           | "string"      | UTF-8 string
 * 3           | "object"      | Embedded document
 * 4           | "array"       | Array
 * 5           | "binData"     | Binary data
 * 6           | "undefined"   | Deprecated
 * 7           | "objectId"    | ObjectId
 * 8           | "bool"        | Boolean
 * 9           | "date"        | Date
 * 10          | "null"        | Null
 * 11          | "regex"       | Regular expression
 * 13          | "javascript"  | JavaScript code
 * 14          | "symbol"      | Symbol (deprecated)
 * 16          | "int"         | 32-bit integer
 * 17          | "timestamp"   | Timestamp
 * 18          | "long"        | 64-bit integer
 * 19          | "decimal"     | 128-bit decimal
 * -1          | "minKey"      | Min key
 * 127         | "maxKey"      | Max key
 * 
 * "number" matches: int, long, double, decimal
 */

// -------------------------------------------------------------------------------------------
// 4. PRACTICAL EXAMPLES
// -------------------------------------------------------------------------------------------

async function practicalExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Find documents with schema issues
        const schemaIssues = await db.collection('users').find({
            $or: [
                { age: { $type: "string" } },    // Age stored as string
                { email: { $type: "null" } },    // Null email
                { createdAt: { $type: "string" } } // Date stored as string
            ]
        }).toArray();
        
        // Find documents with optional fields populated
        const complete = await db.collection('profiles').find({
            bio: { $exists: true, $type: "string" },
            avatar: { $exists: true },
            socialLinks: { $exists: true, $type: "array" }
        }).toArray();
        
        // Data migration: Find documents needing update
        const needsMigration = await db.collection('orders').find({
            $or: [
                { total: { $type: "string" } },   // Should be number
                { items: { $exists: false } },    // Missing items array
                { createdAt: { $exists: false } } // Missing timestamp
            ]
        }).toArray();
        
        // Find embedded documents vs references
        const embedded = await db.collection('posts').find({
            author: { $type: "object" }  // Embedded author document
        }).toArray();
        
        const referenced = await db.collection('posts').find({
            author: { $type: "objectId" }  // Author is reference
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. DATA VALIDATION AND CLEANUP
// -------------------------------------------------------------------------------------------

async function dataCleanup() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Fix type mismatches
        const wrongTypes = await collection.find({
            price: { $type: "string" }
        }).toArray();
        
        for (const doc of wrongTypes) {
            await collection.updateOne(
                { _id: doc._id },
                { $set: { price: parseFloat(doc.price) } }
            );
        }
        
        // Remove null fields
        await collection.updateMany(
            { description: { $type: "null" } },
            { $unset: { description: "" } }
        );
        
        // Set default for missing fields
        await collection.updateMany(
            { category: { $exists: false } },
            { $set: { category: "uncategorized" } }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * ELEMENT OPERATORS:
 * 
 * $exists - Check if field exists
 * $type   - Check field's BSON type
 * 
 * BEST PRACTICES:
 * - Use $exists to find incomplete documents
 * - Use $type to identify schema inconsistencies
 * - Combine $exists and $ne: null for "has value" checks
 * - Use $type for data validation queries
 * - Consider adding schema validation to prevent type issues
 * - Run data quality checks periodically
 */

module.exports = {
    existsOperator,
    typeOperator,
    practicalExamples,
    dataCleanup
};
