/**
 * TOPIC: SHARD KEY STRATEGIES
 * DESCRIPTION:
 * Shard key selection is critical for horizontal scaling. The shard key
 * determines data distribution and query routing in sharded clusters.
 */

// -------------------------------------------------------------------------------------------
// 1. SHARD KEY REQUIREMENTS
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY RULES:
 * 
 * 1. Immutable - Cannot change after sharding
 * 2. Must exist - All documents must have the shard key
 * 3. Index required - Must have index starting with shard key
 * 4. Size limit - 512 bytes max
 * 
 * CANNOT BE:
 * - Array field
 * - Multikey index
 */

// -------------------------------------------------------------------------------------------
// 2. SHARD KEY TYPES
// -------------------------------------------------------------------------------------------

/**
 * HASHED SHARD KEY:
 * - Even distribution
 * - No range queries
 * - Good for high-cardinality fields
 */
const hashedShardKey = `
sh.shardCollection("mydb.users", { _id: "hashed" })
`;

/**
 * RANGED SHARD KEY:
 * - Supports range queries
 * - Risk of hotspots
 * - Good for time-based queries
 */
const rangedShardKey = `
sh.shardCollection("mydb.orders", { customerId: 1, orderDate: 1 })
`;

/**
 * COMPOUND SHARD KEY:
 * - Better distribution
 * - More query patterns
 */
const compoundShardKey = `
sh.shardCollection("mydb.logs", { tenant: 1, timestamp: 1 })
`;

// -------------------------------------------------------------------------------------------
// 3. CHOOSING A SHARD KEY
// -------------------------------------------------------------------------------------------

/**
 * GOOD SHARD KEY PROPERTIES:
 * 
 * 1. High Cardinality
 *    - Many unique values
 *    - Enables fine distribution
 *    - Examples: userId, email, orderId
 * 
 * 2. Low Frequency
 *    - Values not repeated too often
 *    - Prevents chunk hotspots
 * 
 * 3. Non-Monotonic
 *    - Not always increasing
 *    - Avoids write hotspots
 *    - Bad: timestamp, auto-increment ID
 *    - Good: hashed _id, UUID
 * 
 * 4. Query Isolation
 *    - Queries target few shards
 *    - Include shard key in queries
 */

const shardKeyExamples = {
    // GOOD: High cardinality, non-monotonic
    good: {
        userCollection: { email: 'hashed' },
        orderCollection: { customerId: 1, _id: 1 },
        logCollection: { tenantId: 1, timestamp: 1 }
    },
    
    // BAD: Low cardinality, monotonic
    bad: {
        status: { status: 1 },        // Only few values
        timestamp: { createdAt: 1 },  // Always increasing
        country: { country: 1 }       // Limited values
    }
};

// -------------------------------------------------------------------------------------------
// 4. ZONE SHARDING
// -------------------------------------------------------------------------------------------

/**
 * Zone sharding pins data ranges to specific shards.
 * Useful for:
 * - Data locality requirements
 * - Multi-tenant isolation
 * - Geographic distribution
 */
const zoneShardingCommands = `
// Add shard to zone
sh.addShardToZone("shard0001", "US")
sh.addShardToZone("shard0002", "EU")

// Define zone ranges
sh.updateZoneKeyRange(
    "mydb.users",
    { country: "US", _id: MinKey },
    { country: "US", _id: MaxKey },
    "US"
)

sh.updateZoneKeyRange(
    "mydb.users", 
    { country: "DE", _id: MinKey },
    { country: "DE", _id: MaxKey },
    "EU"
)
`;

// -------------------------------------------------------------------------------------------
// 5. RESHARDING (MongoDB 5.0+)
// -------------------------------------------------------------------------------------------

const reshardingCommands = `
// Reshard collection with new key
db.adminCommand({
    reshardCollection: "mydb.orders",
    key: { customerId: "hashed" }
})

// Monitor resharding
db.getSiblingDB("admin").aggregate([
    { $currentOp: { allUsers: true, localOps: false } },
    { $match: { type: "op", "originatingCommand.reshardCollection": { $exists: true } } }
])
`;

// -------------------------------------------------------------------------------------------
// 6. ANTI-PATTERNS
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY ANTI-PATTERNS:
 * 
 * 1. Monotonically Increasing Field
 *    - timestamp, auto-increment ID
 *    - All writes go to one shard
 *    - Solution: Use hashed shard key
 * 
 * 2. Low Cardinality
 *    - status, boolean, enum
 *    - Can't split chunks finely
 *    - Solution: Use compound key
 * 
 * 3. High Write Rate on Same Value
 *    - Counter fields, hot documents
 *    - Creates jumbo chunks
 *    - Solution: Prefix with random value
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY SELECTION:
 * 
 * 1. Analyze query patterns first
 * 2. Choose high-cardinality field
 * 3. Avoid monotonic keys
 * 4. Use compound keys for better distribution
 * 5. Consider hashed for even writes
 * 
 * BEST PRACTICES:
 * - Test with production-like data
 * - Monitor chunk distribution
 * - Use zones for data locality
 * - Plan for resharding if needed
 */

module.exports = {
    shardKeyExamples
};
