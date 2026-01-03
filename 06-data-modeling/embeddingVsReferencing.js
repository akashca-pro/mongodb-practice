/**
 * TOPIC: EMBEDDING VS REFERENCING
 * DESCRIPTION:
 * The fundamental schema design decision: embed related data
 * within documents or store references to other collections.
 */

// -------------------------------------------------------------------------------------------
// 1. WHEN TO EMBED
// -------------------------------------------------------------------------------------------

/**
 * EMBED WHEN:
 * - One-to-few relationship
 * - Data is read together
 * - Data changes together
 * - Child data is not accessed independently
 */

// Embedded address (always read with user)
const userWithAddress = {
    _id: "user_001",
    name: "John Doe",
    email: "john@example.com",
    address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001"
    }
};

// Embedded order items (always together)
const orderEmbedded = {
    _id: "order_001",
    customerId: "cust_001",
    items: [
        { productId: "prod_001", name: "Widget", qty: 2, price: 9.99 },
        { productId: "prod_002", name: "Gadget", qty: 1, price: 19.99 }
    ],
    total: 39.97
};

// -------------------------------------------------------------------------------------------
// 2. WHEN TO REFERENCE
// -------------------------------------------------------------------------------------------

/**
 * REFERENCE WHEN:
 * - One-to-many (unbounded)
 * - Many-to-many relationships
 * - Data accessed independently
 * - Data changes frequently
 * - Document would exceed 16MB
 */

// Referenced comments (many, access independently)
const postReferenced = {
    _id: "post_001",
    title: "MongoDB Guide",
    content: "...",
    authorId: "user_001"  // Reference to users collection
};

const comment = {
    _id: "comment_001",
    postId: "post_001",    // Reference back to post
    userId: "user_002",
    text: "Great post!"
};

// -------------------------------------------------------------------------------------------
// 3. HYBRID APPROACH
// -------------------------------------------------------------------------------------------

// Extended reference - embed frequently used fields
const orderHybrid = {
    _id: "order_001",
    customer: {
        _id: "cust_001",
        name: "John Doe"  // Embedded for display
        // Full customer data in customers collection
    },
    productIds: ["prod_001", "prod_002"],  // Reference
    items: [  // Embedded snapshot at purchase time
        { productId: "prod_001", name: "Widget", price: 9.99 }
    ]
};

// -------------------------------------------------------------------------------------------
// 4. COMPARISON TABLE
// -------------------------------------------------------------------------------------------

/**
 * | Factor              | Embed                | Reference          |
 * |---------------------|----------------------|--------------------|
 * | Read performance    | ✅ Faster            | Slower ($lookup)   |
 * | Write performance   | Slower (large docs)  | ✅ Faster          |
 * | Data duplication    | Some duplication     | ✅ No duplication  |
 * | Consistency         | Manual updates       | ✅ Single source   |
 * | Document size       | Can exceed 16MB      | ✅ Smaller docs    |
 * | Query complexity    | ✅ Simple            | Requires $lookup   |
 */

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * DECISION GUIDE:
 * 
 * 1. How often is data read together? → Embed
 * 2. How often is data updated independently? → Reference
 * 3. Is the array bounded? → Embed if small
 * 4. Is data needed for display? → Consider extended reference
 * 5. Many-to-many? → Reference with array of IDs
 */

module.exports = {
    userWithAddress,
    orderEmbedded,
    postReferenced,
    orderHybrid
};
