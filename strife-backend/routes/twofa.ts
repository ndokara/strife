import { NextFunction, Request, Response } from 'express';
import speakeasy, { GeneratedSecret } from 'speakeasy';
import User, { IUser } from '../models/user';
import { verifyToken } from '../middleware/verifyToken';
import router from './auth';
import { generateBrandedQRCode } from '../utils/brandedQRCode';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

router.post('/2fa-setup', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.user!.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { email = user.email } = req.body;
    const secret: GeneratedSecret = speakeasy.generateSecret({
      name: `Strife: ${email}`,
    });

    const tempToken = jwt.sign(
      {
        newTwoFASecret: secret.base32,
        createdAt: Date.now(),
      },
      process.env.TOKEN_KEY as string,
      { expiresIn: '5m' }
    );

    const qrCode: string = await generateBrandedQRCode(secret.otpauth_url!);
    res.json({ qrCode, tempToken });
  } catch (err) {
    next(err);
  }
});

router.post('/verify-2fa-setup', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token: code, tempToken } = req.body;

    if (!code || !tempToken) {
      res.status(400).json({ message: 'Token and temporary secret token are required.' });
      return;
    }

    const user: IUser | null = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    let payload: jwt.JwtPayload;
    try {
      const decoded = jwt.verify(tempToken, process.env.TOKEN_KEY as string);
      if (typeof decoded === 'string') {
        res.status(400).json({ error: 'Invalid token format' });
        return;
      }
      payload = decoded;
    } catch (err) {
      res.status(400).json({ error: 'Invalid or expired temp token' });
      return;
    }

    const verified = speakeasy.totp.verify({
      secret: payload.newTwoFASecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!verified) {
      res.status(403).json({ error: 'Invalid 2FA code' });
      return;
    }

    user.twoFASecret = payload.newTwoFASecret;
    user.isTwoFAEnabled = true;
    await user.save();

    res.status(200).json({ message: '2FA enabled successfully.' });
  } catch (err) {
    next(err);
  }
});


router.post('/verify-2fa', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { token } = req.body;
    if (!token) {
      res.status(400).json({ message: 'Token is required' });
      return;
    }

    const user: IUser | null = await User.findById(req.user.id).select('-password');
    if (!user || !user.twoFASecret) {
      res.status(400).json({ message: '2FA not setup for this user' });
      return;
    }

    const verified: boolean = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      res.status(403).json({ error: 'invalid_token', message: 'Invalid 2FA Token.' });
      return;
    }

    res.status(200).json({ message: 'Token verified' });
  } catch (err) {
    next(err);
  }
});

router.post('/remove-2fa', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const { password } = req.body;
    const user: IUser | null = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if(!user.password){
      return;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      res.status(403).json({ error: 'invalid_password', message: 'Incorrect password.' });
      return;
    }

    if (!user.isTwoFAEnabled) {
      res.status(400).json({ message: '2FA is not enabled for this account.' });
      return;
    }

    user.isTwoFAEnabled = false;
    user.twoFASecret = undefined;
    await user.save();
    res.status(200).json({ message: '2FA removed successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
