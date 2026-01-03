/**
 * TOPIC: DISTRIBUTED TRANSACTIONS
 * DESCRIPTION:
 * Advanced transaction patterns for distributed MongoDB deployments
 * including session management and cross-shard transactions.
 */

const { MongoClient, ClientSession } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. SESSION MANAGEMENT
// -------------------------------------------------------------------------------------------

async function sessionManagement() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        
        // Create session
        const session = client.startSession({
            causalConsistency: true,
            defaultTransactionOptions: {
                readPreference: 'primary',
                readConcern: { level: 'majority' },
                writeConcern: { w: 'majority' }
            }
        });
        
        try {
            // Use session for operations
            const db = client.db('testdb');
            
            // Read with session
            await db.collection('users')
                .find({}, { session })
                .toArray();
                
            // Write with session
            await db.collection('logs')
                .insertOne({ action: 'read' }, { session });
                
        } finally {
            session.endSession();
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. CAUSAL CONSISTENCY
// -------------------------------------------------------------------------------------------

async function causalConsistency() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        
        // Session with causal consistency
        const session = client.startSession({ causalConsistency: true });
        
        const users = client.db('testdb').collection('users');
        
        // Write operation
        await users.updateOne(
            { _id: 'user1' },
            { $set: { lastLogin: new Date() } },
            { session }
        );
        
        // Guaranteed to see the write above (even on secondary)
        const user = await users.findOne(
            { _id: 'user1' },
            { session, readPreference: 'secondaryPreferred' }
        );
        
        session.endSession();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. TRANSACTION WITH CALLBACK API
// -------------------------------------------------------------------------------------------

async function transactionCallback() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const session = client.startSession();
        
        // Callback API handles retries automatically
        await session.withTransaction(async () => {
            const orders = client.db('shop').collection('orders');
            const inventory = client.db('shop').collection('inventory');
            
            const order = { item: 'widget', qty: 5 };
            
            // Check inventory
            const stock = await inventory.findOne(
                { item: order.item },
                { session }
            );
            
            if (!stock || stock.qty < order.qty) {
                throw new Error('Insufficient inventory');
            }
            
            // Create order
            await orders.insertOne(order, { session });
            
            // Update inventory
            await inventory.updateOne(
                { item: order.item },
                { $inc: { qty: -order.qty } },
                { session }
            );
            
        }, {
            readPreference: 'primary',
            readConcern: { level: 'snapshot' },
            writeConcern: { w: 'majority' },
            maxCommitTimeMS: 30000
        });
        
        session.endSession();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. CROSS-COLLECTION AND CROSS-DATABASE TRANSACTIONS
// -------------------------------------------------------------------------------------------

async function crossDatabaseTransaction() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const session = client.startSession();
        
        await session.withTransaction(async () => {
            // Operations across databases
            const db1 = client.db('payments');
            const db2 = client.db('orders');
            
            await db1.collection('transactions').insertOne(
                { type: 'payment', amount: 100 },
                { session }
            );
            
            await db2.collection('orders').updateOne(
                { _id: 'order1' },
                { $set: { paid: true } },
                { session }
            );
        });
        
        session.endSession();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. ERROR HANDLING
// -------------------------------------------------------------------------------------------

async function handleTransactionErrors() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const session = client.startSession();
        
        try {
            session.startTransaction();
            
            // Operations...
            
            await session.commitTransaction();
            
        } catch (error) {
            // TransientTransactionError - safe to retry
            if (error.hasErrorLabel('TransientTransactionError')) {
                console.log('Transient error, retrying...');
                // Retry logic
            }
            
            // UnknownTransactionCommitResult - may or may not committed
            if (error.hasErrorLabel('UnknownTransactionCommitResult')) {
                console.log('Unknown commit result, check and retry...');
                // Retry commit or check operation results
            }
            
            await session.abortTransaction();
            throw error;
            
        } finally {
            session.endSession();
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * DISTRIBUTED TRANSACTIONS:
 * 
 * 1. Use session.withTransaction() for automatic retry
 * 2. Enable causal consistency for read-your-writes
 * 3. Work across collections and databases
 * 4. Handle error labels for proper retry logic
 * 
 * BEST PRACTICES:
 * - Keep transactions short (< 60 seconds)
 * - Use appropriate read/write concerns
 * - Handle transient errors with retry
 * - Design to minimize transaction needs
 */

module.exports = {
    sessionManagement,
    causalConsistency,
    transactionCallback,
    crossDatabaseTransaction,
    handleTransactionErrors
};
