/**
 * TOPIC: AUDIT LOGGING
 * DESCRIPTION:
 * MongoDB audit logging tracks database operations for security,
 * compliance, and debugging. Available in MongoDB Enterprise.
 */

// -------------------------------------------------------------------------------------------
// 1. AUDIT LOG CONFIGURATION
// -------------------------------------------------------------------------------------------

/**
 * Enable auditing via mongod configuration:
 * 
 * mongod.conf:
 * 
 * auditLog:
 *   destination: file
 *   format: JSON
 *   path: /var/log/mongodb/audit.json
 *   filter: '{ atype: { $in: ["authenticate", "createCollection", "dropCollection"] } }'
 * 
 * Command line:
 * mongod --auditDestination file --auditFormat JSON --auditPath /var/log/mongodb/audit.json
 */

const auditConfiguration = {
    file: {
        destination: 'file',
        format: 'JSON',       // or BSON
        path: '/var/log/mongodb/audit.json'
    },
    syslog: {
        destination: 'syslog',
        format: 'JSON'
    },
    console: {
        destination: 'console',
        format: 'JSON'
    }
};

// -------------------------------------------------------------------------------------------
// 2. AUDIT EVENT TYPES
// -------------------------------------------------------------------------------------------

/**
 * AUTHENTICATION EVENTS:
 * - authenticate
 * - authCheck
 * 
 * USER/ROLE MANAGEMENT:
 * - createUser, dropUser, updateUser
 * - createRole, dropRole, updateRole
 * - grantRoles, revokeRoles
 * 
 * DATABASE OPERATIONS:
 * - createDatabase, dropDatabase
 * - createCollection, dropCollection
 * - createIndex, dropIndex
 * 
 * CRUD OPERATIONS (with filter):
 * - insert, update, delete, find
 * 
 * SHARDING:
 * - enableSharding, shardCollection
 * - addShard, removeShard
 * 
 * REPLICATION:
 * - replSetReconfig, replSetInitiate
 */

// -------------------------------------------------------------------------------------------
// 3. AUDIT FILTERS
// -------------------------------------------------------------------------------------------

const auditFilters = {
    // Audit only authentication events
    authOnly: {
        atype: { $in: ['authenticate', 'authCheck'] }
    },
    
    // Audit all admin operations
    adminOps: {
        atype: {
            $in: [
                'createUser', 'dropUser',
                'createRole', 'dropRole',
                'createCollection', 'dropCollection',
                'dropDatabase'
            ]
        }
    },
    
    // Audit specific database
    specificDb: {
        'param.ns': { $regex: '^production\\.' }
    },
    
    // Audit specific user
    specificUser: {
        'users.user': 'admin'
    },
    
    // Audit failed operations
    failedOps: {
        result: { $ne: 0 }
    },
    
    // Complex filter
    complex: {
        $and: [
            { atype: { $in: ['authenticate', 'dropCollection'] } },
            { result: 0 }
        ]
    }
};

// -------------------------------------------------------------------------------------------
// 4. AUDIT LOG FORMAT
// -------------------------------------------------------------------------------------------

const sampleAuditEntry = {
    atype: 'authenticate',           // Action type
    ts: { $date: '2024-01-15T10:30:00.000Z' },  // Timestamp
    local: { ip: '127.0.0.1', port: 27017 },    // Server
    remote: { ip: '192.168.1.100', port: 45678 },  // Client
    users: [{ user: 'appUser', db: 'admin' }],  // Users
    roles: [{ role: 'readWrite', db: 'myapp' }], // Roles
    param: {
        user: 'appUser',
        db: 'admin',
        mechanism: 'SCRAM-SHA-256'
    },
    result: 0  // 0 = success, non-zero = error code
};

// -------------------------------------------------------------------------------------------
// 5. ANALYZING AUDIT LOGS
// -------------------------------------------------------------------------------------------

const fs = require('fs');
const readline = require('readline');

async function analyzeAuditLog(logPath) {
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    const stats = {
        total: 0,
        byType: {},
        failed: 0,
        byUser: {}
    };
    
    for await (const line of rl) {
        try {
            const entry = JSON.parse(line);
            stats.total++;
            
            // Count by type
            stats.byType[entry.atype] = (stats.byType[entry.atype] || 0) + 1;
            
            // Count failures
            if (entry.result !== 0) stats.failed++;
            
            // Count by user
            if (entry.users && entry.users[0]) {
                const user = entry.users[0].user;
                stats.byUser[user] = (stats.byUser[user] || 0) + 1;
            }
        } catch (e) {
            // Skip malformed lines
        }
    }
    
    console.log('Audit Log Analysis:');
    console.log('Total events:', stats.total);
    console.log('Failed operations:', stats.failed);
    console.log('Events by type:', stats.byType);
    console.log('Events by user:', stats.byUser);
    
    return stats;
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * AUDIT LOGGING:
 * 
 * 1. Available in Enterprise/Atlas
 * 2. Configure destination and format
 * 3. Use filters to reduce volume
 * 4. Analyze logs for security insights
 * 
 * BEST PRACTICES:
 * - Enable for production compliance
 * - Filter to relevant events
 * - Rotate and archive logs
 * - Monitor for suspicious patterns
 * - Integrate with SIEM tools
 */

module.exports = {
    auditConfiguration,
    auditFilters,
    analyzeAuditLog
};
