/**
 * TOPIC: REPLICA SETS - IN-DEPTH GUIDE
 * DESCRIPTION:
 * Replica sets provide high availability, data redundancy, and automatic failover.
 * This file covers architecture, configuration, elections, monitoring, and operations.
 */

const { MongoClient, ReadPreference } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. REPLICA SET ARCHITECTURE
// -------------------------------------------------------------------------------------------

/**
 * REPLICA SET COMPONENTS:
 * 
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        REPLICA SET (rs0)                        │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                                                                 │
 * │    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
 * │    │   PRIMARY    │───►│  SECONDARY   │    │  SECONDARY   │    │
 * │    │              │    │              │◄───│              │    │
 * │    │ • All writes │    │    Oplog     │    │    Oplog     │    │
 * │    │ • Reads      │    │ replication  │    │ replication  │    │
 * │    └──────────────┘    └──────────────┘    └──────────────┘    │
 * │          │                    │                   │            │
 * │          └────────────────────┴───────────────────┘            │
 * │                         Heartbeats                              │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * MEMBER TYPES:
 * 
 * 1. PRIMARY
 *    - Receives ALL write operations
 *    - Only member that can accept writes
 *    - Maintains the oplog (operations log)
 *    - One primary per replica set
 * 
 * 2. SECONDARY
 *    - Replicates data from primary via oplog
 *    - Can serve read operations (with readPreference)
 *    - Can become primary during failover
 *    - Can be configured as hidden or delayed
 * 
 * 3. ARBITER
 *    - Voting member only, holds no data
 *    - Breaks ties in elections
 *    - Lightweight, for cost savings
 *    - Cannot become primary
 * 
 * MINIMUM CONFIGURATION:
 * - 3 members recommended (odd number for elections)
 * - Can be: 3 data nodes, or 2 data nodes + 1 arbiter
 * - Maximum: 50 members (7 voting)
 */

// -------------------------------------------------------------------------------------------
// 2. OPLOG (OPERATIONS LOG)
// -------------------------------------------------------------------------------------------

/**
 * OPLOG DETAILS:
 * 
 * The oplog is a capped collection in the 'local' database that records
 * all operations that modify data. Secondaries replicate by reading the oplog.
 * 
 * OPLOG STRUCTURE:
 * {
 *   ts: Timestamp(1234, 1),     // Timestamp + increment
 *   h: NumberLong("..."),       // Unique hash
 *   v: 2,                       // Oplog version
 *   op: "i",                    // Operation type: i=insert, u=update, d=delete, c=command
 *   ns: "testdb.users",         // Namespace (db.collection)
 *   o: { _id: 1, name: "John" } // Document or operation
 * }
 * 
 * SIZING:
 * - Default: 5% of free disk space (990MB - 50GB)
 * - Too small: Secondaries may fall out of sync
 * - Too large: Wastes disk space
 * - Rule of thumb: Should hold 24-48 hours of operations
 */

const oplogCommands = `
// View oplog status
rs.printReplicationInfo()

// View oplog size
use local
db.oplog.rs.stats()

// View recent oplog entries
db.oplog.rs.find().sort({$natural: -1}).limit(5)

// Change oplog size (MongoDB 4.0+)
db.adminCommand({
    replSetResizeOplog: 1, 
    size: Double(16384)  // Size in MB
})
`;

// -------------------------------------------------------------------------------------------
// 3. REPLICA SET INITIALIZATION & CONFIGURATION
// -------------------------------------------------------------------------------------------

const replicaSetSetup = `
// ============================================================
// STEP 1: Start mongod instances with replica set name
// ============================================================

// Node 1 (Primary candidate - higher priority)
mongod --replSet "rs0" --port 27017 --dbpath /data/rs0-0 --bind_ip localhost,192.168.1.10

// Node 2 (Secondary)
mongod --replSet "rs0" --port 27018 --dbpath /data/rs0-1 --bind_ip localhost,192.168.1.11

// Node 3 (Secondary)
mongod --replSet "rs0" --port 27019 --dbpath /data/rs0-2 --bind_ip localhost,192.168.1.12

// ============================================================
// STEP 2: Connect and initialize
// ============================================================

mongosh --port 27017

rs.initiate({
    _id: "rs0",
    members: [
        { 
            _id: 0, 
            host: "192.168.1.10:27017",
            priority: 2           // Higher priority = more likely primary
        },
        { 
            _id: 1, 
            host: "192.168.1.11:27018",
            priority: 1
        },
        { 
            _id: 2, 
            host: "192.168.1.12:27019",
            priority: 1
        }
    ]
})

// ============================================================
// STEP 3: Verify configuration
// ============================================================

rs.status()    // Current state of all members
rs.conf()      // Current configuration
rs.isMaster()  // Check if connected to primary
`;

// -------------------------------------------------------------------------------------------
// 4. MEMBER CONFIGURATION OPTIONS
// -------------------------------------------------------------------------------------------

/**
 * MEMBER SETTINGS:
 * 
 * _id          - Unique identifier (0, 1, 2, ...)
 * host         - Hostname:port
 * priority     - Election priority (0 = never become primary)
 * votes        - Voting power (0 or 1)
 * hidden       - Hidden from application (must have priority: 0)
 * slaveDelay   - Delay replication by N seconds (renamed to secondaryDelaySecs in 5.0)
 * arbiterOnly  - Is this an arbiter?
 * tags         - Custom tags for read preference
 * buildIndexes - Whether to build indexes (default: true)
 */

const memberConfigurations = `
// STANDARD CONFIGURATION
{
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017", priority: 2 },
        { _id: 1, host: "mongo2:27017", priority: 1 },
        { _id: 2, host: "mongo3:27017", priority: 1 }
    ]
}

// WITH ARBITER (2 data + 1 arbiter)
{
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017", priority: 2 },
        { _id: 1, host: "mongo2:27017", priority: 1 },
        { _id: 2, host: "arbiter:27017", arbiterOnly: true }
    ]
}

// WITH HIDDEN MEMBER (for backups/reporting)
{
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017" },
        { _id: 1, host: "mongo2:27017" },
        { _id: 2, host: "mongo3:27017", hidden: true, priority: 0 }
    ]
}

// WITH DELAYED SECONDARY (disaster recovery)
{
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017" },
        { _id: 1, host: "mongo2:27017" },
        { 
            _id: 2, 
            host: "mongo3:27017", 
            priority: 0,
            hidden: true,
            secondaryDelaySecs: 3600  // 1 hour delay
        }
    ]
}

// WITH TAGS FOR DATA CENTER AWARENESS
{
    _id: "rs0",
    members: [
        { _id: 0, host: "mongo1:27017", tags: { dc: "east", rack: "r1" } },
        { _id: 1, host: "mongo2:27017", tags: { dc: "east", rack: "r2" } },
        { _id: 2, host: "mongo3:27017", tags: { dc: "west", rack: "r1" } }
    ],
    settings: {
        getLastErrorModes: {
            multiDC: { dc: 2 }  // Custom write concern requiring 2 data centers
        }
    }
}
`;

// -------------------------------------------------------------------------------------------
// 5. ELECTIONS AND FAILOVER
// -------------------------------------------------------------------------------------------

/**
 * ELECTION PROCESS:
 * 
 * 1. Primary unavailable (crash, network, step down)
 * 2. Secondaries detect via heartbeat timeout (10s default)
 * 3. Eligible secondary calls election
 * 4. Voting members cast votes
 * 5. Candidate with majority of votes becomes primary
 * 6. New primary applies any uncommitted writes
 * 
 * ELECTION REQUIREMENTS:
 * - Candidate must have highest priority among reachable members
 * - Candidate's oplog must be reasonably up-to-date
 * - Majority of voting members must be reachable
 * - Candidate must receive majority of votes
 * 
 * ELECTION TIMING:
 * - electionTimeoutMillis: 10000ms (default)
 * - heartbeatTimeoutSecs: 10s
 * - Typical failover: 10-12 seconds
 */

const electionCommands = `
// Force current primary to step down
rs.stepDown()

// Step down with options
rs.stepDown(60, 30)  // stepDownSecs, catchUpSecs

// Prevent elections (maintenance mode)
rs.freeze(300)  // Freeze for 300 seconds

// Unfreeze
rs.freeze(0)

// Force reconfiguration
cfg = rs.conf()
cfg.members[0].priority = 3
rs.reconfig(cfg)

// Force reconfiguration during recovery
rs.reconfig(cfg, { force: true })

// Check who would become primary
rs.status()
`;

// -------------------------------------------------------------------------------------------
// 6. READ PREFERENCES
// -------------------------------------------------------------------------------------------

/**
 * READ PREFERENCE MODES:
 * 
 * primary (default)
 *   - All reads go to primary
 *   - Strongest consistency
 *   - Errors if no primary
 * 
 * primaryPreferred
 *   - Primary if available, else secondary
 *   - Good for most applications
 * 
 * secondary
 *   - Only secondaries
 *   - Reduces primary load
 *   - May read stale data
 * 
 * secondaryPreferred
 *   - Secondary if available, else primary
 *   - Good for read-heavy workloads
 * 
 * nearest
 *   - Lowest network latency member
 *   - Best for geographically distributed clusters
 */

async function readPreferenceExamples() {
    // Connection-level read preference
    const client = new MongoClient('mongodb://host1,host2,host3/mydb?replicaSet=rs0', {
        readPreference: ReadPreference.SECONDARY_PREFERRED
    });

    await client.connect();
    const collection = client.db('testdb').collection('data');

    // Per-query read preference
    const results = await collection.find({})
        .readPreference('secondary')
        .toArray();

    // With tags (for data center awareness)
    const nearbyResults = await collection.find({})
        .readPreference('nearest', [{ dc: 'east' }])
        .toArray();

    // With maxStalenessSeconds (avoid stale secondaries)
    const freshResults = await collection.find({})
        .readPreference('secondaryPreferred', [], { maxStalenessSeconds: 90 })
        .toArray();

    await client.close();
}

// -------------------------------------------------------------------------------------------
// 7. REPLICATION LAG MONITORING
// -------------------------------------------------------------------------------------------

const replicationMonitoring = `
// Check replication lag
rs.printSecondaryReplicationInfo()

// Detailed status
rs.status()
// Look for: optimeDate, lastHeartbeat, lastHeartbeatRecv

// Programmatic lag check
db.adminCommand({ replSetGetStatus: 1 }).members.forEach(member => {
    if (member.stateStr === "SECONDARY") {
        const lagSeconds = (member.optimeDate - member.lastHeartbeat) / 1000;
        print(\`\${member.name}: \${lagSeconds}s lag\`);
    }
});

// Server status metrics
db.serverStatus().repl

// Oplog window (how far back oplog goes)
const oplogStats = db.getSiblingDB('local').oplog.rs.stats();
const first = db.getSiblingDB('local').oplog.rs.find().sort({$natural: 1}).limit(1).next();
const last = db.getSiblingDB('local').oplog.rs.find().sort({$natural: -1}).limit(1).next();
print("Oplog window:", (last.ts.getTime() - first.ts.getTime()) / 3600, "hours");
`;

// -------------------------------------------------------------------------------------------
// 8. MAINTENANCE OPERATIONS
// -------------------------------------------------------------------------------------------

const maintenanceOperations = `
// ============================================================
// ADDING A NEW MEMBER
// ============================================================
rs.add("mongo4:27017")

// Add with specific options
rs.add({
    host: "mongo4:27017",
    priority: 1,
    votes: 1
})

// ============================================================
// REMOVING A MEMBER
// ============================================================
rs.remove("mongo4:27017")

// ============================================================
// CHANGING MEMBER OPTIONS
// ============================================================
cfg = rs.conf()
cfg.members[2].priority = 0
cfg.members[2].hidden = true
rs.reconfig(cfg)

// ============================================================
// ROLLING RESTART PROCEDURE
// ============================================================
// 1. Connect to each secondary one at a time
// 2. Shut down: db.adminCommand({ shutdown: 1 })
// 3. Perform maintenance (upgrade, etc.)
// 4. Start mongod
// 5. Wait for it to sync: rs.status()
// 6. Repeat for other secondaries
// 7. Step down primary: rs.stepDown()
// 8. Perform maintenance on former primary
// 9. Restart

// ============================================================
// INITIAL SYNC TROUBLESHOOTING
// ============================================================
// If initial sync is slow or fails:
// 1. Check network bandwidth
// 2. Verify oplog is large enough
// 3. Consider using --initialSyncAttempts
// 4. Use mongodump/mongorestore for large datasets
`;

// -------------------------------------------------------------------------------------------
// 9. REPLICA SET SETTINGS
// -------------------------------------------------------------------------------------------

const replicaSetSettings = `
// View and modify replica set settings
cfg = rs.conf()

cfg.settings = {
    // Heartbeat frequency
    heartbeatIntervalMillis: 2000,
    
    // Election timeout
    electionTimeoutMillis: 10000,
    
    // Catchup timeout for new primary
    catchUpTimeoutMillis: 60000,
    
    // Custom write concern definitions
    getLastErrorModes: {
        "multiDC": { "dc": 2 },    // Both data centers
        "multiRack": { "rack": 2 } // Multiple racks
    },
    
    // Default write concern
    getLastErrorDefaults: {
        w: "majority",
        wtimeout: 5000
    },
    
    // Chaining (secondaries sync from other secondaries)
    chainingAllowed: true
}

rs.reconfig(cfg)
`;

// -------------------------------------------------------------------------------------------
// 10. REPLICA SET CONNECTION STRINGS
// -------------------------------------------------------------------------------------------

async function connectionExamples() {
    // Standard replica set connection
    const uri1 = 'mongodb://host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0';

    // With authentication
    const uri2 = 'mongodb://user:password@host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0&authSource=admin';

    // With read preference
    const uri3 = 'mongodb://host1,host2,host3/mydb?replicaSet=rs0&readPreference=secondaryPreferred';

    // With write concern
    const uri4 = 'mongodb://host1,host2,host3/mydb?replicaSet=rs0&w=majority&journal=true';

    // With SSL/TLS
    const uri5 = 'mongodb://host1,host2,host3/mydb?replicaSet=rs0&tls=true&tlsCAFile=/path/to/ca.pem';

    // MongoDB Atlas format
    const uri6 = 'mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/mydb?retryWrites=true&w=majority';

    // Using options object
    const client = new MongoClient(uri1, {
        replicaSet: 'rs0',
        readPreference: ReadPreference.PRIMARY_PREFERRED,
        writeConcern: { w: 'majority', j: true },
        maxPoolSize: 100,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 10000
    });

    return client;
}

// -------------------------------------------------------------------------------------------
// 11. ERROR HANDLING IN REPLICA SETS
// -------------------------------------------------------------------------------------------

async function replicaSetErrorHandling() {
    const client = new MongoClient('mongodb://host1,host2,host3/mydb?replicaSet=rs0', {
        retryWrites: true,
        retryReads: true
    });

    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');

        // Retryable writes automatically handle failover
        await collection.insertOne({ item: 'widget' });

    } catch (error) {
        if (error.name === 'MongoNetworkError') {
            // Network issue - connection may automatically retry
            console.log('Network error, driver may auto-retry');
        } else if (error.code === 10107) {
            // NotMaster - write sent to secondary
            console.log('Write sent to secondary, will retry on primary');
        } else if (error.code === 189) {
            // PrimarySteppedDown
            console.log('Primary stepped down during operation');
        } else if (error.message.includes('no primary')) {
            // No primary available
            console.log('No primary available - cluster in election');
        }
        throw error;
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 12. BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * REPLICA SET BEST PRACTICES:
 * 
 * 1. MEMBER COUNT
 *    - Use odd number of voting members (3, 5, 7)
 *    - Maximum 7 voting members
 *    - Up to 50 total members (for read scaling)
 * 
 * 2. DEPLOYMENT
 *    - Spread across availability zones/data centers
 *    - Use majority in primary data center
 *    - Consider network latency between members
 * 
 * 3. ARBITER GUIDELINES
 *    - Only use if cost is a concern
 *    - Never more than one arbiter
 *    - Don't run on same host as other members
 *    - Prefer 3 data nodes over 2 data + 1 arbiter
 * 
 * 4. OPLOG SIZING
 *    - Size for 24-48 hours of operations
 *    - Monitor oplog window regularly
 *    - Larger oplog = more recovery time for downed secondaries
 * 
 * 5. MONITORING
 *    - Alert on replication lag > threshold
 *    - Monitor election events
 *    - Track write concern timeouts
 * 
 * 6. MAINTENANCE
 *    - Use rolling restarts for upgrades
 *    - Always maintain quorum during maintenance
 *    - Test failover regularly
 * 
 * 7. APPLICATION DESIGN
 *    - Use retryable writes
 *    - Handle NotMaster errors
 *    - Choose appropriate read preference
 *    - Set reasonable timeouts
 */

// -------------------------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------------------------

/**
 * KEY POINTS:
 * 
 * 1. Replica sets provide automatic failover and data redundancy
 * 2. Primary handles all writes; secondaries replicate via oplog
 * 3. Elections require majority of voting members
 * 4. Read preferences allow reading from secondaries
 * 5. Delayed/hidden secondaries useful for DR and backups
 * 6. Monitor replication lag and oplog window
 * 7. Use retryable writes for automatic failover handling
 * 8. Size oplog appropriately for your write volume
 */

module.exports = {
    readPreferenceExamples,
    connectionExamples,
    replicaSetErrorHandling
};
