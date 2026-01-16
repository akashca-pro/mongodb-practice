/**
 * MONGODB PRACTICE PROBLEMS - INDEXING & PERFORMANCE
 * 
 * This file contains practice problems for MongoDB indexing and query optimization.
 * Learn to create indexes, analyze query plans, and optimize performance.
 * 
 * RUN IN MONGOSH: Copy and paste commands into mongosh to practice.
 */

// ==========================================================================================
// SETUP: Create sample database with larger dataset
// ==========================================================================================

// use practiceDB

// Drop existing collections
db.customers.drop()
db.transactions.drop()

// Create customers collection with 1000 documents
print("Creating sample data... (this may take a moment)")

const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"];
const statuses = ["active", "inactive", "pending"];

const customers = [];
for (let i = 1; i <= 1000; i++) {
    customers.push({
        _id: i,
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        age: Math.floor(Math.random() * 50) + 18,
        city: cities[Math.floor(Math.random() * cities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        registeredAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)),
        orderCount: Math.floor(Math.random() * 100),
        totalSpent: Math.floor(Math.random() * 10000),
        tags: ["customer", i % 2 === 0 ? "premium" : "standard", i % 5 === 0 ? "vip" : "regular"]
    });
}
db.customers.insertMany(customers);

// Create transactions collection with 5000 documents
const products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse", "Headphones", "Camera", "Printer", "Speaker"];

const transactions = [];
for (let i = 1; i <= 5000; i++) {
    transactions.push({
        _id: i,
        customerId: Math.floor(Math.random() * 1000) + 1,
        product: products[Math.floor(Math.random() * products.length)],
        amount: Math.floor(Math.random() * 2000) + 10,
        quantity: Math.floor(Math.random() * 5) + 1,
        date: new Date(Date.now() - Math.floor(Math.random() * 180 * 24 * 60 * 60 * 1000)),
        status: ["completed", "pending", "refunded", "cancelled"][Math.floor(Math.random() * 4)],
        paymentMethod: ["credit_card", "debit_card", "paypal", "bank_transfer"][Math.floor(Math.random() * 4)]
    });
}
db.transactions.insertMany(transactions);

print("✅ Sample data created!")
print(`   - Customers: ${db.customers.countDocuments()} documents`)
print(`   - Transactions: ${db.transactions.countDocuments()} documents`)


// ==========================================================================================
// PROBLEM 1: Analyzing Queries Without Indexes
// ==========================================================================================

/**
 * PROBLEM 1.1: Check query without index
 * 
 * Run explain() on a query to find customers by email and analyze the execution plan.
 * What type of scan is being performed?
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ email: "customer500@example.com" }).explain("executionStats")

// Look for:
// - stage: "COLLSCAN" (collection scan - inefficient!)
// - totalDocsExamined: 1000 (scanned all documents)
// - executionTimeMillis: (time taken)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.2: Analyze query for range scan
 * 
 * Use explain() to analyze a query finding customers with age > 40.
 * How many documents were examined?
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ age: { $gt: 40 } }).explain("executionStats")

// Without index: COLLSCAN, examines all 1000 docs


// ==========================================================================================
// PROBLEM 2: Creating Single Field Indexes
// ==========================================================================================

/**
 * PROBLEM 2.1: Create a single field index
 * 
 * Create an index on the "email" field for the customers collection.
 * Verify it was created.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ email: 1 })

// Verify
db.customers.getIndexes()

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.2: Analyze query WITH index
 * 
 * Run the same email query from Problem 1.1 and compare the execution plan.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ email: "customer500@example.com" }).explain("executionStats")

// Now look for:
// - stage: "IXSCAN" (index scan - efficient!)
// - indexName: "email_1"
// - totalKeysExamined: 1
// - totalDocsExamined: 1

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.3: Create index on numeric field
 * 
 * Create an index on the "age" field and verify the range query now uses an index.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ age: 1 })

// Verify with explain
db.customers.find({ age: { $gt: 40 } }).explain("executionStats")
// Should show IXSCAN

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.4: Create descending index
 * 
 * Create a descending index on "orderCount" for efficient sorting.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ orderCount: -1 })

// Test with a sort query
db.customers.find().sort({ orderCount: -1 }).limit(10).explain("executionStats")
// Should use index for sort (no in-memory sort)


// ==========================================================================================
// PROBLEM 3: Compound Indexes
// ==========================================================================================

/**
 * PROBLEM 3.1: Create a compound index
 * 
 * Create a compound index on { city: 1, status: 1 } for the customers collection.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ city: 1, status: 1 })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.2: Query using compound index prefix
 * 
 * Run a query that filters only by "city" and verify it uses the compound index.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ city: "New York" }).explain("executionStats")

// Should use city_1_status_1 index (prefix works!)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.3: Query using full compound index
 * 
 * Run a query that filters by both "city" AND "status" and verify index usage.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ city: "Chicago", status: "active" }).explain("executionStats")

// Uses the full compound index

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.4: Query that cannot use compound index efficiently
 * 
 * Run a query that filters only by "status" (not the prefix). 
 * Does it use the compound index?
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ status: "active" }).explain("executionStats")

// Will likely do COLLSCAN or less efficient index scan
// The compound index can't be used efficiently without the prefix field

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.5: ESR Rule - Create optimal compound index
 * 
 * Create an optimal compound index for this query pattern:
 * - Filter by status (equality)
 * - Filter by age (range)
 * - Sort by orderCount (descending)
 * 
 * Remember ESR: Equality, Sort, Range
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ status: 1, orderCount: -1, age: 1 })

// Test the query
db.customers.find({ status: "active", age: { $gt: 30 } })
    .sort({ orderCount: -1 })
    .explain("executionStats")

// The ESR ordering allows the index to:
// 1. Match equality on status
// 2. Provide sorted results (no in-memory sort)
// 3. Filter range on age


// ==========================================================================================
// PROBLEM 4: Unique Indexes
// ==========================================================================================

/**
 * PROBLEM 4.1: Create unique index
 * 
 * Create a unique index on the email field to prevent duplicate emails.
 * (Drop existing email index first)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.dropIndex("email_1")
db.customers.createIndex({ email: 1 }, { unique: true })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.2: Test unique constraint
 * 
 * Try to insert a document with an existing email and observe the error.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
try {
    db.customers.insertOne({
        _id: 9999,
        name: "Duplicate Test",
        email: "customer1@example.com"  // Already exists!
    })
} catch (e) {
    print("Error:", e.message)
    // Should show duplicate key error
}


// ==========================================================================================
// PROBLEM 5: Partial Indexes
// ==========================================================================================

/**
 * PROBLEM 5.1: Create partial index
 * 
 * Create a partial index on "totalSpent" that only indexes customers 
 * with totalSpent > 5000 (high-value customers).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex(
    { totalSpent: -1 },
    { partialFilterExpression: { totalSpent: { $gt: 5000 } } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.2: Query using partial index
 * 
 * Run a query that can use the partial index (totalSpent > 6000).
 * Verify it uses the index.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ totalSpent: { $gt: 6000 } }).explain("executionStats")

// Uses the partial index

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.3: Query that cannot use partial index
 * 
 * Run a query that cannot use the partial index (totalSpent > 3000).
 * Explain why.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ totalSpent: { $gt: 3000 } }).explain("executionStats")

// Cannot use the partial index because the query range (>3000)
// includes values not in the index (3001-5000)
// MongoDB will use COLLSCAN or another index


// ==========================================================================================
// PROBLEM 6: Text Indexes
// ==========================================================================================

/**
 * PROBLEM 6.1: Create text index
 * 
 * Create a text index on the "name" field for full-text search.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ name: "text" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.2: Perform text search
 * 
 * Search for customers with "Customer 5" in their name.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ $text: { $search: "Customer 5" } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.3: Text search with score sorting
 * 
 * Search for "Customer 50" sorted by text relevance score.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find(
    { $text: { $search: "Customer 50" } },
    { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })


// ==========================================================================================
// PROBLEM 7: TTL Indexes
// ==========================================================================================

/**
 * PROBLEM 7.1: Create TTL index
 * 
 * Create a TTL index on transactions that automatically deletes documents 
 * 90 days after their "date" field.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.transactions.createIndex(
    { date: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }  // 90 days
)

// Note: MongoDB checks and removes expired docs every 60 seconds


// ==========================================================================================
// PROBLEM 8: Multikey Indexes (Array Fields)
// ==========================================================================================

/**
 * PROBLEM 8.1: Create multikey index
 * 
 * Create an index on the "tags" array field.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.createIndex({ tags: 1 })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 8.2: Query array with index
 * 
 * Find all customers with "vip" tag and verify index usage.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ tags: "vip" }).explain("executionStats")

// Uses the multikey index

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 8.3: Query with $all operator
 * 
 * Find customers with both "premium" AND "vip" tags.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ tags: { $all: ["premium", "vip"] } }).explain("executionStats")


// ==========================================================================================
// PROBLEM 9: Index Management
// ==========================================================================================

/**
 * PROBLEM 9.1: List all indexes
 * 
 * List all indexes on the customers collection.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.getIndexes()

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.2: Get index statistics
 * 
 * Check the usage statistics for all indexes on customers.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.aggregate([{ $indexStats: {} }])

// Shows: ops (how many times used), since (when tracking started)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.3: Drop specific index
 * 
 * Drop the "age_1" index.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.dropIndex("age_1")

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.4: Drop all non-_id indexes
 * 
 * Drop all indexes except the default _id index.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.dropIndexes()

// Verify only _id remains
db.customers.getIndexes()


// ==========================================================================================
// PROBLEM 10: Query Optimization
// ==========================================================================================

/**
 * PROBLEM 10.1: Covered Query
 * 
 * Create an index and write a query that can be fully satisfied by the index
 * (covered query - no document fetch needed).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Create compound index
db.customers.createIndex({ city: 1, email: 1 })

// Query only the indexed fields with projection
db.customers.find(
    { city: "New York" },
    { _id: 0, city: 1, email: 1 }
).explain("executionStats")

// Look for: totalDocsExamined: 0 (covered query!)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.2: Hint to force index usage
 * 
 * Create a query that uses hint() to force a specific index.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.find({ city: "Chicago" })
    .hint({ city: 1, email: 1 })
    .explain("executionStats")

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.3: Analyze slow query
 * 
 * Enable the profiler to catch slow queries, then run a slow query.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Enable profiler for queries > 100ms
db.setProfilingLevel(1, { slowms: 100 })

// Run a query that might be slow (forces COLLSCAN after dropping indexes)
db.customers.find({ orderCount: { $gt: 50 } }).toArray()

// Check profiler
db.system.profile.find().sort({ ts: -1 }).limit(5).pretty()

// Disable profiler
db.setProfilingLevel(0)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.4: Optimize a complex query
 * 
 * Given this query pattern, create the optimal index:
 * 
 * db.transactions.find({
 *     status: "completed",
 *     amount: { $gte: 500, $lte: 1500 },
 *     date: { $gte: new Date("2024-01-01") }
 * }).sort({ amount: -1 }).limit(20)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Analyze the query:
// - status: equality filter (E)
// - amount: range filter AND sort (R/S)
// - date: range filter (R)
// 
// ESR Rule suggests: { status: 1, amount: -1, date: 1 }
// Since amount is both sorted and ranged, put it after equality

db.transactions.createIndex({ status: 1, amount: -1, date: 1 })

// Verify
db.transactions.find({
    status: "completed",
    amount: { $gte: 500, $lte: 1500 },
    date: { $gte: new Date("2024-01-01") }
}).sort({ amount: -1 }).limit(20).explain("executionStats")


// ==========================================================================================
// PROBLEM 11: Index Size and Memory
// ==========================================================================================

/**
 * PROBLEM 11.1: Check index size
 * 
 * Get the size of indexes on the transactions collection.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.transactions.stats().indexSizes

// Or more detail
db.transactions.stats()
// Look for: totalIndexSize, indexSizes

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 11.2: Check collection statistics
 * 
 * Get full statistics for the customers collection including index details.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.customers.stats()

// Key metrics:
// - count: number of documents
// - size: collection data size
// - storageSize: storage size on disk
// - totalIndexSize: total size of all indexes
// - indexSizes: size of each individual index


// ==========================================================================================
// PROBLEM 12: Real-World Index Scenarios
// ==========================================================================================

/**
 * PROBLEM 12.1: E-commerce product search
 * 
 * Create indexes to optimize these common e-commerce queries:
 * 1. Find products by category, sorted by price
 * 2. Search products by name (text search)
 * 3. Find products by category and in-stock status
 */

// Create sample products first
db.products_demo.drop()
db.products_demo.insertMany([
    { name: "Laptop Pro 15", category: "Electronics", price: 1299, inStock: true },
    { name: "Wireless Mouse", category: "Electronics", price: 29, inStock: true },
    { name: "Office Chair", category: "Furniture", price: 199, inStock: false },
    { name: "Standing Desk", category: "Furniture", price: 599, inStock: true },
    { name: "Laptop Stand", category: "Accessories", price: 49, inStock: true }
])

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// 1. Category + price sort
db.products_demo.createIndex({ category: 1, price: 1 })

// 2. Text search on name
db.products_demo.createIndex({ name: "text" })

// 3. Category + inStock filter
db.products_demo.createIndex({ category: 1, inStock: 1 })

// Test queries
db.products_demo.find({ category: "Electronics" }).sort({ price: 1 }).explain("executionStats")
db.products_demo.find({ $text: { $search: "laptop" } })
db.products_demo.find({ category: "Electronics", inStock: true })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 12.2: User activity log optimization
 * 
 * Given a user activity log with these query patterns:
 * - Find all activities by userId, sorted by timestamp (most recent first)
 * - Find activities by userId and action type
 * - TTL: delete activities older than 30 days
 * 
 * Create the necessary indexes.
 */

db.activity_log.drop()
db.activity_log.insertMany([
    { userId: 1, action: "login", timestamp: new Date(), metadata: {} },
    { userId: 1, action: "view_page", timestamp: new Date(), metadata: { page: "/home" } },
    { userId: 2, action: "purchase", timestamp: new Date(), metadata: { amount: 99.99 } }
])

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// 1. Activities by user, sorted by time
db.activity_log.createIndex({ userId: 1, timestamp: -1 })

// 2. Activities by user and action
db.activity_log.createIndex({ userId: 1, action: 1 })

// 3. TTL index for automatic cleanup
db.activity_log.createIndex(
    { timestamp: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 }  // 30 days
)

// Verify
db.activity_log.getIndexes()


// ==========================================================================================
// CLEANUP
// ==========================================================================================

// Clean up when done
// db.customers.drop()
// db.transactions.drop()
// db.products_demo.drop()
// db.activity_log.drop()

print("✅ All Indexing & Performance practice problems completed!")
