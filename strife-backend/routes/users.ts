import { verifyToken } from "../middleware/verifyToken";
import { NextFunction, Request, Response } from "express";
import User, { IUser } from "../models/user";
import router from "./auth";
import uploadAvatar from "../middleware/uploadAvatar";
import { fileTypeFromBuffer, FileTypeResult } from 'file-type'
import bcrypt from "bcrypt";
import s3 from '../db/s3';
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { promisify } from "node:util";
import sharp = require('sharp');
import crypto = require('crypto');

//TODO: set max length of all credentials on registration and updating.

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const defaultAvatarUrl: string = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg` as const;

const putObjectPromise: (params: PutObjectRequest) => Promise<any> = promisify(s3.putObject.bind(s3));

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
    async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded.' });
            }

            const imageBuffer: Buffer<ArrayBufferLike> = req.file.buffer;
            const fileType: FileTypeResult | undefined = await fileTypeFromBuffer(imageBuffer);

            if (!fileType || !allowedTypes.includes(fileType.mime as typeof allowedTypes[number])) {
                return res.status(400).json({
                    message: 'Invalid image format. Please upload a valid image (JPEG, PNG, WebP).'
                });
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

            return res.status(200).json({
                message: 'Avatar uploaded successfully.',
                avatarUrl,
            });

        } catch (err) {
            next(err);
        }
    });

router.delete('/avatar', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {

        await User.findByIdAndUpdate(req.user!.id, { avatarUrl: defaultAvatarUrl });

        return res.status(200).json({
            message: 'Avatar deleted successfully.',
            defaultAvatarUrl,
        });
    } catch (err) {
        return next(err);
    }
});
router.put('/display-name', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { displayName } = req.body;
        await User.findByIdAndUpdate(req.user!.id, { displayName });

        return res.status(200).json({
            message: 'Display name updated successfully.',
        });
    } catch (err) {
        return next(err);
    }
});
router.put('/email', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { email } = req.body;
        await User.findByIdAndUpdate(req.user!.id, { email });

        return res.status(200).json({
            message: 'Email updated successfully.',
        });
    } catch (err) {
        return next(err);
    }
});
router.put('/date-of-birth', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { dateOfBirth } = req.body;
        await User.findByIdAndUpdate(req.user!.id, { dateOfBirth });

        return res.status(200).json({
            message: 'Date of birth updated successfully.',
        });
    } catch (err) {
        return next(err);
    }
});

router.put('/username', verifyToken, async (req: Request, res: Response): Promise<any> => {
    try {

        const { currentPassword, newUsername } = req.body;
        const user: IUser | null = await User.findById(req.user!.id);

        const passwordValid: boolean = await bcrypt.compare(currentPassword, user!.password);
        if (!passwordValid) {
            return res.status(403).json({ error: "invalid_password", message: "Incorrect password." });
        }

        const usernameTaken: { _id: any } | null = await User.exists({ username: newUsername });
        if (usernameTaken) {
            return res.status(409).json({ error: "username_taken", message: "Username is already taken." });
        }
        user!.username = newUsername;
        await user!.save();
        res.status(200).json({ message: "Username updated successfully." });

    } catch (err) {
        res.status(500).json({ error: "server_error", message: "Something went wrong." });
    }
});

router.put('/password', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user: IUser | null = await User.findById(req.user!.id);

        const passwordValid: boolean = await bcrypt.compare(currentPassword, user!.password);
        if (!passwordValid) {
            return res.status(403).json({ error: "invalid_password", message: "Incorrect password." });
        }

        user!.password = newPassword;
        await user!.save();
        res.status(200).json({ message: "Password updated successfully." });
    } catch (err) {
        return next(err);
    }
});

export default router