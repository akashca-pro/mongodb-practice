/**
 * TOPIC: SCHEMA VALIDATION
 * DESCRIPTION:
 * MongoDB schema validation enforces document structure using JSON Schema.
 * Define rules at collection level to ensure data integrity.
 */

const { MongoClient } = require('mongodb');

// -------------------------------------------------------------------------------------------
// 1. CREATING VALIDATED COLLECTION
// -------------------------------------------------------------------------------------------

async function createValidatedCollection() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Create collection with validation
        await db.createCollection('users', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['name', 'email', 'age'],
                    properties: {
                        name: {
                            bsonType: 'string',
                            description: 'must be a string and is required'
                        },
                        email: {
                            bsonType: 'string',
                            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                            description: 'must be a valid email address'
                        },
                        age: {
                            bsonType: 'int',
                            minimum: 0,
                            maximum: 150,
                            description: 'must be an integer between 0 and 150'
                        },
                        status: {
                            enum: ['active', 'inactive', 'pending'],
                            description: 'must be one of the allowed values'
                        },
                        address: {
                            bsonType: 'object',
                            properties: {
                                street: { bsonType: 'string' },
                                city: { bsonType: 'string' },
                                zip: { bsonType: 'string' }
                            }
                        }
                    }
                }
            },
            validationLevel: 'strict',
            validationAction: 'error'
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 2. VALIDATION LEVELS AND ACTIONS
// -------------------------------------------------------------------------------------------

/**
 * VALIDATION LEVELS:
 * - strict: Validate all inserts and updates (default)
 * - moderate: Validate inserts and updates to existing valid documents
 * 
 * VALIDATION ACTIONS:
 * - error: Reject invalid documents (default)
 * - warn: Log warning but accept document
 */

async function setValidationOptions() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Modify validation on existing collection
        await db.command({
            collMod: 'users',
            validationLevel: 'moderate',
            validationAction: 'warn'
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 3. ADVANCED VALIDATION RULES
// -------------------------------------------------------------------------------------------

async function advancedValidation() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        await db.createCollection('products', {
            validator: {
                $jsonSchema: {
                    bsonType: 'object',
                    required: ['name', 'price'],
                    properties: {
                        name: { bsonType: 'string', minLength: 1, maxLength: 100 },
                        price: { bsonType: 'decimal', minimum: 0 },
                        tags: {
                            bsonType: 'array',
                            items: { bsonType: 'string' },
                            minItems: 1,
                            uniqueItems: true
                        },
                        // Conditional validation
                        discount: { bsonType: 'int', minimum: 0, maximum: 100 }
                    }
                },
                // Additional query-style validation
                $or: [
                    { price: { $gt: 0 } },
                    { status: 'free' }
                ]
            }
        });
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. GETTING VALIDATION RULES
// -------------------------------------------------------------------------------------------

async function getValidationRules() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        
        // Get collection info including validation
        const collections = await db.listCollections({ name: 'users' }).toArray();
        console.log('Validation rules:', JSON.stringify(collections[0].options, null, 2));
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. BYPASSING VALIDATION
// -------------------------------------------------------------------------------------------

async function bypassValidation() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const collection = client.db('testdb').collection('users');
        
        // Bypass validation (requires bypassDocumentValidation privilege)
        await collection.insertOne(
            { name: 'Test', invalid: true },  // Invalid document
            { bypassDocumentValidation: true }
        );
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * SCHEMA VALIDATION:
 * 
 * 1. Use JSON Schema for structure validation
 * 2. Set validationLevel and validationAction appropriately
 * 3. Use 'moderate' level for migrations
 * 4. Combine with application-level validation
 * 
 * BEST PRACTICES:
 * - Start with 'warn' action, switch to 'error' after testing
 * - Use 'moderate' during schema migrations
 * - Document validation rules
 * - Handle validation errors gracefully
 */

module.exports = {
    createValidatedCollection,
    setValidationOptions,
    advancedValidation,
    getValidationRules,
    bypassValidation
};
