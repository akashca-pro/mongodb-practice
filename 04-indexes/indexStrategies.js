/**
 * TOPIC: INDEX STRATEGIES
 * DESCRIPTION:
 * Learn advanced indexing strategies for optimal MongoDB performance
 * including partial indexes, wildcard indexes, and index maintenance.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. PARTIAL INDEXES
// -------------------------------------------------------------------------------------------

async function partialIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Index only active orders
        await collection.createIndex(
            { orderDate: -1 },
            { 
                partialFilterExpression: { status: "active" },
                name: "active_orders_date_idx"
            }
        );
        
        // Index for high-value orders only
        await collection.createIndex(
            { customerId: 1, total: -1 },
            {
                partialFilterExpression: { total: { $gte: 1000 } }
            }
        );
        
        // Sparse + partial for optional fields
        await collection.createIndex(
            { email: 1 },
            {
                unique: true,
                partialFilterExpression: { email: { $exists: true } }
            }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. WILDCARD INDEXES
// -------------------------------------------------------------------------------------------

async function wildcardIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Index all fields
        await collection.createIndex({ "$**": 1 });
        
        // Index specific path
        await collection.createIndex({ "metadata.$**": 1 });
        
        // With options
        await collection.createIndex(
            { "attributes.$**": 1 },
            { wildcardProjection: { "attributes.internal": 0 } }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. INDEX INTERSECTION
// -------------------------------------------------------------------------------------------

/**
 * MongoDB can combine multiple indexes for a query.
 * 
 * Example:
 * Indexes: { a: 1 } and { b: 1 }
 * Query: { a: 1, b: 2 }
 * 
 * MongoDB MAY use index intersection.
 * However, a compound index { a: 1, b: 1 } is usually more efficient.
 */

// -------------------------------------------------------------------------------------------
// 4. INDEX SELECTION STRATEGY
// -------------------------------------------------------------------------------------------

/**
 * 1. Analyze query patterns
 * 2. Identify high-frequency queries  
 * 3. Create indexes for:
 *    - Filter fields (WHERE equivalents)
 *    - Sort fields
 *    - Join fields ($lookup)
 * 4. Follow ESR rule for compound index field order
 * 5. Consider selectivity (high-cardinality fields first)
 * 6. Monitor with explain() and $indexStats
 * 7. Remove unused indexes
 */

async function indexStrategy() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // E-commerce example
        const products = db.collection('products');
        
        // Query: Find active products in category, sorted by price
        await products.createIndex({ 
            status: 1,           // Equality (always "active")
            category: 1,         // Equality (user selects)
            price: 1             // Sort/Range
        });
        
        // Query: Product search by name
        await products.createIndex({ name: "text" });
        
        // Query: Admin listing all products
        await products.createIndex({ createdAt: -1 });
        
        // Find unused indexes
        const stats = await products.aggregate([{ $indexStats: {} }]).toArray();
        const unused = stats.filter(s => s.accesses.ops === 0);
        console.log("Unused indexes:", unused.map(s => s.name));
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. INDEX MAINTENANCE
// -------------------------------------------------------------------------------------------

async function indexMaintenance() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Check index sizes
        const stats = await collection.stats();
        console.log("Index sizes:", stats.indexSizes);
        console.log("Total index size:", stats.totalIndexSize);
        
        // Rebuild indexes (use with caution in production)
        await collection.reIndex();
        
        // Create index in background (4.2+ builds in background by default)
        await collection.createIndex(
            { newField: 1 },
            { name: "new_field_idx" }
        );
        
        // Hide index (test impact before dropping)
        await collection.dropIndex("unused_index");
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * INDEX STRATEGIES:
 * 
 * 1. Partial indexes: Reduce size, index only relevant docs
 * 2. Wildcard indexes: Flexible schema indexing
 * 3. Follow ESR: Equality, Sort, Range
 * 4. Monitor and remove unused indexes
 * 
 * BEST PRACTICES:
 * - Profile before creating indexes
 * - Use partial indexes for selective queries
 * - Limit total number of indexes (5-10 typical)
 * - Monitor index size vs. data size
 * - Review indexes after query pattern changes
 * - Use explain() to verify index usage
 */

module.exports = {
    partialIndexes,
    wildcardIndexes,
    indexStrategy,
    indexMaintenance
};
