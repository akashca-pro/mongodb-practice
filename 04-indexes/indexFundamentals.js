/**
 * TOPIC: INDEX FUNDAMENTALS
 * DESCRIPTION:
 * Indexes are data structures that improve query performance by providing
 * efficient access paths to documents. Understanding index basics is
 * essential for MongoDB performance optimization.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. WHY INDEXES MATTER
// -------------------------------------------------------------------------------------------

/**
 * WITHOUT INDEX: Collection scan (COLLSCAN)
 * - Reads every document in collection
 * - O(n) time complexity
 * - Very slow for large collections
 * 
 * WITH INDEX: Index scan (IXSCAN)
 * - Uses B-tree structure
 * - O(log n) time complexity
 * - Much faster for selective queries
 * 
 * ANALOGY:
 * - No index = Reading every page of a book to find a topic
 * - With index = Using table of contents to jump to the topic
 */

// -------------------------------------------------------------------------------------------
// 2. CREATING INDEXES
// -------------------------------------------------------------------------------------------

async function createIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Single field index (ascending)
        await collection.createIndex({ email: 1 });
        
        // Single field index (descending)
        await collection.createIndex({ createdAt: -1 });
        
        // With name
        await collection.createIndex(
            { username: 1 },
            { name: "username_index" }
        );
        
        // Unique index
        await collection.createIndex(
            { email: 1 },
            { unique: true }
        );
        
        // Sparse index (only for docs with the field)
        await collection.createIndex(
            { middleName: 1 },
            { sparse: true }
        );
        
        // Background index (non-blocking, deprecated in 4.2+)
        await collection.createIndex(
            { phone: 1 },
            { background: true }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. INDEX TYPES
// -------------------------------------------------------------------------------------------

async function indexTypes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Single field index
        await db.collection('users').createIndex({ name: 1 });
        
        // Compound index
        await db.collection('orders').createIndex({ status: 1, date: -1 });
        
        // Multikey index (automatically created for array fields)
        await db.collection('posts').createIndex({ tags: 1 });
        
        // Hashed index (for hash-based sharding)
        await db.collection('users').createIndex({ email: "hashed" });
        
        // TTL index (auto-delete documents)
        await db.collection('sessions').createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: 3600 }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. MANAGING INDEXES
// -------------------------------------------------------------------------------------------

async function manageIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // List all indexes
        const indexes = await collection.listIndexes().toArray();
        console.log("Indexes:", indexes);
        
        // Drop single index by name
        await collection.dropIndex("email_1");
        
        // Drop all indexes (except _id)
        await collection.dropIndexes();
        
        // Reindex collection
        await collection.reIndex();
        
        // Check if index exists
        const indexExists = await collection.indexExists("price_1");
        console.log("Index exists:", indexExists);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. EXPLAIN AND ANALYZE
// -------------------------------------------------------------------------------------------

async function analyzeQueries() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Explain query plan
        const explanation = await collection.find({ email: "test@example.com" })
            .explain("executionStats");
        
        console.log("Winning Plan:", explanation.queryPlanner.winningPlan);
        console.log("Docs Examined:", explanation.executionStats.totalDocsExamined);
        console.log("Keys Examined:", explanation.executionStats.totalKeysExamined);
        console.log("Execution Time:", explanation.executionStats.executionTimeMillis);
        
        /**
         * Explain verbosity levels:
         * - "queryPlanner": Default, shows plan selection
         * - "executionStats": Plan + execution statistics
         * - "allPlansExecution": All candidate plans executed
         */
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. INDEX PERFORMANCE METRICS
// -------------------------------------------------------------------------------------------

/**
 * Key metrics to check:
 * 
 * GOOD:
 * - stage: "IXSCAN" (using index)
 * - totalDocsExamined close to or equal to nReturned
 * - totalKeysExamined slightly higher than nReturned
 * - Low executionTimeMillis
 * 
 * BAD:
 * - stage: "COLLSCAN" (no index used)
 * - totalDocsExamined >> nReturned (scanning too many docs)
 * - High executionTimeMillis
 * 
 * COVERED QUERY (best):
 * - totalDocsExamined = 0
 * - All fields returned are in the index
 */

async function indexStats() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Get index usage statistics
        const stats = await collection.aggregate([
            { $indexStats: {} }
        ]).toArray();
        
        for (const stat of stats) {
            console.log(`Index: ${stat.name}`);
            console.log(`  Accesses: ${stat.accesses.ops}`);
            console.log(`  Since: ${stat.accesses.since}`);
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * INDEX FUNDAMENTALS:
 * 
 * 1. Indexes speed up queries dramatically
 * 2. Every collection has _id index by default
 * 3. Use explain() to verify index usage
 * 4. Monitor index usage with $indexStats
 * 
 * BEST PRACTICES:
 * - Create indexes for frequently queried fields
 * - Index fields used in sort operations
 * - Use compound indexes for multi-field queries
 * - Avoid too many indexes (slows writes)
 * - Monitor and remove unused indexes
 * - Use covered queries when possible
 * - Consider query patterns when designing indexes
 */

module.exports = {
    createIndexes,
    indexTypes,
    manageIndexes,
    analyzeQueries,
    indexStats
};
