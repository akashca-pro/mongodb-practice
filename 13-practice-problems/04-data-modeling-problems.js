/**
 * MONGODB PRACTICE PROBLEMS - DATA MODELING & SCHEMA DESIGN
 * 
 * This file contains practice problems for MongoDB schema design.
 * Learn to model data effectively using embedding vs referencing,
 * design patterns, and schema validation.
 * 
 * RUN IN MONGOSH: Copy and paste commands into mongosh to practice.
 */

// ==========================================================================================
// SETUP
// ==========================================================================================

// use practiceDB


// ==========================================================================================
// PROBLEM 1: Embedding vs Referencing
// ==========================================================================================

/**
 * PROBLEM 1.1: Design - Blog with Comments (Embedding)
 * 
 * Design a blog post schema that EMBEDS comments directly in the post.
 * Create a sample blog post with 3 comments.
 * 
 * When to embed: Comments are always fetched with the post, limited comments per post.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.blog_embedded.drop()
db.blog_embedded.insertOne({
    _id: ObjectId(),
    title: "Introduction to MongoDB",
    slug: "intro-to-mongodb",
    author: {
        _id: 1,
        name: "John Doe",
        email: "john@example.com"
    },
    content: "MongoDB is a NoSQL document database...",
    tags: ["mongodb", "database", "nosql"],
    publishedAt: new Date("2024-01-15"),
    views: 1250,
    comments: [
        {
            _id: ObjectId(),
            author: "Alice",
            email: "alice@example.com",
            content: "Great article!",
            createdAt: new Date("2024-01-16"),
            likes: 5
        },
        {
            _id: ObjectId(),
            author: "Bob",
            email: "bob@example.com",
            content: "Very helpful, thanks!",
            createdAt: new Date("2024-01-17"),
            likes: 3
        },
        {
            _id: ObjectId(),
            author: "Charlie",
            email: "charlie@example.com",
            content: "Can you write more about aggregation?",
            createdAt: new Date("2024-01-18"),
            likes: 8
        }
    ],
    commentCount: 3
})

// Verify
db.blog_embedded.findOne()

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.2: Design - Blog with Comments (Referencing)
 * 
 * Design a blog system using REFERENCES for comments (separate collection).
 * Create a blog post and 3 separate comment documents.
 * 
 * When to reference: Unlimited comments, independent access to comments.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.blog_posts.drop()
db.blog_comments.drop()

const postId = ObjectId()

db.blog_posts.insertOne({
    _id: postId,
    title: "Advanced MongoDB Aggregation",
    slug: "advanced-aggregation",
    author: {
        _id: 2,
        name: "Jane Smith"
    },
    content: "Let's dive deep into aggregation pipelines...",
    tags: ["mongodb", "aggregation"],
    publishedAt: new Date("2024-01-20"),
    views: 890,
    commentCount: 3
})

db.blog_comments.insertMany([
    {
        _id: ObjectId(),
        postId: postId,  // Reference to post
        author: "Diana",
        email: "diana@example.com",
        content: "Finally someone explained $lookup properly!",
        createdAt: new Date("2024-01-21"),
        likes: 12
    },
    {
        _id: ObjectId(),
        postId: postId,
        author: "Edward",
        email: "edward@example.com",
        content: "The $facet example was very useful.",
        createdAt: new Date("2024-01-22"),
        likes: 7
    },
    {
        _id: ObjectId(),
        postId: postId,
        author: "Fiona",
        email: "fiona@example.com",
        content: "Could you cover $graphLookup next?",
        createdAt: new Date("2024-01-23"),
        likes: 4
    }
])

// Query post with comments using $lookup
db.blog_posts.aggregate([
    { $match: { slug: "advanced-aggregation" } },
    {
        $lookup: {
            from: "blog_comments",
            localField: "_id",
            foreignField: "postId",
            as: "comments"
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.3: Design - E-commerce Product with Reviews
 * 
 * Design a product schema using the HYBRID approach:
 * - Embed basic product info
 * - Embed summary review stats (avg rating, total reviews)
 * - Reference individual reviews
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products_hybrid.drop()
db.product_reviews.drop()

const productId = ObjectId()

// Product with embedded summary stats
db.products_hybrid.insertOne({
    _id: productId,
    name: "Wireless Headphones Pro",
    category: "Electronics",
    price: 299.99,
    description: "Premium noise-canceling wireless headphones",
    specifications: {
        brand: "AudioTech",
        connectivity: "Bluetooth 5.0",
        batteryLife: "30 hours",
        weight: "250g"
    },
    // Embedded summary (denormalized)
    reviewSummary: {
        averageRating: 4.6,
        totalReviews: 3,
        ratingDistribution: {
            "5": 2,
            "4": 1,
            "3": 0,
            "2": 0,
            "1": 0
        }
    },
    inStock: true,
    createdAt: new Date()
})

// Reviews in separate collection
db.product_reviews.insertMany([
    {
        _id: ObjectId(),
        productId: productId,
        userId: 101,
        userName: "John D.",
        rating: 5,
        title: "Best headphones ever!",
        content: "Amazing sound quality and comfort.",
        helpful: 15,
        createdAt: new Date("2024-01-10")
    },
    {
        _id: ObjectId(),
        productId: productId,
        userId: 102,
        userName: "Sarah M.",
        rating: 5,
        title: "Worth every penny",
        content: "Noise cancellation is incredible.",
        helpful: 8,
        createdAt: new Date("2024-01-12")
    },
    {
        _id: ObjectId(),
        productId: productId,
        userId: 103,
        userName: "Mike R.",
        rating: 4,
        title: "Great but pricey",
        content: "Excellent quality, just a bit expensive.",
        helpful: 5,
        createdAt: new Date("2024-01-15")
    }
])


// ==========================================================================================
// PROBLEM 2: One-to-Many Relationships
// ==========================================================================================

/**
 * PROBLEM 2.1: One-to-Few - User with Addresses
 * 
 * Design a user schema with embedded addresses (most users have 1-3 addresses).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users_addresses.drop()

db.users_addresses.insertOne({
    _id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    addresses: [
        {
            type: "home",
            street: "123 Main St",
            city: "New York",
            state: "NY",
            zip: "10001",
            isDefault: true
        },
        {
            type: "work",
            street: "456 Office Blvd",
            city: "New York",
            state: "NY",
            zip: "10002",
            isDefault: false
        }
    ]
})

// Query: Find user's default address
db.users_addresses.findOne({ _id: 1 }, { addresses: { $elemMatch: { isDefault: true } } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.2: One-to-Many - Author with Books (Child Reference)
 * 
 * Design schema where Book documents reference their Author.
 * This is better when you have many books per author.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.authors.drop()
db.books.drop()

db.authors.insertOne({
    _id: 1,
    name: "Stephen King",
    birthYear: 1947,
    genres: ["Horror", "Thriller", "Fantasy"]
})

db.books.insertMany([
    { _id: 101, title: "The Shining", authorId: 1, year: 1977, pages: 447 },
    { _id: 102, title: "It", authorId: 1, year: 1986, pages: 1138 },
    { _id: 103, title: "Misery", authorId: 1, year: 1987, pages: 310 }
])

// Query: Get author with all their books
db.authors.aggregate([
    { $match: { _id: 1 } },
    {
        $lookup: {
            from: "books",
            localField: "_id",
            foreignField: "authorId",
            as: "books"
        }
    }
])

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.3: One-to-Many - Category with Products (Parent Reference in Array)
 * 
 * Design where Category embeds an array of product IDs.
 * Good for bounded sets (e.g., featured products).
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.categories.drop()
db.category_products.drop()

db.category_products.insertMany([
    { _id: "P001", name: "Laptop", price: 999 },
    { _id: "P002", name: "Mouse", price: 49 },
    { _id: "P003", name: "Keyboard", price: 129 }
])

db.categories.insertOne({
    _id: "electronics",
    name: "Electronics",
    description: "Electronic devices and accessories",
    featuredProducts: ["P001", "P002"],  // Array of references
    productCount: 3
})

// Query: Get category with featured product details
db.categories.aggregate([
    { $match: { _id: "electronics" } },
    {
        $lookup: {
            from: "category_products",
            localField: "featuredProducts",
            foreignField: "_id",
            as: "featuredProductDetails"
        }
    }
])


// ==========================================================================================
// PROBLEM 3: Many-to-Many Relationships
// ==========================================================================================

/**
 * PROBLEM 3.1: Students and Courses
 * 
 * Design a many-to-many relationship between students and courses.
 * Use the array of references approach.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.students.drop()
db.courses.drop()

db.courses.insertMany([
    { _id: "CS101", name: "Intro to Programming", credits: 3 },
    { _id: "CS201", name: "Data Structures", credits: 4 },
    { _id: "CS301", name: "Databases", credits: 3 }
])

db.students.insertMany([
    {
        _id: 1,
        name: "Alice",
        enrolledCourses: ["CS101", "CS201"]  // References to courses
    },
    {
        _id: 2,
        name: "Bob",
        enrolledCourses: ["CS101", "CS301"]
    },
    {
        _id: 3,
        name: "Charlie",
        enrolledCourses: ["CS201", "CS301"]
    }
])

// Query: Get student with course details
db.students.aggregate([
    { $match: { _id: 1 } },
    {
        $lookup: {
            from: "courses",
            localField: "enrolledCourses",
            foreignField: "_id",
            as: "courseDetails"
        }
    }
])

// Query: Find all students in CS101
db.students.find({ enrolledCourses: "CS101" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.2: Products and Tags with Junction Collection
 * 
 * Design a many-to-many with a junction collection that stores additional data.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.tag_products.drop()
db.tags.drop()
db.product_tags.drop()  // Junction collection

db.tag_products.insertMany([
    { _id: "P1", name: "Gaming Laptop" },
    { _id: "P2", name: "Office Laptop" }
])

db.tags.insertMany([
    { _id: "T1", name: "Gaming" },
    { _id: "T2", name: "Work" },
    { _id: "T3", name: "Portable" }
])

// Junction collection with additional metadata
db.product_tags.insertMany([
    { productId: "P1", tagId: "T1", addedBy: "admin", addedAt: new Date() },
    { productId: "P1", tagId: "T3", addedBy: "admin", addedAt: new Date() },
    { productId: "P2", tagId: "T2", addedBy: "moderator", addedAt: new Date() },
    { productId: "P2", tagId: "T3", addedBy: "admin", addedAt: new Date() }
])

// Query: Get product with all its tags
db.tag_products.aggregate([
    { $match: { _id: "P1" } },
    {
        $lookup: {
            from: "product_tags",
            localField: "_id",
            foreignField: "productId",
            as: "tagRelations"
        }
    },
    {
        $lookup: {
            from: "tags",
            localField: "tagRelations.tagId",
            foreignField: "_id",
            as: "tags"
        }
    },
    { $project: { name: 1, "tags.name": 1 } }
])


// ==========================================================================================
// PROBLEM 4: Schema Validation
// ==========================================================================================

/**
 * PROBLEM 4.1: Create collection with JSON Schema validation
 * 
 * Create a "products" collection with validation:
 * - name: required string
 * - price: required number, minimum 0
 * - category: required, enum ["Electronics", "Furniture", "Clothing"]
 * - inStock: required boolean
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.validated_products.drop()

db.createCollection("validated_products", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "price", "category", "inStock"],
            properties: {
                name: {
                    bsonType: "string",
                    description: "Product name is required"
                },
                price: {
                    bsonType: "number",
                    minimum: 0,
                    description: "Price must be a non-negative number"
                },
                category: {
                    enum: ["Electronics", "Furniture", "Clothing"],
                    description: "Category must be one of the allowed values"
                },
                inStock: {
                    bsonType: "bool",
                    description: "Stock status is required"
                }
            }
        }
    },
    validationAction: "error"  // or "warn"
})

// Test: Valid document
db.validated_products.insertOne({
    name: "Laptop",
    price: 999.99,
    category: "Electronics",
    inStock: true
})

// Test: Invalid document (should fail)
try {
    db.validated_products.insertOne({
        name: "Chair",
        price: -50,  // Invalid: negative
        category: "InvalidCategory",  // Invalid: not in enum
        inStock: true
    })
} catch (e) {
    print("Validation error:", e.message)
}

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.2: Add validation to existing collection
 * 
 * Add validation to require email format in users collection.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.validated_users.drop()
db.validated_users.insertOne({ name: "Test", email: "test@test.com" })

db.runCommand({
    collMod: "validated_users",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email"],
            properties: {
                name: { bsonType: "string" },
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    description: "Must be a valid email format"
                }
            }
        }
    },
    validationLevel: "moderate"  // Only validate updates to existing docs
})


// ==========================================================================================
// PROBLEM 5: Design Patterns
// ==========================================================================================

/**
 * PROBLEM 5.1: Bucket Pattern
 * 
 * Design a schema for IoT sensor data using the bucket pattern.
 * Group readings by hour to reduce document count.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.sensor_buckets.drop()

// Instead of one doc per reading, group by hour
db.sensor_buckets.insertOne({
    sensor_id: "SENSOR-001",
    bucket_start: new Date("2024-01-15T10:00:00Z"),
    bucket_end: new Date("2024-01-15T11:00:00Z"),
    readings_count: 4,
    readings: [
        { timestamp: new Date("2024-01-15T10:00:00Z"), temp: 22.5, humidity: 45 },
        { timestamp: new Date("2024-01-15T10:15:00Z"), temp: 22.8, humidity: 44 },
        { timestamp: new Date("2024-01-15T10:30:00Z"), temp: 23.1, humidity: 43 },
        { timestamp: new Date("2024-01-15T10:45:00Z"), temp: 23.0, humidity: 44 }
    ],
    // Pre-computed stats for quick access
    stats: {
        temp: { min: 22.5, max: 23.1, avg: 22.85 },
        humidity: { min: 43, max: 45, avg: 44 }
    }
})

// Add new reading to existing bucket
db.sensor_buckets.updateOne(
    { 
        sensor_id: "SENSOR-001",
        bucket_start: new Date("2024-01-15T10:00:00Z"),
        readings_count: { $lt: 60 }  // Max readings per bucket
    },
    {
        $push: { 
            readings: { 
                timestamp: new Date("2024-01-15T10:55:00Z"), 
                temp: 23.2, 
                humidity: 42 
            } 
        },
        $inc: { readings_count: 1 },
        $min: { "stats.temp.min": 23.2, "stats.humidity.min": 42 },
        $max: { "stats.temp.max": 23.2, "stats.humidity.max": 42 }
    }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.2: Computed Pattern
 * 
 * Design a product schema that pre-computes review statistics
 * to avoid expensive aggregations.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.computed_products.drop()

db.computed_products.insertOne({
    _id: "PROD-001",
    name: "Wireless Earbuds",
    price: 79.99,
    // Pre-computed fields (updated on each review)
    computed: {
        reviewCount: 150,
        avgRating: 4.3,
        ratingSum: 645,  // For recalculating avg
        lastReviewDate: new Date("2024-01-20")
    }
})

// Function to add a review and update computed fields
function addReview(productId, rating) {
    db.computed_products.updateOne(
        { _id: productId },
        {
            $inc: {
                "computed.reviewCount": 1,
                "computed.ratingSum": rating
            },
            $set: {
                "computed.lastReviewDate": new Date()
            }
        }
    )
    
    // Recalculate average
    const product = db.computed_products.findOne({ _id: productId })
    const newAvg = product.computed.ratingSum / product.computed.reviewCount
    
    db.computed_products.updateOne(
        { _id: productId },
        { $set: { "computed.avgRating": Math.round(newAvg * 10) / 10 } }
    )
}

// Test
addReview("PROD-001", 5)
db.computed_products.findOne({ _id: "PROD-001" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.3: Extended Reference Pattern
 * 
 * Design an order schema that copies frequently accessed customer data
 * to avoid joins for common queries.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.extended_orders.drop()
db.extended_customers.drop()

db.extended_customers.insertOne({
    _id: "CUST-001",
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "555-0100",
    addresses: [/* ... */],
    memberSince: new Date("2020-01-15")
})

// Order with extended reference to customer
db.extended_orders.insertOne({
    _id: "ORD-001",
    orderDate: new Date(),
    status: "processing",
    items: [
        { productId: "P1", name: "Laptop", quantity: 1, price: 999 }
    ],
    total: 999,
    // Extended reference: copied data for quick access
    customer: {
        _id: "CUST-001",  // Reference for $lookup if needed
        name: "Alice Johnson",
        email: "alice@example.com"
        // Only copy what you frequently need
    },
    shippingAddress: {/* ... */}
})

// Now most order queries don't need a $lookup
db.extended_orders.find({ "customer.email": "alice@example.com" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.4: Outlier Pattern
 * 
 * Design a schema for a social media post where most posts have few likes
 * but some viral posts have millions.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.social_posts.drop()
db.post_likes_overflow.drop()

// Normal post: likes embedded (works for most posts)
db.social_posts.insertOne({
    _id: "POST-001",
    content: "Regular post",
    userId: 1,
    createdAt: new Date(),
    likeCount: 3,
    likes: [101, 102, 103],  // User IDs
    hasOverflow: false
})

// Viral post: uses overflow collection
db.social_posts.insertOne({
    _id: "POST-002",
    content: "Viral post!",
    userId: 2,
    createdAt: new Date(),
    likeCount: 1500000,
    likes: [],  // Too many to embed
    hasOverflow: true  // Flag to check overflow collection
})

// Overflow collection for viral posts
db.post_likes_overflow.insertMany([
    { postId: "POST-002", userId: 201, likedAt: new Date() },
    { postId: "POST-002", userId: 202, likedAt: new Date() }
    // ... millions more
])

// Create index for efficient queries
db.post_likes_overflow.createIndex({ postId: 1, userId: 1 })

// Check if user liked a post
function userLikedPost(postId, userId) {
    const post = db.social_posts.findOne({ _id: postId })
    
    if (!post.hasOverflow) {
        return post.likes.includes(userId)
    } else {
        return db.post_likes_overflow.findOne({ postId, userId }) !== null
    }
}


// ==========================================================================================
// PROBLEM 6: Tree Structures
// ==========================================================================================

/**
 * PROBLEM 6.1: Materialized Path Pattern
 * 
 * Design a category hierarchy using materialized paths.
 * Electronics > Computers > Laptops > Gaming Laptops
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.category_tree.drop()

db.category_tree.insertMany([
    { _id: "electronics", name: "Electronics", path: ",electronics,", parent: null },
    { _id: "computers", name: "Computers", path: ",electronics,computers,", parent: "electronics" },
    { _id: "laptops", name: "Laptops", path: ",electronics,computers,laptops,", parent: "computers" },
    { _id: "gaming-laptops", name: "Gaming Laptops", path: ",electronics,computers,laptops,gaming-laptops,", parent: "laptops" },
    { _id: "phones", name: "Phones", path: ",electronics,phones,", parent: "electronics" }
])

// Create index for path queries
db.category_tree.createIndex({ path: 1 })

// Find all descendants of "electronics"
db.category_tree.find({ path: { $regex: /^,electronics,/ } })

// Find all ancestors of "gaming-laptops"
const gamingLaptop = db.category_tree.findOne({ _id: "gaming-laptops" })
const ancestorIds = gamingLaptop.path.split(',').filter(id => id)
db.category_tree.find({ _id: { $in: ancestorIds } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.2: Array of Ancestors Pattern
 * 
 * Design the same category hierarchy using ancestors array.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.category_ancestors.drop()

db.category_ancestors.insertMany([
    { _id: "electronics", name: "Electronics", ancestors: [], parent: null, level: 0 },
    { _id: "computers", name: "Computers", ancestors: ["electronics"], parent: "electronics", level: 1 },
    { _id: "laptops", name: "Laptops", ancestors: ["electronics", "computers"], parent: "computers", level: 2 },
    { _id: "gaming-laptops", name: "Gaming Laptops", ancestors: ["electronics", "computers", "laptops"], parent: "laptops", level: 3 }
])

// Find all ancestors of "gaming-laptops"
const cat = db.category_ancestors.findOne({ _id: "gaming-laptops" })
db.category_ancestors.find({ _id: { $in: cat.ancestors } })

// Find all descendants of "electronics"
db.category_ancestors.find({ ancestors: "electronics" })


// ==========================================================================================
// PROBLEM 7: Real-World Schema Design Examples
// ==========================================================================================

/**
 * PROBLEM 7.1: Design a complete E-commerce Order System
 * 
 * Design schemas for: Users, Products, Orders, Shipping
 * Consider: What to embed, what to reference, what to denormalize
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.ecom_users.drop()
db.ecom_products.drop()
db.ecom_orders.drop()

// Users collection
db.ecom_users.insertOne({
    _id: ObjectId(),
    email: "customer@example.com",
    passwordHash: "...",
    profile: {
        firstName: "John",
        lastName: "Doe",
        phone: "555-0100"
    },
    addresses: [
        {
            _id: ObjectId(),
            label: "Home",
            street: "123 Main St",
            city: "New York",
            state: "NY",
            zip: "10001",
            country: "USA",
            isDefault: true
        }
    ],
    paymentMethods: [
        {
            _id: ObjectId(),
            type: "card",
            last4: "4242",
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true
        }
    ],
    createdAt: new Date(),
    lastLoginAt: new Date()
})

// Products collection
db.ecom_products.insertOne({
    _id: ObjectId(),
    sku: "LAPTOP-001",
    name: "Professional Laptop",
    description: "High-performance laptop for professionals",
    price: 1299.99,
    compareAtPrice: 1499.99,  // Original price for "sale" display
    category: ["Electronics", "Computers", "Laptops"],
    brand: "TechBrand",
    images: [
        { url: "/images/laptop-1.jpg", isPrimary: true },
        { url: "/images/laptop-2.jpg", isPrimary: false }
    ],
    variants: [
        { sku: "LAPTOP-001-8GB", ram: "8GB", storage: "256GB", price: 1299.99, stock: 50 },
        { sku: "LAPTOP-001-16GB", ram: "16GB", storage: "512GB", price: 1499.99, stock: 25 }
    ],
    // Pre-computed review stats
    reviews: {
        average: 4.5,
        count: 128
    },
    seo: {
        title: "Professional Laptop | TechBrand",
        description: "...",
        slug: "professional-laptop"
    },
    isActive: true,
    createdAt: new Date()
})

// Orders collection
const userId = ObjectId()
db.ecom_orders.insertOne({
    _id: ObjectId(),
    orderNumber: "ORD-2024-001234",
    userId: userId,
    // Denormalized customer info (snapshot at order time)
    customer: {
        email: "customer@example.com",
        name: "John Doe",
        phone: "555-0100"
    },
    items: [
        {
            productId: ObjectId(),
            sku: "LAPTOP-001-16GB",
            name: "Professional Laptop",  // Snapshot
            variant: { ram: "16GB", storage: "512GB" },
            price: 1499.99,  // Price at time of order
            quantity: 1,
            subtotal: 1499.99
        }
    ],
    pricing: {
        subtotal: 1499.99,
        shipping: 0,
        tax: 134.99,
        discount: 0,
        total: 1634.98
    },
    // Snapshot of shipping address
    shippingAddress: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA"
    },
    shipping: {
        method: "express",
        carrier: "FedEx",
        trackingNumber: null,
        estimatedDelivery: new Date("2024-01-25")
    },
    payment: {
        method: "card",
        last4: "4242",
        status: "captured"
    },
    status: "processing",
    statusHistory: [
        { status: "pending", timestamp: new Date("2024-01-20T10:00:00Z") },
        { status: "paid", timestamp: new Date("2024-01-20T10:01:00Z") },
        { status: "processing", timestamp: new Date("2024-01-20T10:05:00Z") }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
})

// Create useful indexes
db.ecom_orders.createIndex({ userId: 1, createdAt: -1 })
db.ecom_orders.createIndex({ orderNumber: 1 }, { unique: true })
db.ecom_orders.createIndex({ status: 1 })
db.ecom_products.createIndex({ "seo.slug": 1 }, { unique: true })
db.ecom_products.createIndex({ category: 1 })


// ==========================================================================================
// CLEANUP
// ==========================================================================================

// Clean up when done
/*
db.blog_embedded.drop()
db.blog_posts.drop()
db.blog_comments.drop()
db.products_hybrid.drop()
db.product_reviews.drop()
... etc
*/

print("✅ All Data Modeling practice problems completed!")
