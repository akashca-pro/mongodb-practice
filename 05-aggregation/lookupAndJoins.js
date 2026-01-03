/**
 * TOPIC: LOOKUP AND JOINS
 * DESCRIPTION:
 * $lookup performs left outer joins between collections. Essential
 * for working with referenced (normalized) data in MongoDB.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC $LOOKUP
// -------------------------------------------------------------------------------------------

async function basicLookup() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Orders collection references customers by customerId
        const ordersWithCustomer = await db.collection('orders').aggregate([
            { $lookup: {
                from: "customers",       // Collection to join
                localField: "customerId",   // Field in orders
                foreignField: "_id",        // Field in customers
                as: "customer"              // Output array field
            }},
            // Unwind single result
            { $unwind: "$customer" }
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. PIPELINE $LOOKUP
// -------------------------------------------------------------------------------------------

async function pipelineLookup() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        const result = await db.collection('orders').aggregate([
            { $lookup: {
                from: "products",
                let: { orderItems: "$items" },
                pipeline: [
                    { $match: { 
                        $expr: { $in: ["$_id", "$$orderItems"] }
                    }},
                    { $project: { name: 1, price: 1 } }
                ],
                as: "productDetails"
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. MULTIPLE LOOKUPS
// -------------------------------------------------------------------------------------------

async function multipleLookups() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        const fullOrders = await db.collection('orders').aggregate([
            // Join customer
            { $lookup: {
                from: "customers",
                localField: "customerId",
                foreignField: "_id",
                as: "customer"
            }},
            { $unwind: "$customer" },
            
            // Join products
            { $lookup: {
                from: "products",
                localField: "productIds",
                foreignField: "_id",
                as: "products"
            }},
            
            // Project clean output
            { $project: {
                orderNumber: 1,
                customerName: "$customer.name",
                productNames: "$products.name",
                total: 1
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. LOOKUP BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * PERFORMANCE TIPS:
 * 
 * 1. Create index on foreignField
 * 2. $match before $lookup to reduce documents
 * 3. Use pipeline lookup for complex joins
 * 4. Consider embedding for frequent joins
 * 5. Limit joined results when possible
 */

async function optimizedLookup() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Ensure index exists
        await db.collection('products').createIndex({ _id: 1 });
        
        const optimized = await db.collection('orders').aggregate([
            // Filter first
            { $match: { status: "completed" } },
            
            // Then lookup
            { $lookup: {
                from: "products",
                let: { productId: "$productId" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
                    { $project: { name: 1, category: 1 } }  // Only needed fields
                ],
                as: "product"
            }},
            
            { $unwind: "$product" },
            
            // Limit output
            { $limit: 100 }
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * $LOOKUP KEY POINTS:
 * 
 * Basic: Simple field-to-field join
 * Pipeline: Complex joins with filtering
 * 
 * BEST PRACTICES:
 * - Index the foreignField for performance
 * - Filter ($match) before $lookup
 * - Use pipeline $lookup for complex conditions
 * - Consider denormalization for frequent joins
 * - Limit results in pipeline lookups
 */

module.exports = {
    basicLookup,
    pipelineLookup,
    multipleLookups,
    optimizedLookup
};
