/**
 * TOPIC: CONNECTION POOLING
 * DESCRIPTION:
 * Connection pooling optimizes database connections by reusing
 * established connections instead of creating new ones.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. POOL CONFIGURATION
// -------------------------------------------------------------------------------------------

async function poolConfiguration() {
    const client = new MongoClient('mongodb://localhost:27017', {
        // Pool size
        maxPoolSize: 100,           // Maximum connections (default: 100)
        minPoolSize: 10,            // Minimum connections to maintain
        
        // Connection lifecycle
        maxIdleTimeMS: 30000,       // Max time connection can be idle
        waitQueueTimeoutMS: 10000,  // Timeout waiting for connection
        
        // Connection timeouts
        connectTimeoutMS: 10000,    // Initial connection timeout
        socketTimeoutMS: 360000,    // Socket timeout for operations
        
        // Server selection
        serverSelectionTimeoutMS: 30000
    });
    
    try {
        await client.connect();
        console.log('Connected with pool');
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. SINGLETON PATTERN (RECOMMENDED)
// -------------------------------------------------------------------------------------------

class Database {
    static instance = null;
    static client = null;
    
    static async getInstance() {
        if (!Database.instance) {
            Database.client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
                maxPoolSize: 50,
                minPoolSize: 5
            });
            
            await Database.client.connect();
            Database.instance = Database.client.db('myapp');
        }
        return Database.instance;
    }
    
    static async close() {
        if (Database.client) {
            await Database.client.close();
            Database.instance = null;
            Database.client = null;
        }
    }
}

// Usage throughout application
async function exampleUsage() {
    const db = await Database.getInstance();
    const users = await db.collection('users').find().toArray();
    return users;
}

// -------------------------------------------------------------------------------------------
// 3. MONITORING POOL
// -------------------------------------------------------------------------------------------

function monitorPool() {
    const client = new MongoClient('mongodb://localhost:27017', {
        maxPoolSize: 10,
        monitorCommands: true
    });
    
    // Connection pool events
    client.on('connectionPoolCreated', (event) => {
        console.log('Pool created:', event.address);
    });
    
    client.on('connectionPoolReady', (event) => {
        console.log('Pool ready:', event.address);
    });
    
    client.on('connectionCreated', (event) => {
        console.log('Connection created:', event.connectionId);
    });
    
    client.on('connectionReady', (event) => {
        console.log('Connection ready:', event.connectionId);
    });
    
    client.on('connectionClosed', (event) => {
        console.log('Connection closed:', event.connectionId, 'reason:', event.reason);
    });
    
    client.on('connectionCheckOutStarted', (event) => {
        console.log('Checkout started');
    });
    
    client.on('connectionCheckedOut', (event) => {
        console.log('Connection checked out:', event.connectionId);
    });
    
    client.on('connectionCheckedIn', (event) => {
        console.log('Connection checked in:', event.connectionId);
    });
    
    return client;
}

// -------------------------------------------------------------------------------------------
// 4. POOL SIZING GUIDELINES
// -------------------------------------------------------------------------------------------

/**
 * POOL SIZE CALCULATION:
 * 
 * maxPoolSize = (max concurrent operations) + buffer
 * 
 * FACTORS:
 * - Application concurrency level
 * - Average operation duration
 * - Server connection limits
 * - Available memory
 * 
 * DEFAULTS:
 * - maxPoolSize: 100 (usually sufficient)
 * - minPoolSize: 0 (creates on demand)
 * 
 * RECOMMENDATIONS:
 * - Web server: 50-100 per replica set member
 * - Worker process: 10-25
 * - Lambda/Serverless: 1-10 (connection reuse critical)
 */

// -------------------------------------------------------------------------------------------
// 5. GRACEFUL SHUTDOWN
// -------------------------------------------------------------------------------------------

async function gracefulShutdown() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    await client.connect();
    
    // Handle process termination
    process.on('SIGINT', async () => {
        console.log('Closing MongoDB connection...');
        await client.close();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('Closing MongoDB connection...');
        await client.close();
        process.exit(0);
    });
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * CONNECTION POOLING:
 * 
 * 1. Use singleton pattern - one client per application
 * 2. Configure pool size based on workload
 * 3. Monitor pool events in production
 * 4. Implement graceful shutdown
 * 
 * BEST PRACTICES:
 * - Don't create new clients per request
 * - Set appropriate timeouts
 * - Monitor connection metrics
 * - Size pool based on actual usage
 */

module.exports = {
    poolConfiguration,
    Database,
    monitorPool,
    gracefulShutdown
};
