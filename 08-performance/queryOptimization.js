/**
 * TOPIC: QUERY OPTIMIZATION
 * DESCRIPTION:
 * Techniques for optimizing MongoDB query performance including
 * indexing, query analysis, and efficient query patterns.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. USING EXPLAIN()
// -------------------------------------------------------------------------------------------

async function analyzeQuery() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        const explanation = await collection.find({
            status: "active",
            age: { $gte: 18 }
        }).explain("executionStats");
        
        console.log("Query Plan:", explanation.queryPlanner.winningPlan);
        console.log("Docs Examined:", explanation.executionStats.totalDocsExamined);
        console.log("Keys Examined:", explanation.executionStats.totalKeysExamined);
        console.log("Time (ms):", explanation.executionStats.executionTimeMillis);
        
        // Good: IXSCAN, docsExamined ≈ nReturned
        // Bad: COLLSCAN, high docsExamined
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. QUERY OPTIMIZATION TIPS
// -------------------------------------------------------------------------------------------

async function optimizationTips() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // 1. Use covered queries
        await collection.createIndex({ status: 1, total: 1 });
        await collection.find(
            { status: "active" },
            { projection: { status: 1, total: 1, _id: 0 } }
        );
        
        // 2. Limit returned fields
        await collection.find({}, { projection: { name: 1, email: 1 } });
        
        // 3. Use limit() for pagination
        await collection.find({}).skip(100).limit(20);
        
        // 4. Avoid $where and $regex without anchor
        // Bad: { name: { $regex: /john/i } }
        // Better: { name: { $regex: /^john/i } }
        
        // 5. Use hint() to force index
        await collection.find({ status: "active" }).hint({ status: 1 });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. SLOW QUERY PROFILING
// -------------------------------------------------------------------------------------------

async function setupProfiling() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Enable profiling (level 1 = slow queries only)
        await db.command({ profile: 1, slowms: 100 });
        
        // Query slow operations
        const slowQueries = await db.collection('system.profile')
            .find({})
            .sort({ ts: -1 })
            .limit(10)
            .toArray();
            
        console.log("Slow queries:", slowQueries);
        
        // Disable profiling
        await db.command({ profile: 0 });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * OPTIMIZATION CHECKLIST:
 * 
 * 1. Always use explain() for slow queries
 * 2. Create indexes for filter and sort fields
 * 3. Project only needed fields
 * 4. Use covered queries when possible
 * 5. Enable profiling to find slow queries
 * 6. Avoid $regex without ^anchor
 * 7. Use compound indexes following ESR rule
 */

module.exports = {
    analyzeQuery,
    optimizationTips,
    setupProfiling
};
