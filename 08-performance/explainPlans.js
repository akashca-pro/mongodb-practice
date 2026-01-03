/**
 * TOPIC: EXPLAIN PLANS
 * DESCRIPTION:
 * Understanding MongoDB explain output to analyze and optimize
 * query performance. Essential for debugging slow queries.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. EXPLAIN VERBOSITY LEVELS
// -------------------------------------------------------------------------------------------

async function explainVerbosityLevels() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // queryPlanner (default) - query plan selection
        const queryPlanner = await collection.find({ status: 'active' })
            .explain('queryPlanner');
            
        // executionStats - plan + execution statistics
        const execStats = await collection.find({ status: 'active' })
            .explain('executionStats');
            
        // allPlansExecution - all considered plans
        const allPlans = await collection.find({ status: 'active' })
            .explain('allPlansExecution');
            
        console.log('Query Planner:', JSON.stringify(queryPlanner.queryPlanner, null, 2));
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. READING EXPLAIN OUTPUT
// -------------------------------------------------------------------------------------------

async function readExplainOutput() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const explain = await collection.find({
            status: 'active',
            total: { $gte: 100 }
        }).explain('executionStats');
        
        // Key fields to check
        const queryPlanner = explain.queryPlanner;
        const execStats = explain.executionStats;
        
        console.log('=== QUERY PLANNER ===');
        console.log('Namespace:', queryPlanner.namespace);
        console.log('Winning Plan Stage:', queryPlanner.winningPlan.stage);
        console.log('Index Used:', queryPlanner.winningPlan.inputStage?.indexName || 'None');
        
        console.log('\n=== EXECUTION STATS ===');
        console.log('Execution Success:', execStats.executionSuccess);
        console.log('Docs Returned:', execStats.nReturned);
        console.log('Docs Examined:', execStats.totalDocsExamined);
        console.log('Keys Examined:', execStats.totalKeysExamined);
        console.log('Execution Time (ms):', execStats.executionTimeMillis);
        
        // Calculate efficiency ratio
        const efficiency = execStats.nReturned / execStats.totalDocsExamined;
        console.log('Efficiency Ratio:', efficiency.toFixed(2));
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. QUERY STAGES
// -------------------------------------------------------------------------------------------

/**
 * COMMON QUERY STAGES:
 * 
 * COLLSCAN    - Collection scan (no index) - BAD
 * IXSCAN      - Index scan - GOOD
 * FETCH       - Retrieve documents from collection
 * SORT        - In-memory sort (no index)
 * SORT_KEY_GENERATOR - Prepare for indexed sort
 * PROJECTION  - Apply field projection
 * LIMIT       - Limit results
 * SKIP        - Skip documents
 * 
 * SHARDED:
 * SHARD_MERGE - Merge results from shards
 * SHARDING_FILTER - Filter by shard
 */

async function identifyStages() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const explain = await collection.find({ status: 'active' })
            .sort({ total: -1 })
            .limit(10)
            .explain('executionStats');
        
        // Recursively print stages
        function printStage(stage, depth = 0) {
            const indent = '  '.repeat(depth);
            console.log(`${indent}Stage: ${stage.stage}`);
            
            if (stage.indexName) console.log(`${indent}  Index: ${stage.indexName}`);
            if (stage.nReturned !== undefined) console.log(`${indent}  Returned: ${stage.nReturned}`);
            if (stage.executionTimeMillisEstimate !== undefined) {
                console.log(`${indent}  Time (ms): ${stage.executionTimeMillisEstimate}`);
            }
            
            if (stage.inputStage) printStage(stage.inputStage, depth + 1);
            if (stage.inputStages) {
                stage.inputStages.forEach(s => printStage(s, depth + 1));
            }
        }
        
        printStage(explain.executionStats.executionStages);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. IDENTIFYING PROBLEMS
// -------------------------------------------------------------------------------------------

async function identifyProblems() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const explain = await collection.find({
            status: 'active'
        }).explain('executionStats');
        
        const stats = explain.executionStats;
        const stage = explain.queryPlanner.winningPlan.stage;
        
        // Problem indicators
        const problems = [];
        
        // 1. Collection scan
        if (stage === 'COLLSCAN') {
            problems.push('No index used - consider creating an index');
        }
        
        // 2. Too many docs examined
        if (stats.totalDocsExamined > stats.nReturned * 10) {
            problems.push(`Examining ${stats.totalDocsExamined} docs for ${stats.nReturned} results - index may be inefficient`);
        }
        
        // 3. In-memory sort
        if (JSON.stringify(explain).includes('"stage":"SORT"')) {
            problems.push('In-memory sort detected - consider indexed sort');
        }
        
        // 4. Slow query
        if (stats.executionTimeMillis > 100) {
            problems.push(`Query took ${stats.executionTimeMillis}ms - may need optimization`);
        }
        
        console.log('Problems found:', problems.length ? problems : 'None');
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * EXPLAIN KEY METRICS:
 * 
 * GOOD:
 * - stage: IXSCAN (using index)
 * - nReturned ≈ totalDocsExamined
 * - Low executionTimeMillis
 * - No in-memory SORT stage
 * 
 * BAD:
 * - stage: COLLSCAN
 * - totalDocsExamined >> nReturned
 * - High executionTimeMillis
 * - SORT stage without index
 * 
 * BEST PRACTICES:
 * - Always explain slow queries
 * - Create indexes for COLLSCAN queries
 * - Aim for covered queries (no FETCH stage)
 */

module.exports = {
    explainVerbosityLevels,
    readExplainOutput,
    identifyStages,
    identifyProblems
};
