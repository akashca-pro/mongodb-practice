/**
 * TOPIC: MONGOOSE VALIDATION AND MIDDLEWARE
 * DESCRIPTION:
 * Custom validation rules and middleware hooks for Mongoose schemas.
 * Control data integrity and add business logic to operations.
 */

const mongoose = require('mongoose');

// -------------------------------------------------------------------------------------------
// 1. BUILT-IN VALIDATORS
// -------------------------------------------------------------------------------------------

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        minlength: [3, 'Name must be at least 3 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
        trim: true
    },
    email: {
        type: String,
        match: [/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/, 'Invalid email'],
        lowercase: true
    },
    price: {
        type: Number,
        required: true,
        min: [0, 'Price cannot be negative'],
        max: [1000000, 'Price too high']
    },
    category: {
        type: String,
        enum: {
            values: ['electronics', 'clothing', 'food'],
            message: '{VALUE} is not a valid category'
        }
    },
    tags: {
        type: [String],
        validate: {
            validator: function(v) {
                return v.length <= 10;
            },
            message: 'Cannot have more than 10 tags'
        }
    }
});

// -------------------------------------------------------------------------------------------
// 2. CUSTOM VALIDATORS
// -------------------------------------------------------------------------------------------

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, and underscores'
        }
    },
    age: {
        type: Number,
        validate: {
            validator: Number.isInteger,
            message: 'Age must be an integer'
        }
    },
    password: {
        type: String,
        validate: {
            validator: function(v) {
                return v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v);
            },
            message: 'Password must be 8+ chars with uppercase and number'
        }
    }
});

// Async validator
userSchema.path('email').validate({
    validator: async function(email) {
        const count = await mongoose.models.User.countDocuments({ email });
        return count === 0 || this._id;  // Allow same email for same user
    },
    message: 'Email already exists'
});

// -------------------------------------------------------------------------------------------
// 3. PRE MIDDLEWARE (HOOKS)
// -------------------------------------------------------------------------------------------

const orderSchema = new mongoose.Schema({
    items: [{ product: String, qty: Number, price: Number }],
    subtotal: Number,
    tax: Number,
    total: Number,
    status: String
});

// Pre-save: Calculate totals
orderSchema.pre('save', function(next) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    this.tax = this.subtotal * 0.1;
    this.total = this.subtotal + this.tax;
    next();
});

// Pre-save: Hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    // const bcrypt = require('bcrypt');
    // this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Pre-find: Add default filter
userSchema.pre('find', function() {
    this.where({ isDeleted: { $ne: true } });
});

// Pre-updateOne
userSchema.pre('updateOne', function() {
    this.set({ updatedAt: new Date() });
});

// Pre-remove
orderSchema.pre('deleteOne', { document: true }, async function() {
    // Cleanup related data
    console.log('Cleaning up order:', this._id);
});

// -------------------------------------------------------------------------------------------
// 4. POST MIDDLEWARE
// -------------------------------------------------------------------------------------------

// Post-save: Log creation
orderSchema.post('save', function(doc) {
    console.log('Order created:', doc._id);
});

// Post-find: Transform results
userSchema.post('find', function(docs) {
    docs.forEach(doc => {
        doc.fullName = `${doc.firstName} ${doc.lastName}`;
    });
});

// Post-save error handling
userSchema.post('save', function(error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Duplicate key error'));
    } else {
        next(error);
    }
});

// -------------------------------------------------------------------------------------------
// 5. VALIDATION ERROR HANDLING
// -------------------------------------------------------------------------------------------

async function handleValidationErrors() {
    const User = mongoose.model('User', userSchema);
    
    try {
        const user = new User({ username: 'ab', age: 5.5 });
        await user.validate();
    } catch (error) {
        if (error.name === 'ValidationError') {
            for (const field in error.errors) {
                console.log(`${field}: ${error.errors[field].message}`);
            }
        }
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * VALIDATION:
 * - Built-in: required, min, max, enum, match
 * - Custom: validator function, async validators
 * 
 * MIDDLEWARE:
 * - Pre: Before operation (save, find, update, delete)
 * - Post: After operation, for logging/cleanup
 * 
 * BEST PRACTICES:
 * - Use built-in validators when possible
 * - Keep middleware focused and fast
 * - Handle errors in post hooks
 * - Use async/await in async validators
 */

module.exports = { productSchema, userSchema, orderSchema };
