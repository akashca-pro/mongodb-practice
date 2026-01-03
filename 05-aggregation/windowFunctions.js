/**
 * TOPIC: WINDOW FUNCTIONS
 * DESCRIPTION:
 * Window functions ($setWindowFields) perform calculations across a
 * window of documents, enabling rankings, running totals, and analytics.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC WINDOW FUNCTIONS
// -------------------------------------------------------------------------------------------

async function basicWindowFunctions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sales');
        
        // Running total
        const runningTotal = await collection.aggregate([
            { $setWindowFields: {
                partitionBy: "$category",
                sortBy: { date: 1 },
                output: {
                    runningTotal: {
                        $sum: "$amount",
                        window: { documents: ["unbounded", "current"] }
                    },
                    movingAvg: {
                        $avg: "$amount",
                        window: { documents: [-2, 0] }  // Last 3 docs
                    }
                }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. RANKING FUNCTIONS
// -------------------------------------------------------------------------------------------

async function rankingFunctions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('scores');
        
        const ranked = await collection.aggregate([
            { $setWindowFields: {
                partitionBy: "$category",
                sortBy: { score: -1 },
                output: {
                    rank: { $rank: {} },
                    denseRank: { $denseRank: {} },
                    rowNumber: { $documentNumber: {} }
                }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. LAG AND LEAD
// -------------------------------------------------------------------------------------------

async function lagLeadFunctions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('stocks');
        
        const withChange = await collection.aggregate([
            { $setWindowFields: {
                partitionBy: "$symbol",
                sortBy: { date: 1 },
                output: {
                    previousClose: { 
                        $shift: { output: "$price", by: -1, default: 0 } 
                    },
                    nextClose: { 
                        $shift: { output: "$price", by: 1 } 
                    }
                }
            }},
            { $addFields: {
                priceChange: { $subtract: ["$price", "$previousClose"] }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * WINDOW FUNCTIONS:
 * 
 * Aggregation: $sum, $avg, $min, $max, $count
 * Ranking: $rank, $denseRank, $documentNumber
 * Navigation: $shift (lag/lead), $first, $last
 * 
 * Window specs:
 * - documents: [-N, M] relative positions
 * - range: numeric range from current
 */

module.exports = {
    basicWindowFunctions,
    rankingFunctions,
    lagLeadFunctions
};
