import { NextFunction, Request, Response } from 'express';
import speakeasy, { GeneratedSecret } from 'speakeasy';
import User, { IUser } from '../models/user';
import { AuthRequest, verifyToken } from '../middleware/verifyToken';
import router from "./auth";
import { generateBrandedQRCode } from "../utils/brandedQRCode";
import bcrypt from "bcrypt";


router.post('/2fa-setup', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user: IUser | null = await User.findById(authReq.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        //** Prevent regenerating secret if already enabled
        if (user.isTwoFAEnabled) {
            return res.status(400).json({ message: '2FA is already enabled for this account.' });
        }

        const secret: GeneratedSecret = speakeasy.generateSecret({
            name: `Strife (${user.email})`,
        });

        user.twoFASecret = secret.base32;
        await user.save();

        const qrCode: string = await generateBrandedQRCode(secret.otpauth_url!);

        res.json({ qrCode, secret: secret.base32 });
    } catch (err) {
        next(err);
    }
});


router.post('/verify-2fa-setup', verifyToken, async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        const authReq: AuthRequest = req as AuthRequest;
        if (!authReq.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const { token } = req.body;

        if (!authReq.user.id || !token) {
            return res.sendStatus(400);
        }

        const user: IUser = await User.findById(authReq.user.id).select('-password');
        if (!user || !user.twoFASecret) {
            return res.sendStatus(400);
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

        res.sendStatus(200);
    } catch (err) {
        next(err);
    }
});

router.post('/verify-2fa', verifyToken, async (authReq: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!authReq.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { token } = authReq.body;

        if (!authReq.user.id || !token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user: IUser | null = await User.findById(authReq.user.id).select('-password');
        if (!user || !user.twoFASecret) {
            return res.status(400).json({ message: '2FA not setup for this user' });
        }

        const verified = speakeasy.totp.verify({
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

router.post('/remove-2fa', verifyToken, async (authReq: AuthRequest, res: Response, next:NextFunction): Promise<any> =>{
    try{
        if (!authReq.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const {password} = authReq.body;
        const user: IUser | null = await User.findById(authReq.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Incorrect password." });
        }
        if (!user.isTwoFAEnabled) {
            return res.status(400).json({ message: '2FA is not enabled for this account.' });
        }
        user.isTwoFAEnabled = false;
        user.twoFASecret = undefined;
        await user.save();
        return res.status(200).json({ message: '2FA removed.' });
    }
    catch (err){
        next(err);
    }
});

export default router;
