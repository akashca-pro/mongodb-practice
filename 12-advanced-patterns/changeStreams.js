/**
 * TOPIC: CHANGE STREAMS
 * DESCRIPTION:
 * Change streams allow applications to access real-time data changes
 * without polling. Requires replica set or sharded cluster.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC CHANGE STREAM
// -------------------------------------------------------------------------------------------

async function watchCollection() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Watch for all changes
        const changeStream = collection.watch();
        
        changeStream.on('change', (change) => {
            console.log('Change detected:', change.operationType);
            console.log('Document:', change.fullDocument);
        });
        
        // Keep watching until closed
        // changeStream.close();
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// -------------------------------------------------------------------------------------------
// 2. FILTERED CHANGE STREAM
// -------------------------------------------------------------------------------------------

async function filteredChangeStream() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Filter for specific operations
        const pipeline = [
            { $match: {
                'operationType': { $in: ['insert', 'update'] },
                'fullDocument.status': 'completed'
            }}
        ];
        
        const changeStream = collection.watch(pipeline, {
            fullDocument: 'updateLookup'  // Include full doc for updates
        });
        
        for await (const change of changeStream) {
            console.log('Completed order:', change.fullDocument);
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// -------------------------------------------------------------------------------------------
// 3. RESUME TOKENS
// -------------------------------------------------------------------------------------------

async function resumableChangeStream() {
    const client = new MongoClient('mongodb://localhost:27017/?replicaSet=rs0');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('data');
        
        let resumeToken = null;
        
        const changeStream = collection.watch();
        
        changeStream.on('change', (change) => {
            console.log('Change:', change);
            // Store resume token for recovery
            resumeToken = change._id;
        });
        
        changeStream.on('error', async (error) => {
            console.error('Stream error:', error);
            // Resume from stored token
            if (resumeToken) {
                const resumed = collection.watch([], {
                    resumeAfter: resumeToken
                });
                // Handle resumed stream...
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// -------------------------------------------------------------------------------------------
// 4. USE CASES
// -------------------------------------------------------------------------------------------

/**
 * CHANGE STREAM USE CASES:
 * 
 * - Real-time notifications
 * - Cache invalidation
 * - Event-driven architecture
 * - Data synchronization
 * - Audit logging
 * - Analytics pipelines
 * 
 * CHANGE TYPES:
 * - insert, update, replace
 * - delete
 * - drop, rename, dropDatabase
 * - invalidate
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * CHANGE STREAMS:
 * 
 * 1. Require replica set or sharded cluster
 * 2. Use resume tokens for fault tolerance
 * 3. Filter early with aggregation pipeline
 * 4. Use fullDocument: 'updateLookup' for updates
 * 
 * BEST PRACTICES:
 * - Store resume tokens persistently
 * - Handle errors and reconnect
 * - Filter server-side, not client-side
 * - Consider memory for high-volume streams
 */

module.exports = {
    watchCollection,
    filteredChangeStream,
    resumableChangeStream
};
