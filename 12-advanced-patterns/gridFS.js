/**
 * TOPIC: GRIDFS - LARGE FILE STORAGE
 * DESCRIPTION:
 * GridFS stores files larger than 16MB by splitting them into chunks.
 * Useful for images, videos, and other binary data.
 */

const { MongoClient, GridFSBucket } = require('mongodb');
const fs = require('fs');

// -------------------------------------------------------------------------------------------
// 1. UPLOAD FILES
// -------------------------------------------------------------------------------------------

async function uploadFile() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        const bucket = new GridFSBucket(db);
        
        // Upload from file system
        const uploadStream = bucket.openUploadStream('video.mp4', {
            metadata: { type: 'video', uploadedBy: 'user_001' }
        });
        
        fs.createReadStream('./video.mp4')
            .pipe(uploadStream)
            .on('finish', () => {
                console.log('Upload complete. File ID:', uploadStream.id);
            });
            
    } catch (error) {
        console.error('Error:', error);
    }
}

// -------------------------------------------------------------------------------------------
// 2. DOWNLOAD FILES
// -------------------------------------------------------------------------------------------

async function downloadFile() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        const bucket = new GridFSBucket(db);
        
        // Download by filename
        bucket.openDownloadStreamByName('video.mp4')
            .pipe(fs.createWriteStream('./downloaded-video.mp4'))
            .on('finish', () => console.log('Download complete'));
        
        // Download by ID
        // bucket.openDownloadStream(fileId).pipe(destination);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// -------------------------------------------------------------------------------------------
// 3. LIST AND DELETE FILES
// -------------------------------------------------------------------------------------------

async function manageFiles() {
    const client = new MongoClient('mongodb://localhost:27017');
    
    try {
        await client.connect();
        const db = client.db('testdb');
        const bucket = new GridFSBucket(db);
        
        // List files
        const files = await bucket.find({
            'metadata.type': 'video'
        }).toArray();
        console.log('Files:', files);
        
        // Delete file
        await bucket.delete(fileId);
        console.log('File deleted');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// -------------------------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------------------------

/**
 * GRIDFS:
 * 
 * - Stores files > 16MB in chunks (default 255KB)
 * - Two collections: fs.files (metadata) and fs.chunks (data)
 * - Supports streaming uploads/downloads
 * - Can store metadata with files
 * 
 * USE CASES:
 * - Large media files
 * - User uploads
 * - Document storage
 */

module.exports = { uploadFile, downloadFile, manageFiles };
