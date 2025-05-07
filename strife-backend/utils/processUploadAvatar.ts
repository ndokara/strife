import sharp from 'sharp';
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';
import S3, { PutObjectRequest } from 'aws-sdk/clients/s3';
import { promisify } from 'node:util';
import s3 from '../db/s3';

const putObjectPromise: (params: PutObjectRequest) => Promise<S3.PutObjectOutput> = promisify(s3.putObject.bind(s3));
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;

export async function processAndUploadAvatar(userId: string, imageBuffer: Buffer): Promise<string> {
  const fileType = await fileTypeFromBuffer(imageBuffer);
  if (!fileType || !allowedTypes.includes(fileType.mime as typeof allowedTypes[number])) {
    throw new Error('Invalid image format.');
  }

  const processedImage = await sharp(imageBuffer)
    .resize(512, 512, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 85 })
    .toBuffer();

  const shortHash = crypto.createHash('md5').update(userId).digest('hex').slice(0, 12);
  const fileName = `avatar-${shortHash}.jpg`;

  await putObjectPromise({
    Bucket: 'avatars',
    Key: fileName,
    Body: processedImage,
    ContentType: 'image/jpeg',
  });

  return `${process.env.S3_ENDPOINT}/avatars/${fileName}`;
}
