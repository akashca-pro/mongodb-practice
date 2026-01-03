/**
 * TOPIC: GROUP AND ACCUMULATORS
 * DESCRIPTION:
 * The $group stage groups documents and applies accumulator expressions
 * to compute aggregate values across grouped documents.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. BASIC ACCUMULATORS
// -------------------------------------------------------------------------------------------

async function basicAccumulators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sales');
        
        const results = await collection.aggregate([
            { $group: {
                _id: "$category",
                
                // Count
                count: { $sum: 1 },
                
                // Sum
                totalRevenue: { $sum: "$amount" },
                
                // Average
                averageOrder: { $avg: "$amount" },
                
                // Min/Max
                minOrder: { $min: "$amount" },
                maxOrder: { $max: "$amount" },
                
                // First/Last (after sort)
                firstOrder: { $first: "$orderDate" },
                lastOrder: { $last: "$orderDate" }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. ARRAY ACCUMULATORS
// -------------------------------------------------------------------------------------------

async function arrayAccumulators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const results = await collection.aggregate([
            { $group: {
                _id: "$customerId",
                
                // Push all values to array
                allProducts: { $push: "$product" },
                
                // Push entire documents
                allOrders: { $push: "$$ROOT" },
                
                // Unique values only
                uniqueProducts: { $addToSet: "$product" }
            }}
        ]).toArray();
        
        // Top N per group
        const topN = await collection.aggregate([
            { $sort: { amount: -1 } },
            { $group: {
                _id: "$category",
                topProducts: { 
                    $topN: { 
                        n: 3, 
                        sortBy: { amount: -1 },
                        output: { name: "$name", amount: "$amount" }
                    }
                }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. STATISTICAL ACCUMULATORS
// -------------------------------------------------------------------------------------------

async function statisticalAccumulators() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('measurements');
        
        const stats = await collection.aggregate([
            { $group: {
                _id: "$sensor",
                
                // Standard deviation
                stdDevSamp: { $stdDevSamp: "$value" },
                stdDevPop: { $stdDevPop: "$value" },
                
                // Count unique
                distinctCount: { $addToSet: "$type" }
            }},
            { $addFields: {
                distinctTypeCount: { $size: "$distinctCount" }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. CONDITIONAL ACCUMULATION
// -------------------------------------------------------------------------------------------

async function conditionalAccumulation() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('orders');
        
        const results = await collection.aggregate([
            { $group: {
                _id: "$category",
                
                // Conditional sum
                completedTotal: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0]
                    }
                },
                
                // Conditional count
                pendingCount: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                    }
                },
                
                // Multiple conditions
                highValueCompleted: {
                    $sum: {
                        $cond: {
                            if: { $and: [
                                { $eq: ["$status", "completed"] },
                                { $gte: ["$amount", 1000] }
                            ]},
                            then: 1,
                            else: 0
                        }
                    }
                }
            }}
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. NESTED GROUPING
// -------------------------------------------------------------------------------------------

async function nestedGrouping() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sales');
        
        // Group by multiple levels
        const nested = await collection.aggregate([
            // First group: by year and month
            { $group: {
                _id: {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                },
                monthlyTotal: { $sum: "$amount" }
            }},
            // Second group: by year
            { $group: {
                _id: "$_id.year",
                months: { 
                    $push: { 
                        month: "$_id.month", 
                        total: "$monthlyTotal" 
                    }
                },
                yearlyTotal: { $sum: "$monthlyTotal" }
            }},
            { $sort: { _id: 1 } }
        ]).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * ACCUMULATORS:
 * 
 * Math: $sum, $avg, $min, $max, $stdDevPop, $stdDevSamp
 * Array: $push, $addToSet, $first, $last
 * Top N: $topN, $bottomN, $firstN, $lastN
 * 
 * BEST PRACTICES:
 * - Sort before using $first/$last
 * - Use $addToSet for unique values
 * - Use conditional accumulators to avoid multiple groups
 * - Limit $push results to avoid memory issues
 */

module.exports = {
    basicAccumulators,
    arrayAccumulators,
    statisticalAccumulators,
    conditionalAccumulation,
    nestedGrouping
};
