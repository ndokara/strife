import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';
import { createSecretToken } from '../middleware/generateToken';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import User, { IUser } from '../models/user';

const router = express.Router();

interface TempTokenPayload extends jwt.JwtPayload {
  userId: string;
  step: string;
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, displayName, username, password, dateOfBirth } = req.body;
    const existingUser: IUser | null = await User.findOne({ $or: [{ email }, { username }] }).exec();
    if (existingUser) {
      res.status(400).json({ message: 'Email or username already in use' });
      return;
    }
    const defaultAvatarUrl: string = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg`;
    const user: IUser = new User({
      email,
      displayName,
      username,
      password,
      dateOfBirth,
      avatarUrl: defaultAvatarUrl
    });
    await user.save();

    const token = createSecretToken(user.id.toString());

    res.cookie('token', token, {
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const user: IUser | null = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ message: 'Invalid credentials.' });
      return;
    }

    if (user.isTwoFAEnabled) {
      const tempToken: string = jwt.sign(
        { userId: user.id, step: '2fa' },
        process.env.TOKEN_KEY!,
        { expiresIn: '5m' }
      );

      res.status(200).json({
        message: '2FA required.',
        twoFARequired: true,
        tempToken,
      });
      return;
    }

    const token: string = createSecretToken(user.id);
    res.cookie('token', token, {
      domain: process.env.frontend_url,
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.json({ token: token, message: 'Login Successful.' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verify-2fa-onlogin', async (req: Request, res: Response): Promise<void> => {
  const { code, tempToken } = req.body;

  if (!code || !tempToken) {
    res.status(400).json({ message: 'Missing code or tempToken.' });
    return;
  }

  try {
    const decoded: string | jwt.JwtPayload = jwt.verify(tempToken, process.env.TOKEN_KEY!);
    if (typeof decoded !== 'object' || !('userId' in decoded)) {
      res.status(401).json({ message: 'Invalid token payload.' });
      return;
    }

    const { userId } = decoded as TempTokenPayload;
    const user: IUser | null = await User.findById(userId);


    if (!user) {
      res.status(401).json({ message: 'Unauthorized.' });
      return;
    }

    if (!user.isTwoFAEnabled || !user.twoFASecret) {
      res.status(401).json({ message: '2FA not configured.' });
      return;
    }

    const isVerified: boolean = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isVerified) {
      res.status(401).json({ message: 'Invalid 2FA code.' });
      return;
    }

    const accessToken = createSecretToken(user.id);

    res.cookie('accessToken', accessToken, {
      domain: process.env.frontend_url,
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.status(200).json({ accessToken });

  } catch (err: unknown) {
    res.status(401).json({ message: 'Invalid or expired temp token.' });
    return;
  }
});

router.post('/logout', (req: Request,res: Response): void => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});


router.post('/check-existing-credentials', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username } = req.body;
    const [emailExists, usernameExists] = await Promise.all([
      User.exists({ email }).then(Boolean),
      User.exists({ username }).then(Boolean),
    ]);

    res.json({ emailExists, usernameExists });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});
export default router;
