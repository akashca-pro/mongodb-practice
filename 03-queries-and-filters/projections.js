/**
 * TOPIC: PROJECTIONS
 * DESCRIPTION:
 * Projections control which fields are returned in query results.
 * Optimize performance by returning only needed fields.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC PROJECTION
// -------------------------------------------------------------------------------------------

async function basicProjection() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Include specific fields (1 = include)
        const namesOnly = await collection.find(
            {},
            { projection: { name: 1, email: 1 } }
        ).toArray();
        // Result includes: _id, name, email
        
        // Exclude _id
        const noId = await collection.find(
            {},
            { projection: { name: 1, email: 1, _id: 0 } }
        ).toArray();
        
        // Exclude specific fields (0 = exclude)
        const noPassword = await collection.find(
            {},
            { projection: { password: 0, sensitiveData: 0 } }
        ).toArray();
        
        // Cannot mix include/exclude (except _id)
        // WRONG: { name: 1, password: 0 }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. NESTED FIELD PROJECTION
// -------------------------------------------------------------------------------------------

async function nestedProjection() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Include nested fields with dot notation
        const addressCity = await collection.find(
            {},
            { projection: { name: 1, "address.city": 1, "address.country": 1 } }
        ).toArray();
        
        // Exclude nested fields
        const noPrivate = await collection.find(
            {},
            { projection: { "profile.private": 0 } }
        ).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. ARRAY PROJECTIONS
// -------------------------------------------------------------------------------------------

async function arrayProjections() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('posts');
        
        // $slice - limit array elements
        const firstThree = await collection.find(
            {},
            { projection: { title: 1, comments: { $slice: 3 } } }  // First 3
        ).toArray();
        
        const lastTwo = await collection.find(
            {},
            { projection: { title: 1, comments: { $slice: -2 } } }  // Last 2
        ).toArray();
        
        const skipAndLimit = await collection.find(
            {},
            { projection: { title: 1, comments: { $slice: [10, 5] } } }  // Skip 10, take 5
        ).toArray();
        
        // $ positional - first matching element
        const firstMatch = await collection.find(
            { "comments.author": "john" },
            { projection: { title: 1, "comments.$": 1 } }
        ).toArray();
        
        // $elemMatch - first element matching condition
        const elemMatch = await collection.find(
            {},
            { 
                projection: { 
                    title: 1, 
                    comments: { 
                        $elemMatch: { rating: { $gte: 4 } } 
                    } 
                } 
            }
        ).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. AGGREGATION PROJECTIONS ($project stage)
// -------------------------------------------------------------------------------------------

async function aggregationProjections() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Rename fields
        const renamed = await collection.aggregate([
            { $project: {
                orderId: "$_id",
                customerName: "$customer.name",
                orderTotal: "$total"
            }}
        ]).toArray();
        
        // Computed fields
        const computed = await collection.aggregate([
            { $project: {
                _id: 1,
                total: 1,
                tax: { $multiply: ["$total", 0.1] },
                grandTotal: { $multiply: ["$total", 1.1] }
            }}
        ]).toArray();
        
        // Conditional projections
        const conditional = await collection.aggregate([
            { $project: {
                _id: 1,
                status: 1,
                displayStatus: {
                    $switch: {
                        branches: [
                            { case: { $eq: ["$status", "pending"] }, then: "Awaiting Processing" },
                            { case: { $eq: ["$status", "shipped"] }, then: "On The Way" },
                            { case: { $eq: ["$status", "delivered"] }, then: "Completed" }
                        ],
                        default: "Unknown"
                    }
                }
            }}
        ]).toArray();
        
        // String manipulation
        const strings = await collection.aggregate([
            { $project: {
                name: 1,
                nameUpper: { $toUpper: "$name" },
                initials: { $substr: ["$name", 0, 1] },
                fullName: { $concat: ["$firstName", " ", "$lastName"] }
            }}
        ]).toArray();
        
        // Array operations
        const arrays = await collection.aggregate([
            { $project: {
                _id: 1,
                itemCount: { $size: "$items" },
                firstItem: { $first: "$items" },
                lastItem: { $last: "$items" }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. PERFORMANCE OPTIMIZATION
// -------------------------------------------------------------------------------------------

async function projectionPerformance() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('largeDocuments');
        
        // Covered query: All fields in projection are in index
        await collection.createIndex({ email: 1, name: 1 });
        
        // This query is "covered" - no document fetch needed
        const covered = await collection.find(
            { email: "test@example.com" },
            { projection: { email: 1, name: 1, _id: 0 } }
        ).explain("executionStats");
        
        console.log("Total docs examined:", covered.executionStats.totalDocsExamined);
        // Should be 0 for covered query (reads from index only)
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * PROJECTION KEY POINTS:
 * 
 * 1 = include field
 * 0 = exclude field
 * Cannot mix (except _id)
 * 
 * OPERATORS:
 * $slice     - Limit array elements
 * $          - First matching array element
 * $elemMatch - First element matching condition
 * $meta      - Metadata (e.g., textScore)
 * 
 * BEST PRACTICES:
 * - Always project only needed fields
 * - Exclude large fields (blobs, long text) when not needed
 * - Use covered queries when possible (project indexed fields only)
 * - Use $slice for large arrays
 * - Be careful with $ positional (needs matching query)
 */

module.exports = {
    basicProjection,
    nestedProjection,
    arrayProjections,
    aggregationProjections,
    projectionPerformance
};
