/**
 * TOPIC: MONGODB ARCHITECTURE
 * DESCRIPTION:
 * MongoDB is a document-oriented NoSQL database designed for scalability,
 * flexibility, and high performance. Understanding its architecture is
 * essential for effective database design and optimization.
 */

// -------------------------------------------------------------------------------------------
// 1. WHAT IS MONGODB?
// -------------------------------------------------------------------------------------------

/**
 * MongoDB is a NoSQL database that stores data in flexible, JSON-like documents.
 * 
 * KEY CHARACTERISTICS:
 * - Document-oriented: Data stored as BSON documents
 * - Schema-flexible: Documents can have different structures
 * - Horizontally scalable: Built-in sharding support
 * - High availability: Replica sets for automatic failover
 * 
 * DIFFERENCES FROM RELATIONAL DATABASES:
 * | RDBMS      | MongoDB      |
 * |------------|--------------|
 * | Database   | Database     |
 * | Table      | Collection   |
 * | Row        | Document     |
 * | Column     | Field        |
 * | Index      | Index        |
 * | JOIN       | $lookup      |
 * | Primary Key| _id field    |
 */

// MongoDB document example
const userDocument = {
    _id: "ObjectId('507f1f77bcf86cd799439011')",
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    address: {
        street: "123 Main St",
        city: "New York",
        country: "USA"
    },
    interests: ["coding", "music", "travel"],
    createdAt: new Date()
};

console.log("MongoDB Document Example:", JSON.stringify(userDocument, null, 2));

// -------------------------------------------------------------------------------------------
// 2. MONGODB COMPONENTS
// -------------------------------------------------------------------------------------------

/**
 * CORE COMPONENTS:
 * 
 * 1. mongod (MongoDB Daemon)
 *    - Primary database process
 *    - Handles data requests and manages data access
 *    - Manages data format and performs background operations
 * 
 * 2. mongos (MongoDB Shard Router)
 *    - Query router for sharded clusters
 *    - Routes queries to appropriate shards
 *    - Aggregates results from multiple shards
 * 
 * 3. mongo / mongosh (MongoDB Shell)
 *    - Interactive JavaScript interface
 *    - Used for administration and data manipulation
 *    - Supports scripting and automation
 * 
 * ARCHITECTURE DIAGRAM:
 * 
 * ┌─────────────────────────────────────────────────────┐
 * │                   APPLICATION                        │
 * │              (Node.js, Python, Java)                 │
 * └──────────────────────┬──────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────┐
 * │               MONGODB DRIVER                         │
 * │         (Official Language Drivers)                  │
 * └──────────────────────┬──────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────┐
 * │                mongos (if sharded)                   │
 * │               Query Router Layer                     │
 * └──────────────────────┬──────────────────────────────┘
 *                        │
 *                        ▼
 * ┌─────────────────────────────────────────────────────┐
 * │                     mongod                           │
 * │              Primary Database Process                │
 * ├─────────────────────────────────────────────────────┤
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
 * │  │   Storage   │  │    Wire     │  │   Query     │  │
 * │  │   Engine    │  │   Protocol  │  │   Engine    │  │
 * │  └─────────────┘  └─────────────┘  └─────────────┘  │
 * └─────────────────────────────────────────────────────┘
 */

// -------------------------------------------------------------------------------------------
// 3. STORAGE ENGINE
// -------------------------------------------------------------------------------------------

/**
 * WiredTiger is the default storage engine since MongoDB 3.2.
 * 
 * WIREDTIGER FEATURES:
 * - Document-level concurrency control
 * - Compression (snappy, zlib, zstd)
 * - Encryption at rest
 * - Checkpointing for durability
 * 
 * STORAGE ENGINE COMPARISON:
 * | Feature           | WiredTiger  | In-Memory  |
 * |-------------------|-------------|------------|
 * | Persistence       | Yes         | No         |
 * | Compression       | Yes         | N/A        |
 * | Concurrency       | Document    | Document   |
 * | Use Case          | General     | Caching    |
 * 
 * JOURNAL:
 * - Write-ahead log for crash recovery
 * - Commits every 100ms by default
 * - Ensures durability of writes
 */

// Check storage engine (run in mongosh)
const storageEngineCheck = `
// In mongosh:
db.serverStatus().storageEngine

// Output example:
// {
//   name: 'wiredTiger',
//   supportsCommittedReads: true,
//   supportsSnapshotReadConcern: true
// }
`;

console.log("Storage Engine Check Command:", storageEngineCheck);

// -------------------------------------------------------------------------------------------
// 4. MEMORY MANAGEMENT
// -------------------------------------------------------------------------------------------

/**
 * MongoDB uses memory-mapped I/O for efficient data access.
 * 
 * WIREDTIGER CACHE:
 * - Default: 50% of RAM minus 1GB, or 256MB (whichever is greater)
 * - Configurable via --wiredTigerCacheSizeGB
 * - Stores indexes and frequently accessed data
 * 
 * MEMORY ALLOCATION:
 * ┌────────────────────────────────────────┐
 * │              System RAM                 │
 * ├──────────────────┬─────────────────────┤
 * │  WiredTiger      │    File System      │
 * │     Cache        │       Cache         │
 * │   (Working Set)  │  (Recent Reads)     │
 * └──────────────────┴─────────────────────┘
 * 
 * BEST PRACTICES:
 * - Working set should fit in RAM
 * - Monitor cache usage with serverStatus
 * - Leave room for OS and other processes
 */

// Memory monitoring commands
const memoryCommands = `
// Check cache statistics
db.serverStatus().wiredTiger.cache

// Check current operations
db.currentOp()

// Check memory usage
db.serverStatus().mem
`;

console.log("Memory Monitoring Commands:", memoryCommands);

// -------------------------------------------------------------------------------------------
// 5. QUERY PROCESSING
// -------------------------------------------------------------------------------------------

/**
 * HOW QUERIES ARE PROCESSED:
 * 
 * 1. Query Parsing
 *    - Parse query document
 *    - Validate syntax and operators
 * 
 * 2. Query Planning
 *    - Generate candidate query plans
 *    - Evaluate available indexes
 *    - Choose optimal plan
 * 
 * 3. Query Execution
 *    - Execute chosen plan
 *    - Return results or cursor
 * 
 * QUERY OPTIMIZER:
 * - Empirical query planner
 * - Caches winning plans
 * - Re-evaluates when:
 *   - Collection changes significantly
 *   - Indexes added/removed
 *   - Server restart
 */

// Example of query explain
const explainExample = `
// Analyze query execution
db.users.find({ email: "test@example.com" }).explain("executionStats")

// Key fields to check:
// - queryPlanner.winningPlan
// - executionStats.executionTimeMillis
// - executionStats.totalDocsExamined
// - executionStats.totalKeysExamined
`;

console.log("Query Explain Example:", explainExample);

// -------------------------------------------------------------------------------------------
// 6. DATA ORGANIZATION
// -------------------------------------------------------------------------------------------

/**
 * DATABASE STRUCTURE:
 * 
 * Server
 * └── Database (myapp)
 *     ├── Collection (users)
 *     │   ├── Document { _id: 1, name: "John" }
 *     │   ├── Document { _id: 2, name: "Jane" }
 *     │   └── Document { _id: 3, name: "Bob" }
 *     ├── Collection (products)
 *     │   └── Documents...
 *     └── Collection (orders)
 *         └── Documents...
 * 
 * NAMESPACES:
 * - Full name: database.collection
 * - Example: myapp.users
 * - Max namespace length: 120 bytes
 * 
 * DOCUMENT LIMITS:
 * - Max document size: 16MB
 * - Max nesting depth: 100 levels
 * - Use GridFS for larger files
 */

// Creating database and collection
const createDbExample = `
// Switch to database (creates if doesn't exist)
use myapp

// Create collection explicitly
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email"],
            properties: {
                name: { bsonType: "string" },
                email: { bsonType: "string" }
            }
        }
    }
})

// Or implicitly by inserting
db.products.insertOne({ name: "Widget", price: 9.99 })
`;

console.log("Database Creation Example:", createDbExample);

// -------------------------------------------------------------------------------------------
// 7. CONCURRENCY MODEL
// -------------------------------------------------------------------------------------------

/**
 * MongoDB uses document-level locking for write operations.
 * 
 * LOCKING HIERARCHY:
 * - Global (rare, for admin operations)
 * - Database (for certain operations)
 * - Collection (for certain operations)
 * - Document (WiredTiger, most operations)
 * 
 * LOCK TYPES:
 * - Shared (S): Multiple readers
 * - Exclusive (X): Single writer
 * - Intent Shared (IS): Intent to read
 * - Intent Exclusive (IX): Intent to write
 * 
 * OPTIMISTIC CONCURRENCY:
 * - No locks during read
 * - Write conflicts handled with retries
 * - Transactions provide ACID guarantees
 */

// Handling concurrent updates
const concurrencyExample = `
// Using findOneAndUpdate for atomic operations
db.inventory.findOneAndUpdate(
    { item: "widget", qty: { $gt: 0 } },
    { $inc: { qty: -1 } },
    { returnDocument: "after" }
)

// Using transactions for multi-document operations
const session = client.startSession();
session.startTransaction();
try {
    await orders.insertOne({ item: "widget", qty: 1 }, { session });
    await inventory.updateOne({ item: "widget" }, { $inc: { qty: -1 } }, { session });
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
}
`;

console.log("Concurrency Example:", concurrencyExample);

// -------------------------------------------------------------------------------------------
// 8. DEPLOYMENT ARCHITECTURES
// -------------------------------------------------------------------------------------------

/**
 * STANDALONE:
 * - Single mongod instance
 * - Development and testing only
 * - No high availability
 * 
 * REPLICA SET:
 * ┌─────────┐  ┌─────────┐  ┌─────────┐
 * │ Primary │  │Secondary│  │Secondary│
 * │ (Read/  │──│ (Read)  │──│ (Read)  │
 * │  Write) │  │         │  │         │
 * └─────────┘  └─────────┘  └─────────┘
 * 
 * - 3+ members recommended
 * - Automatic failover
 * - Data redundancy
 * 
 * SHARDED CLUSTER:
 * ┌─────────────────────────────────────┐
 * │             Application              │
 * └──────────────────┬──────────────────┘
 *                    │
 * ┌──────────────────▼──────────────────┐
 * │               mongos                 │
 * └──────────────────┬──────────────────┘
 *          ┌─────────┼─────────┐
 *          ▼         ▼         ▼
 *     ┌─────────┐ ┌─────────┐ ┌─────────┐
 *     │ Shard 1 │ │ Shard 2 │ │ Shard 3 │
 *     │(RepSet) │ │(RepSet) │ │(RepSet) │
 *     └─────────┘ └─────────┘ └─────────┘
 * 
 * - Horizontal scaling
 * - Config servers for metadata
 * - Each shard is a replica set
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * MONGODB ARCHITECTURE KEY POINTS:
 * 
 * 1. Document Model: Flexible schema, embedded documents, JSON-like structure
 * 
 * 2. Storage Engine: WiredTiger provides document-level concurrency and compression
 * 
 * 3. Memory: WiredTiger cache + OS file cache; working set should fit in RAM
 * 
 * 4. Query Processing: Optimizer evaluates plans, caches winners
 * 
 * 5. Concurrency: Document-level locking, optimistic concurrency control
 * 
 * BEST PRACTICES:
 * - Size working set to fit in available RAM
 * - Use replica sets for production (minimum 3 members)
 * - Enable journaling for durability (default: on)
 * - Monitor with mongostat and mongotop
 * - Use explain() to understand query performance
 * - Design schema based on access patterns, not relationships
 * - Consider sharding early for very large datasets
 */
