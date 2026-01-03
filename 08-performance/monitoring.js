/**
 * TOPIC: MONITORING
 * DESCRIPTION:
 * MongoDB monitoring tools and techniques for tracking performance,
 * health, and diagnosing issues in production.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. SERVER STATUS
// -------------------------------------------------------------------------------------------

async function serverStatus() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const admin = client.db('admin');
        
        const status = await admin.command({ serverStatus: 1 });
        
        console.log('=== SERVER STATUS ===');
        console.log('Host:', status.host);
        console.log('Version:', status.version);
        console.log('Uptime (seconds):', status.uptime);
        
        // Connections
        console.log('\n=== CONNECTIONS ===');
        console.log('Current:', status.connections.current);
        console.log('Available:', status.connections.available);
        console.log('Total Created:', status.connections.totalCreated);
        
        // Operations
        console.log('\n=== OPERATIONS ===');
        console.log('Insert:', status.opcounters.insert);
        console.log('Query:', status.opcounters.query);
        console.log('Update:', status.opcounters.update);
        console.log('Delete:', status.opcounters.delete);
        
        // Memory
        console.log('\n=== MEMORY ===');
        console.log('Resident (MB):', status.mem.resident);
        console.log('Virtual (MB):', status.mem.virtual);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. CURRENT OPERATIONS
// -------------------------------------------------------------------------------------------

async function currentOperations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const admin = client.db('admin');
        
        // All current operations
        const ops = await admin.command({
            currentOp: 1,
            active: true,
            secs_running: { $gte: 5 }  // Running > 5 seconds
        });
        
        console.log('Long running operations:', ops.inprog.length);
        
        for (const op of ops.inprog) {
            console.log('---');
            console.log('OpId:', op.opid);
            console.log('Type:', op.op);
            console.log('Namespace:', op.ns);
            console.log('Running (sec):', op.secs_running);
            console.log('Query:', JSON.stringify(op.command).substring(0, 100));
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. KILLING OPERATIONS
// -------------------------------------------------------------------------------------------

async function killOperation() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const admin = client.db('admin');
        
        // Find and kill slow query
        const ops = await admin.command({ currentOp: 1, active: true });
        
        for (const op of ops.inprog) {
            if (op.secs_running > 60) {
                console.log('Killing operation:', op.opid);
                await admin.command({ killOp: 1, op: op.opid });
            }
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. DATABASE PROFILER
// -------------------------------------------------------------------------------------------

async function profiler() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Enable profiling
        // Level 0: Off
        // Level 1: Slow queries only
        // Level 2: All operations
        await db.command({ profile: 1, slowms: 100 });
        
        // Get profiling status
        const status = await db.command({ profile: -1 });
        console.log('Profiling level:', status.was);
        console.log('Slow threshold (ms):', status.slowms);
        
        // Query profiler results
        const slowQueries = await db.collection('system.profile')
            .find({})
            .sort({ ts: -1 })
            .limit(10)
            .toArray();
        
        for (const query of slowQueries) {
            console.log('---');
            console.log('Operation:', query.op);
            console.log('Namespace:', query.ns);
            console.log('Duration (ms):', query.millis);
            console.log('DocsExamined:', query.docsExamined);
            console.log('Command:', JSON.stringify(query.command).substring(0, 100));
        }
        
        // Disable profiling
        await db.command({ profile: 0 });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. INDEX STATISTICS
// -------------------------------------------------------------------------------------------

async function indexStats() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const stats = await collection.aggregate([
            { $indexStats: {} }
        ]).toArray();
        
        console.log('=== INDEX USAGE ===');
        for (const index of stats) {
            console.log(`\n${index.name}:`);
            console.log('  Accesses:', index.accesses.ops);
            console.log('  Since:', index.accesses.since);
        }
        
        // Find unused indexes (0 accesses)
        const unused = stats.filter(i => i.accesses.ops === 0 && i.name !== '_id_');
        console.log('\nUnused indexes:', unused.map(i => i.name));
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. COLLECTION STATISTICS
// -------------------------------------------------------------------------------------------

async function collectionStats() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        const stats = await db.command({ collStats: 'orders' });
        
        console.log('=== COLLECTION STATS ===');
        console.log('Name:', stats.ns);
        console.log('Document Count:', stats.count);
        console.log('Size (bytes):', stats.size);
        console.log('Avg Doc Size:', stats.avgObjSize);
        console.log('Storage Size:', stats.storageSize);
        console.log('Index Count:', stats.nindexes);
        console.log('Total Index Size:', stats.totalIndexSize);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * MONITORING TOOLS:
 * 
 * serverStatus - Overall server health
 * currentOp    - Active operations
 * profiler     - Slow query logging
 * $indexStats  - Index usage
 * collStats    - Collection metrics
 * 
 * BEST PRACTICES:
 * - Monitor connections and op counters
 * - Enable profiler for slow queries
 * - Review and remove unused indexes
 * - Set up alerts for key metrics
 */

module.exports = {
    serverStatus,
    currentOperations,
    killOperation,
    profiler,
    indexStats,
    collectionStats
};
