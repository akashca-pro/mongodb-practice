/**
 * TOPIC: INSERT OPERATIONS
 * DESCRIPTION:
 * MongoDB provides insertOne() and insertMany() methods for adding
 * documents to collections. Understanding insert behavior and options
 * is essential for data ingestion.
 */

const { MongoClient, ObjectId } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. INSERT ONE DOCUMENT
// -------------------------------------------------------------------------------------------

async function insertOneExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Basic insert
        const result = await collection.insertOne({
            name: "John Doe",
            email: "john@example.com",
            age: 30,
            createdAt: new Date()
        });
        console.log("Inserted ID:", result.insertedId);
        console.log("Acknowledged:", result.acknowledged);
        
        // Insert with custom _id
        await collection.insertOne({
            _id: "user_001",
            name: "Custom ID User"
        });
        
        // Insert with ObjectId
        await collection.insertOne({
            _id: new ObjectId(),
            name: "ObjectId User"
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. INSERT MANY DOCUMENTS
// -------------------------------------------------------------------------------------------

async function insertManyExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Basic insertMany
        const result = await collection.insertMany([
            { name: "Widget", price: 9.99, category: "electronics" },
            { name: "Gadget", price: 19.99, category: "electronics" },
            { name: "Gizmo", price: 14.99, category: "tools" }
        ]);
        
        console.log("Inserted count:", result.insertedCount);
        console.log("Inserted IDs:", result.insertedIds);
        
        // Ordered vs Unordered inserts
        // ordered: true (default) - stops on first error
        await collection.insertMany(
            [{ _id: 1, name: "A" }, { _id: 2, name: "B" }],
            { ordered: true }
        );
        
        // ordered: false - continues after errors
        try {
            await collection.insertMany(
                [
                    { _id: 1, name: "Duplicate" },  // Will fail
                    { _id: 3, name: "New" }          // Will succeed
                ],
                { ordered: false }
            );
        } catch (error) {
            console.log("Some inserts failed:", error.result.insertedCount);
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. INSERT OPTIONS
// -------------------------------------------------------------------------------------------

async function insertWithOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // With write concern
        await collection.insertOne(
            { orderId: "ORD001", amount: 100 },
            { 
                writeConcern: { 
                    w: 'majority',     // Wait for majority acknowledgment
                    wtimeout: 5000,    // Timeout in ms
                    j: true            // Wait for journal write
                }
            }
        );
        
        // Bypass document validation
        await collection.insertOne(
            { partialData: true },
            { bypassDocumentValidation: true }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. BULK INSERTS FOR PERFORMANCE
// -------------------------------------------------------------------------------------------

async function bulkInsertPerformance() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('logs');
        
        // Generate large dataset
        const documents = [];
        for (let i = 0; i < 10000; i++) {
            documents.push({
                logId: i,
                message: `Log entry ${i}`,
                level: ['info', 'warn', 'error'][i % 3],
                timestamp: new Date()
            });
        }
        
        // Batch insert (recommended for large datasets)
        const batchSize = 1000;
        let inserted = 0;
        
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const result = await collection.insertMany(batch, { ordered: false });
            inserted += result.insertedCount;
        }
        
        console.log("Total inserted:", inserted);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. ERROR HANDLING FOR INSERTS
// -------------------------------------------------------------------------------------------

async function handleInsertErrors() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Create unique index
        await collection.createIndex({ email: 1 }, { unique: true });
        
        try {
            await collection.insertOne({ email: "test@example.com" });
            await collection.insertOne({ email: "test@example.com" }); // Duplicate
        } catch (error) {
            if (error.code === 11000) {
                console.log("Duplicate key error:", error.keyValue);
            } else {
                throw error;
            }
        }
        
        // Handle validation errors
        try {
            await collection.insertOne({ invalidField: null });
        } catch (error) {
            if (error.code === 121) {
                console.log("Validation failed:", error.errInfo);
            }
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * INSERT OPERATIONS KEY POINTS:
 * 
 * 1. insertOne: Single document, returns insertedId
 * 2. insertMany: Multiple documents, returns insertedIds
 * 3. Ordered inserts: Stop on first error (default)
 * 4. Unordered inserts: Continue after errors
 * 
 * BEST PRACTICES:
 * - Use insertMany for bulk operations
 * - Set ordered: false when partial success is acceptable
 * - Use appropriate write concern for data importance
 * - Handle duplicate key errors gracefully
 * - Batch large inserts to avoid memory issues
 * - Generate _id client-side for better performance
 */

module.exports = {
    insertOneExamples,
    insertManyExamples,
    insertWithOptions,
    bulkInsertPerformance,
    handleInsertErrors
};
