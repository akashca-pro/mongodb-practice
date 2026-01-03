/**
 * TOPIC: AGGREGATION OPTIMIZATION
 * DESCRIPTION:
 * Optimize aggregation pipelines for better performance using
 * proper stage ordering, indexing, and memory management.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. STAGE ORDERING
// -------------------------------------------------------------------------------------------

async function stageOrdering() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // BAD: Processing all docs before filtering
        const bad = await collection.aggregate([
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $match: { status: "active" } }  // Filter AFTER heavy operations
        ]).explain();
        
        // GOOD: Filter early
        const good = await collection.aggregate([
            { $match: { status: "active" } },  // Filter FIRST
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "user" } },
            { $unwind: "$user" }
        ]).explain();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. USING INDEXES
// -------------------------------------------------------------------------------------------

async function indexOptimization() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Ensure index for $match
        await collection.createIndex({ status: 1, createdAt: -1 });
        
        // Index-optimized pipeline
        const results = await collection.aggregate([
            // Uses index
            { $match: { status: "completed", createdAt: { $gte: new Date('2024-01-01') } } },
            // $sort can use same index if following $match
            { $sort: { createdAt: -1 } },
            { $limit: 100 }
        ]).explain("executionStats");
        
        console.log("Index used:", results.stages[0].$cursor?.queryPlanner?.winningPlan);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. MEMORY MANAGEMENT
// -------------------------------------------------------------------------------------------

async function memoryManagement() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('largecollection');
        
        // Enable disk use for large operations
        const results = await collection.aggregate([
            { $group: { _id: "$category", total: { $sum: "$amount" } } },
            { $sort: { total: -1 } }
        ], {
            allowDiskUse: true  // Spill to disk if exceeding 100MB memory
        }).toArray();
        
        // Limit accumulator size
        const limited = await collection.aggregate([
            { $group: {
                _id: "$category",
                items: { $push: "$name" }  // Could grow large!
            }},
            { $project: {
                // Limit array size
                topItems: { $slice: ["$items", 100] }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. EXPLAIN AND ANALYZE
// -------------------------------------------------------------------------------------------

async function analyzeAggregation() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const explanation = await collection.aggregate([
            { $match: { status: "active" } },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]).explain("executionStats");
        
        // Check stages
        console.log("Stages:", JSON.stringify(explanation.stages, null, 2));
        
        // Key metrics to check:
        // - Is $match using IXSCAN?
        // - Total docs examined vs returned
        // - Execution time
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * OPTIMIZATION RULES:
 * 
 * 1. $match first - Filter early, use indexes
 * 2. $project early - Reduce document size
 * 3. $sort after $match - Can use same index
 * 4. Use allowDiskUse for large operations
 * 5. Limit $push/$addToSet array sizes
 * 
 * PIPELINE ORDER:
 * $match → $project → $group → $lookup → $sort → $limit
 */

module.exports = {
    stageOrdering,
    indexOptimization,
    memoryManagement,
    analyzeAggregation
};
