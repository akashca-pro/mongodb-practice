# MongoDB Practice

A comprehensive MongoDB learning resource covering fundamentals to advanced patterns. Each file contains detailed explanations, practical code examples, and best practices.

## Structure

```
mongodb-practice/
├── 01-fundamentals/           # Core MongoDB concepts
├── 02-crud-operations/        # Create, Read, Update, Delete
├── 03-queries-and-filters/    # Query operators and filtering
├── 04-indexes/                # Index types and optimization
├── 05-aggregation/            # Aggregation framework
├── 06-data-modeling/          # Schema design patterns
├── 07-transactions/           # ACID transactions
├── 08-performance/            # Performance tuning
├── 09-security/               # Authentication and authorization
├── 10-replication-and-sharding/ # High availability and scaling
├── 11-mongoose-odm/           # Mongoose with Node.js
├── 12-advanced-patterns/      # Change streams, GridFS, etc.
└── README.md
```

## Topics Covered

### 01 - Fundamentals (5 files)

- `mongodbArchitecture.js` - Components, storage engine, deployment
- `bsonAndDataTypes.js` - BSON format, all data types
- `collectionsAndDocuments.js` - Documents, collections, validation
- `mongoShell.js` - mongosh commands and operations
- `connectionAndDrivers.js` - Node.js driver, connection patterns

### 02 - CRUD Operations (5 files)

- `insertOperations.js` - insertOne, insertMany, bulk inserts
- `findOperations.js` - Querying, cursors, projections
- `updateOperations.js` - Update operators, upserts
- `deleteOperations.js` - Delete methods, soft deletes, TTL
- `bulkOperations.js` - bulkWrite, batch processing

### 03 - Queries and Filters (6 files)

- `comparisonOperators.js` - $eq, $ne, $gt, $lt, $in, $nin
- `logicalOperators.js` - $and, $or, $not, $nor
- `elementOperators.js` - $exists, $type
- `arrayOperators.js` - $all, $elemMatch, $size
- `evaluationOperators.js` - $regex, $expr, $text, $where
- `projections.js` - Field selection, array projections

### 04 - Indexes (5 files)

- `indexFundamentals.js` - Index creation, types, explain()
- `compoundIndexes.js` - ESR rule, covered queries
- `textIndexes.js` - Full-text search
- `geospatialIndexes.js` - 2dsphere, location queries
- `indexStrategies.js` - Partial, wildcard indexes

### 05 - Aggregation (6 files)

- `aggregationBasics.js` - Pipeline stages, $match, $project, $group
- `stageOperators.js` - $unwind, $facet, $bucket, $redact
- `groupAndAccumulators.js` - All accumulator operators
- `lookupAndJoins.js` - $lookup patterns
- `windowFunctions.js` - $setWindowFields, ranking
- `aggregationOptimization.js` - Performance optimization

### 06 - Data Modeling (5 files)

- `schemaDesignPatterns.js` - Bucket, Computed, Extended Reference
- `embeddingVsReferencing.js` - When to embed vs reference
- `relationshipPatterns.js` - One-to-many, many-to-many
- `schemaValidation.js` - JSON Schema validation
- `treeStructures.js` - Hierarchical data patterns

### 07 - Transactions (2 files)

- `acidTransactions.js` - Multi-document transactions
- `distributedTransactions.js` - Sessions, cross-shard transactions

### 08 - Performance (4 files)

- `queryOptimization.js` - Explain, profiling, optimization tips
- `explainPlans.js` - Reading and analyzing query plans
- `connectionPooling.js` - Pool configuration, singleton pattern
- `monitoring.js` - serverStatus, currentOp, profiler

### 09 - Security (3 files)

- `authentication.js` - Auth methods, RBAC, encryption
- `fieldLevelEncryption.js` - Client-side field level encryption
- `auditLogging.js` - Audit configuration and analysis

### 10 - Replication and Sharding (4 files)

- `replicaSetsAndSharding.js` - Replica set architecture, oplog, elections, failover, monitoring
- `sharding.js` - Sharded cluster architecture, chunks, balancer, query routing
- `readWriteConcerns.js` - Write/read concerns, causal consistency, transactions
- `shardKeyStrategies.js` - Shard key selection, anti-patterns, zone sharding

### 11 - Mongoose ODM (5 files)

- `mongooseBasics.js` - Schemas, models, CRUD
- `mongooseAdvanced.js` - Population, virtuals, plugins
- `validationAndMiddleware.js` - Validators, pre/post hooks
- `mongooseQueries.js` - Query building, lean, pagination
- `mongooseTypeScript.js` - TypeScript integration

### 12 - Advanced Patterns (5 files)

- `changeStreams.js` - Real-time data changes
- `gridFS.js` - Large file storage
- `timeSeries.js` - Time series collections
- `fullTextSearch.js` - Atlas Search, fuzzy matching
- `dataValidation.js` - Data quality, migrations

## File Format

Each file follows a consistent educational format:

```javascript
/**
 * TOPIC: [Topic Name]
 * DESCRIPTION:
 * [Brief overview of the topic]
 */

// 1. SECTION HEADING
// Detailed explanation with code examples

// SUMMARY & BEST PRACTICES
// Key takeaways and recommendations
```

## Prerequisites

- Node.js 16+
- MongoDB 6.0+
- MongoDB Node.js Driver (`npm install mongodb`)
- Mongoose (for ODM files) (`npm install mongoose`)

## Usage

These are educational reference files, not executable applications.

```bash
# Install dependencies
npm install mongodb mongoose

# Check syntax
find . -name "*.js" -exec node --check {} \;
```

## Related Resources

- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [MongoDB University](https://university.mongodb.com/)
- [Node.js Driver Docs](https://www.mongodb.com/docs/drivers/node/current/)
