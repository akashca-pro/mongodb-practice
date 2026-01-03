/**
 * TOPIC: COMPOUND INDEXES
 * DESCRIPTION:
 * Compound indexes contain multiple fields and support queries on any
 * prefix of the indexed fields. Order matters for both queries and sorting.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. CREATING COMPOUND INDEXES
// -------------------------------------------------------------------------------------------

async function createCompoundIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Compound index: status ascending, date descending
        await collection.createIndex({ status: 1, orderDate: -1 });
        
        // Three-field compound index
        await collection.createIndex({ 
            category: 1, 
            brand: 1, 
            price: -1 
        });
        
        // With options
        await collection.createIndex(
            { userId: 1, status: 1, createdAt: -1 },
            { name: "user_orders_idx" }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. INDEX PREFIX RULE
// -------------------------------------------------------------------------------------------

/**
 * INDEX: { a: 1, b: 1, c: 1 }
 * 
 * Supports queries on:
 * ✅ { a: ... }                 (prefix: a)
 * ✅ { a: ..., b: ... }         (prefix: a, b)
 * ✅ { a: ..., b: ..., c: ... } (full index)
 * 
 * Does NOT support efficiently:
 * ❌ { b: ... }           (not a prefix)
 * ❌ { c: ... }           (not a prefix)
 * ❌ { b: ..., c: ... }   (not a prefix)
 * ❌ { a: ..., c: ... }   (b is missing, can use a but not c)
 */

async function prefixExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Create index
        await collection.createIndex({ category: 1, brand: 1, price: 1 });
        
        // Uses index (prefix: category)
        await collection.find({ category: "electronics" }).explain();
        
        // Uses index (prefix: category, brand)
        await collection.find({ 
            category: "electronics", 
            brand: "Samsung" 
        }).explain();
        
        // Uses full index
        await collection.find({ 
            category: "electronics", 
            brand: "Samsung",
            price: { $lt: 1000 }
        }).explain();
        
        // COLLSCAN - brand is not a prefix
        await collection.find({ brand: "Samsung" }).explain();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. SORT OPTIMIZATION
// -------------------------------------------------------------------------------------------

async function sortOptimization() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Index: { status: 1, date: -1 }
        await collection.createIndex({ status: 1, date: -1 });
        
        // Uses index for sort
        await collection.find({ status: "active" }).sort({ date: -1 });
        
        // Uses index (equality + sort on next field)
        await collection.find({ status: "active" }).sort({ date: 1 }); // reversed OK
        
        // In-memory sort needed (sorting on non-sequential field)
        await collection.find({}).sort({ date: -1 }); // No status filter
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. ESR RULE (Equality, Sort, Range)
// -------------------------------------------------------------------------------------------

/**
 * ESR Rule for compound index field ordering:
 * 
 * 1. E - Equality: Fields with exact match ($eq)
 * 2. S - Sort: Fields used in sort order
 * 3. R - Range: Fields with range queries ($gt, $lt, $in)
 * 
 * Example query:
 * find({ status: "active", price: { $gt: 10 } }).sort({ date: -1 })
 * 
 * Optimal index: { status: 1, date: -1, price: 1 }
 *                  ^E          ^S        ^R
 */

async function esrRule() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Query pattern:
        // Equality: category, inStock
        // Sort: price
        // Range: rating
        
        // Optimal index following ESR
        await collection.createIndex({ 
            category: 1,   // E - Equality
            inStock: 1,    // E - Equality  
            price: 1,      // S - Sort
            rating: 1      // R - Range
        });
        
        // This query will use index efficiently
        await collection.find({
            category: "electronics",
            inStock: true,
            rating: { $gte: 4 }
        }).sort({ price: 1 });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. COVERED QUERIES
// -------------------------------------------------------------------------------------------

async function coveredQueries() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Create index covering all needed fields
        await collection.createIndex({ email: 1, name: 1, status: 1 });
        
        // Covered query - no document fetch needed
        const result = await collection.find(
            { email: "test@example.com" },
            { projection: { email: 1, name: 1, status: 1, _id: 0 } }
        );
        
        // Explain shows totalDocsExamined: 0 for covered query
        const explanation = await collection.find(
            { email: "test@example.com" },
            { projection: { email: 1, name: 1, status: 1, _id: 0 } }
        ).explain("executionStats");
        
        console.log("Docs examined:", explanation.executionStats.totalDocsExamined);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * COMPOUND INDEX KEY POINTS:
 * 
 * 1. Field order matters - leftmost prefix rule
 * 2. Follow ESR rule: Equality, Sort, Range
 * 3. Consider sort direction in index
 * 4. Aim for covered queries when possible
 * 
 * BEST PRACTICES:
 * - Put high-cardinality equality fields first
 * - Include sort fields after equality fields
 * - Put range fields last
 * - Match index sort direction to query sort
 * - Avoid redundant indexes (compound includes prefixes)
 * - Monitor with explain() to verify usage
 */

module.exports = {
    createCompoundIndexes,
    prefixExamples,
    sortOptimization,
    esrRule,
    coveredQueries
};
