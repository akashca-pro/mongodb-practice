/**
 * MONGODB PRACTICE PROBLEMS - TRANSACTIONS & ADVANCED TOPICS
 * 
 * This file contains practice problems for MongoDB transactions,
 * change streams, and advanced operations.
 * 
 * NOTE: Transactions require a replica set. For local testing:
 * - Use MongoDB Atlas (free tier works)
 * - Or run local replica set: https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set-for-testing/
 * 
 * RUN IN MONGOSH: Copy and paste commands into mongosh to practice.
 */

// ==========================================================================================
// SETUP
// ==========================================================================================

// use practiceDB

// Sample collections for banking example
db.accounts.drop()
db.transfers.drop()
db.audit_log.drop()

db.accounts.insertMany([
    { _id: "ACC001", name: "Alice", balance: 5000, currency: "USD" },
    { _id: "ACC002", name: "Bob", balance: 3000, currency: "USD" },
    { _id: "ACC003", name: "Charlie", balance: 7500, currency: "USD" },
    { _id: "ACC004", name: "Diana", balance: 2000, currency: "USD" }
])

print("✅ Sample data for transactions created!")


// ==========================================================================================
// PROBLEM 1: Basic Transactions
// ==========================================================================================

/**
 * PROBLEM 1.1: Simple Money Transfer
 * 
 * Transfer $500 from Alice (ACC001) to Bob (ACC002) using a transaction.
 * Both updates must succeed or both must fail.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Note: This requires a replica set connection
const session = db.getMongo().startSession()

session.startTransaction()

try {
    const accountsCollection = session.getDatabase("practiceDB").accounts
    
    // Debit from Alice
    accountsCollection.updateOne(
        { _id: "ACC001", balance: { $gte: 500 } },  // Check sufficient funds
        { $inc: { balance: -500 } }
    )
    
    // Credit to Bob  
    accountsCollection.updateOne(
        { _id: "ACC002" },
        { $inc: { balance: 500 } }
    )
    
    session.commitTransaction()
    print("✅ Transfer successful!")
    
} catch (error) {
    session.abortTransaction()
    print("❌ Transfer failed:", error.message)
} finally {
    session.endSession()
}

// Verify balances
db.accounts.find({ _id: { $in: ["ACC001", "ACC002"] } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.2: Transfer with Validation
 * 
 * Create a transfer that:
 * 1. Checks if source account has sufficient balance
 * 2. Performs the transfer
 * 3. Creates a transfer record
 * 4. Logs to audit collection
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
async function transferWithAudit(fromAccount, toAccount, amount) {
    const session = db.getMongo().startSession()
    
    session.startTransaction({
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" }
    })
    
    try {
        const accounts = session.getDatabase("practiceDB").accounts
        const transfers = session.getDatabase("practiceDB").transfers
        const auditLog = session.getDatabase("practiceDB").audit_log
        
        // Check source account balance
        const sourceAccount = accounts.findOne(
            { _id: fromAccount },
            { session }
        )
        
        if (!sourceAccount) {
            throw new Error("Source account not found")
        }
        
        if (sourceAccount.balance < amount) {
            throw new Error("Insufficient funds")
        }
        
        // Debit source
        accounts.updateOne(
            { _id: fromAccount },
            { $inc: { balance: -amount } },
            { session }
        )
        
        // Credit destination
        accounts.updateOne(
            { _id: toAccount },
            { $inc: { balance: amount } },
            { session }
        )
        
        // Create transfer record
        const transferId = ObjectId()
        transfers.insertOne({
            _id: transferId,
            from: fromAccount,
            to: toAccount,
            amount: amount,
            currency: "USD",
            status: "completed",
            timestamp: new Date()
        }, { session })
        
        // Audit log
        auditLog.insertOne({
            action: "TRANSFER",
            transferId: transferId,
            from: fromAccount,
            to: toAccount,
            amount: amount,
            timestamp: new Date(),
            success: true
        }, { session })
        
        session.commitTransaction()
        print("✅ Transfer completed. ID:", transferId)
        return transferId
        
    } catch (error) {
        session.abortTransaction()
        
        // Log failed attempt
        db.audit_log.insertOne({
            action: "TRANSFER_FAILED",
            from: fromAccount,
            to: toAccount,
            amount: amount,
            error: error.message,
            timestamp: new Date(),
            success: false
        })
        
        print("❌ Transfer failed:", error.message)
        throw error
        
    } finally {
        session.endSession()
    }
}

// Test the function
// transferWithAudit("ACC001", "ACC002", 200)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.3: Transaction with Read Preference
 * 
 * Create a transaction that uses specific read/write concerns.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
const txnSession = db.getMongo().startSession()

// Start transaction with explicit options
txnSession.startTransaction({
    readConcern: { level: "snapshot" },  // Consistent reads
    writeConcern: { w: "majority", j: true },  // Durable writes
    readPreference: "primary"  // Must read from primary
})

try {
    // Transaction operations here
    const coll = txnSession.getDatabase("practiceDB").accounts
    
    coll.updateOne({ _id: "ACC003" }, { $inc: { balance: 100 } })
    
    txnSession.commitTransaction()
    print("✅ Transaction committed with majority write concern")
    
} catch (error) {
    txnSession.abortTransaction()
    print("❌ Transaction aborted:", error.message)
} finally {
    txnSession.endSession()
}


// ==========================================================================================
// PROBLEM 2: Multi-Document Transactions
// ==========================================================================================

/**
 * PROBLEM 2.1: Order Processing Transaction
 * 
 * Create a transaction that:
 * 1. Creates an order
 * 2. Updates inventory for all ordered items
 * 3. Deducts from customer balance
 * All must succeed or none should apply.
 */

// Setup
db.inventory.drop()
db.customer_orders.drop()
db.customer_balances.drop()

db.inventory.insertMany([
    { _id: "PROD1", name: "Laptop", stock: 10, price: 999 },
    { _id: "PROD2", name: "Mouse", stock: 50, price: 29 },
    { _id: "PROD3", name: "Keyboard", stock: 25, price: 79 }
])

db.customer_balances.insertOne({
    _id: "CUST001",
    name: "John Doe",
    balance: 2000
})

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
async function processOrder(customerId, items) {
    const session = db.getMongo().startSession()
    
    session.startTransaction()
    
    try {
        const inventory = session.getDatabase("practiceDB").inventory
        const orders = session.getDatabase("practiceDB").customer_orders
        const balances = session.getDatabase("practiceDB").customer_balances
        
        let totalAmount = 0
        const orderItems = []
        
        // Check and update inventory for each item
        for (const item of items) {
            const product = inventory.findOne(
                { _id: item.productId },
                { session }
            )
            
            if (!product) {
                throw new Error(`Product ${item.productId} not found`)
            }
            
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`)
            }
            
            // Update inventory
            inventory.updateOne(
                { _id: item.productId, stock: { $gte: item.quantity } },
                { $inc: { stock: -item.quantity } },
                { session }
            )
            
            const itemTotal = product.price * item.quantity
            totalAmount += itemTotal
            
            orderItems.push({
                productId: item.productId,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                subtotal: itemTotal
            })
        }
        
        // Check customer balance
        const customer = balances.findOne(
            { _id: customerId },
            { session }
        )
        
        if (!customer || customer.balance < totalAmount) {
            throw new Error("Insufficient customer balance")
        }
        
        // Deduct from balance
        balances.updateOne(
            { _id: customerId },
            { $inc: { balance: -totalAmount } },
            { session }
        )
        
        // Create order
        const orderId = ObjectId()
        orders.insertOne({
            _id: orderId,
            customerId: customerId,
            items: orderItems,
            total: totalAmount,
            status: "confirmed",
            createdAt: new Date()
        }, { session })
        
        session.commitTransaction()
        print("✅ Order processed. Order ID:", orderId)
        print("   Total:", totalAmount)
        return orderId
        
    } catch (error) {
        session.abortTransaction()
        print("❌ Order failed:", error.message)
        throw error
    } finally {
        session.endSession()
    }
}

// Test
// processOrder("CUST001", [
//     { productId: "PROD1", quantity: 1 },
//     { productId: "PROD2", quantity: 2 }
// ])


// ==========================================================================================
// PROBLEM 3: Handling Transaction Errors
// ==========================================================================================

/**
 * PROBLEM 3.1: Retry Transaction on Transient Error
 * 
 * Implement a retry mechanism for transient transaction errors.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
function runTransactionWithRetry(txnFunc, maxRetries = 3) {
    const session = db.getMongo().startSession()
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            session.startTransaction()
            
            // Execute the transaction function
            const result = txnFunc(session)
            
            // Commit with retry
            commitWithRetry(session)
            
            print(`✅ Transaction succeeded on attempt ${attempt}`)
            return result
            
        } catch (error) {
            session.abortTransaction()
            
            // Check if error is retryable
            if (error.hasOwnProperty("errorLabels") && 
                error.errorLabels.includes("TransientTransactionError") &&
                attempt < maxRetries) {
                print(`⚠️ Transient error, retrying (${attempt}/${maxRetries})...`)
                continue
            }
            
            print(`❌ Transaction failed after ${attempt} attempts:`, error.message)
            throw error
        }
    }
    
    session.endSession()
}

function commitWithRetry(session) {
    while (true) {
        try {
            session.commitTransaction()
            return
        } catch (error) {
            if (error.hasOwnProperty("errorLabels") &&
                error.errorLabels.includes("UnknownTransactionCommitResult")) {
                print("⚠️ Unknown commit result, retrying...")
                continue
            }
            throw error
        }
    }
}

// Usage example
// runTransactionWithRetry((session) => {
//     const coll = session.getDatabase("practiceDB").accounts
//     coll.updateOne({ _id: "ACC001" }, { $inc: { balance: 50 } })
//     return "success"
// })


// ==========================================================================================
// PROBLEM 4: Change Streams
// ==========================================================================================

/**
 * PROBLEM 4.1: Basic Change Stream
 * 
 * Create a change stream that watches for new insertions in the orders collection.
 * 
 * NOTE: Change streams require a replica set.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Open a change stream on the collection
const changeStream = db.customer_orders.watch()

// Process changes (run in one terminal)
print("Watching for changes... (Ctrl+C to stop)")
while (changeStream.hasNext()) {
    const change = changeStream.next()
    print("Change detected:")
    printjson(change)
    
    // Handle different operation types
    switch (change.operationType) {
        case "insert":
            print("New order inserted:", change.fullDocument._id)
            break
        case "update":
            print("Order updated:", change.documentKey._id)
            break
        case "delete":
            print("Order deleted:", change.documentKey._id)
            break
    }
}

// Close when done
// changeStream.close()

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.2: Filtered Change Stream
 * 
 * Create a change stream that only watches for high-value orders (> $500).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
const highValueStream = db.customer_orders.watch([
    {
        $match: {
            $or: [
                // Match inserts where total > 500
                { 
                    operationType: "insert",
                    "fullDocument.total": { $gt: 500 }
                },
                // Match updates that might affect total
                {
                    operationType: "update",
                    "updateDescription.updatedFields.total": { $gt: 500 }
                }
            ]
        }
    }
])

// Process filtered changes
// while (highValueStream.hasNext()) {
//     const change = highValueStream.next()
//     print("High-value order detected!")
//     printjson(change.fullDocument || change.documentKey)
// }

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.3: Resume Token
 * 
 * Create a change stream that can resume from where it left off.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
let resumeToken = null

// First run - save resume token
function watchWithResumeToken() {
    const options = resumeToken 
        ? { resumeAfter: resumeToken }
        : {}
    
    const stream = db.accounts.watch([], options)
    
    while (stream.hasNext()) {
        const change = stream.next()
        resumeToken = change._id  // Save token for resume
        
        print("Processing change...")
        printjson(change)
        
        // Store resumeToken somewhere persistent (e.g., another collection)
        db.resume_tokens.updateOne(
            { _id: "accounts_stream" },
            { $set: { token: resumeToken, updatedAt: new Date() } },
            { upsert: true }
        )
    }
}

// Resume from stored token
function resumeWatching() {
    const stored = db.resume_tokens.findOne({ _id: "accounts_stream" })
    if (stored) {
        resumeToken = stored.token
        print("Resuming from stored token...")
    }
    watchWithResumeToken()
}


// ==========================================================================================
// PROBLEM 5: Bulk Operations
// ==========================================================================================

/**
 * PROBLEM 5.1: Ordered Bulk Write
 * 
 * Perform multiple operations in order.
 * If one fails, subsequent operations are skipped.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.bulk_test.drop()

db.bulk_test.bulkWrite([
    {
        insertOne: {
            document: { _id: 1, name: "Item 1", status: "active" }
        }
    },
    {
        insertOne: {
            document: { _id: 2, name: "Item 2", status: "active" }
        }
    },
    {
        updateOne: {
            filter: { _id: 1 },
            update: { $set: { status: "updated" } }
        }
    },
    {
        deleteOne: {
            filter: { _id: 2 }
        }
    }
], { ordered: true })  // Default is ordered: true

db.bulk_test.find()

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.2: Unordered Bulk Write
 * 
 * Perform multiple operations in parallel.
 * Failures don't stop other operations.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.bulk_parallel.drop()

const result = db.bulk_parallel.bulkWrite([
    { insertOne: { document: { _id: 1, value: 100 } } },
    { insertOne: { document: { _id: 2, value: 200 } } },
    { insertOne: { document: { _id: 3, value: 300 } } },
    { insertOne: { document: { _id: 1, value: 999 } } },  // Duplicate _id - will fail
    { insertOne: { document: { _id: 4, value: 400 } } }   // Still executes
], { ordered: false })

print("Inserted:", result.insertedCount)
print("Errors occurred but other operations continued")

db.bulk_parallel.find()  // Should have 1, 2, 3, 4

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.3: Bulk Upserts
 * 
 * Update multiple documents, inserting if they don't exist.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products_bulk.drop()

const bulkOps = [
    {
        updateOne: {
            filter: { sku: "PROD001" },
            update: { $set: { name: "Laptop", price: 999, stock: 50 } },
            upsert: true
        }
    },
    {
        updateOne: {
            filter: { sku: "PROD002" },
            update: { $set: { name: "Mouse", price: 29, stock: 100 } },
            upsert: true
        }
    },
    {
        updateOne: {
            filter: { sku: "PROD003" },
            update: { $set: { name: "Keyboard", price: 79, stock: 75 } },
            upsert: true
        }
    }
]

const bulkResult = db.products_bulk.bulkWrite(bulkOps)
print("Upserted:", bulkResult.upsertedCount)
print("Modified:", bulkResult.modifiedCount)

db.products_bulk.find()


// ==========================================================================================
// PROBLEM 6: Write Concern and Read Concern in Practice
// ==========================================================================================

/**
 * PROBLEM 6.1: Critical Write with Full Durability
 * 
 * Insert a critical document with the strongest durability guarantee.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.critical_data.insertOne(
    {
        type: "financial_transaction",
        amount: 10000,
        timestamp: new Date()
    },
    {
        writeConcern: {
            w: "majority",  // Wait for majority of nodes
            j: true,        // Wait for journal commit
            wtimeout: 5000  // 5 second timeout
        }
    }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.2: Read Committed Data Only
 * 
 * Read data that is guaranteed to be committed (won't be rolled back).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.critical_data.find({}).readConcern("majority")

// Or with full options
db.critical_data.aggregate([
    { $match: { type: "financial_transaction" } }
], {
    readConcern: { level: "majority" }
})


// ==========================================================================================
// PROBLEM 7: Capped Collections
// ==========================================================================================

/**
 * PROBLEM 7.1: Create and Use Capped Collection
 * 
 * Create a capped collection for storing logs (max 10MB, max 10000 docs).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.logs_capped.drop()

db.createCollection("logs_capped", {
    capped: true,
    size: 10 * 1024 * 1024,  // 10 MB
    max: 10000               // Max 10000 documents
})

// Insert logs
for (let i = 0; i < 100; i++) {
    db.logs_capped.insertOne({
        level: ["INFO", "WARN", "ERROR"][i % 3],
        message: `Log message ${i}`,
        timestamp: new Date()
    })
}

// Capped collections maintain insertion order
db.logs_capped.find().sort({ $natural: -1 }).limit(5)  // Latest 5 logs

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 7.2: Tailable Cursor on Capped Collection
 * 
 * Create a tailable cursor to continuously read new logs.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Tailable cursor - stays open and returns new documents as inserted
const tailableCursor = db.logs_capped.find().tailable()

// In a real application, you'd process in a loop:
// while (tailableCursor.hasNext()) {
//     const doc = tailableCursor.next()
//     print("New log:", doc.message)
// }


// ==========================================================================================
// PROBLEM 8: GridFS (Large File Storage)
// ==========================================================================================

/**
 * PROBLEM 8.1: Store Large File with GridFS
 * 
 * GridFS stores files larger than 16MB by splitting into chunks.
 * Use mongofiles command-line tool or the driver.
 */

// Using mongosh/driver approach:

// ✅ SOLUTION:
// In mongosh, GridFS operations are typically done via drivers or mongofiles CLI

// CLI Example (run in terminal, not mongosh):
// mongofiles -d practiceDB put myLargeFile.pdf
// mongofiles -d practiceDB get myLargeFile.pdf
// mongofiles -d practiceDB list
// mongofiles -d practiceDB delete myLargeFile.pdf

// The files are stored in:
// db.fs.files - metadata
// db.fs.chunks - file chunks (255KB each by default)

// View stored files metadata
db.fs.files.find()

// View chunks for a file
// db.fs.chunks.find({ files_id: <file_id> }).count()


// ==========================================================================================
// PROBLEM 9: Time-To-Live (TTL) Collections
// ==========================================================================================

/**
 * PROBLEM 9.1: Session Storage with TTL
 * 
 * Create a sessions collection where sessions expire after 30 minutes.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sessions.drop()

// Create TTL index
db.sessions.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 30 * 60 }  // 30 minutes
)

// Insert a session
db.sessions.insertOne({
    sessionId: "abc123",
    userId: 1,
    data: { preferences: {} },
    createdAt: new Date()  // TTL based on this field
})

// MongoDB background thread removes expired docs (runs every 60 sec)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.2: TTL with Custom Expiration
 * 
 * Create tokens that expire at a specific time (not after duration).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.tokens.drop()

// TTL index on expireAt field
db.tokens.createIndex(
    { expireAt: 1 },
    { expireAfterSeconds: 0 }  // Expire at the specified date
)

// Insert token that expires in 1 hour
db.tokens.insertOne({
    token: "xyz789",
    userId: 1,
    expireAt: new Date(Date.now() + 60 * 60 * 1000)  // 1 hour from now
})

// Insert token that expires in 24 hours
db.tokens.insertOne({
    token: "abc456",
    userId: 2,
    expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000)  // 24 hours
})


// ==========================================================================================
// PROBLEM 10: Database Administration
// ==========================================================================================

/**
 * PROBLEM 10.1: Collection Statistics
 * 
 * Get detailed statistics about a collection.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.accounts.stats()

// Key metrics:
// - count: document count
// - size: data size in bytes
// - avgObjSize: average document size
// - storageSize: allocated storage
// - totalIndexSize: total index size
// - indexSizes: size per index

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.2: Compact Collection
 * 
 * Reclaim disk space after many deletions.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Note: This blocks writes, run during maintenance window
db.runCommand({ compact: "accounts" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.3: Profiler
 * 
 * Enable the database profiler to log slow queries.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
// Set profiling level
// 0 = off
// 1 = slow queries only
// 2 = all queries

db.setProfilingLevel(1, { slowms: 100 })  // Log queries > 100ms

// Check profiler status
db.getProfilingStatus()

// View profiled queries
db.system.profile.find().sort({ ts: -1 }).limit(10)

// Disable profiler
db.setProfilingLevel(0)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.4: Server Status
 * 
 * Get comprehensive server statistics.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.serverStatus()

// Key sections:
// - connections: current connections
// - opcounters: operation counts
// - mem: memory usage
// - wiredTiger: storage engine stats
// - repl: replication status


// ==========================================================================================
// CLEANUP
// ==========================================================================================

print("✅ All Transactions & Advanced practice problems completed!")
print("")
print("NOTE: Many of these examples require a replica set.")
print("For local testing, use MongoDB Atlas free tier or deploy a local replica set.")
