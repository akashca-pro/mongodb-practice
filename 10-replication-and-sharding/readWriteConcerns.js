/**
 * TOPIC: READ AND WRITE CONCERNS - COMPREHENSIVE GUIDE
 * DESCRIPTION:
 * Read and write concerns control data consistency, durability, and availability
 * guarantees in MongoDB replica sets and sharded clusters. Understanding these
 * is critical for building reliable applications.
 */

const { MongoClient, ReadPreference, ReadConcern, WriteConcern } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. WRITE CONCERN FUNDAMENTALS
// -------------------------------------------------------------------------------------------

/**
 * WRITE CONCERN:
 * 
 * Specifies the level of acknowledgment requested from MongoDB for write operations.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Property    │ Type              │ Description                              │
 * ├─────────────┼───────────────────┼──────────────────────────────────────────┤
 * │ w           │ number | "majority"│ Number of nodes that must acknowledge   │
 * │ j           │ boolean           │ Wait for journal commit                  │
 * │ wtimeout    │ number (ms)       │ Timeout for write concern                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * W VALUES:
 * 
 * w: 0      - Fire and forget (no acknowledgment)
 *             ⚠️ Network errors won't be reported
 *             ⚠️ Write conflicts won't be detected
 *             Use: Logging, metrics (where loss is acceptable)
 * 
 * w: 1      - Primary acknowledged (DEFAULT)
 *             ✓ Primary has written to memory
 *             ✗ May be lost if primary crashes before replication
 *             Use: General purpose, balanced performance/safety
 * 
 * w: 2      - Primary + 1 secondary
 *             ✓ Data on 2 nodes
 *             ✗ May still lose if both crash before journal
 *             Use: Higher durability requirement
 * 
 * w: "majority" - Majority of replica set (RECOMMENDED)
 *             ✓ Data on majority of voting nodes
 *             ✓ Survives failover without rollback
 *             ✓ Required for transactions
 *             Use: Critical data, financial systems
 * 
 * w: <number> - Specific number of nodes
 *             Must be <= total nodes
 *             Higher = more durable but slower
 * 
 * w: <tag>   - Custom write concern using tags
 *             Defined in replica set configuration
 *             Use: Multi-data-center acknowledgment
 */

async function writeConcernExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // ============================================================
        // w: 0 - Fire and forget (DANGEROUS)
        // ============================================================
        // No acknowledgment, fastest, no error reporting
        await collection.insertOne(
            { type: 'metric', value: 42 },
            { writeConcern: { w: 0 } }
        );
        
        // ============================================================
        // w: 1 - Primary acknowledged (DEFAULT)
        // ============================================================
        // Waits for primary to write to memory
        await collection.insertOne(
            { item: 'widget' },
            { writeConcern: { w: 1 } }
        );
        
        // ============================================================
        // w: "majority" - Majority of replica set (RECOMMENDED)
        // ============================================================
        // Waits for majority of voting members
        await collection.insertOne(
            { item: 'important' },
            { writeConcern: { w: 'majority' } }
        );
        
        // ============================================================
        // w: "majority" with journal (SAFEST)
        // ============================================================
        // Waits for majority AND journal commit
        await collection.insertOne(
            { item: 'critical' },
            { writeConcern: { w: 'majority', j: true } }
        );
        
        // ============================================================
        // With timeout
        // ============================================================
        // Fails if acknowledgment not received within timeout
        try {
            await collection.insertOne(
                { item: 'time-sensitive' },
                { writeConcern: { w: 'majority', wtimeout: 5000 } }
            );
        } catch (error) {
            if (error.code === 64) {
                // WriteConcernError - write happened but timed out waiting
                // Document may or may not be replicated
            }
        }
        
        // ============================================================
        // Specific number of nodes
        // ============================================================
        await collection.insertOne(
            { item: 'multi-node' },
            { writeConcern: { w: 3 } }  // Wait for 3 nodes
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. JOURNAL OPTION (j)
// -------------------------------------------------------------------------------------------

/**
 * JOURNAL WRITE CONCERN:
 * 
 * j: true  - Wait for write to be committed to the journal (on-disk WAL)
 * j: false - Don't wait for journal commit (default for w >= 1)
 * 
 * WHY JOURNAL MATTERS:
 * 
 * Without journal commit:
 * 1. Write goes to memory
 * 2. Acknowledged to client
 * 3. Server crashes
 * 4. Data LOST (not in journal)
 * 
 * With journal commit:
 * 1. Write goes to memory
 * 2. Write goes to disk journal
 * 3. Acknowledged to client
 * 4. Server crashes
 * 5. Data RECOVERED from journal
 * 
 * JOURNAL COMMIT INTERVAL:
 * - Default: 100ms (configurable)
 * - j: true forces immediate commit
 * 
 * WHEN TO USE j: true:
 * - Financial transactions
 * - Audit logs
 * - Any data that must survive crash
 */

async function journalExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const collection = client.db('testdb').collection('transactions');
    
    // Safe: Wait for journal commit
    await collection.insertOne(
        { type: 'transfer', amount: 1000 },
        { writeConcern: { w: 'majority', j: true } }
    );
    
    // Faster but less safe: No journal wait
    await collection.insertOne(
        { type: 'view', page: '/home' },
        { writeConcern: { w: 1, j: false } }
    );
    
    await client.close();
}

// -------------------------------------------------------------------------------------------
// 3. READ CONCERN FUNDAMENTALS
// -------------------------------------------------------------------------------------------

/**
 * READ CONCERN:
 * 
 * Specifies the consistency and isolation level for reading data.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────────────┐
 * │ Level         │ Isolation   │ Description                                          │
 * ├───────────────┼─────────────┼──────────────────────────────────────────────────────┤
 * │ local         │ Low         │ Returns most recent data (may be rolled back)        │
 * │ available     │ Lowest      │ Returns data without guarantee (sharded clusters)    │
 * │ majority      │ High        │ Returns data acknowledged by majority                │
 * │ linearizable  │ Highest     │ Real-time read, reflects all completed writes        │
 * │ snapshot      │ Transaction │ Consistent snapshot at transaction start             │
 * └─────────────────────────────────────────────────────────────────────────────────────┘
 * 
 * DETAILED BREAKDOWN:
 * 
 * "local" (DEFAULT):
 *   - Returns most recent data on the queried member
 *   - No guarantee data won't be rolled back
 *   - Cannot read uncommitted data (within a document)
 *   - Fast, good for secondaries
 *   - Use: General reads where slight staleness is OK
 * 
 * "available":
 *   - Like local but returns data ASAP
 *   - In sharded clusters, may return orphaned documents
 *   - Fastest read concern
 *   - Use: Analytics queries where correctness > speed
 * 
 * "majority":
 *   - Returns only data acknowledged by majority
 *   - Data is durable and won't be rolled back
 *   - Returns potentially stale data (from majority ack time)
 *   - Use: When you need committed data only
 * 
 * "linearizable":
 *   - Returns data that reflects ALL successful writes
 *   - Single-document reads only
 *   - Requires primary
 *   - Slowest (waits for majority commit)
 *   - Use: When you need "read-after-write" guarantee
 * 
 * "snapshot":
 *   - Used with multi-document transactions
 *   - Reads from consistent snapshot
 *   - Use: Transactions requiring isolation
 */

async function readConcernExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    const collection = client.db('testdb').collection('accounts');
    
    // ============================================================
    // "local" - Most recent data (may rollback)
    // ============================================================
    const localResult = await collection.find({})
        .readConcern('local')
        .toArray();
    
    // ============================================================
    // "majority" - Only committed data
    // ============================================================
    const majorityResult = await collection.find({})
        .readConcern('majority')
        .toArray();
    
    // ============================================================
    // "linearizable" - Strongest guarantee (primary, single doc)
    // ============================================================
    // Note: Must be primary, single document, expensive
    const linearResult = await collection.findOne(
        { _id: 'account123' },
        { readConcern: { level: 'linearizable' } }
    );
    
    // ============================================================
    // With maxTimeMS (important for linearizable)
    // ============================================================
    const timedResult = await collection.findOne(
        { _id: 'account123' },
        {
            readConcern: { level: 'linearizable' },
            maxTimeMS: 10000  // 10 second timeout
        }
    );
    
    await client.close();
}

// -------------------------------------------------------------------------------------------
// 4. READ PREFERENCE
// -------------------------------------------------------------------------------------------

/**
 * READ PREFERENCE:
 * 
 * Determines which replica set members to read from.
 * Different from READ CONCERN (which is about consistency).
 * 
 * ┌─────────────────────────┬───────────────────────────────────────────────────┐
 * │ Mode                    │ Behavior                                          │
 * ├─────────────────────────┼───────────────────────────────────────────────────┤
 * │ primary                 │ Read only from primary (default)                  │
 * │ primaryPreferred        │ Primary if available, else secondary              │
 * │ secondary               │ Read only from secondaries                        │
 * │ secondaryPreferred      │ Secondary if available, else primary              │
 * │ nearest                 │ Lowest network latency member                     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * ADDITIONAL OPTIONS:
 * - tags: Route to members with specific tags
 * - maxStalenessSeconds: Avoid stale secondaries
 * - hedge: Enable hedged reads (MongoDB 4.4+)
 */

async function readPreferenceExamples() {
    // Connection-level setting
    const client = new MongoClient('mongodb://host1,host2,host3/mydb?replicaSet=rs0', {
        readPreference: ReadPreference.SECONDARY_PREFERRED
    });
    
    await client.connect();
    const collection = client.db('testdb').collection('data');
    
    // Per-query override
    const results = await collection.find({})
        .readPreference('secondary')
        .toArray();
    
    // With tags (for geographic routing)
    const dcEastResults = await collection.find({})
        .readPreference('nearest', [{ dc: 'east' }])
        .toArray();
    
    // With maxStalenessSeconds (avoid very stale secondaries)
    const freshResults = await collection.find({})
        .readPreference('secondaryPreferred', [], { maxStalenessSeconds: 120 })
        .toArray();
    
    await client.close();
}

// -------------------------------------------------------------------------------------------
// 5. CONSISTENCY COMBINATIONS
// -------------------------------------------------------------------------------------------

/**
 * READ/WRITE CONCERN COMBINATIONS:
 * 
 * The combination determines your consistency guarantee.
 * 
 * ┌─────────────────┬──────────────────┬─────────────────────────────────────────┐
 * │ Write Concern   │ Read Concern     │ Guarantee                               │
 * ├─────────────────┼──────────────────┼─────────────────────────────────────────┤
 * │ w: 1            │ local            │ Fastest, may read uncommitted           │
 * │ w: 1            │ majority         │ Read durable data, writes may rollback  │
 * │ w: majority     │ local            │ Writes durable, may read uncommitted    │
 * │ w: majority     │ majority         │ Full durability, read your writes       │
 * │ w: majority, j  │ linearizable     │ Strongest: durable + real-time read     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * USE CASE RECOMMENDATIONS:
 * 
 * FINANCIAL TRANSACTIONS:
 *   Write: { w: "majority", j: true }
 *   Read:  { level: "majority" }
 *   Why:   Must survive failures, read only committed
 * 
 * ANALYTICS / REPORTING:
 *   Write: { w: 1 }
 *   Read:  { level: "local" }, readPreference: "secondary"
 *   Why:   Speed matters, slight staleness OK
 * 
 * USER SESSIONS:
 *   Write: { w: "majority" }
 *   Read:  { level: "majority" }
 *   + Causal consistency
 *   Why:   User should see own changes
 * 
 * AUDIT LOGS:
 *   Write: { w: "majority", j: true }
 *   Read:  { level: "majority" }
 *   Why:   Must be durable and tamper-evident
 * 
 * HIGH-VOLUME METRICS:
 *   Write: { w: 0 } or { w: 1 }
 *   Read:  { level: "local" }
 *   Why:   Losing some data acceptable for performance
 */

// -------------------------------------------------------------------------------------------
// 6. CAUSAL CONSISTENCY
// -------------------------------------------------------------------------------------------

/**
 * CAUSAL CONSISTENCY:
 * 
 * Ensures a logical ordering of operations within a session.
 * - Read your writes
 * - Monotonic reads
 * - Monotonic writes
 * - Writes follow reads
 * 
 * Without causal consistency (reading from secondary):
 * 1. Write to primary: { name: "John" }
 * 2. Read from secondary: null (replication lag!)
 * 
 * With causal consistency:
 * 1. Write to primary: { name: "John" }
 * 2. Read from secondary: { name: "John" } (guaranteed)
 */

async function causalConsistencyExamples() {
    const client = new MongoClient('mongodb://host1,host2,host3/?replicaSet=rs0');
    await client.connect();
    
    // Start causally consistent session
    const session = client.startSession({ causalConsistency: true });
    
    try {
        const users = client.db('testdb').collection('users');
        
        // Write to primary
        await users.updateOne(
            { _id: 'user1' },
            { $set: { lastActive: new Date() } },
            { session }
        );
        
        // Read from secondary - guaranteed to see the write
        // because we're using the same causal session
        const user = await users.findOne(
            { _id: 'user1' },
            {
                session,
                readPreference: 'secondary'
            }
        );
        
        console.log(user.lastActive); // Will reflect the update
        
    } finally {
        session.endSession();
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 7. READ CONCERN IN TRANSACTIONS
// -------------------------------------------------------------------------------------------

/**
 * TRANSACTION READ CONCERNS:
 * 
 * Transactions have specific read concern behavior.
 * 
 * "snapshot" (default for transactions):
 *   - Reads from consistent snapshot at transaction start
 *   - Provides repeatable reads
 *   - Isolation from concurrent writes
 * 
 * "local":
 *   - Available in transactions
 *   - Faster but less isolated
 * 
 * "majority":
 *   - Available in transactions
 *   - Reads only committed data
 */

async function transactionReadConcern() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    await client.connect();
    
    const session = client.startSession();
    
    try {
        session.startTransaction({
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' }
        });
        
        const accounts = client.db('bank').collection('accounts');
        
        // All reads see consistent snapshot from transaction start
        const sender = await accounts.findOne({ _id: 'account1' }, { session });
        const receiver = await accounts.findOne({ _id: 'account2' }, { session });
        
        // Even if another transaction modifies these accounts,
        // we see the snapshot from when we started
        
        await accounts.updateOne(
            { _id: 'account1' },
            { $inc: { balance: -100 } },
            { session }
        );
        
        await accounts.updateOne(
            { _id: 'account2' },
            { $inc: { balance: 100 } },
            { session }
        );
        
        await session.commitTransaction();
        
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 8. CONNECTION-LEVEL DEFAULTS
// -------------------------------------------------------------------------------------------

async function connectionDefaults() {
    // Set defaults at connection level
    const client = new MongoClient('mongodb://host1,host2,host3/?replicaSet=rs0', {
        // Default write concern for all operations
        writeConcern: {
            w: 'majority',
            j: true,
            wtimeout: 10000
        },
        
        // Default read concern
        readConcern: { level: 'majority' },
        
        // Default read preference
        readPreference: 'primaryPreferred'
    });
    
    await client.connect();
    
    // All operations use these defaults
    const collection = client.db('testdb').collection('data');
    
    // Uses w: majority, j: true from connection
    await collection.insertOne({ item: 'test' });
    
    // Uses readConcern: majority from connection
    await collection.find({}).toArray();
    
    // Override at operation level
    await collection.insertOne(
        { item: 'less-critical' },
        { writeConcern: { w: 1 } }
    );
    
    await client.close();
}

// -------------------------------------------------------------------------------------------
// 9. WRITE CONCERN ERRORS
// -------------------------------------------------------------------------------------------

/**
 * WRITE CONCERN ERRORS:
 * 
 * Write concern errors occur when the write succeeds on primary
 * but fails to replicate within the specified parameters.
 * 
 * Important: The write DID occur on the primary!
 */

async function handleWriteConcernErrors() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    
    const collection = client.db('testdb').collection('orders');
    
    try {
        await collection.insertOne(
            { orderId: 'ORD123' },
            { writeConcern: { w: 3, wtimeout: 5000 } }
        );
    } catch (error) {
        if (error.code === 64) {
            // WriteConcernError
            console.log('Write succeeded on primary but timed out waiting for replication');
            console.log('The write DID happen, but replicas may not have it yet');
            
            // Options:
            // 1. Check if document exists
            const doc = await collection.findOne({ orderId: 'ORD123' });
            if (doc) {
                console.log('Document exists on primary');
            }
            
            // 2. Wait and retry verification
            // 3. Alert operations team
        }
        
        if (error.code === 100) {
            // CannotSatisfyWriteConcern
            console.log('Impossible to satisfy write concern');
            console.log('e.g., w: 5 but only 3 members in replica set');
        }
    }
    
    await client.close();
}

// -------------------------------------------------------------------------------------------
// 10. TAG-BASED WRITE CONCERNS
// -------------------------------------------------------------------------------------------

/**
 * CUSTOM WRITE CONCERNS WITH TAGS:
 * 
 * Define custom write concerns in replica set configuration
 * to require acknowledgment from specific members.
 */

const tagBasedWriteConcerns = `
// Configure replica set with tags
cfg = rs.conf()
cfg.members[0].tags = { dc: "east", rack: "r1" }
cfg.members[1].tags = { dc: "east", rack: "r2" }
cfg.members[2].tags = { dc: "west", rack: "r1" }

// Define custom write concern modes
cfg.settings.getLastErrorModes = {
    // Require acknowledgment from both data centers
    "multiDC": { "dc": 2 },
    
    // Require acknowledgment from multiple racks
    "multiRack": { "rack": 2 }
}

rs.reconfig(cfg)

// Use custom write concern
db.orders.insertOne(
    { orderId: "ORD123" },
    { writeConcern: { w: "multiDC", wtimeout: 10000 } }
)
`;

async function tagBasedWriteConcernExample() {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    
    const collection = client.db('testdb').collection('orders');
    
    // Use custom write concern defined in replica set config
    await collection.insertOne(
        { orderId: 'ORD123' },
        { writeConcern: { w: 'multiDC' } }  // Both data centers must ack
    );
    
    await client.close();
}

// -------------------------------------------------------------------------------------------
// 11. BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * READ/WRITE CONCERN BEST PRACTICES:
 * 
 * 1. DEFAULT TO MAJORITY
 *    - Use w: "majority" for important data
 *    - Prevents rollback after failover
 *    - Required for transactions
 * 
 * 2. ADD JOURNAL FOR CRITICAL DATA
 *    - Use j: true for financial/audit data
 *    - Survives server crash before journal flush
 * 
 * 3. ALWAYS SET TIMEOUTS
 *    - wtimeout prevents hanging forever
 *    - Handle timeout errors appropriately
 * 
 * 4. MATCH READ AND WRITE CONCERNS
 *    - majority/majority for read-your-writes
 *    - Don't read majority if writing w:1 (inconsistent)
 * 
 * 5. USE CAUSAL CONSISTENCY FOR SESSIONS
 *    - Enables reading from secondaries safely
 *    - User sees their own writes
 * 
 * 6. CONSIDER LINEARIZABLE CAREFULLY
 *    - Very expensive (waits for majority ack)
 *    - Single document only
 *    - Use when you need real-time guarantee
 * 
 * 7. TUNE FOR WORKLOAD
 *    - Analytics: local/w:1 (speed)
 *    - Financial: majority/majority with journal
 *    - Metrics: w:0 or w:1 (high volume)
 * 
 * 8. MONITOR REPLICATION LAG
 *    - High lag affects majority reads on secondaries
 *    - May cause timeouts
 * 
 * 9. SET CONNECTION DEFAULTS
 *    - Configure at connection level
 *    - Override per-operation only when needed
 * 
 * 10. TEST FAILOVER BEHAVIOR
 *     - Verify application handles write concern errors
 *     - Test with network partitions
 */

// -------------------------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------------------------

/**
 * KEY POINTS:
 * 
 * WRITE CONCERN:
 * - w: 0 = fire and forget (dangerous)
 * - w: 1 = primary ack (default)
 * - w: "majority" = majority ack (recommended)
 * - j: true = journal commit (safest)
 * - wtimeout = prevent infinite wait
 * 
 * READ CONCERN:
 * - "local" = fast, may see uncommitted (default)
 * - "majority" = only committed data
 * - "linearizable" = real-time, single doc
 * - "snapshot" = transactions
 * 
 * READ PREFERENCE:
 * - Determines WHICH node to read from
 * - Different from read CONCERN (consistency)
 * 
 * CAUSAL CONSISTENCY:
 * - Read your writes guarantee
 * - Enables safe secondary reads
 * - Use within sessions
 * 
 * RECOMMENDATIONS:
 * - Critical data: majority/majority with journal
 * - Analytics: local with secondary reads
 * - High volume: w:1 or w:0
 * - Sessions: Enable causal consistency
 */

module.exports = {
    writeConcernExamples,
    readConcernExamples,
    readPreferenceExamples,
    causalConsistencyExamples,
    transactionReadConcern,
    connectionDefaults,
    handleWriteConcernErrors,
    tagBasedWriteConcernExample
};
