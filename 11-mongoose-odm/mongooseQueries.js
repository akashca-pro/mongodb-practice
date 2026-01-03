/**
 * TOPIC: MONGOOSE QUERIES
 * DESCRIPTION:
 * Advanced query building, pagination, lean queries, and aggregation
 * with Mongoose for optimal performance and flexibility.
 */

const mongoose = require('mongoose');

// -------------------------------------------------------------------------------------------
// 1. QUERY BUILDING
// -------------------------------------------------------------------------------------------

async function queryBuilding() {
    const User = mongoose.model('User');
    
    // Chained query methods
    const users = await User.find()
        .where('status').equals('active')
        .where('age').gte(18).lte(65)
        .where('role').in(['user', 'admin'])
        .select('name email age')
        .sort({ createdAt: -1 })
        .limit(10)
        .skip(0);
    
    // Using query conditions object
    const results = await User.find({
        status: 'active',
        age: { $gte: 18, $lte: 65 },
        role: { $in: ['user', 'admin'] }
    })
    .select('name email age')
    .sort('-createdAt')
    .limit(10);
    
    return results;
}

// -------------------------------------------------------------------------------------------
// 2. LEAN QUERIES (PERFORMANCE)
// -------------------------------------------------------------------------------------------

async function leanQueries() {
    const User = mongoose.model('User');
    
    // Regular query (Mongoose documents)
    const docs = await User.find();
    // docs[0].save() - Works, has methods
    
    // Lean query (plain JavaScript objects)
    const plainObjects = await User.find().lean();
    // plainObjects[0].save() - Undefined, no methods
    // BUT: 5-10x faster for read-only operations
    
    // Lean with virtuals
    const withVirtuals = await User.find()
        .lean({ virtuals: true });
    
    return plainObjects;
}

// -------------------------------------------------------------------------------------------
// 3. PAGINATION
// -------------------------------------------------------------------------------------------

async function pagination(page = 1, limit = 20) {
    const User = mongoose.model('User');
    
    const skip = (page - 1) * limit;
    
    // Simple pagination
    const users = await User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    
    const total = await User.countDocuments();
    
    return {
        data: users,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    };
}

// Cursor-based pagination (better for large datasets)
async function cursorPagination(lastId = null, limit = 20) {
    const User = mongoose.model('User');
    
    const query = lastId 
        ? { _id: { $gt: lastId } }
        : {};
    
    const users = await User.find(query)
        .sort({ _id: 1 })
        .limit(limit + 1)  // Fetch one extra to check hasNext
        .lean();
    
    const hasNext = users.length > limit;
    if (hasNext) users.pop();  // Remove extra
    
    return {
        data: users,
        hasNext,
        nextCursor: users.length ? users[users.length - 1]._id : null
    };
}

// -------------------------------------------------------------------------------------------
// 4. AGGREGATION WITH MONGOOSE
// -------------------------------------------------------------------------------------------

async function aggregationExamples() {
    const Order = mongoose.model('Order');
    
    // Basic aggregation
    const stats = await Order.aggregate([
        { $match: { status: 'completed' } },
        { $group: {
            _id: '$customerId',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            avgOrder: { $avg: '$total' }
        }},
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
    ]);
    
    // With mongoose-specific features
    const results = await Order.aggregate([
        { $match: { status: 'completed' } }
    ])
    .allowDiskUse(true)
    .readPreference('secondaryPreferred')
    .exec();
    
    return stats;
}

// -------------------------------------------------------------------------------------------
// 5. QUERY HELPERS
// -------------------------------------------------------------------------------------------

const userSchema = new mongoose.Schema({
    name: String,
    status: String,
    role: String,
    createdAt: Date
});

// Define query helpers
userSchema.query.active = function() {
    return this.where({ status: 'active' });
};

userSchema.query.recent = function(days = 30) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.where({ createdAt: { $gte: date } });
};

userSchema.query.byRole = function(role) {
    return this.where({ role });
};

// Usage: User.find().active().recent(7).byRole('admin')

// -------------------------------------------------------------------------------------------
// 6. EXEC VS THEN
// -------------------------------------------------------------------------------------------

async function execVsThen() {
    const User = mongoose.model('User');
    
    // Both work, exec() is more explicit
    const users1 = await User.find().exec();
    const users2 = await User.find();
    
    // exec() returns proper Mongoose Query promise
    // Useful for error handling
    User.find().exec()
        .then(users => console.log(users))
        .catch(err => console.error(err));
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * QUERY PATTERNS:
 * 
 * 1. Use lean() for read-only operations
 * 2. Implement proper pagination
 * 3. Use query helpers for reusable conditions
 * 4. Prefer cursor pagination for large datasets
 * 
 * BEST PRACTICES:
 * - Always add indexes for query fields
 * - Use lean() + virtuals when needed
 * - Limit projection to required fields
 * - Use allowDiskUse for large aggregations
 */

module.exports = {
    queryBuilding,
    leanQueries,
    pagination,
    cursorPagination,
    aggregationExamples
};
