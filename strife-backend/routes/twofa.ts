import { NextFunction, Request, Response } from 'express';
import speakeasy, { GeneratedSecret } from 'speakeasy';
import User, { IUser } from '../models/user';
import { verifyToken } from '../middleware/verifyToken';
import router from "./auth";
import { generateBrandedQRCode } from "../utils/brandedQRCode";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


router.post('/2fa-setup', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user: IUser | null = await User.findById(req.user!.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isTwoFAEnabled) {
            return res.status(400).json({ message: '2FA is already enabled for this account.' });
        }

        const secret: GeneratedSecret = speakeasy.generateSecret({
            name: `Strife: ${user.email}`,
        });

        user.twoFASecret = secret.base32;
        await user.save();
        const qrCode: string = await generateBrandedQRCode(secret.otpauth_url!);

        res.json({ qrCode });
    } catch (err) {
        next(err);
    }
});
router.post('/2fa-setup-new', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user: IUser | null = await User.findById(req.user!.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.isTwoFAEnabled) {
            return res.status(400).json({ message: '2FA is not enabled for this account.' });
        }
        const { email } = req.body;
        const secret: GeneratedSecret = speakeasy.generateSecret({
            name: `Strife: ${email}`,
        });

        const secretToken = jwt.sign(
            {
                newTwoFASecret: secret.base32,
                createdAt: Date.now()
            },
            process.env.TOKEN_KEY as string,
            { expiresIn: '5m' }
        );
        const qrCode: string = await generateBrandedQRCode(secret.otpauth_url!);
        res.json({ qrCode, tempToken: secretToken });
    } catch (err) {
        next(err);
    }
});

router.put('/verify-2fa-setup-and-update', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user: IUser | null = await User.findById(req.user!.id).select('-password');
        if (!user || !user.twoFASecret) {
            return res.status(400).json({ message: '2FA not setup for this user' });
        }

        const { secretToken, newToken } = req.body;

        let payload: jwt.JwtPayload;
        try {
            const decoded = jwt.verify(secretToken, process.env.TOKEN_KEY as string);

            if (typeof decoded === 'string') {
                return res.status(400).json({ error: 'Unexpected token format' });
            }

            payload = decoded;
        } catch (err) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }

        const newVerified = speakeasy.totp.verify({
            secret: payload.newTwoFASecret,
            encoding: 'base32',
            token: newToken,
        });

        if (!newVerified) {
            return res.status(403).json({ error: "invalid_new_token", message: "Invalid New 2FA Token." });
        }
        user.twoFASecret = payload.newTwoFASecret;
        user.save();
        res.sendStatus(200);

    } catch (err) {
        next(err);
    }
});

router.post('/verify-2fa-setup', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user: IUser = await User.findById(req.user.id).select('-password');
        if (!user || !user.twoFASecret) {
            return res.status(400).json({ message: '2FA not setup for this user' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!verified) return res.status(400).json({ error: 'Invalid 2FA token' });

        user.isTwoFAEnabled = true;
        await user.save();

        return res.status(200).json({ message: 'New 2FA Token Verified.' });
    } catch (err) {
        next(err);
    }
});

router.post('/verify-2fa', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user: IUser | null = await User.findById(req.user.id).select('-password');
        if (!user || !user.twoFASecret) {
            return res.status(400).json({ message: '2FA not setup for this user' });
        }

        const verified: boolean = speakeasy.totp.verify({
            secret: user.twoFASecret,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!verified) {
            return res.status(403).json({ error: "invalid_token", message: "Invalid 2FA Token." });
        }

        return res.status(200).json({ message: 'Token verified' });
    } catch (err) {
        next(err);
    }
});

router.post('/remove-2fa', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { password } = req.body;
        const user: IUser | null = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(403).json({ error: "invalid_password", message: "Incorrect password." });
        }

        if (!user.isTwoFAEnabled) {
            return res.status(400).json({ message: '2FA is not enabled for this account.' });
        }

        user.isTwoFAEnabled = false;
        user.twoFASecret = undefined;
        await user.save();
        return res.status(200).json({ message: '2FA removed successfully.' });
    } catch (err) {
        next(err);
    }
});

export default router;
