/**
 * TOPIC: TEXT INDEXES
 * DESCRIPTION:
 * Text indexes support full-text search queries on string content.
 * They enable searching for words and phrases within text fields.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. CREATING TEXT INDEXES
// -------------------------------------------------------------------------------------------

async function createTextIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('articles');
        
        // Single field text index
        await collection.createIndex({ content: "text" });
        
        // Multiple fields text index
        await collection.createIndex({ 
            title: "text", 
            content: "text",
            tags: "text"
        });
        
        // With weights (relevance scoring)
        await collection.createIndex(
            { title: "text", content: "text", tags: "text" },
            { 
                weights: { title: 10, content: 5, tags: 1 },
                name: "article_text_index"
            }
        );
        
        // Wildcard text index (all string fields)
        await collection.createIndex({ "$**": "text" });
        
        // With language
        await collection.createIndex(
            { content: "text" },
            { default_language: "spanish" }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. TEXT SEARCH QUERIES
// -------------------------------------------------------------------------------------------

async function textSearchQueries() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('articles');
        
        // Create text index
        await collection.createIndex({ title: "text", content: "text" });
        
        // Basic search (any word)
        const basic = await collection.find({
            $text: { $search: "mongodb database" }
        }).toArray();
        
        // Phrase search
        const phrase = await collection.find({
            $text: { $search: '"nosql database"' }
        }).toArray();
        
        // Exclude words
        const exclude = await collection.find({
            $text: { $search: "database -sql" }
        }).toArray();
        
        // Case sensitive
        const caseSensitive = await collection.find({
            $text: { $search: "MongoDB", $caseSensitive: true }
        }).toArray();
        
        // Diacritic sensitive
        const diacriticSensitive = await collection.find({
            $text: { $search: "café", $diacriticSensitive: true }
        }).toArray();
        
        // With language override
        const spanish = await collection.find({
            $text: { $search: "base datos", $language: "spanish" }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. TEXT SCORE AND SORTING
// -------------------------------------------------------------------------------------------

async function textScoring() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('articles');
        
        // Get text score
        const withScore = await collection.find(
            { $text: { $search: "mongodb" } },
            { projection: { title: 1, score: { $meta: "textScore" } } }
        ).toArray();
        
        // Sort by relevance
        const sorted = await collection.find(
            { $text: { $search: "mongodb tutorial" } },
            { projection: { title: 1, score: { $meta: "textScore" } } }
        ).sort({ score: { $meta: "textScore" } }).toArray();
        
        // Filter by minimum score
        const minScore = await collection.find(
            { $text: { $search: "mongodb" } },
            { projection: { title: 1, score: { $meta: "textScore" } } }
        ).sort({ score: { $meta: "textScore" } })
         .toArray()
         .then(docs => docs.filter(d => d.score > 1.0));
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. TEXT INDEX LIMITATIONS
// -------------------------------------------------------------------------------------------

/**
 * LIMITATIONS:
 * - Only one text index per collection
 * - Cannot use hint() to force text index
 * - Cannot combine with other special indexes (geospatial, hashed)
 * - Case-insensitive by default
 * - Stems words (searching, searched → search)
 * - Stop words ignored (the, a, an, etc.)
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * TEXT INDEX KEY POINTS:
 * 
 * 1. One text index per collection
 * 2. Supports word/phrase search
 * 3. Use weights for field importance
 * 4. Sort by $meta textScore for relevance
 * 
 * BEST PRACTICES:
 * - Use weights to boost important fields
 * - Consider language settings for correct stemming
 * - Combine text search with other filters
 * - For complex search, consider Atlas Search or Elasticsearch
 */

module.exports = {
    createTextIndexes,
    textSearchQueries,
    textScoring
};
