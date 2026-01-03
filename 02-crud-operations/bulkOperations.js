/**
 * TOPIC: BULK OPERATIONS
 * DESCRIPTION:
 * Bulk operations allow executing multiple write operations in a single
 * database call, improving performance significantly for batch operations.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BULK WRITE BASICS
// -------------------------------------------------------------------------------------------

async function bulkWriteBasics() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        const result = await collection.bulkWrite([
            // Insert operations
            { insertOne: { document: { name: "Widget", price: 9.99 } } },
            { insertOne: { document: { name: "Gadget", price: 19.99 } } },
            
            // Update operations
            { updateOne: {
                filter: { name: "Widget" },
                update: { $set: { inStock: true } }
            }},
            { updateMany: {
                filter: { price: { $lt: 10 } },
                update: { $set: { category: "budget" } }
            }},
            
            // Replace operation
            { replaceOne: {
                filter: { name: "OldProduct" },
                replacement: { name: "NewProduct", price: 29.99 }
            }},
            
            // Delete operations
            { deleteOne: { filter: { status: "discontinued" } } },
            { deleteMany: { filter: { quantity: 0 } } }
        ]);
        
        console.log("Bulk Write Results:", {
            insertedCount: result.insertedCount,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            deletedCount: result.deletedCount,
            upsertedCount: result.upsertedCount
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. ORDERED VS UNORDERED
// -------------------------------------------------------------------------------------------

async function orderedVsUnordered() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('items');
        
        // Ordered (default) - stops on first error
        try {
            await collection.bulkWrite([
                { insertOne: { document: { _id: 1, name: "A" } } },
                { insertOne: { document: { _id: 1, name: "Duplicate" } } }, // Error
                { insertOne: { document: { _id: 2, name: "B" } } }  // Won't execute
            ], { ordered: true });
        } catch (error) {
            console.log("Ordered - stopped at error");
        }
        
        // Unordered - continues after errors
        try {
            const result = await collection.bulkWrite([
                { insertOne: { document: { _id: 3, name: "C" } } },
                { insertOne: { document: { _id: 3, name: "Duplicate" } } }, // Error
                { insertOne: { document: { _id: 4, name: "D" } } }  // Will execute!
            ], { ordered: false });
            
            console.log("Unordered - successful ops:", result.insertedCount);
        } catch (error) {
            console.log("Some failed, but others succeeded");
            console.log("Write errors:", error.writeErrors);
        }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. BULK WRITE OPTIONS
// -------------------------------------------------------------------------------------------

async function bulkWriteOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        await collection.bulkWrite(
            [
                { insertOne: { document: { orderId: "ORD001" } } },
                { updateOne: { 
                    filter: { orderId: "ORD002" },
                    update: { $set: { status: "shipped" } },
                    upsert: true
                }}
            ],
            {
                ordered: false,
                bypassDocumentValidation: false,
                writeConcern: { w: 'majority', wtimeout: 5000 }
            }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. BULK UPSERTS
// -------------------------------------------------------------------------------------------

async function bulkUpserts() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('inventory');
        
        const items = [
            { sku: "SKU001", name: "Widget", quantity: 100 },
            { sku: "SKU002", name: "Gadget", quantity: 50 },
            { sku: "SKU003", name: "Gizmo", quantity: 75 }
        ];
        
        // Upsert all items
        const operations = items.map(item => ({
            updateOne: {
                filter: { sku: item.sku },
                update: { $set: item },
                upsert: true
            }
        }));
        
        const result = await collection.bulkWrite(operations);
        
        console.log("Matched:", result.matchedCount);
        console.log("Upserted:", result.upsertedCount);
        console.log("Upserted IDs:", result.upsertedIds);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. PERFORMANCE COMPARISON
// -------------------------------------------------------------------------------------------

async function performanceComparison() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('benchmark');
        await collection.deleteMany({});
        
        const documents = Array.from({ length: 1000 }, (_, i) => ({
            index: i,
            data: `Document ${i}`,
            timestamp: new Date()
        }));
        
        // Method 1: Individual inserts (slow)
        console.time('Individual inserts');
        for (const doc of documents.slice(0, 100)) {
            await collection.insertOne(doc);
        }
        console.timeEnd('Individual inserts');
        
        // Method 2: insertMany (faster)
        console.time('insertMany');
        await collection.insertMany(documents.slice(100, 200));
        console.timeEnd('insertMany');
        
        // Method 3: bulkWrite (most flexible)
        console.time('bulkWrite');
        await collection.bulkWrite(
            documents.slice(200, 300).map(doc => ({ insertOne: { document: doc } }))
        );
        console.timeEnd('bulkWrite');
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. BATCHING LARGE OPERATIONS
// -------------------------------------------------------------------------------------------

async function batchingLargeOperations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('bigdata');
        
        const operations = Array.from({ length: 100000 }, (_, i) => ({
            insertOne: { document: { index: i } }
        }));
        
        const BATCH_SIZE = 1000;
        let totalInserted = 0;
        
        for (let i = 0; i < operations.length; i += BATCH_SIZE) {
            const batch = operations.slice(i, i + BATCH_SIZE);
            const result = await collection.bulkWrite(batch, { ordered: false });
            totalInserted += result.insertedCount;
            console.log(`Batch ${i / BATCH_SIZE + 1}: Inserted ${result.insertedCount}`);
        }
        
        console.log("Total inserted:", totalInserted);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * BULK OPERATIONS KEY POINTS:
 * 
 * 1. bulkWrite: Execute multiple operations in one call
 * 2. Ordered: Sequential execution, stops on error
 * 3. Unordered: Parallel execution, continues on error
 * 4. Supports: insert, update, replace, delete
 * 5. Much faster than individual operations
 * 
 * BEST PRACTICES:
 * - Use unordered for better performance when order doesn't matter
 * - Batch large operations (1000-5000 per batch)
 * - Handle errors appropriately for unordered operations
 * - Use upsert in bulk for sync operations
 * - Monitor memory when building large operation arrays
 * - Prefer insertMany for insert-only bulk operations
 */

module.exports = {
    bulkWriteBasics,
    orderedVsUnordered,
    bulkWriteOptions,
    bulkUpserts,
    performanceComparison,
    batchingLargeOperations
};
