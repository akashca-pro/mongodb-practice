/**
 * TOPIC: AGGREGATION BASICS
 * DESCRIPTION:
 * The aggregation framework processes data through pipeline stages,
 * transforming and combining documents to produce computed results.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. AGGREGATION PIPELINE CONCEPT
// -------------------------------------------------------------------------------------------

/**
 * Pipeline stages process documents sequentially:
 * 
 * Documents → [$match] → [$group] → [$sort] → [$project] → Results
 * 
 * Each stage:
 * - Receives documents from previous stage
 * - Transforms/filters them
 * - Passes output to next stage
 */

async function basicPipeline() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const results = await collection.aggregate([
            // Stage 1: Filter
            { $match: { status: "completed" } },
            // Stage 2: Group and calculate
            { $group: { _id: "$customerId", total: { $sum: "$amount" } } },
            // Stage 3: Sort
            { $sort: { total: -1 } },
            // Stage 4: Limit
            { $limit: 10 }
        ]).toArray();
        
        console.log("Top customers:", results);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. $MATCH STAGE
// -------------------------------------------------------------------------------------------

async function matchStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Uses same query syntax as find()
        const results = await collection.aggregate([
            { $match: {
                status: "completed",
                orderDate: { $gte: new Date('2024-01-01') },
                total: { $gte: 100 }
            }}
        ]).toArray();
        
        // Multiple $match stages
        const multiMatch = await collection.aggregate([
            { $match: { status: "completed" } },
            { $group: { _id: "$category", sum: { $sum: "$total" } } },
            { $match: { sum: { $gte: 10000 } } }  // Filter after grouping
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. $PROJECT STAGE
// -------------------------------------------------------------------------------------------

async function projectStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        const results = await collection.aggregate([
            { $project: {
                // Include fields
                name: 1,
                email: 1,
                
                // Exclude _id
                _id: 0,
                
                // Rename field
                userEmail: "$email",
                
                // Computed field
                fullName: { $concat: ["$firstName", " ", "$lastName"] },
                
                // Conditional
                status: {
                    $cond: {
                        if: { $gte: ["$age", 18] },
                        then: "adult",
                        else: "minor"
                    }
                }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. $GROUP STAGE
// -------------------------------------------------------------------------------------------

async function groupStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Group by single field
        const byCategory = await collection.aggregate([
            { $group: {
                _id: "$category",
                totalSales: { $sum: "$total" },
                avgOrder: { $avg: "$total" },
                count: { $sum: 1 }
            }}
        ]).toArray();
        
        // Group by multiple fields
        const byCategoryAndStatus = await collection.aggregate([
            { $group: {
                _id: { category: "$category", status: "$status" },
                count: { $sum: 1 }
            }}
        ]).toArray();
        
        // Group all documents
        const totals = await collection.aggregate([
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$total" },
                orderCount: { $sum: 1 }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. $SORT AND PAGINATION
// -------------------------------------------------------------------------------------------

async function sortAndPaginate() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Sort, skip, limit
        const page2 = await collection.aggregate([
            { $match: { category: "electronics" } },
            { $sort: { price: -1, name: 1 } },
            { $skip: 10 },
            { $limit: 10 }
        ]).toArray();
        
        // Add row numbers
        const numbered = await collection.aggregate([
            { $sort: { price: -1 } },
            { $group: {
                _id: null,
                items: { $push: "$$ROOT" }
            }},
            { $unwind: { path: "$items", includeArrayIndex: "rank" } },
            { $replaceRoot: { 
                newRoot: { $mergeObjects: ["$items", { rank: { $add: ["$rank", 1] } }] }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. AGGREGATION OPTIONS
// -------------------------------------------------------------------------------------------

async function aggregationOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('largecollection');
        
        const results = await collection.aggregate(
            [{ $match: { status: "active" } }],
            {
                allowDiskUse: true,         // Use disk for large sorts
                maxTimeMS: 60000,           // Timeout
                batchSize: 1000,            // Cursor batch size
                readPreference: 'secondaryPreferred',
                hint: { status: 1 }         // Force index
            }
        ).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * AGGREGATION BASICS:
 * 
 * $match  - Filter documents (uses indexes)
 * $project - Reshape documents
 * $group  - Group and aggregate
 * $sort   - Order results
 * $skip/$limit - Pagination
 * 
 * BEST PRACTICES:
 * - Put $match early in pipeline (uses indexes)
 * - Use $project to reduce document size early
 * - Enable allowDiskUse for large aggregations
 * - Monitor performance with explain()
 */

module.exports = {
    basicPipeline,
    matchStage,
    projectStage,
    groupStage,
    sortAndPaginate,
    aggregationOptions
};
