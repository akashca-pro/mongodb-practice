/**
 * TOPIC: TIME SERIES COLLECTIONS
 * DESCRIPTION:
 * MongoDB 5.0+ time series collections optimize storage and queries
 * for time-stamped data like IoT, metrics, and logs.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. CREATING TIME SERIES COLLECTION
// -------------------------------------------------------------------------------------------

async function createTimeSeriesCollection() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Create time series collection
        await db.createCollection('sensorData', {
            timeseries: {
                timeField: 'timestamp',       // Required: field with date
                metaField: 'sensorId',        // Optional: metadata field
                granularity: 'seconds'        // seconds, minutes, hours
            },
            expireAfterSeconds: 86400 * 30   // Optional: TTL (30 days)
        });
        
        console.log('Time series collection created');
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. INSERTING TIME SERIES DATA
// -------------------------------------------------------------------------------------------

async function insertTimeSeriesData() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sensorData');
        
        // Insert single measurement
        await collection.insertOne({
            timestamp: new Date(),
            sensorId: 'sensor_001',
            temperature: 23.5,
            humidity: 45,
            pressure: 1013
        });
        
        // Insert batch of measurements
        const measurements = [];
        for (let i = 0; i < 100; i++) {
            measurements.push({
                timestamp: new Date(Date.now() - i * 60000),
                sensorId: `sensor_00${i % 5}`,
                temperature: 20 + Math.random() * 10,
                humidity: 40 + Math.random() * 20
            });
        }
        await collection.insertMany(measurements);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. QUERYING TIME SERIES DATA
// -------------------------------------------------------------------------------------------

async function queryTimeSeriesData() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sensorData');
        
        // Query by time range
        const lastHour = await collection.find({
            timestamp: {
                $gte: new Date(Date.now() - 3600000),
                $lt: new Date()
            }
        }).toArray();
        
        // Query by metadata
        const sensor1Data = await collection.find({
            sensorId: 'sensor_001',
            timestamp: { $gte: new Date('2024-01-01') }
        }).sort({ timestamp: -1 }).limit(100).toArray();
        
        return { lastHour, sensor1Data };
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. TIME SERIES AGGREGATIONS
// -------------------------------------------------------------------------------------------

async function timeSeriesAggregations() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sensorData');
        
        // Hourly averages
        const hourlyAvg = await collection.aggregate([
            {
                $match: {
                    timestamp: { $gte: new Date('2024-01-01') }
                }
            },
            {
                $group: {
                    _id: {
                        sensor: '$sensorId',
                        hour: { $dateTrunc: { date: '$timestamp', unit: 'hour' } }
                    },
                    avgTemp: { $avg: '$temperature' },
                    maxTemp: { $max: '$temperature' },
                    minTemp: { $min: '$temperature' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.hour': 1 } }
        ]).toArray();
        
        // Daily statistics per sensor
        const dailyStats = await collection.aggregate([
            {
                $group: {
                    _id: {
                        sensor: '$sensorId',
                        day: { $dateTrunc: { date: '$timestamp', unit: 'day' } }
                    },
                    avgTemp: { $avg: '$temperature' },
                    avgHumidity: { $avg: '$humidity' },
                    readings: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.sensor',
                    dailyData: {
                        $push: {
                            day: '$_id.day',
                            avgTemp: '$avgTemp',
                            readings: '$readings'
                        }
                    }
                }
            }
        ]).toArray();
        
        return { hourlyAvg, dailyStats };
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. WINDOW FUNCTIONS FOR TIME SERIES
// -------------------------------------------------------------------------------------------

async function windowFunctions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('sensorData');
        
        // Moving average
        const movingAvg = await collection.aggregate([
            { $match: { sensorId: 'sensor_001' } },
            { $sort: { timestamp: 1 } },
            {
                $setWindowFields: {
                    partitionBy: '$sensorId',
                    sortBy: { timestamp: 1 },
                    output: {
                        movingAvgTemp: {
                            $avg: '$temperature',
                            window: { documents: [-5, 0] }  // Last 5 readings
                        }
                    }
                }
            }
        ]).toArray();
        
        return movingAvg;
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * TIME SERIES COLLECTIONS:
 * 
 * 1. Optimized storage (columnar compression)
 * 2. Automatic bucketing by time
 * 3. Built-in TTL support
 * 4. Efficient time-range queries
 * 
 * BEST PRACTICES:
 * - Choose appropriate granularity
 * - Use metaField for grouping
 * - Batch inserts for better performance
 * - Use aggregation for analytics
 */

module.exports = {
    createTimeSeriesCollection,
    insertTimeSeriesData,
    queryTimeSeriesData,
    timeSeriesAggregations,
    windowFunctions
};
