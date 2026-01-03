/**
 * TOPIC: READ AND WRITE CONCERNS
 * DESCRIPTION:
 * Read and write concerns control data consistency and durability
 * guarantees in MongoDB replica sets and sharded clusters.
 */

const { MongoClient, ReadPreference, ReadConcern, WriteConcern } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. WRITE CONCERN
// -------------------------------------------------------------------------------------------

/**
 * WRITE CONCERN LEVELS:
 * 
 * w: 0         - Fire and forget (no acknowledgment)
 * w: 1         - Primary acknowledged (default)
 * w: 2         - Primary + 1 secondary
 * w: "majority"- Majority of replica set
 * 
 * j: true      - Wait for journal commit
 * wtimeout     - Max wait time in ms
 */

async function writeConcernExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Default write concern (w: 1)
        await collection.insertOne({ item: 'widget' });
        
        // Majority write concern (recommended for durability)
        await collection.insertOne(
            { item: 'gadget' },
            { writeConcern: { w: 'majority', j: true } }
        );
        
        // With timeout
        await collection.insertOne(
            { item: 'thing' },
            { writeConcern: { w: 'majority', wtimeout: 5000 } }
        );
        
        // Specific number of nodes
        await collection.insertOne(
            { item: 'stuff' },
            { writeConcern: { w: 2, j: true } }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. READ CONCERN
// -------------------------------------------------------------------------------------------

/**
 * READ CONCERN LEVELS:
 * 
 * local      - Returns local data (may be rolled back)
 * available  - No guarantee, fastest
 * majority   - Data acknowledged by majority
 * linearizable - Real-time read on primary
 * snapshot   - Consistent snapshot (transactions)
 */

async function readConcernExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Local read (default)
        await collection.find({})
            .readConcern('local')
            .toArray();
        
        // Majority read (durable data only)
        await collection.find({})
            .readConcern('majority')
            .toArray();
        
        // Linearizable (strongest guarantee)
        await collection.find({})
            .readConcern('linearizable')
            .limit(1)
            .toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. COMBINATION TABLE
// -------------------------------------------------------------------------------------------

/**
 * CONSISTENCY VS AVAILABILITY TRADE-OFF:
 * 
 * | Read Concern   | Write Concern  | Guarantee                        |
 * |----------------|----------------|----------------------------------|
 * | local          | 1              | Fastest, may read uncommitted    |
 * | local          | majority       | Durable writes, fast reads       |
 * | majority       | majority       | Read committed data only         |
 * | linearizable   | majority       | Strongest consistency            |
 * 
 * RECOMMENDATIONS:
 * - Financial: majority/majority
 * - Analytics: local/1
 * - Session data: majority/majority with causal consistency
 */

// -------------------------------------------------------------------------------------------
// 4. CAUSAL CONSISTENCY
// -------------------------------------------------------------------------------------------

async function causalConsistency() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        
        // Enable causal consistency
        const session = client.startSession({ causalConsistency: true });
        
        const collection = client.db('testdb').collection('users');
        
        // Write to primary
        await collection.updateOne(
            { _id: 'user1' },
            { $set: { lastActive: new Date() } },
            { session }
        );
        
        // Read from secondary - guaranteed to see the write
        const user = await collection.findOne(
            { _id: 'user1' },
            { session, readPreference: 'secondary' }
        );
        
        session.endSession();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. CONNECTION-LEVEL DEFAULTS
// -------------------------------------------------------------------------------------------

async function connectionLevelDefaults() {
    // Set defaults at connection level
    const client = new MongoClient('mongodb://localhost:27017', {
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true },
        readPreference: 'primaryPreferred'
    });
    
    try {
        await client.connect();
        
        // All operations use connection defaults
        const collection = client.db('testdb').collection('orders');
        
        await collection.insertOne({ item: 'widget' });
        await collection.find({}).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * READ/WRITE CONCERNS:
 * 
 * Write Concern:
 * - w: 'majority' for durability
 * - j: true for crash safety
 * - Set wtimeout to avoid hanging
 * 
 * Read Concern:
 * - 'majority' for committed data
 * - 'linearizable' for real-time reads
 * - 'local' for performance
 * 
 * BEST PRACTICES:
 * - Use majority/majority for critical data
 * - Enable causal consistency for sessions
 * - Set reasonable timeouts
 * - Balance consistency vs latency
 */

module.exports = {
    writeConcernExamples,
    readConcernExamples,
    causalConsistency,
    connectionLevelDefaults
};
