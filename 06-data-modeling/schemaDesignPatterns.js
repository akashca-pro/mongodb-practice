/**
 * TOPIC: SCHEMA DESIGN PATTERNS
 * DESCRIPTION:
 * MongoDB schema design differs fundamentally from relational design.
 * Focus on access patterns and embed vs reference decisions.
 */

// -------------------------------------------------------------------------------------------
// 1. DESIGN PRINCIPLES
// -------------------------------------------------------------------------------------------

/**
 * KEY PRINCIPLES:
 * 
 * 1. Design for queries, not relationships
 * 2. Embed what is read together
 * 3. Reference what is updated independently
 * 4. Accept data duplication for read performance
 * 5. Keep document size under 16MB
 */

// -------------------------------------------------------------------------------------------
// 2. COMMON PATTERNS
// -------------------------------------------------------------------------------------------

// PATTERN: Attribute Pattern
// Use when: Many similar optional fields
const productWithAttributes = {
    _id: "prod_001",
    name: "Smartphone",
    category: "electronics",
    basePrice: 599,
    attributes: [
        { name: "color", value: "black" },
        { name: "storage", value: "128GB" },
        { name: "ram", value: "8GB" }
    ]
};

// PATTERN: Bucket Pattern  
// Use when: Time series data, IoT, logs
const sensorBucket = {
    sensorId: "sensor_001",
    date: "2024-01-15",
    readings: [
        { time: "00:00", temp: 23.5, humidity: 45 },
        { time: "00:05", temp: 23.6, humidity: 44 },
        // ... up to ~200 readings per bucket
    ],
    count: 288,
    avgTemp: 23.8
};

// PATTERN: Computed Pattern
// Use when: Expensive calculations queried frequently
const orderWithComputed = {
    _id: "order_001",
    items: [
        { product: "Widget", qty: 2, price: 9.99 },
        { product: "Gadget", qty: 1, price: 19.99 }
    ],
    // Computed and stored
    itemCount: 3,
    subtotal: 39.97,
    tax: 3.20,
    total: 43.17
};

// PATTERN: Extended Reference
// Use when: Need subset of referenced data frequently
const orderWithCustomer = {
    _id: "order_001",
    // Extended reference - embedded subset
    customer: {
        _id: "cust_001",
        name: "John Doe",
        email: "john@example.com"
        // Only frequently accessed fields
    },
    items: [],
    total: 99.99
};

// PATTERN: Outlier Pattern
// Use when: Few documents exceed normal size
const bookWithReviews = {
    _id: "book_001",
    title: "MongoDB Guide",
    reviews: [/* ... limited reviews ... */],
    hasExtraReviews: true  // Flag for outliers
};
// Extra reviews in separate collection for outlier books

// PATTERN: Polymorphic Pattern
// Use when: Different types in same collection
const products = [
    {
        type: "book",
        title: "MongoDB Guide",
        author: "John Doe",
        pages: 350
    },
    {
        type: "clothing",
        name: "T-Shirt",
        size: "L",
        color: "blue"
    }
];

// -------------------------------------------------------------------------------------------
// 3. ANTI-PATTERNS TO AVOID
// -------------------------------------------------------------------------------------------

/**
 * ANTI-PATTERNS:
 * 
 * 1. Massive arrays (unbounded growth)
 * 2. Unnecessary normalization
 * 3. Ignoring query patterns
 * 4. Documents over 16MB
 * 5. Deeply nested documents (>5 levels)
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * DESIGN RULES:
 * 
 * 1. Understand access patterns first
 * 2. Embed for single-entity queries
 * 3. Reference for many-to-many or unbounded
 * 4. Denormalize for read-heavy workloads
 * 5. Use patterns: Bucket, Computed, Extended Reference
 */

module.exports = {
    productWithAttributes,
    sensorBucket,
    orderWithComputed,
    orderWithCustomer,
    bookWithReviews
};
