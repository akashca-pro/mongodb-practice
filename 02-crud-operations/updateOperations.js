/**
 * TOPIC: UPDATE OPERATIONS
 * DESCRIPTION:
 * MongoDB provides various update methods and operators for modifying
 * documents. Learn updateOne, updateMany, replaceOne, and update operators.
 */

const { MongoClient, ObjectId } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. UPDATE ONE AND MANY
// -------------------------------------------------------------------------------------------

async function basicUpdateOperations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Update one document
        const result = await collection.updateOne(
            { name: "John" },                    // Filter
            { $set: { age: 31, verified: true } } // Update
        );
        console.log("Matched:", result.matchedCount);
        console.log("Modified:", result.modifiedCount);
        
        // Update many documents
        const manyResult = await collection.updateMany(
            { status: "pending" },
            { $set: { status: "active", updatedAt: new Date() } }
        );
        console.log("Updated many:", manyResult.modifiedCount);
        
        // Upsert (insert if not found)
        await collection.updateOne(
            { email: "new@example.com" },
            { $set: { name: "New User", createdAt: new Date() } },
            { upsert: true }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. UPDATE OPERATORS - FIELD
// -------------------------------------------------------------------------------------------

async function fieldUpdateOperators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $set - Set field values
        await collection.updateOne(
            { _id: 1 },
            { $set: { name: "Widget Pro", "details.color": "blue" } }
        );
        
        // $unset - Remove fields
        await collection.updateOne(
            { _id: 1 },
            { $unset: { temporaryField: "", oldData: "" } }
        );
        
        // $inc - Increment numeric values
        await collection.updateOne(
            { _id: 1 },
            { $inc: { quantity: 5, viewCount: 1 } }
        );
        
        // $mul - Multiply values
        await collection.updateOne(
            { _id: 1 },
            { $mul: { price: 1.1 } }  // 10% price increase
        );
        
        // $min - Update if new value is less
        await collection.updateOne(
            { _id: 1 },
            { $min: { lowestPrice: 9.99 } }
        );
        
        // $max - Update if new value is greater
        await collection.updateOne(
            { _id: 1 },
            { $max: { highestPrice: 29.99 } }
        );
        
        // $rename - Rename fields
        await collection.updateOne(
            { _id: 1 },
            { $rename: { oldName: "newName" } }
        );
        
        // $setOnInsert - Only set on insert (upsert)
        await collection.updateOne(
            { productCode: "NEW001" },
            { 
                $set: { name: "New Product" },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );
        
        // $currentDate - Set to current date
        await collection.updateOne(
            { _id: 1 },
            { $currentDate: { lastModified: true, "timestamps.updated": { $type: "date" } } }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. UPDATE OPERATORS - ARRAY
// -------------------------------------------------------------------------------------------

async function arrayUpdateOperators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('posts');
        
        // $push - Add to array
        await collection.updateOne(
            { _id: 1 },
            { $push: { tags: "mongodb" } }
        );
        
        // $push with modifiers
        await collection.updateOne(
            { _id: 1 },
            { 
                $push: { 
                    comments: {
                        $each: [{ text: "Great!" }, { text: "Nice!" }],
                        $position: 0,     // Insert at beginning
                        $slice: -10       // Keep last 10 elements
                    }
                }
            }
        );
        
        // $addToSet - Add unique value only
        await collection.updateOne(
            { _id: 1 },
            { $addToSet: { tags: "database" } }
        );
        
        // $addToSet with $each
        await collection.updateOne(
            { _id: 1 },
            { $addToSet: { tags: { $each: ["nosql", "document"] } } }
        );
        
        // $pop - Remove first (-1) or last (1) element
        await collection.updateOne(
            { _id: 1 },
            { $pop: { tags: 1 } }  // Remove last
        );
        
        // $pull - Remove matching elements
        await collection.updateOne(
            { _id: 1 },
            { $pull: { tags: "deprecated" } }
        );
        
        // $pull with conditions
        await collection.updateOne(
            { _id: 1 },
            { $pull: { scores: { $lt: 50 } } }
        );
        
        // $pullAll - Remove all matching values
        await collection.updateOne(
            { _id: 1 },
            { $pullAll: { tags: ["old", "outdated"] } }
        );
        
        // $ positional operator - Update matched element
        await collection.updateOne(
            { _id: 1, "items.name": "widget" },
            { $set: { "items.$.price": 19.99 } }
        );
        
        // $[] - Update all elements
        await collection.updateOne(
            { _id: 1 },
            { $inc: { "scores.$[]": 5 } }  // Add 5 to all scores
        );
        
        // $[<identifier>] - Update matching elements
        await collection.updateOne(
            { _id: 1 },
            { $set: { "grades.$[elem].passed": true } },
            { arrayFilters: [{ "elem.score": { $gte: 60 } }] }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. REPLACE DOCUMENT
// -------------------------------------------------------------------------------------------

async function replaceDocument() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Replace entire document (except _id)
        const result = await collection.replaceOne(
            { name: "John" },
            { 
                name: "John Doe",
                email: "john.doe@example.com",
                age: 32,
                replacedAt: new Date()
            }
        );
        console.log("Replaced:", result.modifiedCount);
        
        // Replace with upsert
        await collection.replaceOne(
            { email: "new@example.com" },
            { name: "New User", email: "new@example.com" },
            { upsert: true }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. UPDATE OPTIONS
// -------------------------------------------------------------------------------------------

async function updateWithOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        await collection.updateOne(
            { orderId: "ORD001" },
            { $set: { status: "shipped" } },
            {
                upsert: true,              // Insert if not found
                bypassDocumentValidation: false,
                writeConcern: { w: 'majority' },
                hint: { orderId: 1 },      // Force index
                arrayFilters: [],          // For filtered positional updates
                collation: { locale: 'en' } // For string comparison
            }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * UPDATE OPERATIONS KEY POINTS:
 * 
 * 1. updateOne/updateMany: Update with operators
 * 2. replaceOne: Replace entire document
 * 3. Field operators: $set, $unset, $inc, $mul
 * 4. Array operators: $push, $pull, $addToSet
 * 5. Positional operators: $, $[], $[<identifier>]
 * 
 * BEST PRACTICES:
 * - Use specific operators instead of replace when possible
 * - Use $set for partial updates
 * - Use $inc for counters (atomic)
 * - Use $addToSet for unique array values
 * - Use arrayFilters for complex array updates
 * - Always check matchedCount and modifiedCount
 */

module.exports = {
    basicUpdateOperations,
    fieldUpdateOperators,
    arrayUpdateOperators,
    replaceDocument,
    updateWithOptions
};
