# MongoDB Practice Problems

A comprehensive collection of MongoDB practice problems with solutions in `mongosh`. Each file contains hands-on exercises covering different aspects of MongoDB.

## Problem Files

| File | Topics | Problems |
|------|--------|----------|
| `01-crud-problems.js` | Find, Insert, Update, Delete, Query Operators | 40+ |
| `02-aggregation-problems.js` | Pipeline Stages, Accumulators, $lookup, $facet | 45+ |
| `03-indexing-problems.js` | Index Types, explain(), Query Optimization | 35+ |
| `04-data-modeling-problems.js` | Embedding vs Referencing, Patterns, Validation | 25+ |
| `05-transactions-advanced-problems.js` | Transactions, Change Streams, Bulk Ops, TTL | 30+ |

**Total: 175+ Practice Problems**

## How to Use

### 1. Setup
Each file starts with a **SETUP** section that creates sample data:

```javascript
use practiceDB

// Run the setup commands to create sample collections
db.users.insertMany([...])
```

### 2. Problem Format
Each problem follows this structure:

```javascript
/**
 * PROBLEM X.X: [Title]
 * 
 * [Problem description]
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.collection.find({...})
```

### 3. Practice Flow
1. Read the problem description
2. Write your solution in the `YOUR SOLUTION HERE` section
3. Compare with the provided solution
4. Run both to verify correctness

## Topics Covered

### CRUD Operations
- Basic find with filters
- Projections and field selection
- Insert (one and many)
- Update operators ($set, $inc, $push, $pull, etc.)
- Delete operations
- Query operators ($gt, $lt, $in, $regex, etc.)
- Array operators ($elemMatch, $all, $size)
- Sorting, limiting, and pagination
- findOneAndUpdate, findOneAndDelete

### Aggregation Pipeline
- $match, $project, $group
- Accumulator operators ($sum, $avg, $min, $max)
- $sort, $limit, $skip
- $unwind for arrays
- $lookup for joins
- $facet for multiple pipelines
- $bucket and $bucketAuto
- Date and string operations
- Window functions ($setWindowFields)
- $out and $merge

### Indexing & Performance
- Single-field indexes
- Compound indexes (ESR rule)
- Unique and partial indexes
- Text indexes for search
- TTL indexes
- Multikey indexes (arrays)
- explain() analysis
- Covered queries
- Index management

### Data Modeling
- Embedding vs referencing decisions
- One-to-many relationships
- Many-to-many relationships
- Schema validation (JSON Schema)
- Bucket pattern
- Computed pattern
- Extended reference pattern
- Outlier pattern
- Tree structures (materialized path, ancestors)

### Transactions & Advanced
- Multi-document transactions
- Transaction error handling
- Write and read concerns
- Change streams
- Bulk operations
- Capped collections
- TTL collections
- Database administration

## Prerequisites

- MongoDB 5.0+ (for transactions and change streams)
- mongosh (MongoDB Shell)
- For transactions/change streams: Replica set (use Atlas free tier or local replica set)

## Quick Start

```bash
# Connect to MongoDB
mongosh

# Switch to practice database
use practiceDB

# Load a problem file and run setup
# (Copy/paste from the file)
```

## Tips

1. **Always run setup first** - Each file requires sample data
2. **Use explain()** - Analyze query performance
3. **Check indexes** - Use `db.collection.getIndexes()`
4. **Verify results** - Run queries after updates to confirm changes
5. **Transactions need replica set** - Use Atlas or local replica set

## Related Resources

- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [MongoDB University](https://university.mongodb.com/)
- [mongosh Reference](https://www.mongodb.com/docs/mongodb-shell/)
