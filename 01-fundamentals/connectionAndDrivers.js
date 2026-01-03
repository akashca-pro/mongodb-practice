/**
 * TOPIC: CONNECTION AND DRIVERS
 * DESCRIPTION:
 * Learn how to connect to MongoDB from Node.js applications using
 * the official MongoDB driver, including connection options,
 * connection pooling, and best practices.
 */

// -------------------------------------------------------------------------------------------
// 1. INSTALLING THE DRIVER
// -------------------------------------------------------------------------------------------

/**
 * npm install mongodb
 * 
 * The official MongoDB Node.js driver provides:
 * - Full CRUD operations
 * - Aggregation framework support
 * - Connection pooling
 * - Transactions support
 * - Change streams
 */

const { MongoClient, ServerApiVersion } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 2. CONNECTION STRING FORMATS
// -------------------------------------------------------------------------------------------

/**
 * STANDARD FORMAT:
 * mongodb://[username:password@]host[:port][/database][?options]
 * 
 * SRV FORMAT (for Atlas):
 * mongodb+srv://[username:password@]host[/database][?options]
 */

const connectionStrings = {
    local: 'mongodb://localhost:27017',
    localWithDb: 'mongodb://localhost:27017/mydb',
    withAuth: 'mongodb://user:password@localhost:27017/mydb',
    replicaSet: 'mongodb://host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0',
    atlas: 'mongodb+srv://user:password@cluster.mongodb.net/mydb'
};

console.log("Connection String Examples:", connectionStrings);

// -------------------------------------------------------------------------------------------
// 3. BASIC CONNECTION
// -------------------------------------------------------------------------------------------

async function basicConnection() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        console.log('Connected successfully');
        
        const db = client.db('mydb');
        const collection = db.collection('users');
        
        // Perform operations
        const result = await collection.findOne({});
        console.log('Found:', result);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. CONNECTION OPTIONS
// -------------------------------------------------------------------------------------------

async function connectionWithOptions() {
    const uri = 'mongodb://localhost:27017';
    
    const client = new MongoClient(uri, {
        // Connection pool settings
        maxPoolSize: 50,           // Max connections in pool
        minPoolSize: 5,            // Min connections maintained
        maxIdleTimeMS: 30000,      // Close idle connections after 30s
        
        // Timeouts
        connectTimeoutMS: 10000,   // Connection timeout
        socketTimeoutMS: 45000,    // Socket timeout
        serverSelectionTimeoutMS: 5000,  // Server selection timeout
        
        // Write concern
        w: 'majority',             // Write to majority of nodes
        wtimeoutMS: 5000,          // Write concern timeout
        
        // Read preference
        readPreference: 'primaryPreferred',
        
        // Retry settings
        retryWrites: true,
        retryReads: true,
        
        // Compression
        compressors: ['snappy', 'zlib'],
        
        // TLS/SSL
        // tls: true,
        // tlsCAFile: '/path/to/ca.pem',
        
        // For MongoDB Atlas with Stable API
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true
        }
    });
    
    try {
        await client.connect();
        console.log('Connected with options');
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. CONNECTION POOLING PATTERN
// -------------------------------------------------------------------------------------------

// Singleton pattern for connection reuse
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 2
    });
    
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'mydb');
    
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
}

// Usage in Express.js
async function expressMiddleware(req, res, next) {
    try {
        const { db } = await connectToDatabase();
        req.db = db;
        next();
    } catch (error) {
        next(error);
    }
}

// -------------------------------------------------------------------------------------------
// 6. ERROR HANDLING
// -------------------------------------------------------------------------------------------

async function handleConnectionErrors() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        
        // Listen for connection events
        client.on('connectionPoolCreated', (event) => {
            console.log('Pool created:', event.address);
        });
        
        client.on('connectionPoolClosed', (event) => {
            console.log('Pool closed:', event.address);
        });
        
        client.on('error', (error) => {
            console.error('Client error:', error);
        });
        
    } catch (error) {
        if (error.name === 'MongoServerSelectionError') {
            console.error('Cannot connect to MongoDB server');
        } else if (error.name === 'MongoNetworkError') {
            console.error('Network error:', error.message);
        } else {
            console.error('Connection error:', error);
        }
        throw error;
    }
}

// Retry connection with exponential backoff
async function connectWithRetry(maxRetries = 5) {
    const uri = 'mongodb://localhost:27017';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const client = new MongoClient(uri);
            await client.connect();
            console.log('Connected on attempt', attempt);
            return client;
        } catch (error) {
            console.log(`Attempt ${attempt} failed:`, error.message);
            if (attempt === maxRetries) throw error;
            
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// -------------------------------------------------------------------------------------------
// 7. GRACEFUL SHUTDOWN
// -------------------------------------------------------------------------------------------

async function setupGracefulShutdown(client) {
    const shutdown = async (signal) => {
        console.log(`${signal} received, closing MongoDB connection...`);
        try {
            await client.close();
            console.log('MongoDB connection closed');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', async (error) => {
        console.error('Uncaught exception:', error);
        await client.close();
        process.exit(1);
    });
}

// -------------------------------------------------------------------------------------------
// 8. CONNECTION HEALTH CHECK
// -------------------------------------------------------------------------------------------

async function healthCheck(client) {
    try {
        const admin = client.db().admin();
        const result = await admin.ping();
        return { status: 'healthy', result };
    } catch (error) {
        return { status: 'unhealthy', error: error.message };
    }
}

// Express health endpoint
async function healthEndpoint(req, res) {
    const { client } = await connectToDatabase();
    const health = await healthCheck(client);
    
    if (health.status === 'healthy') {
        res.status(200).json(health);
    } else {
        res.status(503).json(health);
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * CONNECTION KEY POINTS:
 * 
 * 1. Connection Pooling: Reuse connections, don't create per request
 * 2. Error Handling: Implement retry logic with backoff
 * 3. Graceful Shutdown: Close connections on process termination
 * 4. Health Checks: Monitor connection health in production
 * 
 * BEST PRACTICES:
 * - Use connection string from environment variables
 * - Set appropriate pool size (default 100 is often too high)
 * - Implement graceful shutdown handling
 * - Use Stable API for forward compatibility
 * - Enable retryWrites and retryReads
 * - Monitor connection pool metrics
 * - Use SRV records for Atlas clusters
 */

module.exports = {
    basicConnection,
    connectionWithOptions,
    connectToDatabase,
    connectWithRetry,
    healthCheck
};
