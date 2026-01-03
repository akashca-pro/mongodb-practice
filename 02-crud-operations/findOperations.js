/**
 * TOPIC: FIND OPERATIONS
 * DESCRIPTION:
 * MongoDB provides powerful querying capabilities through find()
 * and findOne() methods. Master these to efficiently retrieve data.
 */

const { MongoClient, ObjectId } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC FIND OPERATIONS
// -------------------------------------------------------------------------------------------

async function basicFindOperations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Find one document
        const user = await collection.findOne({ name: "John" });
        console.log("Found user:", user);
        
        // Find by _id
        const byId = await collection.findOne({ 
            _id: new ObjectId("507f1f77bcf86cd799439011") 
        });
        
        // Find all documents (returns cursor)
        const cursor = collection.find({});
        const allUsers = await cursor.toArray();
        console.log("All users:", allUsers.length);
        
        // Find with filter
        const activeUsers = await collection.find({ 
            status: "active" 
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. CURSOR METHODS
// -------------------------------------------------------------------------------------------

async function cursorMethods() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Sort
        const sortedByPrice = await collection
            .find({})
            .sort({ price: -1 })  // -1 descending, 1 ascending
            .toArray();
        
        // Limit
        const top5 = await collection
            .find({})
            .limit(5)
            .toArray();
        
        // Skip (for pagination)
        const page2 = await collection
            .find({})
            .skip(10)
            .limit(10)
            .toArray();
        
        // Combined - sorted pagination
        const paginatedSorted = await collection
            .find({})
            .sort({ createdAt: -1 })
            .skip(20)
            .limit(10)
            .toArray();
        
        // Count documents
        const count = await collection.countDocuments({ category: "electronics" });
        const estimatedCount = await collection.estimatedDocumentCount();
        
        // Distinct values
        const categories = await collection.distinct("category");
        console.log("Categories:", categories);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. PROJECTION (Selecting Fields)
// -------------------------------------------------------------------------------------------

async function projectionExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Include specific fields
        const namesOnly = await collection.find(
            {},
            { projection: { name: 1, email: 1, _id: 0 } }
        ).toArray();
        
        // Exclude specific fields
        const noPassword = await collection.find(
            {},
            { projection: { password: 0, sensitiveData: 0 } }
        ).toArray();
        
        // Array slice
        const recentComments = await collection.find(
            {},
            { projection: { comments: { $slice: -5 } } }  // Last 5 comments
        ).toArray();
        
        // Array element match (first matching)
        const matchingGrade = await collection.find(
            { grades: { $elemMatch: { score: { $gt: 90 } } } },
            { projection: { "grades.$": 1 } }
        ).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. ITERATING CURSORS
// -------------------------------------------------------------------------------------------

async function iterateCursor() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('logs');
        
        const cursor = collection.find({});
        
        // Method 1: toArray (loads all into memory)
        const allDocs = await cursor.clone().toArray();
        
        // Method 2: forEach
        await cursor.clone().forEach(doc => {
            console.log(doc._id);
        });
        
        // Method 3: for-await-of (recommended for large datasets)
        for await (const doc of cursor.clone()) {
            console.log(doc._id);
        }
        
        // Method 4: hasNext/next
        const cur = cursor.clone();
        while (await cur.hasNext()) {
            const doc = await cur.next();
            console.log(doc._id);
        }
        
        // Method 5: Stream
        cursor.clone().stream().on('data', doc => {
            console.log(doc._id);
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. FIND OPTIONS
// -------------------------------------------------------------------------------------------

async function findWithOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        const results = await collection.find(
            { category: "electronics" },
            {
                projection: { name: 1, price: 1 },
                sort: { price: -1 },
                skip: 0,
                limit: 10,
                hint: { category: 1 },          // Force index usage
                maxTimeMS: 5000,                // Query timeout
                readPreference: 'secondaryPreferred',
                batchSize: 100                  // Cursor batch size
            }
        ).toArray();
        
        console.log("Results:", results);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. FIND AND MODIFY OPERATIONS
// -------------------------------------------------------------------------------------------

async function findAndModify() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('inventory');
        
        // Find and update atomically
        const updated = await collection.findOneAndUpdate(
            { item: "widget", qty: { $gt: 0 } },
            { $inc: { qty: -1 } },
            { returnDocument: 'after' }  // Return updated document
        );
        console.log("Updated:", updated);
        
        // Find and replace
        const replaced = await collection.findOneAndReplace(
            { item: "gadget" },
            { item: "gadget", qty: 100, price: 29.99 },
            { returnDocument: 'after', upsert: true }
        );
        
        // Find and delete
        const deleted = await collection.findOneAndDelete(
            { status: "expired" },
            { sort: { createdAt: 1 } }  // Delete oldest first
        );
        console.log("Deleted:", deleted);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * FIND OPERATIONS KEY POINTS:
 * 
 * 1. findOne: Returns single document or null
 * 2. find: Returns cursor for iteration
 * 3. Projection: Select only needed fields
 * 4. Cursor methods: sort, skip, limit, count
 * 5. findOneAnd*: Atomic find-and-modify operations
 * 
 * BEST PRACTICES:
 * - Always use projection to limit returned fields
 * - Use indexes for frequently queried fields
 * - Prefer for-await-of for large result sets
 * - Use findOneAnd* for atomic operations
 * - Set maxTimeMS to prevent long-running queries
 * - Use cursor.batchSize for memory control
 */

module.exports = {
    basicFindOperations,
    cursorMethods,
    projectionExamples,
    iterateCursor,
    findWithOptions,
    findAndModify
};
