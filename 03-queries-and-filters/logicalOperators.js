/**
 * TOPIC: LOGICAL OPERATORS
 * DESCRIPTION:
 * MongoDB logical operators combine multiple conditions in queries.
 * Master $and, $or, $not, and $nor for complex filtering.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. $AND OPERATOR
// -------------------------------------------------------------------------------------------

async function andOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Implicit AND (multiple conditions on same query)
        const implicit = await collection.find({
            category: "electronics",
            price: { $lt: 100 },
            inStock: true
        }).toArray();
        
        // Explicit $and
        const explicit = await collection.find({
            $and: [
                { category: "electronics" },
                { price: { $lt: 100 } },
                { inStock: true }
            ]
        }).toArray();
        
        // $and required when same field appears multiple times
        const sameField = await collection.find({
            $and: [
                { price: { $gt: 10 } },
                { price: { $lt: 100 } }
            ]
        }).toArray();
        // Equivalent to: { price: { $gt: 10, $lt: 100 } }
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. $OR OPERATOR
// -------------------------------------------------------------------------------------------

async function orOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $or - Match any condition
        const result = await collection.find({
            $or: [
                { category: "electronics" },
                { category: "computers" },
                { price: { $lt: 10 } }
            ]
        }).toArray();
        
        // Combining $or with other conditions
        const combined = await collection.find({
            inStock: true,  // AND this
            $or: [          // AND (any of these)
                { category: "electronics" },
                { featured: true }
            ]
        }).toArray();
        
        // Multiple $or conditions
        const multipleOr = await collection.find({
            $and: [
                { $or: [{ type: "A" }, { type: "B" }] },
                { $or: [{ status: "active" }, { priority: "high" }] }
            ]
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. $NOT OPERATOR
// -------------------------------------------------------------------------------------------

async function notOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $not - Negate a condition
        const notExpensive = await collection.find({
            price: { $not: { $gt: 100 } }
        }).toArray();
        // Includes: price <= 100 OR price doesn't exist
        
        // $not with regex
        const notStartsWithA = await collection.find({
            name: { $not: /^A/ }
        }).toArray();
        
        // $ne vs $not
        // $ne: field !== value (field must exist)
        // $not: negates operator (includes non-existent)
        
        const neExample = await collection.find({
            status: { $ne: "active" }  // "pending", "inactive", etc, NOT where status doesn't exist
        }).toArray();
        
        const notExample = await collection.find({
            status: { $not: { $eq: "active" } }  // Includes docs without status field
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. $NOR OPERATOR
// -------------------------------------------------------------------------------------------

async function norOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $nor - Match if NONE of the conditions are true
        const result = await collection.find({
            $nor: [
                { category: "discontinued" },
                { price: { $gt: 1000 } },
                { inStock: false }
            ]
        }).toArray();
        // Returns: NOT discontinued AND NOT expensive AND in stock
        
        // Equivalent using $and and $not
        const equivalent = await collection.find({
            $and: [
                { category: { $ne: "discontinued" } },
                { price: { $not: { $gt: 1000 } } },
                { inStock: { $ne: false } }
            ]
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. COMPLEX COMBINATIONS
// -------------------------------------------------------------------------------------------

async function complexCombinations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Complex query: Active high-value orders from priority customers
        const complexQuery = await collection.find({
            $and: [
                // Order is not cancelled or refunded
                { status: { $nin: ["cancelled", "refunded"] } },
                
                // Either high value OR from VIP customer
                { $or: [
                    { total: { $gte: 1000 } },
                    { customerType: "VIP" }
                ]},
                
                // Not flagged for review
                { $nor: [
                    { flagged: true },
                    { disputed: true }
                ]},
                
                // Recent order
                { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
            ]
        }).toArray();
        
        // Nested logical operators
        const nested = await collection.find({
            $or: [
                {
                    $and: [
                        { type: "premium" },
                        { total: { $gte: 500 } }
                    ]
                },
                {
                    $and: [
                        { type: "standard" },
                        { total: { $gte: 1000 } }
                    ]
                }
            ]
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. PERFORMANCE CONSIDERATIONS
// -------------------------------------------------------------------------------------------

/**
 * INDEX USAGE WITH LOGICAL OPERATORS:
 * 
 * $and: All conditions can use indexes independently
 * $or:  Each clause can use different indexes (index merge)
 * $not: May not use indexes efficiently
 * $nor: Generally cannot use indexes well
 * 
 * OPTIMIZATION TIPS:
 * - Put most selective conditions first
 * - Ensure $or clauses have supporting indexes
 * - Consider restructuring $not queries
 * - Use explain() to verify index usage
 */

async function performanceExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Good: $or with indexed fields
        await collection.createIndex({ category: 1 });
        await collection.createIndex({ brand: 1 });
        
        const goodQuery = await collection.find({
            $or: [
                { category: "electronics" },  // Uses category index
                { brand: "Apple" }            // Uses brand index
            ]
        }).explain("executionStats");
        
        // Check if indexes were used
        console.log("Query plan:", goodQuery.queryPlanner.winningPlan);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * LOGICAL OPERATORS:
 * 
 * $and - All conditions must match (often implicit)
 * $or  - Any condition must match
 * $not - Negates a single operator expression
 * $nor - None of the conditions must match
 * 
 * BEST PRACTICES:
 * - Use implicit $and when possible (cleaner)
 * - Ensure $or clauses have supporting indexes
 * - Prefer $ne over $not when appropriate
 * - Put selective conditions first
 * - Use explain() to verify query plans
 * - Consider query restructuring for better performance
 */

module.exports = {
    andOperator,
    orOperator,
    notOperator,
    norOperator,
    complexCombinations,
    performanceExamples
};
