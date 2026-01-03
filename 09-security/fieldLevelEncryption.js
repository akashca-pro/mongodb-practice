/**
 * TOPIC: FIELD-LEVEL ENCRYPTION
 * DESCRIPTION:
 * Client-Side Field Level Encryption (CSFLE) encrypts sensitive data
 * before sending to MongoDB. Data remains encrypted at rest and in transit.
 */

const { MongoClient, ClientEncryption } = require('mongodb');
const crypto = require('crypto');

// -------------------------------------------------------------------------------------------
// 1. ENCRYPTION CONCEPTS
// -------------------------------------------------------------------------------------------

/**
 * CSFLE COMPONENTS:
 * 
 * - Master Key: Top-level key (stored in KMS)
 * - Data Encryption Key (DEK): Encrypts actual data
 * - Key Vault: Collection storing encrypted DEKs
 * 
 * ENCRYPTION TYPES:
 * - Deterministic: Same input = same ciphertext (queryable)
 * - Randomized: Same input = different ciphertext (more secure)
 */

// -------------------------------------------------------------------------------------------
// 2. LOCAL MASTER KEY (Development Only)
// -------------------------------------------------------------------------------------------

function generateLocalMasterKey() {
    // Generate 96-byte local master key
    const localMasterKey = crypto.randomBytes(96);
    
    // Store securely (in production, use KMS)
    return {
        local: { key: localMasterKey }
    };
}

// -------------------------------------------------------------------------------------------
// 3. CREATING DATA ENCRYPTION KEY
// -------------------------------------------------------------------------------------------

async function createDataEncryptionKey() {
    const kmsProviders = generateLocalMasterKey();
    const keyVaultNamespace = 'encryption.__keyVault';
    
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        
        const encryption = new ClientEncryption(client, {
            keyVaultNamespace,
            kmsProviders
        });
        
        // Create index on key vault (required)
        await client.db('encryption')
            .collection('__keyVault')
            .createIndex(
                { keyAltNames: 1 },
                { unique: true, partialFilterExpression: { keyAltNames: { $exists: true } } }
            );
        
        // Create data encryption key
        const dataKeyId = await encryption.createDataKey('local', {
            keyAltNames: ['myDataKey']
        });
        
        console.log('Created DEK with ID:', dataKeyId);
        return dataKeyId;
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 4. EXPLICIT ENCRYPTION
// -------------------------------------------------------------------------------------------

async function explicitEncryption() {
    const kmsProviders = generateLocalMasterKey();
    const keyVaultNamespace = 'encryption.__keyVault';
    
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        
        const encryption = new ClientEncryption(client, {
            keyVaultNamespace,
            kmsProviders
        });
        
        // Encrypt a value
        const encryptedSSN = await encryption.encrypt(
            '123-45-6789',
            {
                keyAltName: 'myDataKey',
                algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
            }
        );
        
        // Store encrypted value
        await client.db('testdb').collection('users').insertOne({
            name: 'John Doe',
            ssn: encryptedSSN  // Encrypted
        });
        
        // Decrypt value
        const decryptedSSN = await encryption.decrypt(encryptedSSN);
        console.log('Decrypted SSN:', decryptedSSN);
        
    } finally {
        await client.close();
    }
}

// -------------------------------------------------------------------------------------------
// 5. AUTO ENCRYPTION WITH SCHEMA
// -------------------------------------------------------------------------------------------

async function autoEncryption() {
    const kmsProviders = generateLocalMasterKey();
    const keyVaultNamespace = 'encryption.__keyVault';
    
    // Get the data key ID first
    const setupClient = new MongoClient('mongodb://localhost:27017');
    await setupClient.connect();
    const keyDoc = await setupClient.db('encryption').collection('__keyVault')
        .findOne({ keyAltNames: 'myDataKey' });
    const dataKeyId = keyDoc._id;
    await setupClient.close();
    
    // Schema map for automatic encryption
    const schemaMap = {
        'testdb.patients': {
            bsonType: 'object',
            encryptMetadata: { keyId: [dataKeyId] },
            properties: {
                ssn: {
                    encrypt: {
                        bsonType: 'string',
                        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
                    }
                },
                medicalRecords: {
                    encrypt: {
                        bsonType: 'array',
                        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
                    }
                }
            }
        }
    };
    
    // Client with auto encryption
    const secureClient = new MongoClient('mongodb://localhost:27017', {
        autoEncryption: {
            keyVaultNamespace,
            kmsProviders,
            schemaMap
        }
    });
    
    try {
        await secureClient.connect();
        
        // Automatically encrypted on insert
        await secureClient.db('testdb').collection('patients').insertOne({
            name: 'Jane Doe',
            ssn: '987-65-4321',  // Auto-encrypted
            medicalRecords: ['record1', 'record2']  // Auto-encrypted
        });
        
        // Automatically decrypted on read
        const patient = await secureClient.db('testdb').collection('patients')
            .findOne({ ssn: '987-65-4321' });
        console.log('Patient:', patient);
        
    } finally {
        await secureClient.close();
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY & BEST PRACTICES
// -------------------------------------------------------------------------------------------

/**
 * CSFLE KEY POINTS:
 * 
 * 1. Deterministic: Enables equality queries
 * 2. Randomized: More secure, no query support
 * 3. Client-side: MongoDB never sees plaintext
 * 4. Use KMS in production (AWS, Azure, GCP)
 * 
 * BEST PRACTICES:
 * - Use KMS for master key management
 * - Rotate DEKs periodically
 * - Use randomized for highly sensitive data
 * - Test encryption in development
 */

module.exports = {
    createDataEncryptionKey,
    explicitEncryption,
    autoEncryption
};
