/**
 * TOPIC: MONGODB SHELL (mongosh)
 * DESCRIPTION:
 * The MongoDB Shell (mongosh) is a JavaScript interface for interacting
 * with MongoDB. It's essential for administration, querying, and scripting.
 */

// -------------------------------------------------------------------------------------------
// 1. CONNECTING TO MONGODB
// -------------------------------------------------------------------------------------------

/**
 * CONNECTION COMMANDS:
 * 
 * # Connect to local instance
 * mongosh
 * 
 * # Connect to specific host/port
 * mongosh "mongodb://localhost:27017"
 * 
 * # Connect with authentication
 * mongosh "mongodb://user:password@localhost:27017/dbname"
 * 
 * # Connect to replica set
 * mongosh "mongodb://host1:27017,host2:27017,host3:27017/dbname?replicaSet=rs0"
 * 
 * # Connect to MongoDB Atlas
 * mongosh "mongodb+srv://cluster.mongodb.net/dbname" --apiVersion 1 --username user
 */

// -------------------------------------------------------------------------------------------
// 2. DATABASE OPERATIONS
// -------------------------------------------------------------------------------------------

const databaseCommands = `
// Show all databases
show dbs

// Switch to database (creates if doesn't exist)
use myDatabase

// Show current database
db

// Drop current database
db.dropDatabase()

// Database stats
db.stats()

// Server status
db.serverStatus()
`;

console.log("Database Commands:", databaseCommands);

// -------------------------------------------------------------------------------------------
// 3. COLLECTION OPERATIONS
// -------------------------------------------------------------------------------------------

const collectionCommands = `
// Show all collections
show collections

// Create collection
db.createCollection("users")

// Drop collection
db.users.drop()

// Collection stats
db.users.stats()

// Count documents
db.users.countDocuments()
db.users.estimatedDocumentCount()

// List indexes
db.users.getIndexes()
`;

console.log("Collection Commands:", collectionCommands);

// -------------------------------------------------------------------------------------------
// 4. CRUD IN SHELL
// -------------------------------------------------------------------------------------------

const crudCommands = `
// INSERT
db.users.insertOne({ name: "John", age: 30 })
db.users.insertMany([
    { name: "Alice", age: 25 },
    { name: "Bob", age: 35 }
])

// FIND
db.users.find()                          // All documents
db.users.find({ age: { $gt: 25 } })      // With filter
db.users.findOne({ name: "John" })       // Single document
db.users.find().limit(10).skip(5)        // Pagination
db.users.find().sort({ age: -1 })        // Sort descending
db.users.find({}, { name: 1, _id: 0 })   // Projection

// UPDATE
db.users.updateOne(
    { name: "John" },
    { $set: { age: 31 } }
)
db.users.updateMany(
    { age: { $lt: 30 } },
    { $set: { category: "young" } }
)
db.users.replaceOne(
    { name: "John" },
    { name: "John Doe", age: 31, email: "john@example.com" }
)

// DELETE
db.users.deleteOne({ name: "Bob" })
db.users.deleteMany({ age: { $lt: 20 } })
`;

console.log("CRUD Commands:", crudCommands);

// -------------------------------------------------------------------------------------------
// 5. AGGREGATION IN SHELL
// -------------------------------------------------------------------------------------------

const aggregationCommands = `
// Basic aggregation
db.orders.aggregate([
    { $match: { status: "completed" } },
    { $group: { 
        _id: "$customerId",
        total: { $sum: "$amount" },
        count: { $sum: 1 }
    }},
    { $sort: { total: -1 } },
    { $limit: 10 }
])

// Lookup (join)
db.orders.aggregate([
    { $lookup: {
        from: "customers",
        localField: "customerId",
        foreignField: "_id",
        as: "customer"
    }},
    { $unwind: "$customer" }
])

// Project and reshape
db.users.aggregate([
    { $project: {
        fullName: { $concat: ["$firstName", " ", "$lastName"] },
        year: { $year: "$createdAt" }
    }}
])
`;

console.log("Aggregation Commands:", aggregationCommands);

// -------------------------------------------------------------------------------------------
// 6. INDEX MANAGEMENT
// -------------------------------------------------------------------------------------------

const indexCommands = `
// Create single field index
db.users.createIndex({ email: 1 })

// Create compound index
db.users.createIndex({ lastName: 1, firstName: 1 })

// Create unique index
db.users.createIndex({ email: 1 }, { unique: true })

// Create text index
db.articles.createIndex({ content: "text" })

// Create TTL index (auto-delete after time)
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })

// List indexes
db.users.getIndexes()

// Drop index
db.users.dropIndex("email_1")
db.users.dropIndexes()  // Drop all except _id
`;

console.log("Index Commands:", indexCommands);

// -------------------------------------------------------------------------------------------
// 7. ADMIN COMMANDS
// -------------------------------------------------------------------------------------------

const adminCommands = `
// User management
db.createUser({
    user: "appUser",
    pwd: "password123",
    roles: [{ role: "readWrite", db: "myDatabase" }]
})
db.dropUser("appUser")
db.getUsers()

// Server info
db.serverStatus()
db.hostInfo()
db.version()

// Current operations
db.currentOp()
db.killOp(opId)

// Profiling
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)

// Repair
db.repairDatabase()

// Compact collection
db.runCommand({ compact: "collectionName" })
`;

console.log("Admin Commands:", adminCommands);

// -------------------------------------------------------------------------------------------
// 8. SHELL HELPERS AND TIPS
// -------------------------------------------------------------------------------------------

const shellTips = `
// Pretty print
db.users.find().pretty()

// Explain query
db.users.find({ age: { $gt: 25 } }).explain("executionStats")

// Show query plan
db.users.find({ age: { $gt: 25 } }).explain("queryPlanner")

// Iterate cursor
const cursor = db.users.find()
while (cursor.hasNext()) {
    printjson(cursor.next())
}

// forEach on cursor
db.users.find().forEach(doc => print(doc.name))

// Map results
db.users.find().map(doc => doc.name)

// Load JavaScript file
load("script.js")

// Exit shell
exit
quit()

// Clear screen
cls

// Help
help
db.help()
db.users.help()
`;

console.log("Shell Tips:", shellTips);

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * MONGOSH KEY POINTS:
 * 
 * 1. Connection: Use connection strings with auth for production
 * 2. Navigation: use db, show dbs, show collections
 * 3. CRUD: insertOne/Many, find, updateOne/Many, deleteOne/Many
 * 4. Aggregation: Pipeline-based data processing
 * 5. Indexes: Create indexes for query optimization
 * 
 * BEST PRACTICES:
 * - Use explain() to analyze queries
 * - Always test queries on small datasets first
 * - Use projection to limit returned fields
 * - Create scripts for repeatable operations
 * - Use --eval for one-liners in scripts
 */
