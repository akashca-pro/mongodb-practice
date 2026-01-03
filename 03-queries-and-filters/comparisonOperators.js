/**
 * TOPIC: COMPARISON OPERATORS
 * DESCRIPTION:
 * MongoDB comparison operators filter documents by comparing field
 * values. These are fundamental to all MongoDB queries.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. EQUALITY OPERATORS
// -------------------------------------------------------------------------------------------

async function equalityOperators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $eq - Equal (implicit)
        await collection.find({ price: 9.99 }).toArray();
        await collection.find({ price: { $eq: 9.99 } }).toArray();  // Explicit
        
        // $ne - Not equal
        await collection.find({ status: { $ne: "discontinued" } }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. RANGE OPERATORS
// -------------------------------------------------------------------------------------------

async function rangeOperators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $gt - Greater than
        const expensive = await collection.find({
            price: { $gt: 100 }
        }).toArray();
        
        // $gte - Greater than or equal
        const minPrice = await collection.find({
            price: { $gte: 50 }
        }).toArray();
        
        // $lt - Less than
        const cheap = await collection.find({
            price: { $lt: 20 }
        }).toArray();
        
        // $lte - Less than or equal
        const maxPrice = await collection.find({
            price: { $lte: 100 }
        }).toArray();
        
        // Range combination
        const priceRange = await collection.find({
            price: { $gte: 10, $lte: 50 }
        }).toArray();
        
        // Date range
        const recentOrders = await collection.find({
            createdAt: {
                $gte: new Date('2024-01-01'),
                $lt: new Date('2024-12-31')
            }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. SET OPERATORS
// -------------------------------------------------------------------------------------------

async function setOperators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $in - Match any value in array
        const categories = await collection.find({
            category: { $in: ["electronics", "computers", "phones"] }
        }).toArray();
        
        // $in with ObjectIds
        const specificUsers = await collection.find({
            _id: { $in: [1, 2, 3, 4, 5] }
        }).toArray();
        
        // $nin - Not in array
        const excluded = await collection.find({
            status: { $nin: ["discontinued", "recalled"] }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. COMPARISON WITH DIFFERENT TYPES
// -------------------------------------------------------------------------------------------

/**
 * BSON Type Comparison Order:
 * 1. MinKey
 * 2. Null
 * 3. Numbers (int, long, double, decimal)
 * 4. Symbol, String
 * 5. Object
 * 6. Array
 * 7. BinData
 * 8. ObjectId
 * 9. Boolean
 * 10. Date
 * 11. Timestamp
 * 12. Regular Expression
 * 13. MaxKey
 */

async function typeComparisons() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('mixed');
        
        // Comparing with null
        await collection.find({
            field: { $gt: null }  // Returns non-null values
        }).toArray();
        
        // String comparison (lexicographic)
        await collection.find({
            name: { $gt: "M" }  // Names starting with M-Z
        }).toArray();
        
        // Date comparisons
        await collection.find({
            timestamp: { $gte: new Date('2024-01-01') }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. PRACTICAL EXAMPLES
// -------------------------------------------------------------------------------------------

async function practicalExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // E-commerce: Find products in stock within price range
        const products = await db.collection('products').find({
            price: { $gte: 10, $lte: 100 },
            quantity: { $gt: 0 },
            category: { $in: ["electronics", "accessories"] }
        }).toArray();
        
        // Users: Find active users not in specific group
        const users = await db.collection('users').find({
            status: "active",
            role: { $ne: "admin" },
            age: { $gte: 18 }
        }).toArray();
        
        // Orders: Find recent orders above minimum value
        const orders = await db.collection('orders').find({
            orderDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            total: { $gte: 50 },
            status: { $nin: ["cancelled", "refunded"] }
        }).toArray();
        
        // Analytics: Find sessions within time window
        const sessions = await db.collection('sessions').find({
            startTime: { $gte: new Date('2024-01-01T00:00:00Z') },
            endTime: { $lt: new Date('2024-01-02T00:00:00Z') },
            duration: { $gt: 60 }  // More than 60 seconds
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * COMPARISON OPERATORS:
 * 
 * $eq  - Equal to value
 * $ne  - Not equal to value
 * $gt  - Greater than value
 * $gte - Greater than or equal
 * $lt  - Less than value
 * $lte - Less than or equal
 * $in  - Matches any value in array
 * $nin - Matches none of values in array
 * 
 * BEST PRACTICES:
 * - Create indexes for fields used in comparisons
 * - Use range queries with indexed fields
 * - Prefer $in over multiple $or conditions
 * - Be aware of BSON type comparison order
 * - Use proper Date objects, not strings
 * - Combine operators for complex filtering
 */

module.exports = {
    equalityOperators,
    rangeOperators,
    setOperators,
    typeComparisons,
    practicalExamples
};
