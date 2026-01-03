/**
 * TOPIC: MONGODB TRANSACTIONS
 * DESCRIPTION:
 * MongoDB supports multi-document ACID transactions for operations that
 * require atomicity across multiple documents or collections.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. TRANSACTION BASICS
// -------------------------------------------------------------------------------------------

async function basicTransaction() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const session = client.startSession();
        
        try {
            session.startTransaction();
            
            const orders = client.db('shop').collection('orders');
            const inventory = client.db('shop').collection('inventory');
            
            // All operations use the session
            await orders.insertOne(
                { item: "widget", qty: 1, customerId: "cust_001" },
                { session }
            );
            
            await inventory.updateOne(
                { item: "widget" },
                { $inc: { qty: -1 } },
                { session }
            );
            
            await session.commitTransaction();
            console.log("Transaction committed");
            
        } catch (error) {
            await session.abortTransaction();
            console.error("Transaction aborted:", error);
            throw error;
        } finally {
            session.endSession();
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. TRANSACTION WITH RETRY
// -------------------------------------------------------------------------------------------

async function runTransactionWithRetry(txnFunc, client) {
    const session = client.startSession();
    
    try {
        await session.withTransaction(async () => {
            await txnFunc(session);
        }, {
            readPreference: 'primary',
            readConcern: { level: 'local' },
            writeConcern: { w: 'majority' }
        });
        // withTransaction handles retries automatically
    } finally {
        session.endSession();
    }
}

async function transferFunds(session) {
    const accounts = session.client.db('bank').collection('accounts');
    
    await accounts.updateOne(
        { _id: "account_A" },
        { $inc: { balance: -100 } },
        { session }
    );
    
    await accounts.updateOne(
        { _id: "account_B" },
        { $inc: { balance: 100 } },
        { session }
    );
}

// -------------------------------------------------------------------------------------------
// 3. TRANSACTION OPTIONS
// -------------------------------------------------------------------------------------------

async function transactionWithOptions() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const session = client.startSession();
        
        session.startTransaction({
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority', wtimeout: 5000 },
            readPreference: 'primary',
            maxCommitTimeMS: 30000
        });
        
        // Operations...
        
        await session.commitTransaction();
        session.endSession();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. WHEN TO USE TRANSACTIONS
// -------------------------------------------------------------------------------------------

/**
 * USE TRANSACTIONS FOR:
 * - Financial operations (transfers, payments)
 * - Inventory management (order + stock update)
 * - Multi-document updates that must be atomic
 * 
 * AVOID TRANSACTIONS WHEN:
 * - Single document operations (already atomic)
 * - Read-only operations
 * - Can be handled with schema design (embedding)
 * 
 * LIMITATIONS:
 * - Requires replica set or sharded cluster
 * - 16MB size limit for transaction documents
 * - 60 second default lifetime
 * - Performance overhead
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * TRANSACTION KEY POINTS:
 * 
 * 1. Require replica set or sharded cluster
 * 2. Use session.withTransaction() for auto-retry
 * 3. Keep transactions short (under 60 seconds)
 * 4. Design schema to minimize transaction needs
 * 
 * BEST PRACTICES:
 * - Use transactions only when necessary
 * - Keep operations within transaction minimal
 * - Handle TransientTransactionError with retry
 * - Set appropriate timeouts
 */

module.exports = {
    basicTransaction,
    runTransactionWithRetry,
    transferFunds,
    transactionWithOptions
};
