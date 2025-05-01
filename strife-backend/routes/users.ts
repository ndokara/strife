import S3, { PutObjectRequest } from 'aws-sdk/clients/s3';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { fileTypeFromBuffer, FileTypeResult } from 'file-type';
import { promisify } from 'node:util';
import sharp from 'sharp';
import s3 from '../db/s3';
import uploadAvatar from '../middleware/uploadAvatar';
import { verifyToken } from '../middleware/verifyToken';
import User, { IUser } from '../models/user';
import router from './auth';

//TODO: set max length of all credentials on registration and updating.

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const defaultAvatarUrl: string = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg` as const;

const putObjectPromise: (params: PutObjectRequest) => Promise<S3.PutObjectOutput> = promisify(s3.putObject.bind(s3));

router.get('/profile', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user: IUser = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.post('/avatar', verifyToken, uploadAvatar.single('avatar'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      const imageBuffer: Buffer<ArrayBufferLike> = req.file.buffer;
      const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(imageBuffer);

      if (!fileType || !allowedTypes.includes(fileType.mime as typeof allowedTypes[number])) {
        res.status(400).json({
          message: 'Invalid image format. Please upload a valid image (JPEG, PNG, WebP).'
        });
        return;
      }

      const processedImage: Buffer<ArrayBufferLike> = await sharp(imageBuffer)
        .resize(512, 512, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();

      const shortHash: string = crypto.createHash('md5').update(req.user!.id).digest('hex').slice(0, 12);
      const fileName: string = `avatar-${shortHash}.jpg`;

      const params: { Bucket: string, Key: string, Body: Buffer<ArrayBufferLike>, ContentType: string } = {
        Bucket: 'avatars',
        Key: fileName,
        Body: processedImage,
        ContentType: 'image/jpeg',
      };
      await putObjectPromise(params);

      const avatarUrl: string = `${process.env.S3_ENDPOINT}/avatars/${fileName}`;
      await User.findByIdAndUpdate(req.user!.id, { avatarUrl });

      res.status(200).json({
        message: 'Avatar uploaded successfully.',
        avatarUrl,
      });
    } catch (err) {
      next(err);
    }
  });
router.delete('/avatar', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user!.id, { avatarUrl: defaultAvatarUrl });

    res.status(200).json({
      message: 'Avatar deleted successfully.',
      defaultAvatarUrl,
    });
    return;
  } catch (err) {
    return next(err);
  }
});
router.put('/display-name', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { displayName } = req.body;
    await User.findByIdAndUpdate(req.user!.id, { displayName });

    res.status(200).json({
      message: 'Display name updated successfully.',
    });
    return;
  } catch (err) {
    return next(err);
  }
});
router.put('/email', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    await User.findByIdAndUpdate(req.user!.id, { email });

    res.status(200).json({
      message: 'Email updated successfully.',
    });
    return;
  } catch (err) {
    return next(err);
  }
});
router.put('/date-of-birth', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dateOfBirth } = req.body;
    await User.findByIdAndUpdate(req.user!.id, { dateOfBirth });

    res.status(200).json({
      message: 'Date of birth updated successfully.',
    });
    return;
  } catch (err) {
    return next(err);
  }
});
router.put('/username', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newUsername } = req.body;
    const user: IUser | null = await User.findById(req.user!.id);

    const passwordValid: boolean = await bcrypt.compare(currentPassword, user!.password);
    if (!passwordValid) {
      res.status(403).json({ error: 'invalid_password', message: 'Incorrect password.' });
      return;
    }

    const usernameTaken: { _id: unknown } | null = await User.exists({ username: newUsername });
    if (usernameTaken) {
      res.status(409).json({ error: 'username_taken', message: 'Username is already taken.' });
    }
    user!.username = newUsername;
    await user!.save();
    res.status(200).json({ message: 'Username updated successfully.' });

  } catch {
    res.status(500).json({ error: 'server_error', message: 'Something went wrong.' });
  }
});

router.put('/password', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user: IUser | null = await User.findById(req.user!.id!);

    const passwordValid: boolean = await bcrypt.compare(currentPassword, user!.password);
    if (!passwordValid) {
      res.status(403).json({ error: 'invalid_password', message: 'Incorrect password.' });
      return;
    }

    user!.password = newPassword;
    await user!.save();
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
});

export default router;
