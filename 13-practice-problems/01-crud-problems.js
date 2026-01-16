/**
 * MONGODB PRACTICE PROBLEMS - CRUD OPERATIONS
 * 
 * This file contains practice problems for MongoDB CRUD operations.
 * Each problem includes the question, sample data setup, and solution.
 * 
 * RUN IN MONGOSH: Copy and paste commands into mongosh to practice.
 */

// ==========================================================================================
// SETUP: Create sample database and collections
// ==========================================================================================

// Switch to practice database
// use practiceDB

// Drop existing collections for clean start
db.users.drop()
db.products.drop()
db.orders.drop()

// Insert sample users
db.users.insertMany([
    { _id: 1, name: "John Doe", email: "john@example.com", age: 28, city: "New York", isActive: true, skills: ["JavaScript", "MongoDB", "React"], createdAt: new Date("2023-01-15") },
    { _id: 2, name: "Jane Smith", email: "jane@example.com", age: 34, city: "Los Angeles", isActive: true, skills: ["Python", "Django", "PostgreSQL"], createdAt: new Date("2023-02-20") },
    { _id: 3, name: "Bob Wilson", email: "bob@example.com", age: 45, city: "Chicago", isActive: false, skills: ["Java", "Spring", "MySQL"], createdAt: new Date("2023-03-10") },
    { _id: 4, name: "Alice Brown", email: "alice@example.com", age: 29, city: "New York", isActive: true, skills: ["JavaScript", "Node.js", "MongoDB"], createdAt: new Date("2023-04-05") },
    { _id: 5, name: "Charlie Davis", email: "charlie@example.com", age: 38, city: "Boston", isActive: true, skills: ["Go", "Kubernetes", "Docker"], createdAt: new Date("2023-05-12") },
    { _id: 6, name: "Diana Martinez", email: "diana@example.com", age: 31, city: "Los Angeles", isActive: false, skills: ["Ruby", "Rails", "Redis"], createdAt: new Date("2023-06-18") },
    { _id: 7, name: "Edward Lee", email: "edward@example.com", age: 42, city: "Seattle", isActive: true, skills: ["C#", ".NET", "Azure"], createdAt: new Date("2023-07-22") },
    { _id: 8, name: "Fiona Green", email: "fiona@example.com", age: 26, city: "Austin", isActive: true, skills: ["JavaScript", "Vue.js", "Firebase"], createdAt: new Date("2023-08-30") }
])

// Insert sample products
db.products.insertMany([
    { _id: 101, name: "Laptop Pro", category: "Electronics", price: 1299.99, stock: 50, rating: 4.5, tags: ["computer", "portable", "work"] },
    { _id: 102, name: "Wireless Mouse", category: "Electronics", price: 29.99, stock: 200, rating: 4.2, tags: ["accessory", "wireless"] },
    { _id: 103, name: "Mechanical Keyboard", category: "Electronics", price: 149.99, stock: 75, rating: 4.8, tags: ["accessory", "gaming", "rgb"] },
    { _id: 104, name: "USB-C Hub", category: "Electronics", price: 59.99, stock: 120, rating: 4.0, tags: ["accessory", "portable"] },
    { _id: 105, name: "Monitor 27inch", category: "Electronics", price: 399.99, stock: 30, rating: 4.6, tags: ["display", "work", "4k"] },
    { _id: 106, name: "Desk Chair", category: "Furniture", price: 249.99, stock: 45, rating: 4.3, tags: ["office", "ergonomic"] },
    { _id: 107, name: "Standing Desk", category: "Furniture", price: 599.99, stock: 20, rating: 4.7, tags: ["office", "adjustable", "health"] },
    { _id: 108, name: "Webcam HD", category: "Electronics", price: 79.99, stock: 90, rating: 4.1, tags: ["video", "streaming", "work"] },
    { _id: 109, name: "Headphones Pro", category: "Electronics", price: 299.99, stock: 60, rating: 4.9, tags: ["audio", "wireless", "noise-canceling"] },
    { _id: 110, name: "Desk Lamp", category: "Furniture", price: 45.99, stock: 150, rating: 4.4, tags: ["lighting", "adjustable"] }
])

// Insert sample orders
db.orders.insertMany([
    { _id: 1001, userId: 1, products: [{productId: 101, quantity: 1, price: 1299.99}, {productId: 102, quantity: 2, price: 29.99}], total: 1359.97, status: "delivered", orderDate: new Date("2024-01-10") },
    { _id: 1002, userId: 2, products: [{productId: 103, quantity: 1, price: 149.99}], total: 149.99, status: "shipped", orderDate: new Date("2024-01-15") },
    { _id: 1003, userId: 1, products: [{productId: 109, quantity: 1, price: 299.99}, {productId: 108, quantity: 1, price: 79.99}], total: 379.98, status: "processing", orderDate: new Date("2024-01-20") },
    { _id: 1004, userId: 4, products: [{productId: 106, quantity: 1, price: 249.99}, {productId: 107, quantity: 1, price: 599.99}], total: 849.98, status: "delivered", orderDate: new Date("2024-01-25") },
    { _id: 1005, userId: 3, products: [{productId: 105, quantity: 2, price: 399.99}], total: 799.98, status: "cancelled", orderDate: new Date("2024-02-01") },
    { _id: 1006, userId: 5, products: [{productId: 101, quantity: 1, price: 1299.99}], total: 1299.99, status: "delivered", orderDate: new Date("2024-02-05") },
    { _id: 1007, userId: 2, products: [{productId: 104, quantity: 3, price: 59.99}], total: 179.97, status: "shipped", orderDate: new Date("2024-02-10") },
    { _id: 1008, userId: 8, products: [{productId: 102, quantity: 1, price: 29.99}, {productId: 103, quantity: 1, price: 149.99}, {productId: 110, quantity: 2, price: 45.99}], total: 271.96, status: "processing", orderDate: new Date("2024-02-15") }
])

print("✅ Sample data inserted successfully!")

// ==========================================================================================
// PROBLEM 1: Basic Find Operations
// ==========================================================================================

/**
 * PROBLEM 1.1: Find all active users
 * 
 * Find all users where isActive is true.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ isActive: true })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.2: Find users in a specific city
 * 
 * Find all users who live in "New York"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ city: "New York" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.3: Find users with specific age range
 * 
 * Find all users who are between 30 and 40 years old (inclusive)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ age: { $gte: 30, $lte: 40 } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.4: Find one user by email
 * 
 * Find a single user with email "jane@example.com"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.findOne({ email: "jane@example.com" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 1.5: Find with projection
 * 
 * Find all users but only return their name and email (exclude _id)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({}, { name: 1, email: 1, _id: 0 })


// ==========================================================================================
// PROBLEM 2: Insert Operations
// ==========================================================================================

/**
 * PROBLEM 2.1: Insert a single document
 * 
 * Insert a new user with the following data:
 * - _id: 9
 * - name: "Grace Kim"
 * - email: "grace@example.com"
 * - age: 33
 * - city: "Denver"
 * - isActive: true
 * - skills: ["Rust", "WebAssembly"]
 * - createdAt: current date
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.insertOne({
    _id: 9,
    name: "Grace Kim",
    email: "grace@example.com",
    age: 33,
    city: "Denver",
    isActive: true,
    skills: ["Rust", "WebAssembly"],
    createdAt: new Date()
})

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 2.2: Insert multiple documents
 * 
 * Insert two new products:
 * 1. { _id: 111, name: "Mouse Pad XL", category: "Electronics", price: 19.99, stock: 300, rating: 4.0 }
 * 2. { _id: 112, name: "Cable Organizer", category: "Accessories", price: 12.99, stock: 500, rating: 3.8 }
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.insertMany([
    { _id: 111, name: "Mouse Pad XL", category: "Electronics", price: 19.99, stock: 300, rating: 4.0 },
    { _id: 112, name: "Cable Organizer", category: "Accessories", price: 12.99, stock: 500, rating: 3.8 }
])


// ==========================================================================================
// PROBLEM 3: Update Operations
// ==========================================================================================

/**
 * PROBLEM 3.1: Update a single field
 * 
 * Update user with _id: 3 to set isActive to true
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { _id: 3 },
    { $set: { isActive: true } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.2: Update multiple documents
 * 
 * Increase the price of all Electronics products by 10%
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.updateMany(
    { category: "Electronics" },
    { $mul: { price: 1.10 } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.3: Add element to an array
 * 
 * Add "TypeScript" to the skills array for user with _id: 1
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { _id: 1 },
    { $push: { skills: "TypeScript" } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.4: Remove element from array
 * 
 * Remove "React" from the skills array for user with _id: 1
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { _id: 1 },
    { $pull: { skills: "React" } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.5: Increment a numeric field
 * 
 * Decrease the stock of product with _id: 101 by 5
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.updateOne(
    { _id: 101 },
    { $inc: { stock: -5 } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.6: Upsert operation
 * 
 * Update user with email "newuser@example.com" to set name to "New User" and age to 25.
 * If the user doesn't exist, create them.
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { email: "newuser@example.com" },
    { $set: { name: "New User", age: 25 } },
    { upsert: true }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.7: Update with $rename
 * 
 * Rename the "rating" field to "avgRating" in the products collection
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.updateMany(
    {},
    { $rename: { "rating": "avgRating" } }
)

// Revert for other problems
db.products.updateMany({}, { $rename: { "avgRating": "rating" } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 3.8: Update with $min/$max
 * 
 * Set the stock of product _id: 102 to 150 only if current stock is greater than 150
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.updateOne(
    { _id: 102 },
    { $min: { stock: 150 } }
)


// ==========================================================================================
// PROBLEM 4: Delete Operations
// ==========================================================================================

/**
 * PROBLEM 4.1: Delete a single document
 * 
 * Delete the user with _id: 9 (the one we inserted earlier)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.deleteOne({ _id: 9 })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.2: Delete multiple documents
 * 
 * Delete all orders with status "cancelled"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.orders.deleteMany({ status: "cancelled" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 4.3: Delete with condition
 * 
 * Delete all products where stock is 0
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.deleteMany({ stock: 0 })


// ==========================================================================================
// PROBLEM 5: Query Operators
// ==========================================================================================

/**
 * PROBLEM 5.1: Using $in operator
 * 
 * Find all users who live in either "New York" or "Los Angeles"
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ city: { $in: ["New York", "Los Angeles"] } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.2: Using $nin operator
 * 
 * Find all products NOT in the "Furniture" category
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find({ category: { $nin: ["Furniture"] } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.3: Using $exists operator
 * 
 * Find all products that have a "tags" field
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find({ tags: { $exists: true } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.4: Using $type operator
 * 
 * Find all documents in users collection where age is a number (int or double)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ age: { $type: "number" } })
// Or specifically: db.users.find({ age: { $type: ["int", "double"] } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.5: Using $all operator
 * 
 * Find all users who have BOTH "JavaScript" AND "MongoDB" in their skills
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ skills: { $all: ["JavaScript", "MongoDB"] } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.6: Using $size operator
 * 
 * Find all users who have exactly 3 skills
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ skills: { $size: 3 } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.7: Using $elemMatch
 * 
 * Find all orders that have at least one product with quantity >= 2
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.orders.find({ products: { $elemMatch: { quantity: { $gte: 2 } } } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.8: Using $regex
 * 
 * Find all users whose name starts with "A" (case-insensitive)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ name: { $regex: /^A/i } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.9: Using logical operators ($and, $or)
 * 
 * Find all products that are either:
 * - In Electronics category with price > 100
 * - OR in Furniture category with rating > 4.5
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find({
    $or: [
        { category: "Electronics", price: { $gt: 100 } },
        { category: "Furniture", rating: { $gt: 4.5 } }
    ]
})

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 5.10: Using $not operator
 * 
 * Find all users whose age is NOT greater than or equal to 35
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find({ age: { $not: { $gte: 35 } } })


// ==========================================================================================
// PROBLEM 6: Sorting, Limiting, and Skipping
// ==========================================================================================

/**
 * PROBLEM 6.1: Sort ascending
 * 
 * Find all products sorted by price (lowest to highest)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find().sort({ price: 1 })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.2: Sort descending
 * 
 * Find all users sorted by age (oldest to youngest)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find().sort({ age: -1 })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.3: Limit results
 * 
 * Find the top 3 most expensive products
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find().sort({ price: -1 }).limit(3)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.4: Skip and Limit (Pagination)
 * 
 * Get the second page of products (5 products per page)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find().skip(5).limit(5)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 6.5: Combined sorting
 * 
 * Find all users sorted by city (ascending), then by age (descending) within each city
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.find().sort({ city: 1, age: -1 })


// ==========================================================================================
// PROBLEM 7: Count and Distinct
// ==========================================================================================

/**
 * PROBLEM 7.1: Count documents
 * 
 * Count the number of active users
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.countDocuments({ isActive: true })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 7.2: Count with filter
 * 
 * Count the number of products with price greater than $100
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.countDocuments({ price: { $gt: 100 } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 7.3: Distinct values
 * 
 * Get all unique cities from the users collection
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.distinct("city")

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 7.4: Distinct with query
 * 
 * Get all unique categories from products with rating >= 4.5
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.distinct("category", { rating: { $gte: 4.5 } })


// ==========================================================================================
// PROBLEM 8: Array Update Operators
// ==========================================================================================

/**
 * PROBLEM 8.1: Add unique element to array
 * 
 * Add "GraphQL" to user 1's skills only if it doesn't already exist
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { _id: 1 },
    { $addToSet: { skills: "GraphQL" } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 8.2: Add multiple unique elements
 * 
 * Add "Docker" and "AWS" to user 1's skills (only if they don't exist)
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { _id: 1 },
    { $addToSet: { skills: { $each: ["Docker", "AWS"] } } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 8.3: Remove first/last element
 * 
 * Remove the last skill from user 1's skills array
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.updateOne(
    { _id: 1 },
    { $pop: { skills: 1 } }  // 1 = last, -1 = first
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 8.4: Update specific array element
 * 
 * In order 1001, update the quantity of the first product to 2
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.orders.updateOne(
    { _id: 1001 },
    { $set: { "products.0.quantity": 2 } }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 8.5: Update matched array element
 * 
 * In order 1001, update the quantity to 3 for the product with productId 102
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.orders.updateOne(
    { _id: 1001, "products.productId": 102 },
    { $set: { "products.$.quantity": 3 } }
)


// ==========================================================================================
// PROBLEM 9: Text Search (Requires Text Index)
// ==========================================================================================

/**
 * PROBLEM 9.1: Create a text index
 * 
 * Create a text index on the "name" field of the products collection
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.createIndex({ name: "text" })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.2: Perform text search
 * 
 * Search for products containing "keyboard" OR "mouse" in their name
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find({ $text: { $search: "keyboard mouse" } })

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 9.3: Text search with score
 * 
 * Search for products with "pro" and return results sorted by relevance score
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.products.find(
    { $text: { $search: "pro" } },
    { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })


// ==========================================================================================
// PROBLEM 10: findOneAndUpdate / findOneAndDelete
// ==========================================================================================

/**
 * PROBLEM 10.1: Find and update with return
 * 
 * Find user with _id: 1, increment their age by 1, and return the NEW document
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.findOneAndUpdate(
    { _id: 1 },
    { $inc: { age: 1 } },
    { returnDocument: "after" }
)

// -------------------------------------------------------------------------------------------

/**
 * PROBLEM 10.2: Find and delete
 * 
 * Find and delete the oldest user (by age), return the deleted document
 */

// YOUR SOLUTION HERE:


// ✅ SOLUTION:
db.users.findOneAndDelete(
    {},
    { sort: { age: -1 } }
)

// Re-insert for other problems
db.users.insertOne({ _id: 3, name: "Bob Wilson", email: "bob@example.com", age: 45, city: "Chicago", isActive: false, skills: ["Java", "Spring", "MySQL"], createdAt: new Date("2023-03-10") })


// ==========================================================================================
// CLEANUP (Optional)
// ==========================================================================================

// Drop the practice database when done
// db.dropDatabase()

print("✅ All CRUD practice problems completed!")
