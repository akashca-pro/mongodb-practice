/**
 * TOPIC: MONGODB INTERNALS - STORAGE, CONSISTENCY & THEORY
 * DESCRIPTION:
 * Deep dive into MongoDB's internal workings including storage engine,
 * journaling, MVCC, CAP theorem, ACID/BASE properties, and consistency models.
 * Essential for understanding how MongoDB handles data at a low level.
 */

// ==========================================================================================
// 1. WIREDTIGER STORAGE ENGINE
// ==========================================================================================

/**
 * WIREDTIGER OVERVIEW:
 * 
 * WiredTiger is MongoDB's default storage engine since version 3.2.
 * It provides document-level concurrency, compression, and journaling.
 * 
 * KEY FEATURES:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Feature              │ Description                                         │
 * ├──────────────────────┼─────────────────────────────────────────────────────┤
 * │ Document-Level Lock  │ Concurrent writes to different documents            │
 * │ MVCC                 │ Readers don't block writers                         │
 * │ Compression          │ Snappy (default), zlib, zstd                        │
 * │ Journaling           │ Write-ahead logging for durability                  │
 * │ Checkpoints          │ Consistent snapshots every 60 seconds               │
 * │ Cache                │ In-memory data structures for performance           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * ARCHITECTURE:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                           APPLICATION                                       │
 * └───────────────────────────────┬─────────────────────────────────────────────┘
 *                                 │
 * ┌───────────────────────────────▼─────────────────────────────────────────────┐
 * │                        WIREDTIGER CACHE                                     │
 * │   ┌─────────────────────────────────────────────────────────────────────┐   │
 * │   │  In-Memory B-Tree Pages  │  Modified Pages  │  Lookaside Buffer    │   │
 * │   └─────────────────────────────────────────────────────────────────────┘   │
 * └───────────────────────────────┬─────────────────────────────────────────────┘
 *                                 │
 *         ┌───────────────────────┼───────────────────────┐
 *         ▼                       ▼                       ▼
 * ┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
 * │  DATA FILES   │     │    JOURNAL      │     │   CHECKPOINT    │
 * │  (.wt files)  │     │   (write-ahead) │     │   (every 60s)   │
 * └───────────────┘     └─────────────────┘     └─────────────────┘
 */

const wiredTigerConfig = `
// View WiredTiger statistics
db.serverStatus().wiredTiger

// Check cache statistics
db.serverStatus().wiredTiger.cache

// Key metrics:
// - "bytes currently in the cache"
// - "pages read into cache"
// - "pages written from cache"
// - "maximum bytes configured"

// View collection storage statistics
db.myCollection.stats().wiredTiger

// Configure WiredTiger cache size (in mongod.conf)
storage:
  engine: wiredTiger
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4  # 4GB cache
    collectionConfig:
      blockCompressor: snappy  # or zlib, zstd
    indexConfig:
      prefixCompression: true
`;

// ==========================================================================================
// 2. JOURNALING (WRITE-AHEAD LOGGING)
// ==========================================================================================

/**
 * JOURNALING IN MONGODB:
 * 
 * Journaling provides durability by writing operations to a write-ahead log
 * BEFORE applying them to data files. This allows crash recovery.
 * 
 * HOW IT WORKS:
 * 
 * 1. Client sends write operation
 * 2. MongoDB writes to in-memory cache
 * 3. Write is logged to journal (WAL)
 * 4. Client receives acknowledgment (if j:true)
 * 5. Checkpoint writes cached data to data files (every 60s)
 * 
 * JOURNAL COMMIT INTERVAL:
 * - Default: 100ms (or when journal reaches 100MB)
 * - With j:true write concern: Immediate commit
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                           WRITE OPERATION                                   │
 * └───────────────────────────────────┬─────────────────────────────────────────┘
 *                                     │
 *                                     ▼
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        IN-MEMORY CACHE                                      │
 * │                    (Modified pages stored here)                             │
 * └───────────────────────────────────┬─────────────────────────────────────────┘
 *                                     │
 *                    ┌────────────────┼────────────────┐
 *                    ▼                                 ▼
 * ┌─────────────────────────────────┐   ┌───────────────────────────────────────┐
 * │           JOURNAL               │   │          DATA FILES                   │
 * │   (Write-ahead log, immediate)  │   │   (Checkpoint every 60 seconds)       │
 * │                                 │   │                                       │
 * │   - Sequential writes (fast)    │   │   - Random I/O (slower)               │
 * │   - 100ms commit interval       │   │   - Background process                │
 * │   - Compressed entries          │   │   - Consistent snapshot               │
 * └─────────────────────────────────┘   └───────────────────────────────────────┘
 * 
 * RECOVERY PROCESS:
 * 
 * On startup after crash:
 * 1. Load last checkpoint (consistent state)
 * 2. Replay journal entries after checkpoint
 * 3. Apply uncommitted operations
 * 4. Database is now consistent
 */

const journalingConfig = `
// Journal storage location
// By default: <dbpath>/journal/

// Check journal status
db.serverStatus().dur

// Journal statistics
db.serverStatus().wiredTiger.log

// Key metrics:
// - "log bytes of payload data"
// - "log records compressed"
// - "log sync time duration (usecs)"

// Force journal commit (for testing)
db.adminCommand({ journalCommitWithinBatchJob: 1 })

// mongod.conf settings
storage:
  journal:
    enabled: true  # Cannot be disabled with WiredTiger
    commitIntervalMs: 100  # Default commit interval

// Write with journal acknowledgment
db.collection.insertOne(
    { data: "important" },
    { writeConcern: { w: 1, j: true } }  // Wait for journal commit
)

// IMPORTANT: j:true ensures durability but adds latency
// Use for critical writes (financial transactions, etc.)
`;

/**
 * JOURNAL vs OPLOG:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Aspect          │ Journal                    │ Oplog                        │
 * ├─────────────────┼────────────────────────────┼──────────────────────────────┤
 * │ Purpose         │ Local crash recovery       │ Replication                  │
 * │ Scope           │ Single node                │ Replica set                  │
 * │ Content         │ Physical operations        │ Logical operations           │
 * │ Location        │ <dbpath>/journal/          │ local.oplog.rs               │
 * │ Retention       │ Until checkpoint           │ Configurable size            │
 * │ Format          │ Binary, low-level          │ BSON documents               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */


// ==========================================================================================
// 3. MVCC (MULTI-VERSION CONCURRENCY CONTROL)
// ==========================================================================================

/**
 * MVCC IN MONGODB:
 * 
 * Multi-Version Concurrency Control allows readers and writers to operate
 * concurrently without blocking each other. Each operation sees a consistent
 * snapshot of data.
 * 
 * HOW IT WORKS:
 * 
 * 1. Each write creates a new version of the document
 * 2. Old versions are kept temporarily (for active readers)
 * 3. Readers see a consistent snapshot from their start time
 * 4. Old versions are cleaned up after no readers need them
 * 
 * EXAMPLE SCENARIO:
 * 
 * Time    │ Writer                    │ Reader
 * ────────┼───────────────────────────┼────────────────────────────────
 * T1      │                           │ Starts query (snapshot at T1)
 * T2      │ Updates doc: value = 100  │
 * T3      │ Commits                   │
 * T4      │                           │ Reads doc: sees old value (T1 snapshot)
 * T5      │                           │ Query completes
 * T6      │                           │ New query sees value = 100
 * 
 * BENEFITS:
 * - Readers never block writers
 * - Writers never block readers
 * - Consistent point-in-time views
 * - No read locks needed
 * 
 * IMPLEMENTATION:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                          DOCUMENT: { _id: 1 }                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │                                                                             │
 * │   Version 1        Version 2        Version 3        (Current)             │
 * │   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐           │
 * │   │ val: 10 │ ───► │ val: 20 │ ───► │ val: 30 │ ───► │ val: 40 │           │
 * │   │ ts: T1  │      │ ts: T2  │      │ ts: T3  │      │ ts: T4  │           │
 * │   └─────────┘      └─────────┘      └─────────┘      └─────────┘           │
 * │        ▲                ▲                                                   │
 * │        │                │                                                   │
 * │   Reader A          Reader B                                                │
 * │   (started T1)      (started T2)                                           │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * SNAPSHOT ISOLATION:
 * 
 * MongoDB transactions use snapshot isolation:
 * - Transaction sees data as of transaction start
 * - Changes from other transactions are invisible
 * - Write conflicts are detected at commit time
 */

const mvccExample = `
// MVCC is automatic in MongoDB - no special configuration needed

// Demonstrate snapshot behavior with transactions
const session = db.getMongo().startSession()

// Reader session sees snapshot from start time
session.startTransaction({ readConcern: { level: "snapshot" } })

// This read sees a consistent point-in-time view
db.collection.find({}).readConcern("snapshot")

// Read concerns and MVCC:
// - "local"       : Most recent committed data on this node
// - "available"   : Most recent data (may include uncommitted in sharding)
// - "majority"    : Data acknowledged by majority (durable)
// - "linearizable": Most recent data + causally consistent
// - "snapshot"    : Transaction snapshot isolation
`;


// ==========================================================================================
// 4. CAP THEOREM
// ==========================================================================================

/**
 * CAP THEOREM:
 * 
 * The CAP theorem states that a distributed system can only guarantee
 * TWO of the following THREE properties at any time:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                        CAP THEOREM                                          │
 * │                                                                             │
 * │                         CONSISTENCY                                         │
 * │                             ▲                                               │
 * │                            / \                                              │
 * │                           /   \                                             │
 * │                          /     \                                            │
 * │                         /   C   \                                           │
 * │                        /    +    \                                          │
 * │                       /     P     \                                         │
 * │                      /             \                                        │
 * │     AVAILABILITY ◄─────────────────►  PARTITION TOLERANCE                   │
 * │                        A + P                                                │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * DEFINITIONS:
 * 
 * C - CONSISTENCY
 *     Every read returns the most recent write or an error.
 *     All nodes see the same data at the same time.
 * 
 * A - AVAILABILITY
 *     Every request receives a response (success or failure).
 *     The system remains operational.
 * 
 * P - PARTITION TOLERANCE
 *     System continues to operate despite network partitions.
 *     Messages between nodes may be dropped or delayed.
 * 
 * 
 * WHERE MONGODB SITS:
 * 
 * MongoDB is a CP system by default:
 * - Prioritizes Consistency and Partition Tolerance
 * - During network partition, minority partition becomes unavailable
 * - Can be tuned toward AP with lower read/write concerns
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Configuration        │ CAP Trade-off │ Behavior                            │
 * ├──────────────────────┼───────────────┼─────────────────────────────────────┤
 * │ w:majority, r:maj    │ CP            │ Strong consistency, may be slower   │
 * │ w:1, r:local         │ AP-ish        │ Higher availability, eventual cons. │
 * │ w:0                  │ AP            │ Fire-forget, no consistency         │
 * │ linearizable read    │ CP (strong)   │ Strongest consistency guarantee     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * 
 * NETWORK PARTITION SCENARIO:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                    NETWORK PARTITION                                        │
 * │                                                                             │
 * │   Data Center A              ╳╳╳╳╳╳╳╳             Data Center B             │
 * │   ┌─────────────┐           ╳ NETWORK ╳           ┌─────────────┐           │
 * │   │   Primary   │          ╳ PARTITION ╳          │  Secondary  │           │
 * │   │  Secondary  │           ╳╳╳╳╳╳╳╳╳            │             │           │
 * │   └─────────────┘                                 └─────────────┘           │
 * │        ▲                                                                    │
 * │   Majority (2/3)                                  Minority (1/3)            │
 * │   Remains PRIMARY                                 Becomes READ-ONLY         │
 * │   Accepts writes                                  Cannot accept writes      │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * MongoDB chooses CONSISTENCY over AVAILABILITY during partition.
 */


// ==========================================================================================
// 5. ACID PROPERTIES
// ==========================================================================================

/**
 * ACID IN MONGODB:
 * 
 * ACID properties ensure reliable database transactions.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Property    │ MongoDB Implementation                                       │
 * ├─────────────┼─────────────────────────────────────────────────────────────┤
 * │ ATOMICITY   │ Single doc: Always atomic                                    │
 * │             │ Multi-doc: Transactions (4.0+ replica, 4.2+ sharded)         │
 * ├─────────────┼─────────────────────────────────────────────────────────────┤
 * │ CONSISTENCY │ Schema validation, unique indexes, document validation       │
 * │             │ Configurable via write/read concerns                         │
 * ├─────────────┼─────────────────────────────────────────────────────────────┤
 * │ ISOLATION   │ Snapshot isolation in transactions                           │
 * │             │ Document-level isolation for single-doc ops                  │
 * ├─────────────┼─────────────────────────────────────────────────────────────┤
 * │ DURABILITY  │ Journaling (write-ahead log)                                 │
 * │             │ Write concern: w:majority, j:true                            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * 
 * ATOMICITY DETAILS:
 * 
 * Single Document:
 * - ALL fields updated atomically
 * - No partial updates visible
 * - Applies to updates of embedded documents
 * 
 * Multi-Document (Transactions):
 * - All-or-nothing across multiple documents
 * - Rollback on error
 * - Available in replica sets and sharded clusters
 */

const acidExamples = `
// --------------------------------------------------
// ATOMICITY - Single Document (Built-in)
// --------------------------------------------------

// This update is atomic - all fields update together
db.accounts.updateOne(
    { _id: "ACC001" },
    {
        $inc: { balance: -100 },
        $push: { transactions: { amount: -100, date: new Date() } },
        $set: { lastModified: new Date() }
    }
)

// --------------------------------------------------
// ATOMICITY - Multi-Document (Transactions)
// --------------------------------------------------

const session = db.getMongo().startSession()
session.startTransaction()

try {
    const accounts = session.getDatabase("bank").accounts
    
    // Debit
    accounts.updateOne({ _id: "ACC001" }, { $inc: { balance: -100 } })
    
    // Credit
    accounts.updateOne({ _id: "ACC002" }, { $inc: { balance: 100 } })
    
    session.commitTransaction()  // Both or neither
} catch (e) {
    session.abortTransaction()   // Rollback
}

// --------------------------------------------------
// CONSISTENCY - Schema Validation
// --------------------------------------------------

db.createCollection("products", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "price"],
            properties: {
                price: { bsonType: "number", minimum: 0 }
            }
        }
    }
})

// --------------------------------------------------
// ISOLATION - Snapshot Read Concern
// --------------------------------------------------

session.startTransaction({
    readConcern: { level: "snapshot" },
    writeConcern: { w: "majority" }
})

// --------------------------------------------------
// DURABILITY - Write Concern
// --------------------------------------------------

db.orders.insertOne(
    { orderId: "ORD123", total: 999 },
    { writeConcern: { w: "majority", j: true } }
)
`;


// ==========================================================================================
// 6. BASE PROPERTIES (Alternative to ACID)
// ==========================================================================================

/**
 * BASE THEOREM:
 * 
 * BASE is an alternative consistency model often used in distributed systems.
 * It trades strong consistency for availability and partition tolerance.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │              ACID vs BASE                                                   │
 * ├────────────────────────────────┬────────────────────────────────────────────┤
 * │ ACID                           │ BASE                                       │
 * ├────────────────────────────────┼────────────────────────────────────────────┤
 * │ Atomicity                      │ Basically Available                        │
 * │ Consistency                    │ Soft state                                 │
 * │ Isolation                      │ Eventually consistent                      │
 * │ Durability                     │                                            │
 * ├────────────────────────────────┼────────────────────────────────────────────┤
 * │ Strong consistency             │ Eventual consistency                       │
 * │ Pessimistic locking            │ Optimistic, best effort                    │
 * │ Always consistent              │ Consistency is eventual                    │
 * │ Harder to scale                │ Easier to scale                            │
 * │ Complex transactions           │ Simpler operations                         │
 * └────────────────────────────────┴────────────────────────────────────────────┘
 * 
 * 
 * BASE EXPLAINED:
 * 
 * BA - BASICALLY AVAILABLE
 *      System appears to work most of the time.
 *      Partial failures don't cause total system failure.
 * 
 * S  - SOFT STATE
 *      State may change over time, even without input.
 *      Due to eventual consistency propagation.
 * 
 * E  - EVENTUALLY CONSISTENT
 *      Given no new updates, all replicas will eventually
 *      converge to the same value.
 * 
 * 
 * MONGODB AND BASE:
 * 
 * MongoDB can operate in BASE-like mode with lower consistency settings:
 */

const baseMode = `
// BASE-like configuration for high availability
// (At the cost of strong consistency)

// Write concern: Just primary acknowledgment
db.logs.insertOne(
    { event: "page_view" },
    { writeConcern: { w: 1 } }  // Don't wait for replication
)

// Read from secondary (may see stale data)
db.logs.find({}).readPreference("secondaryPreferred")

// Fire-and-forget writes (eventual consistency)
db.metrics.insertOne(
    { metric: "cpu", value: 45 },
    { writeConcern: { w: 0 } }
)

// When to use BASE-like settings:
// - Logging / Metrics collection
// - User activity tracking
// - Non-critical data
// - High-throughput scenarios where some loss is acceptable
`;


// ==========================================================================================
// 7. CONSISTENCY MODELS
// ==========================================================================================

/**
 * MONGODB CONSISTENCY MODELS:
 * 
 * MongoDB offers configurable consistency through read/write concerns.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Model                │ Read Concern    │ Write Concern │ Trade-off          │
 * ├──────────────────────┼─────────────────┼───────────────┼────────────────────┤
 * │ Strong Consistency   │ linearizable    │ majority, j   │ Slowest, safest    │
 * │ Causal Consistency   │ majority        │ majority      │ Session ordering   │
 * │ Read Your Writes     │ majority        │ majority      │ See own changes    │
 * │ Monotonic Reads      │ majority        │ majority      │ No backward reads  │
 * │ Eventual Consistency │ local           │ 1             │ Fastest, stalest   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * 
 * CAUSAL CONSISTENCY (MongoDB 3.6+):
 * 
 * Ensures that operations that have a causal relationship are seen in order.
 * 
 * Without Causal Consistency:
 * 1. Client A writes to primary
 * 2. Client A reads from secondary (may not see own write!)
 * 
 * With Causal Consistency:
 * 1. Client A writes to primary
 * 2. Client A reads from secondary (guaranteed to see own write)
 */

const consistencyModels = `
// --------------------------------------------------
// STRONG CONSISTENCY (Linearizable)
// --------------------------------------------------

// Single document, real-time consistency
db.accounts.find({ _id: "ACC001" }).readConcern("linearizable")

// Use for: Critical reads needing most up-to-date data

// --------------------------------------------------
// CAUSAL CONSISTENCY
// --------------------------------------------------

const session = db.getMongo().startSession({ causalConsistency: true })

// Write to primary
session.getDatabase("mydb").users.updateOne(
    { _id: 1 },
    { $set: { name: "John" } }
)

// Read from secondary - GUARANTEED to see the write above
session.getDatabase("mydb").users.findOne(
    { _id: 1 },
    { readPreference: "secondary" }
)

// --------------------------------------------------
// MONOTONIC READS
// --------------------------------------------------

// Using majority read concern ensures you never read
// data that's older than what you've already seen

db.products.find({}).readConcern("majority")

// --------------------------------------------------
// EVENTUAL CONSISTENCY
// --------------------------------------------------

// Fastest reads, may see stale data
db.analytics.find({})
    .readPreference("secondaryPreferred")
    .readConcern("local")
`;


// ==========================================================================================
// 8. DOCUMENT-LEVEL LOCKING
// ==========================================================================================

/**
 * CONCURRENCY CONTROL IN MONGODB:
 * 
 * MongoDB uses document-level locking (with WiredTiger) for write operations.
 * 
 * LOCKING GRANULARITY:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Level          │ Description                     │ Impact                   │
 * ├────────────────┼─────────────────────────────────┼──────────────────────────┤
 * │ Global         │ Entire database server          │ Rare (admin ops)         │
 * │ Database       │ Single database                 │ Some DDL operations      │
 * │ Collection     │ Single collection               │ Index operations         │
 * │ Document       │ Single document                 │ Normal read/write        │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * 
 * INTENT LOCKS:
 * 
 * MongoDB uses intent locks to prevent conflicts between operations:
 * 
 * IS (Intent Shared)   - Intend to read at finer granularity
 * IX (Intent Exclusive) - Intend to write at finer granularity
 * S  (Shared)          - Reading this level
 * X  (Exclusive)       - Writing this level
 * 
 * 
 * LOCK COMPATIBILITY:
 * 
 *        │  IS   │  IX   │  S    │  X
 * ───────┼───────┼───────┼───────┼───────
 *   IS   │   ✓   │   ✓   │   ✓   │   ✗
 *   IX   │   ✓   │   ✓   │   ✗   │   ✗
 *   S    │   ✓   │   ✗   │   ✓   │   ✗
 *   X    │   ✗   │   ✗   │   ✗   │   ✗
 */

const lockingInfo = `
// View current operations and locks
db.currentOp()

// Check lock statistics
db.serverStatus().locks

// Check for long-running operations
db.currentOp({ "active": true, "secs_running": { $gt: 5 } })

// Kill a long-running operation
db.killOp(opId)

// Check lock percentage
db.serverStatus().globalLock

// Metrics to monitor:
// - globalLock.activeClients.readers
// - globalLock.activeClients.writers
// - globalLock.currentQueue.readers
// - globalLock.currentQueue.writers
`;


// ==========================================================================================
// 9. CHECKPOINTS AND RECOVERY
// ==========================================================================================

/**
 * CHECKPOINT PROCESS:
 * 
 * WiredTiger creates checkpoints every 60 seconds to ensure data durability.
 * 
 * CHECKPOINT FLOW:
 * 
 * 1. Mark current point in time
 * 2. Flush dirty pages from cache to data files
 * 3. Record checkpoint metadata
 * 4. Truncate journal entries before checkpoint
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                         CHECKPOINT TIMELINE                                 │
 * │                                                                             │
 * │  Time ──────────────────────────────────────────────────────────────►       │
 * │                                                                             │
 * │    │         │         │         │         │         │                      │
 * │    CP1       CP2       CP3       CP4       CP5       CP6                    │
 * │    │         │         │         │         │         │                      │
 * │    └────60s──┴────60s──┴────60s──┴────60s──┴────60s──┘                      │
 * │                                                                             │
 * │  Journal: ═══════════════════════════════════════════════►                  │
 * │           (keeps entries since last checkpoint)                             │
 * │                                                                             │
 * │  Recovery Point: Last successful checkpoint + journal replay                │
 * │                                                                             │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * 
 * CRASH RECOVERY:
 * 
 * 1. Load last valid checkpoint
 * 2. Replay journal entries since checkpoint
 * 3. Database returns to consistent state
 * 4. Maximum data loss: ~60 seconds (unless j:true used)
 */

const checkpointConfig = `
// View checkpoint status
db.serverStatus().wiredTiger.transaction

// Force a checkpoint (not recommended in production)
db.adminCommand({ fsync: 1 })

// Configure checkpoint interval (mongod.conf)
storage:
  wiredTiger:
    engineConfig:
      journalCompressor: snappy
    
# Note: Checkpoint interval is not directly configurable
# It's triggered by:
# - 60 seconds since last checkpoint
# - 2GB of journal data written
# - Specific admin commands
`;


// ==========================================================================================
// 10. DATA COMPRESSION
// ==========================================================================================

/**
 * COMPRESSION IN MONGODB:
 * 
 * WiredTiger supports multiple compression algorithms.
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Algorithm │ Ratio     │ CPU       │ Use Case                               │
 * ├───────────┼───────────┼───────────┼────────────────────────────────────────┤
 * │ snappy    │ Moderate  │ Low       │ Default, balanced (recommended)        │
 * │ zlib      │ High      │ High      │ Storage-constrained environments       │
 * │ zstd      │ Very High │ Moderate  │ Best ratio-to-speed (MongoDB 4.2+)     │
 * │ none      │ 1x        │ None      │ CPU-constrained environments           │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * COMPRESSION TARGETS:
 * - Collection data
 * - Indexes (prefix compression)
 * - Journal entries
 */

const compressionConfig = `
// Create collection with specific compression
db.createCollection("logs", {
    storageEngine: {
        wiredTiger: {
            configString: "block_compressor=zstd"
        }
    }
})

// Check compression stats
db.myCollection.stats().wiredTiger.creationString
// Look for: block_compressor=

// Global config (mongod.conf)
storage:
  wiredTiger:
    collectionConfig:
      blockCompressor: zstd
    indexConfig:
      prefixCompression: true

// Compression ratio estimation
const stats = db.myCollection.stats()
const compressionRatio = stats.size / stats.storageSize
print("Compression ratio:", compressionRatio.toFixed(2) + "x")
`;


// ==========================================================================================
// SUMMARY
// ==========================================================================================

/**
 * KEY TAKEAWAYS:
 * 
 * 1. WIREDTIGER: Default storage engine with MVCC, compression, journaling
 * 
 * 2. JOURNALING: Write-ahead log for crash recovery (100ms commit interval)
 * 
 * 3. MVCC: Multi-version concurrency - readers don't block writers
 * 
 * 4. CAP THEOREM: MongoDB is CP by default (Consistency + Partition tolerance)
 *    - Can be tuned to AP with lower read/write concerns
 * 
 * 5. ACID:
 *    - Single document: Always atomic
 *    - Multi-document: Transactions (4.0+)
 *    - Durability: Journaling + write concerns
 * 
 * 6. BASE: MongoDB can operate in eventual consistency mode for performance
 * 
 * 7. CONSISTENCY MODELS: Configurable from eventual to linearizable
 * 
 * 8. LOCKING: Document-level locking for high concurrency
 * 
 * 9. CHECKPOINTS: Every 60 seconds for durability
 * 
 * 10. COMPRESSION: snappy (default), zlib, zstd options
 */

module.exports = {
    wiredTigerConfig,
    journalingConfig,
    mvccExample,
    acidExamples,
    baseMode,
    consistencyModels,
    lockingInfo,
    checkpointConfig,
    compressionConfig
};
