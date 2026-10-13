/// <reference types="multer" />
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly logger = new Logger(S3Service.name);
  private bucketName: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';

    // If keys are provided, configure S3 Client.
    // On AWS EC2 with an IAM role attached, credentials might be auto-loaded,
    // but typically we pass them via env for simplicity.
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      });
    } else {
      // Fallback for EC2 IAM Profile
      this.s3Client = new S3Client({ region });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'avatars',
  ): Promise<string> {
    if (!this.bucketName) {
      this.logger.error('AWS_S3_BUCKET_NAME is not configured in .env');
      throw new InternalServerErrorException('S3 Bucket is not configured');
    }

    try {
      const ext = path.extname(file.originalname);
      const filename = `${folder}/${uuidv4()}${ext}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        // ACL: 'public-read' // Only if bucket allows ACLs, otherwise use Bucket Policy
      });

      await this.s3Client.send(command);

      // Return the public URL
      return `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
    } catch (error) {
      this.logger.error('Error uploading file to S3', error);
      throw new InternalServerErrorException('Failed to upload file to S3');
    }
  }

  async deleteFile(fileUrl: string, allowedPrefix: string = 'avatars/'): Promise<void> {
    if (!this.bucketName || !fileUrl || typeof fileUrl !== 'string') {
      return;
    }

    try {
      const url = new URL(fileUrl);
      const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

      // Strict validation: must start with the allowed prefix, cannot traverse paths,
      // and must match this bucket's domain.
      if (!key || !key.startsWith(allowedPrefix) || key.includes('..')) {
        this.logger.warn(`Rejected S3 delete for disallowed key: ${key}`);
        return;
      }

      if (!url.hostname.startsWith(`${this.bucketName}.s3.`)) {
        this.logger.warn(`Rejected S3 delete for foreign host: ${url.hostname}`);
        return;
      }

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully deleted old file from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${fileUrl}`, error);
    }
  }
}
