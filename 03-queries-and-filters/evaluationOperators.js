/**
 * TOPIC: EVALUATION OPERATORS
 * DESCRIPTION:
 * Evaluation operators perform complex matching including regex,
 * JavaScript expressions, and text search.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. $REGEX OPERATOR
// -------------------------------------------------------------------------------------------

async function regexOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Basic regex
        const johnsons = await collection.find({
            name: { $regex: /johnson/i }  // Case-insensitive
        }).toArray();
        
        // String regex with options
        const pattern = await collection.find({
            email: { $regex: "^admin", $options: "i" }
        }).toArray();
        
        // Starts with
        const startsWithA = await collection.find({
            name: { $regex: /^A/ }
        }).toArray();
        
        // Ends with
        const endsWithCom = await collection.find({
            email: { $regex: /\.com$/i }
        }).toArray();
        
        // Contains
        const containsTest = await collection.find({
            email: { $regex: /test/i }
        }).toArray();
        
        // Options: i (case-insensitive), m (multiline), x (extended), s (dotall)
        const multiline = await collection.find({
            description: { $regex: /^start/m }  // Match at line starts
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. $EXPR OPERATOR
// -------------------------------------------------------------------------------------------

async function exprOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        // Compare two fields
        const overBudget = await collection.find({
            $expr: { $gt: ["$spent", "$budget"] }
        }).toArray();
        
        // Arithmetic in comparison
        const discounted = await collection.find({
            $expr: {
                $lt: [
                    "$salePrice",
                    { $multiply: ["$originalPrice", 0.8] }  // 20% off
                ]
            }
        }).toArray();
        
        // Array size comparison
        const manyItems = await collection.find({
            $expr: { $gte: [{ $size: "$items" }, 5] }
        }).toArray();
        
        // String operations
        const longNames = await collection.find({
            $expr: { $gt: [{ $strLenCP: "$name" }, 20] }
        }).toArray();
        
        // Date comparisons
        const dueToday = await collection.find({
            $expr: {
                $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$dueDate" } },
                    { $dateToString: { format: "%Y-%m-%d", date: new Date() } }
                ]
            }
        }).toArray();
        
        // Conditional expressions
        const conditional = await collection.find({
            $expr: {
                $cond: {
                    if: { $eq: ["$status", "vip"] },
                    then: { $gte: ["$total", 100] },
                    else: { $gte: ["$total", 500] }
                }
            }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. $MOD OPERATOR
// -------------------------------------------------------------------------------------------

async function modOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $mod - Modulo operation (divisor, remainder)
        const evenPriced = await collection.find({
            price: { $mod: [2, 0] }  // price % 2 == 0
        }).toArray();
        
        // Find every 10th item
        const everyTenth = await collection.find({
            itemNumber: { $mod: [10, 0] }
        }).toArray();
        
        // Remainder is 1
        const oddItems = await collection.find({
            count: { $mod: [2, 1] }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. $TEXT SEARCH
// -------------------------------------------------------------------------------------------

async function textSearch() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('articles');
        
        // Create text index first
        await collection.createIndex({ title: "text", content: "text" });
        
        // Basic text search
        const results = await collection.find({
            $text: { $search: "mongodb tutorial" }
        }).toArray();
        
        // Phrase search
        const phrase = await collection.find({
            $text: { $search: '"mongodb tutorial"' }  // Exact phrase
        }).toArray();
        
        // Exclude terms
        const excluded = await collection.find({
            $text: { $search: "database -sql" }  // Has database, not sql
        }).toArray();
        
        // With language
        const spanish = await collection.find({
            $text: { $search: "mensaje", $language: "spanish" }
        }).toArray();
        
        // Case sensitive
        const caseSensitive = await collection.find({
            $text: { $search: "MongoDB", $caseSensitive: true }
        }).toArray();
        
        // Sort by relevance score
        const ranked = await collection.find(
            { $text: { $search: "mongodb" } },
            { projection: { score: { $meta: "textScore" } } }
        ).sort({ score: { $meta: "textScore" } }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. $WHERE OPERATOR (Use Sparingly)
// -------------------------------------------------------------------------------------------

async function whereOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // $where runs JavaScript (slow, not indexed)
        // Use only when no other option
        const result = await collection.find({
            $where: function() {
                return this.price > this.cost * 2;  // More than 100% margin
            }
        }).toArray();
        
        // String form
        const stringWhere = await collection.find({
            $where: "this.qty > this.minQty * 2"
        }).toArray();
        
        // IMPORTANT: $where cannot use indexes and runs on every document
        // Always prefer other operators when possible
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 6. $JSONSCHEMA VALIDATION
// -------------------------------------------------------------------------------------------

async function jsonSchemaOperator() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Find documents matching JSON Schema
        const valid = await collection.find({
            $jsonSchema: {
                bsonType: "object",
                required: ["name", "email", "age"],
                properties: {
                    name: { bsonType: "string" },
                    email: { bsonType: "string", pattern: "^.+@.+$" },
                    age: { bsonType: "int", minimum: 18 }
                }
            }
        }).toArray();
        
        // Find documents NOT matching schema (validation errors)
        const invalid = await collection.find({
            $nor: [{
                $jsonSchema: {
                    required: ["email"],
                    properties: {
                        email: { pattern: "^.+@.+$" }
                    }
                }
            }]
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * EVALUATION OPERATORS:
 * 
 * $regex      - Pattern matching with regular expressions
 * $expr       - Aggregation expressions in queries
 * $mod        - Modulo arithmetic
 * $text       - Full-text search (requires text index)
 * $where      - JavaScript expression (avoid if possible)
 * $jsonSchema - JSON Schema validation
 * 
 * BEST PRACTICES:
 * - Avoid $where (slow, no index support)
 * - Use $expr for field comparisons
 * - Create text indexes before using $text
 * - Anchor regex patterns when possible (^start)
 * - Use case-insensitive regex sparingly (can't use index)
 * - Prefer $regex with index-friendly patterns
 */

module.exports = {
    regexOperator,
    exprOperator,
    modOperator,
    textSearch,
    whereOperator,
    jsonSchemaOperator
};
