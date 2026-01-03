/**
 * TOPIC: STAGE OPERATORS
 * DESCRIPTION:
 * Advanced aggregation stage operators for document transformation,
 * array manipulation, and data reshaping.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. $UNWIND - Flatten Arrays
// -------------------------------------------------------------------------------------------

async function unwindStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Basic unwind
        const unwound = await collection.aggregate([
            { $unwind: "$items" }
        ]).toArray();
        // Each item becomes a separate document
        
        // With options
        const withOptions = await collection.aggregate([
            { $unwind: {
                path: "$items",
                includeArrayIndex: "itemIndex",
                preserveNullAndEmptyArrays: true
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. $ADDFIELDS / $SET
// -------------------------------------------------------------------------------------------

async function addFieldsStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // $addFields adds or updates fields
        const results = await collection.aggregate([
            { $addFields: {
                fullName: { $concat: ["$firstName", " ", "$lastName"] },
                ageGroup: {
                    $switch: {
                        branches: [
                            { case: { $lt: ["$age", 18] }, then: "minor" },
                            { case: { $lt: ["$age", 65] }, then: "adult" }
                        ],
                        default: "senior"
                    }
                }
            }}
        ]).toArray();
        
        // $set is alias for $addFields
        const withSet = await collection.aggregate([
            { $set: { updatedAt: new Date() } }
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. $REPLACEROOT / $REPLACESWITH
// -------------------------------------------------------------------------------------------

async function replaceRootStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Promote nested document to root
        const promoted = await collection.aggregate([
            { $replaceRoot: { newRoot: "$address" } }
        ]).toArray();
        
        // Merge with root
        const merged = await collection.aggregate([
            { $replaceRoot: { 
                newRoot: { $mergeObjects: ["$defaults", "$$ROOT"] }
            }}
        ]).toArray();
        
        // $replaceWith is shorthand
        const replaced = await collection.aggregate([
            { $replaceWith: "$profile" }
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. $FACET - Multiple Pipelines
// -------------------------------------------------------------------------------------------

async function facetStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Run multiple aggregations in one query
        const results = await collection.aggregate([
            { $facet: {
                // Get counts by category
                categoryCounts: [
                    { $group: { _id: "$category", count: { $sum: 1 } } }
                ],
                // Get price statistics
                priceStats: [
                    { $group: { 
                        _id: null,
                        avgPrice: { $avg: "$price" },
                        minPrice: { $min: "$price" },
                        maxPrice: { $max: "$price" }
                    }}
                ],
                // Get top products
                topProducts: [
                    { $sort: { rating: -1 } },
                    { $limit: 5 },
                    { $project: { name: 1, rating: 1 } }
                ]
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. $BUCKET AND $BUCKETAUTO
// -------------------------------------------------------------------------------------------

async function bucketStages() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Manual buckets
        const priceBuckets = await collection.aggregate([
            { $bucket: {
                groupBy: "$price",
                boundaries: [0, 10, 50, 100, 500, Infinity],
                default: "Other",
                output: {
                    count: { $sum: 1 },
                    products: { $push: "$name" }
                }
            }}
        ]).toArray();
        
        // Auto buckets
        const autoBuckets = await collection.aggregate([
            { $bucketAuto: {
                groupBy: "$price",
                buckets: 5,
                output: {
                    count: { $sum: 1 },
                    avgPrice: { $avg: "$price" }
                }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. $REDACT - Document Level Security
// -------------------------------------------------------------------------------------------

async function redactStage() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('documents');
        
        const userLevel = 2;
        
        const filtered = await collection.aggregate([
            { $redact: {
                $cond: {
                    if: { $gte: [userLevel, "$accessLevel"] },
                    then: "$$DESCEND",  // Include this level
                    else: "$$PRUNE"     // Remove this branch
                }
            }}
        ]).toArray();
        
        /**
         * Redact variables:
         * $$DESCEND - Include document and process embedded docs
         * $$PRUNE   - Exclude document entirely
         * $$KEEP    - Keep document as-is (no further processing)
         */
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * STAGE OPERATORS:
 * 
 * $unwind      - Flatten arrays into documents
 * $addFields   - Add computed fields
 * $replaceRoot - Promote embedded doc to root
 * $facet       - Run multiple pipelines
 * $bucket      - Group by ranges
 * $redact      - Field-level access control
 * 
 * BEST PRACTICES:
 * - Preserve null/empty arrays if needed in $unwind
 * - Use $facet for dashboard-style queries
 * - Combine $addFields with $project for efficiency
 */

module.exports = {
    unwindStage,
    addFieldsStage,
    replaceRootStage,
    facetStage,
    bucketStages,
    redactStage
};
