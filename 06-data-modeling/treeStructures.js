/**
 * TOPIC: TREE STRUCTURES
 * DESCRIPTION:
 * Modeling hierarchical data in MongoDB using various tree patterns.
 * Each pattern has different trade-offs for reads and writes.
 */

// -------------------------------------------------------------------------------------------
// 1. PARENT REFERENCE PATTERN
// -------------------------------------------------------------------------------------------

/**
 * Each node stores reference to parent.
 * Simple to implement, good for parent queries.
 */

const parentReference = [
    { _id: 'Electronics', parent: null },
    { _id: 'Computers', parent: 'Electronics' },
    { _id: 'Laptops', parent: 'Computers' },
    { _id: 'Phones', parent: 'Electronics' }
];

// Find immediate children
// db.categories.find({ parent: 'Electronics' })

// Find parent
// db.categories.findOne({ _id: 'Laptops' }).parent

// -------------------------------------------------------------------------------------------
// 2. CHILD REFERENCE PATTERN
// -------------------------------------------------------------------------------------------

/**
 * Each node stores references to children.
 * Good for finding children, harder to find ancestors.
 */

const childReference = [
    { _id: 'Electronics', children: ['Computers', 'Phones'] },
    { _id: 'Computers', children: ['Laptops', 'Desktops'] },
    { _id: 'Laptops', children: [] }
];

// Find children
// db.categories.findOne({ _id: 'Electronics' }).children

// -------------------------------------------------------------------------------------------
// 3. ARRAY OF ANCESTORS PATTERN
// -------------------------------------------------------------------------------------------

/**
 * Store full path of ancestors.
 * Efficient for ancestor queries and subtree queries.
 */

const ancestorArray = [
    { _id: 'Electronics', ancestors: [] },
    { _id: 'Computers', ancestors: ['Electronics'] },
    { _id: 'Laptops', ancestors: ['Electronics', 'Computers'] },
    { _id: 'Gaming', ancestors: ['Electronics', 'Computers', 'Laptops'] }
];

// Find all ancestors
// db.categories.findOne({ _id: 'Gaming' }).ancestors

// Find all descendants
// db.categories.find({ ancestors: 'Computers' })

// -------------------------------------------------------------------------------------------
// 4. MATERIALIZED PATH PATTERN
// -------------------------------------------------------------------------------------------

/**
 * Store path as string with delimiter.
 * Efficient for subtree queries using regex.
 */

const materializedPath = [
    { _id: 'Electronics', path: ',Electronics,' },
    { _id: 'Computers', path: ',Electronics,Computers,' },
    { _id: 'Laptops', path: ',Electronics,Computers,Laptops,' }
];

// Find all descendants of Computers
// db.categories.find({ path: /,Computers,/ })

// Find all ancestors (parse the path string)

// -------------------------------------------------------------------------------------------
// 5. NESTED SETS PATTERN
// -------------------------------------------------------------------------------------------

/**
 * Each node has left and right values.
 * Very efficient reads, expensive writes.
 */

const nestedSets = [
    { _id: 'Electronics', left: 1, right: 10 },
    { _id: 'Computers', left: 2, right: 7 },
    { _id: 'Laptops', left: 3, right: 4 },
    { _id: 'Desktops', left: 5, right: 6 },
    { _id: 'Phones', left: 8, right: 9 }
];

// Find all descendants
// db.categories.find({ left: { $gt: 2 }, right: { $lt: 7 } })

// Find all ancestors
// db.categories.find({ left: { $lt: 3 }, right: { $gt: 4 } })

// -------------------------------------------------------------------------------------------
// 6. GRAPHLOOKUP FOR RECURSIVE QUERIES
// -------------------------------------------------------------------------------------------

const { MongoClient } = require('mongodb');

async function findAllAncestors() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('categories');
        
        // Recursive lookup using $graphLookup
        const result = await collection.aggregate([
            { $match: { _id: 'Laptops' } },
            {
                $graphLookup: {
                    from: 'categories',
                    startWith: '$parent',
                    connectFromField: 'parent',
                    connectToField: '_id',
                    as: 'ancestors'
                }
            }
        ]).toArray();
        
        console.log('Ancestors:', result[0].ancestors);
        
    } finally {
        await client.close();
    }
}

async function findAllDescendants() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('categories');
        
        const result = await collection.aggregate([
            { $match: { _id: 'Electronics' } },
            {
                $graphLookup: {
                    from: 'categories',
                    startWith: '$_id',
                    connectFromField: '_id',
                    connectToField: 'parent',
                    as: 'descendants',
                    maxDepth: 10,
                    depthField: 'depth'
                }
            }
        ]).toArray();
        
        console.log('Descendants:', result[0].descendants);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * PATTERN COMPARISON:
 * 
 * | Pattern           | Add Child | Find Children | Find Ancestors | Find Subtree |
 * |-------------------|-----------|---------------|----------------|--------------|
 * | Parent Reference  | Easy      | Index lookup  | Recursive      | Recursive    |
 * | Child Reference   | Update    | Direct        | Recursive      | Recursive    |
 * | Ancestor Array    | Update    | Index lookup  | Direct         | Index lookup |
 * | Materialized Path | Easy      | Regex         | Parse string   | Regex        |
 * | Nested Sets       | Expensive | Range query   | Range query    | Range query  |
 * 
 * RECOMMENDATIONS:
 * - Read-heavy: Materialized Path or Ancestor Array
 * - Write-heavy: Parent Reference
 * - Deep trees: $graphLookup for queries
 */

module.exports = {
    findAllAncestors,
    findAllDescendants
};
