/**
 * TOPIC: MONGOOSE ODM BASICS
 * DESCRIPTION:
 * Mongoose is an Object Document Mapper (ODM) for MongoDB and Node.js.
 * It provides schema validation, middleware, and query building.
 */

const mongoose = require('mongoose');

// -------------------------------------------------------------------------------------------
// 1. CONNECTION
// -------------------------------------------------------------------------------------------

async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/myapp', {
            // Connection options
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Connection failed:', error);
    }
}

// Handle connection events
mongoose.connection.on('connected', () => console.log('Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

// -------------------------------------------------------------------------------------------
// 2. SCHEMA DEFINITION
// -------------------------------------------------------------------------------------------

const userSchema = new mongoose.Schema({
    // Basic types
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    age: { type: Number, min: 0, max: 150 },
    isActive: { type: Boolean, default: true },
    
    // Nested object
    profile: {
        bio: String,
        avatar: String
    },
    
    // Array
    tags: [String],
    
    // Reference
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    
    // Enum
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now }
}, {
    timestamps: true,  // Auto createdAt/updatedAt
    collection: 'users'  // Collection name
});

// -------------------------------------------------------------------------------------------
// 3. MODEL CREATION
// -------------------------------------------------------------------------------------------

const User = mongoose.model('User', userSchema);

// -------------------------------------------------------------------------------------------
// 4. CRUD OPERATIONS
// -------------------------------------------------------------------------------------------

async function crudOperations() {
    // Create
    const user = new User({ name: 'John', email: 'john@example.com' });
    await user.save();
    // Or: await User.create({ name: 'John', email: 'john@example.com' });
    
    // Read
    const found = await User.findById(user._id);
    const all = await User.find({ isActive: true });
    const one = await User.findOne({ email: 'john@example.com' });
    
    // Update
    await User.updateOne({ _id: user._id }, { name: 'John Doe' });
    const updated = await User.findByIdAndUpdate(
        user._id,
        { name: 'John Doe' },
        { new: true, runValidators: true }
    );
    
    // Delete
    await User.deleteOne({ _id: user._id });
    await User.findByIdAndDelete(user._id);
}

// -------------------------------------------------------------------------------------------
// 5. INSTANCE AND STATIC METHODS
// -------------------------------------------------------------------------------------------

// Instance method
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Static method
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email });
};

// Virtuals
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// -------------------------------------------------------------------------------------------
// 6. MIDDLEWARE (HOOKS)
// -------------------------------------------------------------------------------------------

// Pre-save hook
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        // Hash password before saving
    }
    next();
});

// Post-save hook
userSchema.post('save', function(doc) {
    console.log('User saved:', doc._id);
});

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * MONGOOSE KEY POINTS:
 * 
 * 1. Schemas define document structure and validation
 * 2. Models are compiled from schemas
 * 3. Built-in validation: required, min, max, enum
 * 4. Middleware for pre/post operation hooks
 * 5. Use virtuals for computed properties
 * 
 * BEST PRACTICES:
 * - Define schemas in separate files
 * - Use lean() for read-only queries
 * - Enable timestamps option
 * - Add indexes to schema definition
 */

module.exports = { User, connectToMongoDB };
