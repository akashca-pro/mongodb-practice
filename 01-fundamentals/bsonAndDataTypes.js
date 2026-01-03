/**
 * TOPIC: BSON AND DATA TYPES
 * DESCRIPTION:
 * MongoDB uses BSON (Binary JSON) as its data format. Understanding
 * BSON data types is essential for proper schema design, querying,
 * and data manipulation in MongoDB applications.
 */

// -------------------------------------------------------------------------------------------
// 1. WHAT IS BSON?
// -------------------------------------------------------------------------------------------

/**
 * BSON = Binary JSON
 * 
 * BSON extends JSON with:
 * - Binary encoding for efficiency
 * - Additional data types (Date, ObjectId, Binary, etc.)
 * - Type information embedded in each value
 * 
 * BSON vs JSON:
 * | Feature          | JSON           | BSON              |
 * |------------------|----------------|-------------------|
 * | Format           | Text           | Binary            |
 * | Types            | 6 basic types  | 18+ types         |
 * | Date support     | String only    | Native Date type  |
 * | Binary data      | Base64 string  | Native Binary     |
 * | Ordering         | Not guaranteed | Preserved         |
 * | Size efficiency  | Smaller text   | Larger but faster |
 */

// JSON representation
const jsonDoc = {
    name: "John",
    age: 30,
    joined: "2023-01-15T10:30:00Z" // Date as string
};

// BSON representation (conceptual - actual BSON is binary)
const bsonDoc = {
    name: "John",        // BSON type: String (0x02)
    age: 30,             // BSON type: Int32 (0x10)
    joined: new Date()   // BSON type: Date (0x09)
};

console.log("JSON Doc:", jsonDoc);
console.log("BSON-style Doc:", bsonDoc);

// -------------------------------------------------------------------------------------------
// 2. OBJECTID
// -------------------------------------------------------------------------------------------

/**
 * ObjectId is the default _id type in MongoDB.
 * 
 * STRUCTURE (12 bytes):
 * - Bytes 0-3: Timestamp (Unix epoch)
 * - Bytes 4-8: Random value (per process)
 * - Bytes 9-11: Incrementing counter
 * 
 * EXAMPLE: 507f1f77bcf86cd799439011
 * | Timestamp | Random    | Counter |
 * | 507f1f77  | bcf86cd799| 439011  |
 * 
 * BENEFITS:
 * - Globally unique
 * - Sortable by creation time
 * - No coordination needed between servers
 */

// Working with ObjectId
const { ObjectId } = require('mongodb');

// Create new ObjectId
const newId = new ObjectId();
console.log("New ObjectId:", newId.toString());

// Create from string
const existingId = new ObjectId("507f1f77bcf86cd799439011");
console.log("From String:", existingId.toString());

// Extract timestamp
const timestamp = newId.getTimestamp();
console.log("Timestamp:", timestamp);

// Validate ObjectId string
function isValidObjectId(str) {
    return ObjectId.isValid(str) && new ObjectId(str).toString() === str;
}

console.log("Valid ObjectId check:", isValidObjectId("507f1f77bcf86cd799439011")); // true
console.log("Invalid check:", isValidObjectId("invalid")); // false

// -------------------------------------------------------------------------------------------
// 3. STRING TYPE
// -------------------------------------------------------------------------------------------

/**
 * BSON String:
 * - UTF-8 encoded
 * - Length-prefixed (efficient for parsing)
 * - Can contain null characters
 * - Max size limited by document size (16MB)
 */

const stringExamples = {
    simple: "Hello, World!",
    unicode: "こんにちは 🌍",
    multiline: `Line 1
Line 2
Line 3`,
    empty: ""
};

// String operations in queries
const stringQueries = `
// Case-sensitive exact match
db.users.find({ name: "John" })

// Case-insensitive with regex
db.users.find({ name: { $regex: /john/i } })

// Text search (requires text index)
db.articles.find({ $text: { $search: "mongodb tutorial" } })

// Starts with
db.users.find({ name: { $regex: /^Jo/ } })
`;

console.log("String Examples:", stringExamples);

// -------------------------------------------------------------------------------------------
// 4. NUMERIC TYPES
// -------------------------------------------------------------------------------------------

/**
 * BSON Numeric Types:
 * 
 * 1. Int32 (32-bit integer)
 *    - Range: -2,147,483,648 to 2,147,483,647
 *    - Use for small integers
 * 
 * 2. Int64 / Long (64-bit integer)
 *    - Range: -9,223,372,036,854,775,808 to 9,223,372,036,854,775,807
 *    - Use for large integers
 * 
 * 3. Double (64-bit floating point)
 *    - IEEE 754 double precision
 *    - Default for JavaScript numbers
 * 
 * 4. Decimal128 (128-bit decimal)
 *    - Exact decimal representation
 *    - Use for financial calculations
 */

const { Long, Decimal128, Int32, Double } = require('mongodb');

const numericExamples = {
    // Regular JavaScript number (stored as Double)
    regularNumber: 42.5,
    
    // Explicit Int32
    int32Value: new Int32(100),
    
    // Large integer (Int64)
    bigInteger: Long.fromNumber(9007199254740993),
    
    // Precise decimal
    price: Decimal128.fromString("19.99"),
    
    // Scientific notation
    scientific: 1.5e10
};

console.log("Numeric Examples:", numericExamples);

// Best practice for financial data
const financialDocument = {
    product: "Widget",
    price: Decimal128.fromString("29.99"),
    tax: Decimal128.fromString("2.40"),
    total: Decimal128.fromString("32.39")
};

console.log("Financial Document:", financialDocument);

// -------------------------------------------------------------------------------------------
// 5. DATE AND TIMESTAMP
// -------------------------------------------------------------------------------------------

/**
 * Date Type:
 * - 64-bit integer
 * - Milliseconds since Unix epoch (Jan 1, 1970)
 * - Range: ~290 million years before/after epoch
 * 
 * Timestamp Type:
 * - Internal MongoDB type
 * - Used for replication oplog
 * - Not recommended for application use
 */

const dateExamples = {
    // Current date
    now: new Date(),
    
    // Specific date
    specific: new Date("2023-06-15T10:30:00Z"),
    
    // From timestamp
    fromTimestamp: new Date(1686825000000),
    
    // ISO string parsing
    parsed: new Date(Date.parse("2023-12-25"))
};

console.log("Date Examples:", dateExamples);

// Date operations in queries
const dateQueries = `
// Find documents from today
db.events.find({
    date: {
        $gte: new Date(new Date().setHours(0,0,0,0)),
        $lt: new Date(new Date().setHours(23,59,59,999))
    }
})

// Find documents from last 7 days
db.events.find({
    date: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    }
})

// Date comparison
db.orders.find({
    orderDate: { $lt: new Date("2023-01-01") }
})
`;

console.log("Date Query Examples:", dateQueries);

// -------------------------------------------------------------------------------------------
// 6. BOOLEAN AND NULL
// -------------------------------------------------------------------------------------------

/**
 * Boolean:
 * - true or false
 * - 1 byte in BSON
 * 
 * Null:
 * - Explicit null value
 * - Different from missing field
 */

const booleanNullExamples = {
    isActive: true,
    isVerified: false,
    deletedAt: null,  // Field exists but has no value
    // middleName doesn't exist - different from null!
};

// Query differences
const nullQueries = `
// Find where field is null
db.users.find({ deletedAt: null })
// Returns: documents where deletedAt is null OR doesn't exist

// Find where field exists and is null
db.users.find({ deletedAt: { $type: "null" } })
// Returns: only documents where deletedAt is explicitly null

// Find where field doesn't exist
db.users.find({ middleName: { $exists: false } })

// Find where field exists (even if null)
db.users.find({ deletedAt: { $exists: true } })
`;

console.log("Boolean/Null Examples:", booleanNullExamples);

// -------------------------------------------------------------------------------------------
// 7. ARRAY TYPE
// -------------------------------------------------------------------------------------------

/**
 * BSON Array:
 * - Ordered list of values
 * - Can contain mixed types
 * - Can be nested
 * - Supports powerful query operators
 */

const arrayDocument = {
    tags: ["mongodb", "database", "nosql"],
    scores: [85, 92, 78, 95],
    nested: [[1, 2], [3, 4], [5, 6]],
    mixed: ["string", 42, true, { nested: "object" }],
    empty: []
};

console.log("Array Document:", arrayDocument);

// Array operations
const arrayOperations = `
// Match any element
db.articles.find({ tags: "mongodb" })

// Match all elements
db.articles.find({ tags: { $all: ["mongodb", "nosql"] } })

// Match by index
db.articles.find({ "scores.0": 85 })  // First element is 85

// Match array size
db.articles.find({ tags: { $size: 3 } })

// Element match (multiple conditions on same element)
db.students.find({
    grades: { $elemMatch: { score: { $gt: 80 }, subject: "math" } }
})

// Add to array
db.articles.updateOne(
    { _id: id },
    { $push: { tags: "new-tag" } }
)

// Add unique to array
db.articles.updateOne(
    { _id: id },
    { $addToSet: { tags: "unique-tag" } }
)

// Remove from array
db.articles.updateOne(
    { _id: id },
    { $pull: { tags: "old-tag" } }
)
`;

console.log("Array Operations:", arrayOperations);

// -------------------------------------------------------------------------------------------
// 8. EMBEDDED DOCUMENTS
// -------------------------------------------------------------------------------------------

/**
 * Embedded Document (Object):
 * - Nested document within document
 * - Preserves field order
 * - Max nesting depth: 100 levels
 * - Queryable with dot notation
 */

const embeddedDocument = {
    _id: new ObjectId(),
    name: "John Doe",
    address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        geo: {
            type: "Point",
            coordinates: [-73.935242, 40.730610]
        }
    },
    contacts: {
        email: "john@example.com",
        phones: {
            home: "555-1234",
            work: "555-5678"
        }
    }
};

console.log("Embedded Document:", JSON.stringify(embeddedDocument, null, 2));

// Querying embedded documents
const embeddedQueries = `
// Dot notation query
db.users.find({ "address.city": "New York" })

// Nested dot notation
db.users.find({ "contacts.phones.work": "555-5678" })

// Update nested field
db.users.updateOne(
    { _id: id },
    { $set: { "address.zip": "10002" } }
)

// Exact match (order and fields must match exactly)
db.users.find({
    address: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001"
    }
})
`;

console.log("Embedded Queries:", embeddedQueries);

// -------------------------------------------------------------------------------------------
// 9. BINARY DATA
// -------------------------------------------------------------------------------------------

/**
 * Binary (BinData):
 * - Stores arbitrary binary data
 * - Subtypes for specific uses
 * 
 * SUBTYPES:
 * - 0: Generic binary
 * - 1: Function
 * - 2: Binary (deprecated)
 * - 3: UUID (deprecated)
 * - 4: UUID (new)
 * - 5: MD5
 * - 128: User-defined
 */

const { Binary, UUID } = require('mongodb');

// Binary from Buffer
const buffer = Buffer.from("Hello, MongoDB!", "utf8");
const binaryData = new Binary(buffer);

// UUID
const uuid = new UUID();

const binaryDocument = {
    _id: uuid,
    fileContent: binaryData,
    thumbnail: new Binary(Buffer.alloc(100)) // Example binary
};

console.log("Binary Document ID:", uuid.toString());

// -------------------------------------------------------------------------------------------
// 10. SPECIAL TYPES
// -------------------------------------------------------------------------------------------

/**
 * Additional BSON Types:
 * 
 * - MinKey: Compares less than all other values
 * - MaxKey: Compares greater than all other values
 * - Regular Expression: Stored regex patterns
 * - JavaScript: Code (with/without scope)
 * - Symbol: Deprecated, use string instead
 */

const { MinKey, MaxKey, Code } = require('mongodb');

const specialTypes = {
    minValue: new MinKey(),
    maxValue: new MaxKey(),
    pattern: /^user_\d+$/i,  // Regular expression
    code: new Code("function() { return this.x + this.y; }")
};

// MinKey/MaxKey usage in queries
const specialQueries = `
// Find all documents (MinKey to MaxKey covers everything)
db.collection.find({
    value: { $gte: MinKey(), $lte: MaxKey() }
})

// These are rarely used in application code
// Mainly for internal MongoDB operations
`;

console.log("Special Types:", specialTypes);

// -------------------------------------------------------------------------------------------
// 11. TYPE CHECKING AND CONVERSION
// -------------------------------------------------------------------------------------------

/**
 * $type Operator:
 * Query documents by BSON type
 */

const typeQueries = `
// Find documents where age is a number
db.users.find({ age: { $type: "number" } })

// Find documents where age is specifically int32
db.users.find({ age: { $type: "int" } })

// Find documents where data is array
db.collection.find({ data: { $type: "array" } })

// Type aliases:
// "double"     - 1
// "string"     - 2
// "object"     - 3
// "array"      - 4
// "binData"    - 5
// "objectId"   - 7
// "bool"       - 8
// "date"       - 9
// "null"       - 10
// "regex"      - 11
// "int"        - 16
// "long"       - 18
// "decimal"    - 19

// Convert types in aggregation
db.collection.aggregate([
    {
        $project: {
            stringAge: { $toString: "$age" },
            intValue: { $toInt: "$stringNumber" },
            dateValue: { $toDate: "$timestamp" },
            doubleValue: { $toDouble: "$intValue" }
        }
    }
])
`;

console.log("Type Queries:", typeQueries);

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * BSON DATA TYPES KEY POINTS:
 * 
 * 1. ObjectId: Default _id, globally unique, contains timestamp
 * 
 * 2. Numbers: Choose appropriate type (Int32, Long, Double, Decimal128)
 *    - Use Decimal128 for financial calculations
 * 
 * 3. Dates: Use native Date type, not strings
 *    - Store in UTC, convert on display
 * 
 * 4. Arrays: Powerful query operators, can contain mixed types
 * 
 * 5. Embedded Documents: Use dot notation for queries
 * 
 * BEST PRACTICES:
 * - Generate ObjectIds server-side for better uniqueness
 * - Use Decimal128 for money/financial data
 * - Store dates as Date type, not strings
 * - Validate types at application level
 * - Use $type operator to find type inconsistencies
 * - Understand null vs missing field difference
 * - Keep embedded document depth reasonable (<5 levels)
 * - Document size limit is 16MB
 */
