/**
 * TOPIC: REPLICA SETS AND SHARDING
 * DESCRIPTION:
 * High availability with replica sets and horizontal scaling with sharding.
 */

// -------------------------------------------------------------------------------------------
// 1. REPLICA SETS
// -------------------------------------------------------------------------------------------

/**
 * REPLICA SET:
 * - Primary: Receives all writes
 * - Secondary: Replicate from primary, serve reads
 * - Arbiter: Voting only, no data
 * 
 * Minimum 3 members for automatic failover
 */

const replicaSetConnection = `
// Connection string for replica set
mongodb://host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0

// Initialize replica set
rs.initiate({
    _id: "rs0",
    members: [
        { _id: 0, host: "host1:27017", priority: 2 },
        { _id: 1, host: "host2:27017", priority: 1 },
        { _id: 2, host: "host3:27017", priority: 1 }
    ]
})
`;

// -------------------------------------------------------------------------------------------
// 2. READ PREFERENCES
// -------------------------------------------------------------------------------------------

const { MongoClient, ReadPreference } = require('mongodb');

async function readPreferences() {
    const client = new MongoClient('mongodb://localhost:27017', {
        readPreference: ReadPreference.SECONDARY_PREFERRED
    });
    
    /**
     * READ PREFERENCES:
     * - primary: Only primary (default)
     * - primaryPreferred: Primary, secondary if unavailable
     * - secondary: Only secondaries
     * - secondaryPreferred: Secondary, primary if unavailable
     * - nearest: Lowest latency member
     */
    
    await client.connect();
    
    // Per-query read preference
    const result = await client.db('test').collection('data')
        .find({})
        .readPreference('secondaryPreferred')
        .toArray();
}

// -------------------------------------------------------------------------------------------
// 3. SHARDING
// -------------------------------------------------------------------------------------------

/**
 * SHARDING COMPONENTS:
 * - Shard: Holds data partition (replica set)
 * - Config Servers: Store metadata (replica set)
 * - mongos: Query router
 * 
 * SHARD KEY: Field(s) that determine data distribution
 */

const shardingCommands = `
// Enable sharding on database
sh.enableSharding("mydb")

// Shard a collection (hashed)
sh.shardCollection("mydb.users", { _id: "hashed" })

// Shard a collection (range)
sh.shardCollection("mydb.orders", { customerId: 1 })

// Check status
sh.status()
`;

// -------------------------------------------------------------------------------------------
// 4. SHARD KEY SELECTION
// -------------------------------------------------------------------------------------------

/**
 * GOOD SHARD KEY:
 * - High cardinality
 * - Even distribution
 * - Query isolation (queries hit few shards)
 * 
 * BAD SHARD KEY:
 * - Low cardinality (status, boolean)
 * - Monotonically increasing (timestamp, ObjectId)
 * - Frequently updated
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * KEY POINTS:
 * 
 * Replica Sets:
 * - Use 3+ members
 * - Enable automatic failover
 * - Use appropriate read preference
 * 
 * Sharding:
 * - Choose shard key carefully (immutable!)
 * - Use hashed shard key for even distribution
 * - Pre-split for predictable growth
 */

module.exports = { readPreferences };
