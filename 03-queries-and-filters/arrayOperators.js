/**
 * TOPIC: ARRAY OPERATORS
 * DESCRIPTION:
 * Array operators query documents by array contents, size, and element positions.
 * Essential for working with array fields in MongoDB documents.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC ARRAY MATCHING
// -------------------------------------------------------------------------------------------

async function basicArrayMatching() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Match if array contains value
        const hasTag = await collection.find({
            tags: "mongodb"  // Any element matches
        }).toArray();
        
        // Exact array match (order and content must match)
        const exactMatch = await collection.find({
            tags: ["mongodb", "database", "nosql"]  // Exact array
        }).toArray();
        
        // Match array element by index
        const firstTag = await collection.find({
            "tags.0": "mongodb"  // First element is "mongodb"
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. $ALL OPERATOR
// -------------------------------------------------------------------------------------------

async function allOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $all - Array must contain ALL specified values (any order)
        const hasAllTags = await collection.find({
            tags: { $all: ["mongodb", "nosql"] }
        }).toArray();
        
        // $all with $elemMatch for complex conditions
        const complexAll = await collection.find({
            scores: {
                $all: [
                    { $elemMatch: { $gte: 80 } },
                    { $elemMatch: { $lte: 100 } }
                ]
            }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. $ELEMMATCH OPERATOR
// -------------------------------------------------------------------------------------------

async function elemMatchOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('students');
        
        // $elemMatch - At least one element matches ALL conditions
        const passed = await collection.find({
            grades: {
                $elemMatch: {
                    subject: "math",
                    score: { $gte: 60 }
                }
            }
        }).toArray();
        
        // Without $elemMatch (different behavior!)
        // This matches if ANY element has subject="math" AND ANY element has score >= 60
        const withoutElemMatch = await collection.find({
            "grades.subject": "math",
            "grades.score": { $gte: 60 }
        }).toArray();
        
        // $elemMatch with range
        const inRange = await collection.find({
            scores: { $elemMatch: { $gte: 70, $lt: 90 } }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. $SIZE OPERATOR
// -------------------------------------------------------------------------------------------

async function sizeOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('posts');
        
        // Exact size match
        const threeTags = await collection.find({
            tags: { $size: 3 }
        }).toArray();
        
        // $size doesn't work with ranges! Use $expr instead
        const moreThanThree = await collection.find({
            $expr: { $gt: [{ $size: "$tags" }, 3] }
        }).toArray();
        
        // Empty array
        const noComments = await collection.find({
            comments: { $size: 0 }
        }).toArray();
        
        // Or check for empty/missing
        const noCommentsAlt = await collection.find({
            $or: [
                { comments: { $size: 0 } },
                { comments: { $exists: false } }
            ]
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. PROJECTION WITH ARRAYS
// -------------------------------------------------------------------------------------------

async function arrayProjection() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('posts');
        
        // $slice - First N elements
        const firstThree = await collection.find(
            {},
            { projection: { comments: { $slice: 3 } } }
        ).toArray();
        
        // $slice - Last N elements
        const lastThree = await collection.find(
            {},
            { projection: { comments: { $slice: -3 } } }
        ).toArray();
        
        // $slice - Skip and limit
        const paginated = await collection.find(
            {},
            { projection: { comments: { $slice: [5, 10] } } }  // Skip 5, take 10
        ).toArray();
        
        // $ positional projection - First matching element
        const matchingElement = await collection.find(
            { "comments.author": "john" },
            { projection: { "comments.$": 1 } }
        ).toArray();
        
        // $elemMatch projection
        const projected = await collection.find(
            {},
            { projection: { comments: { $elemMatch: { rating: { $gte: 4 } } } } }
        ).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. PRACTICAL EXAMPLES
// -------------------------------------------------------------------------------------------

async function practicalExamples() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // E-commerce: Products with specific features
        const products = await db.collection('products').find({
            features: {
                $all: ["waterproof", "bluetooth"],
                $elemMatch: { $regex: /wifi/i }
            }
        }).toArray();
        
        // Social: Posts with many comments from verified users
        const popularPosts = await db.collection('posts').find({
            $expr: { $gte: [{ $size: "$comments" }, 10] },
            comments: {
                $elemMatch: { verified: true, likes: { $gte: 5 } }
            }
        }).toArray();
        
        // Orders with specific item combination
        const orders = await db.collection('orders').find({
            items: {
                $all: [
                    { $elemMatch: { product: "keyboard", qty: { $gte: 1 } } },
                    { $elemMatch: { product: "mouse", qty: { $gte: 1 } } }
                ]
            }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * ARRAY OPERATORS:
 * 
 * $all       - Array contains all specified values
 * $elemMatch - Element matches all conditions
 * $size      - Array has exact size
 * $slice     - Projection: return subset of array
 * $          - Positional: first matching element
 * 
 * BEST PRACTICES:
 * - Use $elemMatch for compound conditions on same element
 * - Use $all for "contains all of these" queries
 * - Use $expr with $size for size comparisons
 * - Index first element for frequent first-element queries
 * - Consider multikey indexes for array fields
 */

module.exports = {
    basicArrayMatching,
    allOperator,
    elemMatchOperator,
    sizeOperator,
    arrayProjection,
    practicalExamples
};
