/**
 * TOPIC: SHARD KEY STRATEGIES - COMPREHENSIVE GUIDE
 * DESCRIPTION:
 * Shard key selection is the most critical decision in sharding. It determines
 * data distribution, query efficiency, and scalability. This guide covers
 * all aspects of shard key selection, patterns, and anti-patterns.
 */

// -------------------------------------------------------------------------------------------
// 1. SHARD KEY FUNDAMENTALS
// -------------------------------------------------------------------------------------------

/**
 * WHAT IS A SHARD KEY?
 * 
 * The shard key is an indexed field (or fields) that MongoDB uses to:
 * - Partition data across shards
 * - Route queries to appropriate shards
 * - Determine chunk boundaries
 * 
 * SHARD KEY REQUIREMENTS:
 * 
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Requirement           │ Description                                     │
 * ├───────────────────────┼─────────────────────────────────────────────────┤
 * │ Immutable             │ Cannot be changed after sharding                │
 * │ Must exist            │ All documents must have the shard key field     │
 * │ Cannot be null/missing│ Shards key field is required in every document  │
 * │ Index required        │ Must have an index starting with the shard key  │
 * │ Size limit            │ Maximum 512 bytes                               │
 * │ Not array             │ Cannot be an array or multikey index            │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * ONCE SET, A SHARD KEY CANNOT BE CHANGED (until MongoDB 5.0 resharding)
 */

// -------------------------------------------------------------------------------------------
// 2. SHARD KEY PROPERTIES
// -------------------------------------------------------------------------------------------

/**
 * THREE KEY PROPERTIES:
 * 
 * 1. CARDINALITY
 *    Definition: Number of unique values the shard key can have
 *    
 *    High Cardinality (GOOD):
 *    - userId, email, orderId, UUID
 *    - Millions of unique values
 *    - Allows fine-grained chunk splitting
 *    
 *    Low Cardinality (BAD):
 *    - status ("pending", "completed")
 *    - country (< 200 values)
 *    - boolean fields
 *    - Creates jumbo chunks
 * 
 * 2. FREQUENCY
 *    Definition: How often specific values appear
 *    
 *    Low Frequency (GOOD):
 *    - Each user has ~100 orders
 *    - Even distribution across values
 *    
 *    High Frequency (BAD):
 *    - One customer has 10 million orders
 *    - Hot documents/chunks
 *    - Cannot split beyond the repeat value
 * 
 * 3. MONOTONICITY
 *    Definition: Whether values increase (or decrease) predictably
 *    
 *    Non-Monotonic (GOOD):
 *    - Random IDs, UUIDs
 *    - Hashed values
 *    - Evenly distributed writes
 *    
 *    Monotonically Increasing (BAD):
 *    - Timestamps
 *    - Auto-incrementing IDs
 *    - ObjectId (_id)
 *    - All writes go to last shard (hotspot)
 */

const cardinalityExamples = {
    high: {
        excellent: ['_id (ObjectId)', 'email', 'userId', 'uuid', 'orderId'],
        good: ['customerId', 'deviceId', 'sessionId', 'productId']
    },
    low: {
        avoid: ['status', 'isActive', 'country', 'category', 'priority', 'role']
    }
};

// -------------------------------------------------------------------------------------------
// 3. SHARD KEY TYPES DEEP DIVE
// -------------------------------------------------------------------------------------------

/**
 * HASHED SHARD KEY:
 * 
 * MongoDB hashes the field value to determine shard placement.
 * 
 * PROS:
 * ✓ Even distribution of writes
 * ✓ No hotspots from monotonic keys
 * ✓ Good for random access patterns
 * 
 * CONS:
 * ✗ Cannot support range queries efficiently
 * ✗ All range queries become scatter-gather
 * ✗ Sorting is expensive
 * 
 * BEST FOR:
 * - High-throughput write workloads
 * - Point queries (find by exact value)
 * - When you'd otherwise have monotonic key
 */

const hashedShardKeyExamples = `
// Converting monotonic _id to even distribution
sh.shardCollection("mydb.events", { _id: "hashed" })

// User-based sharding
sh.shardCollection("mydb.sessions", { sessionId: "hashed" })

// IoT data with many sensors
sh.shardCollection("mydb.sensors", { sensorId: "hashed" })

// Documents get distributed randomly:
// { sensorId: "A001" } → hash("A001") → Shard 2
// { sensorId: "A002" } → hash("A002") → Shard 1
// { sensorId: "A003" } → hash("A003") → Shard 3
`;

/**
 * RANGED SHARD KEY:
 * 
 * Documents sharded based on value ranges.
 * 
 * PROS:
 * ✓ Efficient range queries
 * ✓ Targeted queries for range predicates
 * ✓ Good for time-series queries (with care)
 * 
 * CONS:
 * ✗ Hotspots with monotonic values
 * ✗ Uneven distribution if data is skewed
 * ✗ Planning required for good distribution
 * 
 * BEST FOR:
 * - Range query heavy workloads
 * - When combined with high-cardinality prefix
 */

const rangedShardKeyExamples = `
// Customer-based sharding (assuming many customers)
sh.shardCollection("mydb.orders", { customerId: 1 })

// Queries target specific shards:
// find({ customerId: "C123" }) → goes to one shard

// With compound key for range queries
sh.shardCollection("mydb.transactions", { accountId: 1, date: 1 })

// Supports efficient queries like:
// find({ accountId: "A001", date: { $gte: ISODate("2024-01-01") } })
`;

/**
 * COMPOUND SHARD KEY:
 * 
 * Multiple fields in the shard key.
 * 
 * PROS:
 * ✓ More query patterns can be targeted
 * ✓ Better distribution with low-cardinality prefix
 * ✓ Range queries on non-prefix fields (if prefix specified)
 * 
 * CONS:
 * ✗ More complex to design
 * ✗ Prefix must be in query for targeting
 * ✗ Order matters significantly
 * 
 * BEST FOR:
 * - Multi-tenant applications
 * - Hierarchical data
 * - When single field doesn't provide good distribution
 */

const compoundShardKeyExamples = `
// Multi-tenant SaaS
sh.shardCollection("mydb.documents", { tenantId: 1, documentId: 1 })

// E-commerce with customer isolation
sh.shardCollection("mydb.orders", { customerId: 1, orderDate: 1 })

// Time series with device isolation
sh.shardCollection("mydb.metrics", { deviceId: 1, timestamp: 1 })

// Query targeting rules:
// ✓ Targeted: find({ tenantId: "T1" })
// ✓ Targeted: find({ tenantId: "T1", documentId: "D1" })
// ✗ Scatter:  find({ documentId: "D1" })  // missing prefix
`;

// -------------------------------------------------------------------------------------------
// 4. SHARD KEY SELECTION BY USE CASE
// -------------------------------------------------------------------------------------------

const shardKeyByUseCase = {
    // E-COMMERCE
    ecommerce: {
        users: {
            key: { email: 'hashed' },
            rationale: 'High cardinality, point lookups only'
        },
        orders: {
            key: { customerId: 1, orderDate: 1 },
            rationale: 'Query by customer, support date ranges'
        },
        products: {
            key: { _id: 'hashed' },
            rationale: 'Random access, high cardinality'
        },
        reviews: {
            key: { productId: 1, _id: 1 },
            rationale: 'Reviews queried by product'
        }
    },

    // MULTI-TENANT SAAS
    multiTenant: {
        documents: {
            key: { tenantId: 1, _id: 'hashed' },
            rationale: 'Isolate tenants, even distribution within tenant'
        },
        users: {
            key: { tenantId: 1, email: 1 },
            rationale: 'Tenant isolation, lookup by email'
        },
        auditLogs: {
            key: { tenantId: 1, timestamp: 1 },
            rationale: 'Per-tenant logs with time queries'
        }
    },

    // IOT / TIME SERIES
    iot: {
        readings: {
            key: { deviceId: 1, timestamp: 1 },
            rationale: 'Query by device + time range'
        },
        devices: {
            key: { _id: 'hashed' },
            rationale: 'Random device lookups'
        },
        alerts: {
            key: { severity: 1, deviceId: 1, timestamp: 1 },
            rationale: 'Query by severity then device'
            // Note: Only works if severity has enough values
        }
    },

    // SOCIAL MEDIA
    socialMedia: {
        posts: {
            key: { authorId: 1, createdAt: 1 },
            rationale: 'User timeline queries'
        },
        comments: {
            key: { postId: 1, _id: 1 },
            rationale: 'Comments for a post'
        },
        likes: {
            key: { targetId: 1, userId: 1 },
            rationale: 'Query likes by target, check if user liked'
        }
    },

    // GAMING
    gaming: {
        players: {
            key: { region: 1, oderId: 'hashed' },
            rationale: 'Regional distribution, zone sharding'
        },
        matches: {
            key: { gameMode: 1, startTime: 1 },
            rationale: 'Query by mode and time'
        },
        leaderboards: {
            key: { leaderboardId: 1, rank: 1 },
            rationale: 'Range queries on rankings'
        }
    },

    // FINANCIAL
    financial: {
        transactions: {
            key: { accountId: 1, transactionDate: 1 },
            rationale: 'Account history queries'
        },
        accounts: {
            key: { customerId: 1, accountId: 1 },
            rationale: 'Customer account lookups'
        },
        statements: {
            key: { accountId: 1, statementMonth: 1 },
            rationale: 'Monthly statement retrieval'
        }
    }
};

// -------------------------------------------------------------------------------------------
// 5. ANTI-PATTERNS AND PITFALLS
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY ANTI-PATTERNS:
 */

const antiPatterns = {
    // ❌ ANTI-PATTERN 1: Monotonically Increasing Shard Key
    monotonic: {
        bad: { timestamp: 1 },
        why: 'All new writes go to the last shard (hotspot)',
        consequence: 'One shard handles all writes, others idle',
        solution: [
            'Use hashed shard key: { timestamp: "hashed" }',
            'Add high-cardinality prefix: { deviceId: 1, timestamp: 1 }',
            'Use random prefix if needed'
        ]
    },

    // ❌ ANTI-PATTERN 2: Low Cardinality Shard Key
    lowCardinality: {
        bad: { status: 1 },
        why: 'Only a few values (pending, completed, cancelled)',
        consequence: 'Maximum 3 chunks, cannot scale beyond 3 shards',
        solution: [
            'Add high-cardinality field: { status: 1, orderId: 1 }',
            'Use a different approach entirely',
            'Consider if sharding is even needed'
        ]
    },

    // ❌ ANTI-PATTERN 3: Frequently Updated Shard Key
    frequentlyUpdated: {
        bad: { version: 1 },
        why: 'Shard key updates cause document migration',
        consequence: 'Performance degradation, distributed transactions',
        solution: [
            'Choose immutable fields',
            'Use fields that don\'t change after creation'
        ]
    },

    // ❌ ANTI-PATTERN 4: Shard Key Not in Queries
    notInQueries: {
        bad: 'Sharding by _id when queries use customerId',
        why: 'All queries become scatter-gather',
        consequence: 'Poor query performance, high mongos load',
        solution: [
            'Analyze query patterns first',
            'Include commonly queried fields in shard key'
        ]
    },

    // ❌ ANTI-PATTERN 5: Single Hot Value
    hotValue: {
        bad: 'One customer has 90% of the data',
        why: 'Creates jumbo chunks, uneven distribution',
        consequence: 'One shard overwhelmed, cannot split further',
        solution: [
            'Add random suffix: { customerId: 1, random: 1 }',
            'Hash the problematic field',
            'Consider data modeling changes'
        ]
    }
};

// -------------------------------------------------------------------------------------------
// 6. QUERY TARGETING ANALYSIS
// -------------------------------------------------------------------------------------------

/**
 * QUERY TARGETING:
 * 
 * A targeted query includes the shard key (or its prefix).
 * mongos routes it to specific shard(s).
 * 
 * A scatter-gather query lacks the shard key.
 * mongos sends it to ALL shards, merges results.
 * 
 * GOAL: Maximize targeted queries (> 80% of traffic)
 */

const queryTargetingAnalysis = `
// Shard key: { customerId: 1, orderDate: 1 }

// ============================================================
// TARGETED QUERIES (GOOD)
// ============================================================

// Full shard key
db.orders.find({ customerId: "C1", orderDate: ISODate("2024-01-15") })  // ✓

// Prefix only (still targeted to customer's shard)
db.orders.find({ customerId: "C1" })  // ✓

// Prefix + range on second field
db.orders.find({ 
    customerId: "C1", 
    orderDate: { $gte: ISODate("2024-01-01"), $lt: ISODate("2024-02-01") }
})  // ✓

// ============================================================
// SCATTER-GATHER QUERIES (EXPENSIVE)
// ============================================================

// Missing shard key prefix
db.orders.find({ orderDate: { $gte: ISODate("2024-01-01") } })  // ✗

// Query on non-shard-key field
db.orders.find({ status: "pending" })  // ✗

// ============================================================
// VERIFY QUERY ROUTING
// ============================================================

// Use explain to check targeting
db.orders.find({ customerId: "C1" }).explain("executionStats")

// Look for "shards" in the explain plan
// Single shard = targeted
// Multiple shards = scatter-gather (for that query pattern)

// Calculate targeting percentage
const ops = db.currentOp({ "active": true, "ns": "mydb.orders" });
const targeted = ops.inprog.filter(op => op.planSummary?.includes("IXSCAN")).length;
const total = ops.inprog.length;
print("Target rate:", (targeted / total * 100).toFixed(1) + "%");
`;

// -------------------------------------------------------------------------------------------
// 7. COMPOUND SHARD KEY ORDERING
// -------------------------------------------------------------------------------------------

/**
 * FIELD ORDER MATTERS:
 * 
 * { A: 1, B: 1, C: 1 }
 * 
 * - Queries with A → targeted
 * - Queries with A, B → targeted
 * - Queries with A, B, C → targeted
 * - Queries with B only → scatter-gather
 * - Queries with C only → scatter-gather
 * - Queries with B, C → scatter-gather
 * 
 * ORDER GUIDELINES:
 * 1. Most used in queries → first
 * 2. Highest cardinality → helps with first
 * 3. Range query fields → later positions
 */

const compoundKeyOrdering = `
// SCENARIO: Multi-tenant with time-based queries

// Option 1: { tenantId: 1, createdAt: 1 }
// ✓ find({ tenantId: "T1" })                  → targeted
// ✓ find({ tenantId: "T1", createdAt: {...} }) → targeted + range efficient
// ✗ find({ createdAt: {...} })                 → scatter-gather

// Option 2: { createdAt: 1, tenantId: 1 }
// ✓ find({ createdAt: {...} })                 → targeted (but monotonic!) 
// ✗ find({ tenantId: "T1" })                   → scatter-gather

// Option 1 is better if tenant queries are common
// Option 2 is NEVER good (monotonic first field)

// SCENARIO: E-commerce orders

// Good: { customerId: 1, orderDate: 1 }
// - Customer lookups targeted
// - Date ranges within customer targeted
// - Global date queries scatter (acceptable trade-off)

// Bad: { orderDate: 1, customerId: 1 }
// - Monotonic first field = write hotspot
`;

// -------------------------------------------------------------------------------------------
// 8. HANDLING HOTSPOTS
// -------------------------------------------------------------------------------------------

/**
 * HOTSPOT MITIGATION STRATEGIES:
 */

const hotspotStrategies = `
// ============================================================
// STRATEGY 1: Hashed Prefix
// ============================================================

// Instead of: { timestamp: 1 }
// Use: { _id: "hashed" } (if using ObjectId)
// Or add random prefix

// ============================================================
// STRATEGY 2: Random Prefix
// ============================================================

// Add a random value calculated from document fields
// Store as part of document, include in shard key

// Example: distribute writes across 16 logical shards
const doc = {
    _id: new ObjectId(),
    prefix: Math.floor(Math.random() * 16),  // 0-15
    timestamp: new Date(),
    data: { ... }
};

sh.shardCollection("mydb.events", { prefix: 1, timestamp: 1 })

// ============================================================
// STRATEGY 3: Compound with High-Cardinality Field
// ============================================================

// Instead of: { timestamp: 1 }
// Use: { deviceId: 1, timestamp: 1 }

// Distributes across devices while allowing time-range queries per device

// ============================================================
// STRATEGY 4: Calculated Shard Key
// ============================================================

// Calculate a bucket from existing fields
function getShardBucket(doc) {
    // Hash of user email to create bucket
    const hash = md5(doc.email);
    return parseInt(hash.substring(0, 2), 16) % 256;
}

const doc = {
    email: "user@example.com",
    shardBucket: getShardBucket({ email: "user@example.com" }),
    createdAt: new Date()
};

sh.shardCollection("mydb.users", { shardBucket: 1, createdAt: 1 })
`;

// -------------------------------------------------------------------------------------------
// 9. ZONE SHARDING STRATEGIES
// -------------------------------------------------------------------------------------------

const zoneShardingStrategies = `
// ============================================================
// GEOGRAPHIC DATA LOCALITY
// ============================================================

// Shard key: { region: 1, userId: 1 }

sh.addShardToZone("shard-us-1", "US")
sh.addShardToZone("shard-eu-1", "EU")
sh.addShardToZone("shard-ap-1", "APAC")

sh.updateZoneKeyRange("mydb.users", 
    { region: "US", userId: MinKey }, 
    { region: "US", userId: MaxKey }, 
    "US")

sh.updateZoneKeyRange("mydb.users", 
    { region: "EU", userId: MinKey }, 
    { region: "EU", userId: MaxKey }, 
    "EU")

// ============================================================
// TIERED STORAGE (HOT/WARM/COLD)
// ============================================================

// Shard key: { dataAge: 1, _id: 1 }
// Note: Requires updating dataAge or periodic reshuffling

sh.addShardToZone("shard-ssd-1", "hot")
sh.addShardToZone("shard-hdd-1", "cold")

// Recent data on fast storage
sh.updateZoneKeyRange("mydb.logs",
    { dataAge: "hot", _id: MinKey },
    { dataAge: "hot", _id: MaxKey },
    "hot")

// ============================================================
// TENANT ISOLATION
// ============================================================

// Premium tenants get dedicated shards
sh.addShardToZone("shard-premium-1", "premium-tenant-A")

sh.updateZoneKeyRange("mydb.data",
    { tenantId: "tenant-A", _id: MinKey },
    { tenantId: "tenant-A", _id: MaxKey },
    "premium-tenant-A")
`;

// -------------------------------------------------------------------------------------------
// 10. SHARD KEY REFACTORING (RESHARDING)
// -------------------------------------------------------------------------------------------

/**
 * RESHARDING (MongoDB 5.0+):
 * 
 * Allows changing the shard key after initial sharding.
 * Before 5.0, the only option was dump and reload.
 */

const reshardingProcess = `
// ============================================================
// PRE-REQUISITES
// ============================================================

// 1. MongoDB 5.0+
// 2. Sufficient disk space (2x collection size recommended)
// 3. Create index on new shard key first
db.orders.createIndex({ customerId: 1, orderDate: 1 })

// ============================================================
// INITIATE RESHARDING
// ============================================================

db.adminCommand({
    reshardCollection: "mydb.orders",
    key: { customerId: 1, orderDate: 1 },
    // Optional: specify number of zones
    numInitialChunks: 100
})

// ============================================================
// MONITOR PROGRESS
// ============================================================

// Watch resharding progress
db.getSiblingDB("admin").aggregate([
    { $currentOp: { allUsers: true } },
    { $match: { type: "op", desc: /Resharding/ } }
])

// Check remaining write bytes
db.adminCommand({ reshardingProgress: "mydb.orders" })

// ============================================================
// POST-RESHARDING
// ============================================================

// Verify new shard key
sh.status()

// Check chunk distribution
use config
db.chunks.aggregate([
    { $match: { ns: "mydb.orders" } },
    { $group: { _id: "$shard", count: { $sum: 1 } } }
])

// Remove old index if no longer needed
db.orders.dropIndex({ oldShardKey: 1 })
`;

// -------------------------------------------------------------------------------------------
// 11. SHARD KEY SELECTION CHECKLIST
// -------------------------------------------------------------------------------------------

/**
 * SHARD KEY SELECTION CHECKLIST:
 * 
 * □ Analyzed query patterns
 *   - What fields are in WHERE clauses?
 *   - What fields are used for sorting?
 *   - What are the most frequent queries?
 * 
 * □ Evaluated cardinality
 *   - Does the field have millions of unique values?
 *   - Is distribution relatively even?
 * 
 * □ Checked for monotonicity
 *   - Is the field always increasing?
 *   - If yes, use hashed or add prefix
 * 
 * □ Verified immutability
 *   - Will this field change after insert?
 *   - If yes, choose different field
 * 
 * □ Tested with realistic data
 *   - Imported production-like dataset
 *   - Verified chunk distribution
 *   - Ran production queries
 * 
 * □ Considered compound key
 *   - Would multiple fields improve targeting?
 *   - What's the optimal field order?
 * 
 * □ Planned for growth
 *   - Will cardinality remain high?
 *   - Will distribution remain even?
 * 
 * □ Documented the decision
 *   - Recorded rationale
 *   - Listed supported query patterns
 *   - Noted known limitations
 */

// -------------------------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------------------------

/**
 * KEY POINTS:
 * 
 * 1. SHARD KEY IS IMMUTABLE (choose wisely)
 * 
 * 2. THREE PROPERTIES:
 *    - High cardinality = good splitting
 *    - Low frequency = no hotspots
 *    - Non-monotonic = even writes
 * 
 * 3. TYPES:
 *    - Hashed = even distribution, no ranges
 *    - Ranged = range queries, hotspot risk
 *    - Compound = flexibility, complexity
 * 
 * 4. AVOID:
 *    - Monotonic keys (timestamp, auto-inc)
 *    - Low cardinality (status, boolean)
 *    - Fields not in queries
 * 
 * 5. QUERY TARGETING:
 *    - Include shard key prefix in queries
 *    - Scatter-gather is expensive
 *    - Design for > 80% targeted queries
 * 
 * 6. ZONE SHARDING:
 *    - Geographic locality
 *    - Tiered storage
 *    - Tenant isolation
 * 
 * 7. RESHARDING (5.0+):
 *    - Allows changing shard key
 *    - Resource intensive
 *    - Plan ahead to avoid
 */

module.exports = {
    shardKeyByUseCase,
    antiPatterns,
    cardinalityExamples
};
