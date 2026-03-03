/**
 * Media Service
 * Phase 1: Store files locally using multer
 * Phase 2: Replace with Amazon S3 upload
 * 
 * IMPORTANT: Controllers must never change when switching to Phase 2
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';

async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(path.join(uploadDir, 'images'), { recursive: true });
    await fs.mkdir(path.join(uploadDir, 'videos'), { recursive: true });
  } catch (error) {
    console.error('Error creating upload directories:', error);
  }
}

ensureUploadDir();

// Phase 1: Local storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    cb(null, path.join(uploadDir, subDir));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png'];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG images and MP4, MOV videos are allowed.'));
  }
};

// Multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_IMAGE_SIZE) || 26214400 // 25MB default
  }
});

/**
 * Get file URL for uploaded media
 * Phase 1: Returns local file path
 * Phase 2: Returns S3 URL
 * @param {string} filename - Name of uploaded file
 * @param {string} type - 'image' or 'video'
 * @returns {string} File URL
 */
function getFileUrl(filename, type = 'image') {
  // Phase 1: Return local path
  return `/uploads/${type}s/${filename}`;
  
  // Phase 2: Return S3 URL
  // return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${filename}`;
}

/**
 * Upload file to storage
 * Phase 1: Already handled by multer middleware
 * Phase 2: Upload to S3 after multer processes file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} File URL
 */
async function uploadFile(file) {
  // Phase 1: File already saved locally by multer
  const type = file.mimetype.startsWith('video/') ? 'video' : 'image';
  return getFileUrl(file.filename, type);
}

/**
 * Delete file from storage
 * @param {string} fileUrl - File URL to delete
 */
async function deleteFile(fileUrl) {
  try {
    // Phase 1: Delete local file
    const filename = path.basename(fileUrl);
    const type = fileUrl.includes('/videos/') ? 'videos' : 'images';
    const filePath = path.join(uploadDir, type, filename);
    await fs.unlink(filePath);
    
    // Phase 2: Delete from S3
    // const s3Client = new S3Client({ region: process.env.AWS_REGION });
    // await s3Client.send(new DeleteObjectCommand({
    //   Bucket: process.env.S3_BUCKET_NAME,
    //   Key: filename
    // }));
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

/**
 * Phase 2 Implementation Guide:
 * 
 * const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
 * 
 * async function uploadFile(file) {
 *   const s3Client = new S3Client({ region: process.env.AWS_REGION });
 *   
 *   const key = `${Date.now()}-${file.originalname}`;
 *   
 *   await s3Client.send(new PutObjectCommand({
 *     Bucket: process.env.S3_BUCKET_NAME,
 *     Key: key,
 *     Body: file.buffer,
 *     ContentType: file.mimetype
 *   }));
 *   
 *   return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
 * }
 */

module.exports = {
  upload,
  uploadFile,
  getFileUrl,
  deleteFile
};
