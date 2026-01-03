/**
 * TOPIC: DELETE OPERATIONS
 * DESCRIPTION:
 * MongoDB provides deleteOne() and deleteMany() for removing documents.
 * Learn deletion methods, soft deletes, and best practices.
 */

const { MongoClient, ObjectId } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. DELETE ONE AND MANY
// -------------------------------------------------------------------------------------------

async function basicDeleteOperations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Delete one document
        const result = await collection.deleteOne({ email: "test@example.com" });
        console.log("Deleted count:", result.deletedCount);
        
        // Delete by _id
        await collection.deleteOne({ _id: new ObjectId("507f1f77bcf86cd799439011") });
        
        // Delete many documents
        const manyResult = await collection.deleteMany({ status: "inactive" });
        console.log("Deleted many:", manyResult.deletedCount);
        
        // Delete all documents (be careful!)
        // await collection.deleteMany({});
        
        // Delete with condition
        await collection.deleteMany({
            createdAt: { $lt: new Date('2020-01-01') }
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. FIND AND DELETE
// -------------------------------------------------------------------------------------------

async function findAndDelete() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('tasks');
        
        // Find and delete - returns deleted document
        const deletedDoc = await collection.findOneAndDelete(
            { status: "completed" },
            { sort: { completedAt: 1 } }  // Delete oldest first
        );
        
        if (deletedDoc) {
            console.log("Deleted:", deletedDoc);
        } else {
            console.log("No document found to delete");
        }
        
        // With projection
        const result = await collection.findOneAndDelete(
            { priority: "low" },
            { 
                sort: { createdAt: 1 },
                projection: { name: 1, status: 1 }
            }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. SOFT DELETE PATTERN
// -------------------------------------------------------------------------------------------

/**
 * Soft delete keeps documents but marks them as deleted.
 * Useful for audit trails and data recovery.
 */

async function softDeletePattern() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('documents');
        
        // Soft delete - mark as deleted
        await collection.updateOne(
            { _id: 1 },
            { 
                $set: { 
                    deletedAt: new Date(),
                    deletedBy: "user123",
                    isDeleted: true
                }
            }
        );
        
        // Query active documents only
        const activeDocs = await collection.find({
            isDeleted: { $ne: true }
        }).toArray();
        
        // Or using deletedAt
        const notDeleted = await collection.find({
            deletedAt: { $exists: false }
        }).toArray();
        
        // Restore soft-deleted document
        await collection.updateOne(
            { _id: 1 },
            { 
                $unset: { deletedAt: "", deletedBy: "" },
                $set: { isDeleted: false, restoredAt: new Date() }
            }
        );
        
        // Permanently delete soft-deleted docs older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        await collection.deleteMany({
            isDeleted: true,
            deletedAt: { $lt: thirtyDaysAgo }
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. TTL (TIME-TO-LIVE) AUTO-DELETE
// -------------------------------------------------------------------------------------------

async function ttlAutoDelete() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sessions');
        
        // Create TTL index - documents auto-deleted after expireAfterSeconds
        await collection.createIndex(
            { createdAt: 1 },
            { expireAfterSeconds: 3600 }  // Delete after 1 hour
        );
        
        // Insert document that will auto-expire
        await collection.insertOne({
            sessionId: "sess_123",
            userId: "user_456",
            createdAt: new Date()  // Will be deleted 1 hour after this time
        });
        
        // Alternative: expire at specific time
        await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 });
        
        await collection.insertOne({
            token: "abc123",
            expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000)  // Expires in 24 hours
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. DELETE WITH OPTIONS
// -------------------------------------------------------------------------------------------

async function deleteWithOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        await collection.deleteOne(
            { orderId: "ORD001" },
            {
                writeConcern: { w: 'majority', wtimeout: 5000 },
                hint: { orderId: 1 },  // Force index
                collation: { locale: 'en', strength: 2 }
            }
        );
        
        // Delete with explain (to analyze without deleting)
        const explanation = await collection.find(
            { status: "cancelled" }
        ).explain();
        console.log("Would delete documents using:", explanation.queryPlanner);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. DROP COLLECTION VS DELETE MANY
// -------------------------------------------------------------------------------------------

async function dropVsDeleteMany() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // deleteMany({}) - Removes all documents, keeps collection and indexes
        await db.collection('logs').deleteMany({});
        
        // drop() - Removes collection entirely (faster for large collections)
        await db.collection('tempData').drop();
        
        // When to use each:
        // - deleteMany: Keep collection structure, indexes, validation
        // - drop: Complete removal, recreate if needed (much faster)
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * DELETE OPERATIONS KEY POINTS:
 * 
 * 1. deleteOne: Remove first matching document
 * 2. deleteMany: Remove all matching documents
 * 3. findOneAndDelete: Atomic find and delete, returns document
 * 4. Soft delete: Mark as deleted instead of removing
 * 5. TTL indexes: Automatic document expiration
 * 
 * BEST PRACTICES:
 * - Prefer soft deletes for important data
 * - Use TTL indexes for temporary data (sessions, logs)
 * - Always filter before deleting (avoid empty filter)
 * - Use findOneAndDelete for queue-like patterns
 * - Consider archive before delete for audit trails
 * - Use drop() instead of deleteMany({}) for speed
 */

module.exports = {
    basicDeleteOperations,
    findAndDelete,
    softDeletePattern,
    ttlAutoDelete,
    deleteWithOptions,
    dropVsDeleteMany
};
