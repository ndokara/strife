import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';
import { createSecretToken } from '../middleware/generateToken';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';

const router = express.Router();

router.post('/register', async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, displayName, username, password, dateOfBirth } = req.body;
    const existingUser: IUser | null = await User.findOne({ $or: [{ email }, { username }] }).exec();
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already in use' });
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

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  try {
    const { username, password } = req.body;
    const user: IUser | null = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.isTwoFAEnabled) {
      const tempToken: string = jwt.sign(
        { userId: user.id, step: '2fa' },
                process.env.TOKEN_KEY!,
                { expiresIn: '5m' }
      );

      return res.status(200).json({
        message: '2FA required.',
        twoFARequired: true,
        tempToken,
      });
    }

    const token: string = createSecretToken(user.id);
    res.cookie('token', token, {
      domain: process.env.frontend_url,
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    return res.json({ token: token, message: 'Login Successful.' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/verify-2fa-onlogin', async (req: Request, res: Response): Promise<any> => {
  const { code, tempToken } = req.body;

  if (!code || !tempToken) {
    return res.status(400).json({ message: 'Missing code or tempToken.' });
  }

  try {
    const decoded: any = jwt.verify(tempToken, process.env.TOKEN_KEY!);

    const user: IUser | null = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (!user.isTwoFAEnabled || !user.twoFASecret) {
      return res.status(401).json({ message: '2FA not configured.' });
    }

    const isVerified: boolean = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isVerified) {
      return res.status(401).json({ message: 'Invalid 2FA code.' });
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

  } catch (error: any) {
    return res.status(401).json({ message: 'Invalid or expired temp token.' });
  }
});

router.post('/logout', (req: Request, res: Response, next: NextFunction): void => {
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
