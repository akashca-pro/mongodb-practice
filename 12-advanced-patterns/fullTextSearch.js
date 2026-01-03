/**
 * TOPIC: FULL-TEXT SEARCH
 * DESCRIPTION:
 * Advanced text search capabilities including Atlas Search
 * for fuzzy matching, autocomplete, and relevance scoring.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC TEXT SEARCH (Text Index)
// -------------------------------------------------------------------------------------------

async function basicTextSearch() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('articles');
        
        // Create text index
        await collection.createIndex(
            { title: 'text', content: 'text', tags: 'text' },
            { weights: { title: 10, content: 5, tags: 2 } }
        );
        
        // Basic search
        const results = await collection.find({
            $text: { $search: 'mongodb database' }
        }).toArray();
        
        // With score
        const withScore = await collection.find(
            { $text: { $search: 'mongodb tutorial' } },
            { projection: { score: { $meta: 'textScore' } } }
        ).sort({ score: { $meta: 'textScore' } }).toArray();
        
        // Phrase search
        const phrase = await collection.find({
            $text: { $search: '"mongodb tutorial"' }
        }).toArray();
        
        // Exclude terms
        const excluded = await collection.find({
            $text: { $search: 'database -mysql' }
        }).toArray();
        
        return { results, withScore, phrase, excluded };
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. ATLAS SEARCH (Full-Featured)
// -------------------------------------------------------------------------------------------

/**
 * Atlas Search requires MongoDB Atlas.
 * Create search index in Atlas UI or via API.
 * 
 * Search Index Definition:
 * {
 *   "mappings": {
 *     "dynamic": true,
 *     "fields": {
 *       "title": { "type": "string", "analyzer": "lucene.standard" },
 *       "content": { "type": "string", "analyzer": "lucene.english" },
 *       "category": { "type": "stringFacet" }
 *     }
 *   }
 * }
 */

async function atlasSearchExamples() {
    const client = new MongoClient(process.env.ATLAS_URI);
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        // Basic search
        const basicSearch = await collection.aggregate([
            {
                $search: {
                    index: 'default',
                    text: {
                        query: 'wireless headphones',
                        path: ['name', 'description']
                    }
                }
            },
            { $limit: 10 }
        ]).toArray();
        
        // Fuzzy matching
        const fuzzySearch = await collection.aggregate([
            {
                $search: {
                    index: 'default',
                    text: {
                        query: 'wireles headphon',  // Typos
                        path: 'name',
                        fuzzy: {
                            maxEdits: 2,
                            prefixLength: 3
                        }
                    }
                }
            }
        ]).toArray();
        
        // Autocomplete
        const autocomplete = await collection.aggregate([
            {
                $search: {
                    index: 'autocomplete',
                    autocomplete: {
                        query: 'head',
                        path: 'name',
                        tokenOrder: 'sequential'
                    }
                }
            },
            { $limit: 5 },
            { $project: { name: 1, _id: 0 } }
        ]).toArray();
        
        return { basicSearch, fuzzySearch, autocomplete };
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. COMPOUND SEARCH
// -------------------------------------------------------------------------------------------

async function compoundSearch() {
    const client = new MongoClient(process.env.ATLAS_URI);
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        const results = await collection.aggregate([
            {
                $search: {
                    index: 'default',
                    compound: {
                        must: [
                            { text: { query: 'headphones', path: 'name' } }
                        ],
                        should: [
                            { text: { query: 'wireless', path: 'name' } },
                            { text: { query: 'bluetooth', path: 'description' } }
                        ],
                        filter: [
                            { range: { path: 'price', gte: 50, lte: 200 } }
                        ],
                        mustNot: [
                            { text: { query: 'refurbished', path: 'condition' } }
                        ]
                    }
                }
            },
            {
                $project: {
                    name: 1,
                    price: 1,
                    score: { $meta: 'searchScore' }
                }
            }
        ]).toArray();
        
        return results;
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. FACETED SEARCH
// -------------------------------------------------------------------------------------------

async function facetedSearch() {
    const client = new MongoClient(process.env.ATLAS_URI);
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('products');
        
        const results = await collection.aggregate([
            {
                $searchMeta: {
                    index: 'default',
                    facet: {
                        operator: {
                            text: { query: 'laptop', path: 'name' }
                        },
                        facets: {
                            categoryFacet: {
                                type: 'string',
                                path: 'category'
                            },
                            priceFacet: {
                                type: 'number',
                                path: 'price',
                                boundaries: [0, 500, 1000, 2000]
                            }
                        }
                    }
                }
            }
        ]).toArray();
        
        return results;
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * TEXT SEARCH OPTIONS:
 * 
 * 1. Text Index: Basic, built-in
 * 2. Atlas Search: Advanced, Lucene-based
 * 
 * ATLAS SEARCH FEATURES:
 * - Fuzzy matching
 * - Autocomplete
 * - Compound queries
 * - Faceted search
 * - Highlighting
 * - Custom analyzers
 * 
 * BEST PRACTICES:
 * - Use Atlas Search for production search
 * - Create specific indexes for autocomplete
 * - Use compound queries for complex filters
 * - Implement facets for navigation
 */

module.exports = {
    basicTextSearch,
    atlasSearchExamples,
    compoundSearch,
    facetedSearch
};
