/**
 * TOPIC: MONGODB SECURITY
 * DESCRIPTION:
 * Authentication, authorization, and security best practices
 * for MongoDB deployments.
 */

// -------------------------------------------------------------------------------------------
// 1. AUTHENTICATION
// -------------------------------------------------------------------------------------------

/**
 * AUTHENTICATION METHODS:
 * 
 * - SCRAM-SHA-256: Default, password-based
 * - x.509: Certificate-based
 * - LDAP: Enterprise, external auth
 * - Kerberos: Enterprise, single sign-on
 */

// Connection with authentication
const authConnection = `
mongodb://username:password@host:27017/database?authSource=admin
`;

// Create user
const createUserCommands = `
use admin
db.createUser({
    user: "appUser",
    pwd: "securePassword123",
    roles: [
        { role: "readWrite", db: "myapp" },
        { role: "read", db: "analytics" }
    ]
})
`;

// -------------------------------------------------------------------------------------------
// 2. ROLE-BASED ACCESS CONTROL (RBAC)
// -------------------------------------------------------------------------------------------

/**
 * BUILT-IN ROLES:
 * 
 * Database User: read, readWrite
 * Database Admin: dbAdmin, userAdmin, dbOwner
 * Cluster Admin: clusterAdmin, clusterManager
 * All Database: readAnyDatabase, readWriteAnyDatabase
 * Superuser: root
 */

const roleExamples = `
// Read-only user
db.createUser({
    user: "readOnlyUser",
    pwd: "password",
    roles: [{ role: "read", db: "myapp" }]
})

// Admin user
db.createUser({
    user: "adminUser",
    pwd: "password",
    roles: [{ role: "dbOwner", db: "myapp" }]
})

// Custom role
db.createRole({
    role: "appReadWrite",
    privileges: [
        { resource: { db: "myapp", collection: "users" }, actions: ["find", "update"] },
        { resource: { db: "myapp", collection: "orders" }, actions: ["find", "insert"] }
    ],
    roles: []
})
`;

// -------------------------------------------------------------------------------------------
// 3. NETWORK SECURITY
// -------------------------------------------------------------------------------------------

/**
 * NETWORK SECURITY:
 * 
 * 1. Bind to specific IPs (not 0.0.0.0)
 * 2. Use TLS/SSL encryption
 * 3. Enable firewall rules
 * 4. Use VPC peering for cloud
 */

const tlsConnection = `
// Connection with TLS
mongodb://user:pass@host:27017/db?tls=true&tlsCAFile=/path/to/ca.pem

// Server configuration
mongod --tlsMode requireTLS \\
       --tlsCertificateKeyFile /path/to/server.pem \\
       --tlsCAFile /path/to/ca.pem
`;

// -------------------------------------------------------------------------------------------
// 4. ENCRYPTION
// -------------------------------------------------------------------------------------------

/**
 * ENCRYPTION OPTIONS:
 * 
 * 1. In-transit: TLS/SSL
 * 2. At-rest: Encrypted storage engine (Enterprise)
 * 3. Field-level: Client-Side Field Level Encryption (CSFLE)
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * SECURITY CHECKLIST:
 * 
 * 1. Enable authentication (--auth)
 * 2. Use strong passwords
 * 3. Apply principle of least privilege
 * 4. Enable TLS/SSL
 * 5. Bind to specific IPs
 * 6. Enable audit logging
 * 7. Keep MongoDB updated
 * 8. Disable unused features
 */

module.exports = {
    authConnection,
    createUserCommands,
    roleExamples,
    tlsConnection
};
