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

    if (user.isTwoFAEnabled) {
      res.status(400).json({ message: '2FA is already enabled for this account.' });
      return;
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
router.post('/2fa-setup-new', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.user!.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (!user.isTwoFAEnabled) {
      res.status(400).json({ message: '2FA is not enabled for this account.' });
      return;
    }

    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

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

router.put('/verify-2fa-setup-and-update', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user: IUser | null = await User.findById(req.user!.id).select('-password');
    if (!user || !user.twoFASecret) {
      res.status(400).json({ message: '2FA not setup for this user' });
      return;
    }

    const { secretToken, newToken } = req.body;

    let payload: jwt.JwtPayload;
    try {
      const decoded = jwt.verify(secretToken, process.env.TOKEN_KEY as string);

      if (typeof decoded === 'string') {
        res.status(400).json({ error: 'Unexpected token format' });
        return;
      }

      payload = decoded;
      if (typeof payload.newTwoFASecret !== 'string') {
        res.status(400).json({ error: 'Invalid token payload' });
        return;
      }

    } catch (err) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    const newVerified = speakeasy.totp.verify({
      secret: payload.newTwoFASecret,
      encoding: 'base32',
      token: newToken,
    });

    if (!newVerified) {
      res.status(403).json({ error: 'invalid_new_token', message: 'Invalid New 2FA Token.' });
      return;
    }
    user.twoFASecret = payload.newTwoFASecret;
    await user.save();
    res.sendStatus(200);

  } catch (err) {
    next(err);
  }
});

router.post('/verify-2fa-setup', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified){
      res.status(400).json({ error: 'Invalid 2FA token' });
      return ;
    }

    user.isTwoFAEnabled = true;
    await user.save();

    res.status(200).json({ message: 'New 2FA Token Verified.' });
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
