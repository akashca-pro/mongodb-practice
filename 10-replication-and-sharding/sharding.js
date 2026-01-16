/**
 * TOPIC: SHARDING - IN-DEPTH GUIDE
 * DESCRIPTION:
 * Sharding is MongoDB's approach to horizontal scaling. It distributes data
 * across multiple servers (shards) to handle large datasets and high throughput.
 */

// -------------------------------------------------------------------------------------------
// 1. SHARDING ARCHITECTURE
// -------------------------------------------------------------------------------------------

/**
 * SHARDED CLUSTER COMPONENTS:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                           SHARDED CLUSTER                                    │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │                                                                              │
 * │                        ┌─────────────────────┐                               │
 * │                        │      mongos         │  ← Query Router               │
 * │                        │   (Query Router)    │    Application connects here  │
 * │                        └──────────┬──────────┘                               │
 * │                                   │                                          │
 * │              ┌────────────────────┼────────────────────┐                     │
 * │              ▼                    ▼                    ▼                     │
 * │   ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
 * │   │   Config Server  │ │   Config Server  │ │   Config Server  │            │
 * │   │  (Replica Set)   │ │  (Replica Set)   │ │  (Replica Set)   │            │
 * │   │   Metadata       │ │   Metadata       │ │   Metadata       │            │
 * │   └──────────────────┘ └──────────────────┘ └──────────────────┘            │
 * │              │                    │                    │                     │
 * │              └────────────────────┼────────────────────┘                     │
 * │                                   │                                          │
 * │         ┌─────────────────────────┼─────────────────────────┐                │
 * │         ▼                         ▼                         ▼                │
 * │  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐          │
 * │  │   SHARD 1   │          │   SHARD 2   │          │   SHARD 3   │          │
 * │  │ (Replica    │          │ (Replica    │          │ (Replica    │          │
 * │  │   Set)      │          │   Set)      │          │   Set)      │          │
 * │  │  Chunk A-M  │          │  Chunk N-T  │          │  Chunk U-Z  │          │
 * │  └─────────────┘          └─────────────┘          └─────────────┘          │
 * │                                                                              │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * COMPONENTS EXPLAINED:
 * 
 * 1. SHARD
 *    - Holds a portion of the sharded data
 *    - Each shard is a replica set
 *    - Minimum 1 shard (but defeats the purpose)
 * 
 * 2. CONFIG SERVERS
 *    - Store metadata and cluster config
 *    - Chunk mappings (which data on which shard)
 *    - MUST be a 3-member replica set
 *    - Critical for cluster operation
 * 
 * 3. MONGOS (Query Router)
 *    - Routes queries to appropriate shards
 *    - Merges results from multiple shards
 *    - Stateless, can run multiple
 *    - Applications connect to mongos, not shards
 */

// -------------------------------------------------------------------------------------------
// 2. CHUNKS AND DATA DISTRIBUTION
// -------------------------------------------------------------------------------------------

/**
 * CHUNKS:
 * 
 * A chunk is a contiguous range of shard key values assigned to a shard.
 * 
 * Example with shard key { age: 1 }:
 * 
 * Chunk 1: { age: MinKey } → { age: 18 }  → Shard A
 * Chunk 2: { age: 18 }     → { age: 35 }  → Shard B
 * Chunk 3: { age: 35 }     → { age: 55 }  → Shard A
 * Chunk 4: { age: 55 }     → { age: MaxKey } → Shard C
 * 
 * CHUNK SIZE:
 * - Default: 128 MB (configurable 1-1024 MB)
 * - When chunk exceeds size, it's split
 * - Balancer moves chunks between shards
 * 
 * JUMBO CHUNKS:
 * - Chunks that cannot be split (all docs have same shard key value)
 * - Indicate bad shard key choice
 * - Cause uneven distribution
 */

const chunkOperations = `
// View chunk distribution
sh.status()

// View chunks for a collection
use config
db.chunks.find({ ns: "mydb.users" }).pretty()

// Count chunks per shard
db.chunks.aggregate([
    { $match: { ns: "mydb.users" } },
    { $group: { _id: "$shard", count: { $sum: 1 } } }
])

// Get chunk size setting
use config
db.settings.findOne({ _id: "chunksize" })

// Change chunk size (MB)
db.settings.updateOne(
    { _id: "chunksize" },
    { $set: { value: 64 } },
    { upsert: true }
)

// Split a specific chunk
sh.splitAt("mydb.users", { username: "midpoint_value" })

// Split chunk at its midpoint
sh.splitFind("mydb.users", { username: "some_value" })

// Manually move a chunk
sh.moveChunk("mydb.users", { username: "john" }, "shard0002")
`;

// -------------------------------------------------------------------------------------------
// 3. SHARD KEY TYPES
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY TYPES:
 * 
 * 1. RANGED SHARD KEY
 *    - Values stored in order
 *    - Good for range queries
 *    - Risk: hotspots with sequential values
 * 
 * 2. HASHED SHARD KEY
 *    - Hash of the field value
 *    - Even distribution
 *    - Random access patterns
 *    - Poor for range queries
 * 
 * 3. COMPOUND SHARD KEY
 *    - Multiple fields
 *    - Better query isolation
 *    - More distribution strategies
 */

const shardKeyTypes = `
// ==============================================================
// HASHED SHARD KEY
// ==============================================================
// Best for: Even write distribution, random access patterns

sh.shardCollection("mydb.users", { _id: "hashed" })

// Documents distributed by hash of _id:
// _id: ObjectId("abc") → hash → Shard A
// _id: ObjectId("def") → hash → Shard C
// _id: ObjectId("ghi") → hash → Shard B

// ==============================================================
// RANGED SHARD KEY
// ==============================================================
// Best for: Range queries, sorted access

sh.shardCollection("mydb.logs", { timestamp: 1 })

// Documents distributed by range:
// timestamp < 2023-01-01 → Shard A
// 2023-01-01 <= timestamp < 2023-06-01 → Shard B
// timestamp >= 2023-06-01 → Shard C

// ==============================================================
// COMPOUND SHARD KEY
// ==============================================================
// Best for: Multi-tenant, query isolation

sh.shardCollection("mydb.orders", { customerId: 1, orderDate: 1 })

// Documents distributed by compound key:
// All orders for customer_1 in 2023 → likely same shard
// Orders for different customers → distributed

// ==============================================================
// HASHED + COMPOUND (Prefix Hashing)
// ==============================================================
// Best for: Scoped queries with even distribution

sh.shardCollection("mydb.products", { category: 1, _id: "hashed" })
`;

// -------------------------------------------------------------------------------------------
// 4. SHARD KEY SELECTION CRITERIA
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY SELECTION MATRIX:
 * 
 * | Property          | Good                          | Bad                           |
 * |-------------------|-------------------------------|-------------------------------|
 * | Cardinality       | High (millions of values)     | Low (few values)              |
 * | Frequency         | Values evenly distributed     | Hotspot values                |
 * | Monotonicity      | Random/non-sequential         | Sequential (timestamp, auto-inc) |
 * | Query Patterns    | Matches common queries        | Never in queries              |
 * 
 * SHARD KEY EXAMPLES BY USE CASE:
 * 
 * E-Commerce Orders:
 * - Good: { customerId: 1, orderDate: 1 }
 * - Why: Queries often by customer, date allows range
 * 
 * User Sessions:
 * - Good: { sessionId: "hashed" }
 * - Why: Random access, no ranges needed
 * 
 * Multi-Tenant SaaS:
 * - Good: { tenantId: 1, _id: "hashed" }
 * - Why: Isolates tenant data, even distribution within tenant
 * 
 * Time Series Data:
 * - Good: { deviceId: 1, timestamp: 1 }
 * - Why: Queries by device + time range, distributes across devices
 * - Bad: { timestamp: 1 } alone (sequential writes to one shard)
 * 
 * IoT Sensor Data:
 * - Good: { sensorId: "hashed" }
 * - Why: Many sensors, even distribution
 * 
 * Social Media Posts:
 * - Good: { userId: 1, createdAt: 1 }
 * - Why: User-centric queries, time ordering
 */

const shardKeyAnalysis = {
    // Analyze your query patterns to choose shard key
    queryPatterns: {
        // If you query like this:
        findByUser: 'db.orders.find({ userId: "123" })',
        // Include userId in shard key
        
        findByUserAndDate: 'db.orders.find({ userId: "123", date: { $gte: ISODate() } })',
        // Use compound key { userId: 1, date: 1 }
        
        findByStatus: 'db.orders.find({ status: "pending" })',
        // DON'T use status as shard key (low cardinality)
    },
    
    // Good shard key indicators
    goodIndicators: [
        'High cardinality (many unique values)',
        'Present in most queries',
        'Not frequently updated',
        'Not monotonically increasing',
        'Reasonable distribution of document counts per value'
    ],
    
    // Red flags
    redFlags: [
        'Only a few distinct values (status, boolean, country)',
        'Always increasing (timestamp, auto-increment)',
        'Frequently updated field',
        'Not in query patterns',
        'Very uneven distribution'
    ]
};

// -------------------------------------------------------------------------------------------
// 5. ZONE SHARDING (TAG-AWARE SHARDING)
// -------------------------------------------------------------------------------------------

/**
 * ZONE SHARDING:
 * 
 * Allows you to associate ranges of shard key values with specific shards.
 * 
 * USE CASES:
 * - Data locality (keep data near users)
 * - Regulatory compliance (GDPR - EU data stays in EU)
 * - Hardware tiering (hot data on SSD, cold on HDD)
 * - Multi-tenant isolation
 */

const zoneShardingSetup = `
// ==============================================================
// GEOGRAPHIC ZONE SHARDING
// ==============================================================

// Step 1: Add shards to zones
sh.addShardToZone("shard-us-east", "US")
sh.addShardToZone("shard-us-west", "US")
sh.addShardToZone("shard-eu-west", "EU")
sh.addShardToZone("shard-eu-central", "EU")

// Step 2: Assign shard key ranges to zones
sh.updateZoneKeyRange(
    "mydb.users",
    { region: "US", _id: MinKey },
    { region: "US", _id: MaxKey },
    "US"
)

sh.updateZoneKeyRange(
    "mydb.users",
    { region: "EU", _id: MinKey },
    { region: "EU", _id: MaxKey },
    "EU"
)

// Step 3: Verify zone configuration
sh.status()

// ==============================================================
// TIERED STORAGE ZONES
// ==============================================================

// Hot data (recent) on fast shards
sh.addShardToZone("shard-ssd-1", "hot")
sh.addShardToZone("shard-ssd-2", "hot")

// Cold data (old) on slower shards
sh.addShardToZone("shard-hdd-1", "cold")
sh.addShardToZone("shard-hdd-2", "cold")

// Recent data goes to hot zone
sh.updateZoneKeyRange(
    "mydb.logs",
    { timestamp: ISODate("2024-01-01"), _id: MinKey },
    { timestamp: MaxKey, _id: MaxKey },
    "hot"
)

// Older data goes to cold zone
sh.updateZoneKeyRange(
    "mydb.logs",
    { timestamp: MinKey, _id: MinKey },
    { timestamp: ISODate("2024-01-01"), _id: MaxKey },
    "cold"
)

// ==============================================================
// MULTI-TENANT ISOLATION
// ==============================================================

sh.addShardToZone("shard-dedicated-1", "enterprise-client-A")

sh.updateZoneKeyRange(
    "mydb.documents",
    { tenantId: "client-A", _id: MinKey },
    { tenantId: "client-A", _id: MaxKey },
    "enterprise-client-A"
)
`;

// -------------------------------------------------------------------------------------------
// 6. SHARDED CLUSTER SETUP
// -------------------------------------------------------------------------------------------

const shardedClusterSetup = `
// ==============================================================
// STEP 1: START CONFIG SERVERS (Replica Set)
// ==============================================================

// Start 3 config servers
mongod --configsvr --replSet configRS --port 27019 --dbpath /data/configdb1
mongod --configsvr --replSet configRS --port 27020 --dbpath /data/configdb2
mongod --configsvr --replSet configRS --port 27021 --dbpath /data/configdb3

// Initialize config replica set
mongosh --port 27019
rs.initiate({
    _id: "configRS",
    configsvr: true,
    members: [
        { _id: 0, host: "config1:27019" },
        { _id: 1, host: "config2:27020" },
        { _id: 2, host: "config3:27021" }
    ]
})

// ==============================================================
// STEP 2: START SHARD SERVERS (Each is a Replica Set)
// ==============================================================

// Shard 1 replica set
mongod --shardsvr --replSet shard1RS --port 27017 --dbpath /data/shard1-1
mongod --shardsvr --replSet shard1RS --port 27018 --dbpath /data/shard1-2
// Initialize shard1RS...

// Shard 2 replica set
mongod --shardsvr --replSet shard2RS --port 27027 --dbpath /data/shard2-1
mongod --shardsvr --replSet shard2RS --port 27028 --dbpath /data/shard2-2
// Initialize shard2RS...

// ==============================================================
// STEP 3: START MONGOS (Query Router)
// ==============================================================

mongos --configdb configRS/config1:27019,config2:27020,config3:27021 --port 27000

// Can start multiple mongos for high availability
mongos --configdb configRS/config1:27019,config2:27020,config3:27021 --port 27001

// ==============================================================
// STEP 4: ADD SHARDS TO CLUSTER
// ==============================================================

mongosh --port 27000

sh.addShard("shard1RS/shard1-1:27017,shard1-2:27018")
sh.addShard("shard2RS/shard2-1:27027,shard2-2:27028")

// Verify
sh.status()

// ==============================================================
// STEP 5: ENABLE SHARDING ON DATABASE
// ==============================================================

sh.enableSharding("mydb")

// ==============================================================
// STEP 6: SHARD COLLECTIONS
// ==============================================================

// Create index on shard key first (for ranged)
use mydb
db.users.createIndex({ email: 1 })

// Shard the collection
sh.shardCollection("mydb.users", { email: "hashed" })
sh.shardCollection("mydb.orders", { customerId: 1, orderDate: 1 })
`;

// -------------------------------------------------------------------------------------------
// 7. BALANCER
// -------------------------------------------------------------------------------------------

/**
 * BALANCER:
 * 
 * Background process that moves chunks between shards to achieve
 * even data distribution.
 * 
 * HOW IT WORKS:
 * 1. Monitors chunk count per shard
 * 2. When imbalance exceeds threshold, initiates migrations
 * 3. Moves chunks from shards with more to shards with fewer
 * 
 * MIGRATION THRESHOLD:
 * - < 20 chunks total: difference of 2
 * - 20-79 chunks: difference of 4
 * - 80+ chunks: difference of 8
 */

const balancerOperations = `
// Check balancer status
sh.isBalancerRunning()
sh.getBalancerState()

// Enable/disable balancer
sh.startBalancer()
sh.stopBalancer()

// Set balancer window (run only during off-peak)
use config
db.settings.updateOne(
    { _id: "balancer" },
    { $set: { activeWindow: { start: "02:00", stop: "06:00" } } },
    { upsert: true }
)

// Disable balancing for specific collection (during maintenance)
sh.disableBalancing("mydb.users")
sh.enableBalancing("mydb.users")

// Check current migrations
use config
db.locks.find({ state: { $ne: 0 } })

// View migration history
db.changelog.find({ what: "moveChunk.commit" }).sort({ time: -1 }).limit(10)

// Check balancer status detailed
db.adminCommand({ balancerStatus: 1 })
`;

// -------------------------------------------------------------------------------------------
// 8. QUERY ROUTING
// -------------------------------------------------------------------------------------------

/**
 * QUERY ROUTING:
 * 
 * mongos routes queries based on shard key:
 * 
 * TARGETED QUERY:
 * - Query includes shard key
 * - Sent to specific shard(s)
 * - Most efficient
 * 
 * SCATTER-GATHER (BROADCAST):
 * - Query lacks shard key
 * - Sent to ALL shards
 * - Results merged by mongos
 * - Expensive for large clusters
 */

const queryRouting = `
// Assume shard key: { customerId: 1 }

// TARGETED (efficient) - goes to one shard
db.orders.find({ customerId: "C123" })
db.orders.find({ customerId: "C123", status: "pending" })

// SCATTER-GATHER (expensive) - goes to all shards
db.orders.find({ status: "pending" })
db.orders.find({ orderDate: { $gt: ISODate("2024-01-01") } })

// TARGETED with compound key { customerId: 1, orderDate: 1 }
db.orders.find({ customerId: "C123" })  // Targeted (prefix match)
db.orders.find({ customerId: "C123", orderDate: { $gt: ISODate() } })  // Targeted

// NOT targeted (missing prefix)
db.orders.find({ orderDate: { $gt: ISODate() } })  // Scatter-gather

// Use explain to verify routing
db.orders.find({ customerId: "C123" }).explain()
// Look for: "shards" in the plan to see which shards are queried
`;

// -------------------------------------------------------------------------------------------
// 9. RESHARDING (MongoDB 5.0+)
// -------------------------------------------------------------------------------------------

/**
 * RESHARDING:
 * 
 * Allows changing the shard key of an existing sharded collection.
 * Previously, the only option was to dump and reload data.
 * 
 * USE CASES:
 * - Poor shard key choice causing hotspots
 * - Changed query patterns
 * - Need different data distribution
 * 
 * LIMITATIONS:
 * - Cannot reshard to a hashed shard key (can FROM hashed)
 * - Increases disk space temporarily
 * - I/O intensive operation
 */

const reshardingOperations = `
// Initiate resharding
db.adminCommand({
    reshardCollection: "mydb.orders",
    key: { customerId: 1, orderDate: 1 }
})

// Monitor resharding progress
db.getSiblingDB("admin").aggregate([
    { $currentOp: { allUsers: true, localOps: false } },
    { 
        $match: { 
            type: "op", 
            "originatingCommand.reshardCollection": { $exists: true } 
        } 
    }
])

// Alternative: watch the metrics
while (true) {
    const status = db.adminCommand({
        currentOp: true,
        $or: [
            { "command.reshardCollection": { $exists: true } },
            { "command._shardsvrReshardCollection": { $exists: true } }
        ]
    });
    printjson(status);
    sleep(5000);
}

// Abort if needed
db.adminCommand({ abortReshardCollection: "mydb.orders" })

// Post-resharding: verify distribution
sh.status()
`;

// -------------------------------------------------------------------------------------------
// 10. MONITORING AND TROUBLESHOOTING
// -------------------------------------------------------------------------------------------

const monitoringCommands = `
// ==============================================================
// CLUSTER STATUS
// ==============================================================

sh.status()           // Overview of entire cluster
sh.status(true)       // Verbose output

// Database sharding status
use config
db.databases.find()

// Collection sharding info
db.collections.find({ _id: /^mydb/ })

// ==============================================================
// CHUNK DISTRIBUTION
// ==============================================================

// Chunks per shard
db.chunks.aggregate([
    { $match: { ns: "mydb.orders" } },
    { $group: { _id: "$shard", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
])

// Identify jumbo chunks
db.chunks.find({ ns: "mydb.orders", jumbo: true })

// Chunk ranges
db.chunks.find({ ns: "mydb.orders" }, { min: 1, max: 1, shard: 1 })

// ==============================================================
// BALANCER ACTIVITY
// ==============================================================

// Current migrations
use config
db.locks.find({ _id: "balancer" })

// Migration history
db.changelog.find({ what: /moveChunk/ }).sort({ time: -1 }).limit(10)

// Failed migrations
db.changelog.find({ what: "moveChunk.error" }).sort({ time: -1 })

// ==============================================================
// QUERY ANALYSIS
// ==============================================================

// Explain query routing
db.orders.find({ customerId: "C123" }).explain("executionStats")

// Check if query is targeted
const explain = db.orders.find({ customerId: "C123" }).explain();
print("Shards queried:", explain.queryPlanner.winningPlan.shards?.length || 1);

// ==============================================================
// COMMON ISSUES
// ==============================================================

// Check for config server issues
rs.status()  // on config server

// Check shard health
db.adminCommand({ listShards: 1 })

// Check for long-running operations
db.currentOp({ active: true, secs_running: { $gt: 5 } })
`;

// -------------------------------------------------------------------------------------------
// 11. BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * SHARDING BEST PRACTICES:
 * 
 * 1. SHARD KEY SELECTION
 *    - Analyze query patterns before choosing
 *    - Prefer compound keys for flexibility
 *    - Test with realistic data volumes
 *    - Consider future query needs
 * 
 * 2. WHEN TO SHARD
 *    - Dataset approaching server capacity
 *    - Write throughput exceeds single node
 *    - Working set doesn't fit in RAM
 *    - Geographic data distribution needed
 * 
 * 3. CLUSTER SIZING
 *    - Start with 2-3 shards
 *    - Each shard should be a 3-member replica set
 *    - Multiple mongos for HA (behind load balancer)
 *    - Config servers on dedicated hardware
 * 
 * 4. PRE-SPLITTING
 *    - Pre-split chunks before bulk loading
 *    - Prevents single shard hotspot during load
 *    - Calculate ranges based on data distribution
 * 
 * 5. MONITORING
 *    - Alert on chunk imbalance
 *    - Monitor balancer activity
 *    - Watch for jumbo chunks
 *    - Track query targeting percentage
 * 
 * 6. APPLICATION DESIGN
 *    - Always include shard key in queries when possible
 *    - Design for targeted queries
 *    - Handle scatter-gather gracefully
 *    - Use read preferences appropriately
 * 
 * 7. CAPACITY PLANNING
 *    - Plan for 50-60% storage utilization per shard
 *    - Reserve capacity for rebalancing
 *    - Consider resharding costs
 */

const preSplitting = `
// Pre-split before bulk load
// Assume shard key: { _id: "hashed" }, loading 10 million docs

// Disable balancer during pre-split
sh.stopBalancer()

// Create collection and shard
sh.shardCollection("mydb.massive", { _id: "hashed" })

// Pre-split into chunks (divide hash space)
for (let i = 0; i < 16; i++) {
    const point = { _id: NumberLong(i * (2**60 / 16)) };
    sh.splitAt("mydb.massive", point);
}

// Move chunks to different shards (if auto-balance too slow)
// ... moveChunk commands ...

// Re-enable balancer
sh.startBalancer()

// Now do bulk load - writes distributed across pre-split chunks
`;

// -------------------------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------------------------

/**
 * KEY POINTS:
 * 
 * 1. Sharding = horizontal scaling across multiple servers
 * 2. Cluster = mongos + config servers + shards (each a replica set)
 * 3. Shard key determines data distribution - choose carefully
 * 4. Hashed keys = even distribution, ranged = range query support
 * 5. Balancer maintains even chunk distribution
 * 6. Targeted queries (with shard key) = efficient
 * 7. Scatter-gather queries = expensive
 * 8. Zone sharding for data locality/compliance
 * 9. Resharding (5.0+) allows changing shard key
 * 10. Monitor: chunk distribution, balancer, query targeting
 */

module.exports = {
    shardKeyAnalysis
};
