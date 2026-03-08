// aws.js
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

// ✅ S3 Client
export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// ✅ Rekognition Client
export const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// ✅ Upload file to S3
export async function uploadFileToS3(file) {
  const fileStream = fs.createReadStream(file.path);
  const fileName = `injury_reports/${Date.now()}_${file.originalname}`;

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
    ContentType: file.mimetype,
  };

  await s3.send(new PutObjectCommand(params));

  // Return public S3 URL
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

// ✅ Detect labels from image using Rekognition
export async function detectLabelsS3(s3Key) {
  const params = {
    Image: {
      S3Object: {
        Bucket: process.env.S3_BUCKET_NAME,
        Name: s3Key,
      },
    },
    MaxLabels: 10,
    MinConfidence: 70,
  };

  const command = new DetectLabelsCommand(params);
  const result = await rekognition.send(command);
  return result.Labels || [];
}