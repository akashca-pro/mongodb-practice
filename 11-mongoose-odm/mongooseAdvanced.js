/**
 * TOPIC: MONGOOSE ADVANCED
 * DESCRIPTION:
 * Advanced Mongoose features including population, virtuals,
 * plugins, and query helpers.
 */

const mongoose = require('mongoose');

// -------------------------------------------------------------------------------------------
// 1. POPULATION (JOINS)
// -------------------------------------------------------------------------------------------

const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
});

const commentSchema = new mongoose.Schema({
    text: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

async function populateExamples() {
    const Post = mongoose.model('Post', postSchema);
    
    // Basic populate
    const post = await Post.findById(id).populate('author');
    
    // Multiple populate
    const postFull = await Post.findById(id)
        .populate('author')
        .populate('comments');
    
    // Nested populate
    const postNested = await Post.findById(id)
        .populate({
            path: 'comments',
            populate: { path: 'author', select: 'name' }
        });
    
    // Selective fields
    const postSelect = await Post.findById(id)
        .populate('author', 'name email');
    
    // With conditions
    const postFiltered = await Post.findById(id)
        .populate({
            path: 'comments',
            match: { approved: true },
            select: 'text'
        });
}

// -------------------------------------------------------------------------------------------
// 2. VIRTUALS
// -------------------------------------------------------------------------------------------

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual getter
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual setter
userSchema.virtual('fullName').set(function(v) {
    const parts = v.split(' ');
    this.firstName = parts[0];
    this.lastName = parts[1];
});

// Virtual populate
userSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'author'
});

// -------------------------------------------------------------------------------------------
// 3. PLUGINS
// -------------------------------------------------------------------------------------------

// Custom plugin
function timestampPlugin(schema, options) {
    schema.add({ 
        createdAt: Date,
        updatedAt: Date 
    });
    
    schema.pre('save', function(next) {
        const now = new Date();
        this.updatedAt = now;
        if (!this.createdAt) this.createdAt = now;
        next();
    });
}

// Apply plugin
userSchema.plugin(timestampPlugin);

// Global plugin (all schemas)
// mongoose.plugin(timestampPlugin);

// -------------------------------------------------------------------------------------------
// 4. QUERY HELPERS
// -------------------------------------------------------------------------------------------

userSchema.query.active = function() {
    return this.where({ isActive: true });
};

userSchema.query.byRole = function(role) {
    return this.where({ role });
};

// Usage: User.find().active().byRole('admin')

// -------------------------------------------------------------------------------------------
// 5. DISCRIMINATION (INHERITANCE)
// -------------------------------------------------------------------------------------------

const eventSchema = new mongoose.Schema({
    name: String,
    date: Date
}, { discriminatorKey: 'kind' });

const Event = mongoose.model('Event', eventSchema);

// Child schemas
const ClickEvent = Event.discriminator('Click', new mongoose.Schema({
    element: String,
    url: String
}));

const PurchaseEvent = Event.discriminator('Purchase', new mongoose.Schema({
    product: String,
    amount: Number
}));

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * ADVANCED MONGOOSE:
 * 
 * 1. Populate: Join referenced documents
 * 2. Virtuals: Computed properties, reverse populate
 * 3. Plugins: Reusable schema extensions
 * 4. Query helpers: Chainable query methods
 * 5. Discriminators: Single collection inheritance
 * 
 * BEST PRACTICES:
 * - Use lean() for read-only queries (5x faster)
 * - Limit population depth
 * - Create plugins for common patterns
 * - Use virtual populate for reverse relationships
 */

module.exports = { populateExamples };
