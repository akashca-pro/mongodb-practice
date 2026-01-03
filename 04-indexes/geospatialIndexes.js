/**
 * TOPIC: GEOSPATIAL INDEXES
 * DESCRIPTION:
 * Geospatial indexes support queries on location data. MongoDB supports
 * both 2dsphere (spherical) and 2d (planar) coordinate systems.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. GEOJSON FORMAT
// -------------------------------------------------------------------------------------------

/**
 * GeoJSON Types:
 * - Point: { type: "Point", coordinates: [longitude, latitude] }
 * - LineString: { type: "LineString", coordinates: [[lng, lat], ...] }
 * - Polygon: { type: "Polygon", coordinates: [[[lng, lat], ...]] }
 * 
 * Note: Coordinates are [longitude, latitude] (x, y)
 */

const locationExamples = {
    point: {
        type: "Point",
        coordinates: [-73.935242, 40.730610]  // NYC
    },
    lineString: {
        type: "LineString",
        coordinates: [
            [-73.935242, 40.730610],
            [-74.006015, 40.712776]
        ]
    },
    polygon: {
        type: "Polygon",
        coordinates: [[
            [-74.0, 40.7],
            [-74.0, 40.8],
            [-73.9, 40.8],
            [-73.9, 40.7],
            [-74.0, 40.7]  // Close the polygon
        ]]
    }
};

// -------------------------------------------------------------------------------------------
// 2. CREATING GEOSPATIAL INDEXES
// -------------------------------------------------------------------------------------------

async function createGeoIndexes() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('places');
        
        // 2dsphere index (recommended for geographic data)
        await collection.createIndex({ location: "2dsphere" });
        
        // 2d index (for flat, planar data)
        await collection.createIndex({ coordinates: "2d" });
        
        // Compound with other fields
        await collection.createIndex({ 
            location: "2dsphere", 
            category: 1 
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. GEOSPATIAL QUERIES
// -------------------------------------------------------------------------------------------

async function geoQueries() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('restaurants');
        
        // $near - Find nearby, sorted by distance
        const nearby = await collection.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [-73.935242, 40.730610]
                    },
                    $maxDistance: 5000,  // meters
                    $minDistance: 100
                }
            }
        }).limit(10).toArray();
        
        // $geoWithin - Find within area
        const withinCircle = await collection.find({
            location: {
                $geoWithin: {
                    $centerSphere: [
                        [-73.935242, 40.730610],
                        5 / 6378.1  // 5km radius (convert to radians)
                    ]
                }
            }
        }).toArray();
        
        // Within polygon
        const withinPolygon = await collection.find({
            location: {
                $geoWithin: {
                    $geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [-74.0, 40.7],
                            [-74.0, 40.8],
                            [-73.9, 40.8],
                            [-73.9, 40.7],
                            [-74.0, 40.7]
                        ]]
                    }
                }
            }
        }).toArray();
        
        // $geoIntersects
        const intersects = await collection.find({
            area: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [-73.935242, 40.730610]
                    }
                }
            }
        }).toArray();
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. AGGREGATION WITH GEONEAR
// -------------------------------------------------------------------------------------------

async function geoAggregation() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('restaurants');
        
        const results = await collection.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [-73.935242, 40.730610]
                    },
                    distanceField: "distance",
                    maxDistance: 5000,
                    query: { cuisine: "Italian" },
                    spherical: true
                }
            },
            { $limit: 10 },
            { $project: { name: 1, distance: 1, cuisine: 1 } }
        ]).toArray();
        
        console.log("Nearby Italian restaurants:", results);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * GEOSPATIAL KEY POINTS:
 * 
 * 1. Use 2dsphere for geographic (Earth) coordinates
 * 2. Use GeoJSON format [longitude, latitude]
 * 3. $near returns sorted by distance
 * 4. $geoWithin for containment queries
 * 
 * BEST PRACTICES:
 * - Use 2dsphere for real-world locations
 * - Store coordinates as GeoJSON Point
 * - Combine geo queries with other filters
 * - Use $geoNear in aggregation for more control
 */

module.exports = {
    createGeoIndexes,
    geoQueries,
    geoAggregation
};
