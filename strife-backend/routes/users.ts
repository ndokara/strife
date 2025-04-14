import { AuthRequest, verifyToken } from "../middleware/verifyToken";
import { NextFunction, Request, Response } from "express";
import User, { IUser } from "../models/user";
import router from "./auth";
import uploadAvatar from "../middleware/uploadAvatar";
import { fileTypeFromBuffer, FileTypeResult } from 'file-type'
import bcrypt from "bcrypt";
import sharp = require('sharp');
import crypto = require('crypto');
import s3 from '../db/minioClient';

router.get('/profile', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const user: IUser = await User.findById(authReq.user.id).select('-password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    } catch (err) {
        next(err);
    }
});

router.post('/upload-avatar', verifyToken, uploadAvatar.single('avatar'),
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            const authReq: AuthRequest = req as AuthRequest;
            if (!authReq.user) {
                return res.status(401).json({ message: 'Unauthorized. Log in first.' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded.' });
            }

            const imageBuffer: Buffer<ArrayBufferLike> = req.file.buffer;
            const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(imageBuffer);
            const allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];

            if (!fileType || !allowedTypes.includes(fileType.mime)) {
                return res.status(400).json({
                    message: 'Invalid image format. Please upload a valid image (JPEG, PNG, WebP).'
                });
            }

            const processedImage: Buffer<ArrayBufferLike> = await sharp(imageBuffer)
                .resize(512, 512, { fit: 'cover', position: 'center' })
                .jpeg({ quality: 85 })
                .toBuffer();

            const shortHash: string = crypto.createHash('md5').update(authReq.user.id).digest('hex').slice(0, 12);
            const fileName: string = `avatar-${shortHash}.jpg`;

            const params: { Bucket: string, Key: string, Body: Buffer<ArrayBufferLike>, ContentType: string } = {
                Bucket: 'avatars',
                Key: fileName,
                Body: processedImage,
                ContentType: 'image/jpeg',
            };

            s3.putObject(params, async (err: any, data: any): Promise<any> => {
                if (err) return next(err);

                const avatarUrl: string = `${process.env.MINIO_ENDPOINT}/avatars/${fileName}`;

                try {
                    await User.findByIdAndUpdate(authReq.user!.id, { avatarUrl });

                    return res.status(200).json({
                        message: 'Avatar uploaded successfully.',
                        avatarUrl,
                    });
                } catch (dbError) {
                    return next(dbError);
                }
            });

        } catch (error) {
            next(error);
        }
    });
router.put('/remove-avatar', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized. Log in first.' });
        }
        const defaultAvatarUrl: string = `${process.env.MINIO_ENDPOINT}/avatars/avatar-default.jpg`
        await User.findByIdAndUpdate(authReq.user!.id, { avatarUrl: defaultAvatarUrl });
        return res.status(200).json({
            message: 'Avatar uploaded successfully.',
            defaultAvatarUrl,
        });
    } catch (dbError) {
        return next(dbError);
    }
});
router.put('/update-display-name', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized. Log in first.' });
        }
        const { displayName } = req.body;
        await User.findByIdAndUpdate(authReq.user!.id, { displayName });
        return res.status(200).json({
            message: 'Display name updated successfully.',
        });
    } catch (dbError) {
        return next(dbError);
    }
});
router.put('/update-email', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized. Log in first.' });
        }
        const { email } = req.body;
        await User.findByIdAndUpdate(authReq.user!.id, { email });
        return res.status(200).json({
            message: 'Email updated successfully.',
        });
    } catch (dbError) {
        return next(dbError);
    }
});
router.put('/update-date-of-birth', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized. Log in first.' });
        }
        const { dateOfBirth } = req.body;
        await User.findByIdAndUpdate(authReq.user!.id, { dateOfBirth });
        return res.status(200).json({
            message: 'Date of birth updated successfully.',
        });
    } catch (dbError) {
        return next(dbError);
    }
});
router.put('/update-username', verifyToken, async (req: Request, res: Response): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized. Log in first.' });
        }

        const { currentPassword, newUsername } = req.body;
        const user: IUser | null = await User.findById(authReq.user.id!);
        if (!user) {
            return res.status(404).json({ error: "user_not_found", message: "User not found." });
        }

        const passwordValid: boolean = await bcrypt.compare(currentPassword, user.password);
        if (!passwordValid) {
            return res.status(403).json({ error: "invalid_password", message: "Incorrect password." });
        }

        const usernameTaken: { _id: any } | null = await User.exists({ username: newUsername });
        if (usernameTaken) {
            return res.status(409).json({ error: "username_taken", message: "Username is already taken." });
        }
        user.username = newUsername;
        await user.save();
        res.status(200).json({ message: "Username updated successfully." });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "server_error", message: "Something went wrong." });
    }
});

export default router