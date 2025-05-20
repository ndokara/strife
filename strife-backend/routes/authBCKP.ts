import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import speakeasy from 'speakeasy';
import User, { IUser } from '../models/user';

const router = express.Router();

interface TempTokenPayload extends jwt.JwtPayload {
  userId: string;
  step: string;
}

interface DecodedRegisterToken {
  googleId: string;
  googleAccessToken: string,
  email: string;
  displayName?: string;
  username: string;
  avatarUrl: string
}

function createSecretToken(id: string): string {
  return jwt.sign({ sub: id }, process.env.TOKEN_KEY!, {
    expiresIn: 3 * 24 * 60 * 60, // 3 days
  });
}


router.post('/complete-registration', async (req: Request, res: Response): Promise<void> => {
  try {
    const { registerToken, dateOfBirth } = req.body;

    if (!registerToken) {
      res.status(400).json({ message: 'Missing register token.' });
      return;
    }
    if (!dateOfBirth) {
      res.status(400).json({ message: 'Missing date of birth.' });
      return;
    }

    let decoded: DecodedRegisterToken;
    try {
      decoded = jwt.verify(registerToken, process.env.TOKEN_KEY!) as DecodedRegisterToken;
    } catch {
      res.status(401).json({ message: 'Invalid or expired token.' });
      return;
    }

    const { googleId, googleAccessToken, email, displayName, username, avatarUrl } = decoded;

    const existingUser = await User.findOne({ $or: [{ email }, { googleId }] }).exec();
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this Google account or email.' });
      return;
    }

    const user: IUser = new User({
      googleId,
      googleAccessToken,
      email,
      displayName,
      username,
      avatarUrl,
      dateOfBirth,
    });

    await user.save();
    const token = createSecretToken(user.id);

    res.cookie('token', token, {
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.status(201).json({ message: 'Google user registered successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      console.error(err);
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }

    if (user) {
      const token = createSecretToken(user.id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400000,
      });
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard/myaccount`);
    }

    if (info?.registerToken) {
      return res.redirect(`${process.env.FRONTEND_URL}/complete-registration?token=${info.registerToken}`);
    }
    if (info?.twoFARequired && info.tempToken) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?tempToken=${info.tempToken}`);
    } else return res.redirect(`${process.env.FRONTEND_URL}/login`);
  })(req, res, next);
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, displayName, username, password, dateOfBirth } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] }).exec();
    if (existingUser) {
      res.status(400).json({ message: 'Email or username already in use' });
      return;
    }
    const defaultAvatarUrl = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg`;
    const user: IUser = new User({
      email,
      displayName,
      username,
      password,
      dateOfBirth,
      avatarUrl: defaultAvatarUrl,
    });
    await user.save();

    const token = createSecretToken(user.id);

    res.cookie('token', token, {
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, code} = req.body;
    const user: IUser | null = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password!))) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    if (user.isTwoFAEnabled && !code) {
      res.status(200).json({
        message: '2FA required.',
        twoFARequired: true,
      });
      return;
    }
    else if (user.isTwoFAEnabled && code){
      const isVerified: boolean = speakeasy.totp.verify({
        secret: user.twoFASecret!,
        encoding: 'base32',
        token: code,
        window: 1,
      });
      if (!isVerified) {
        res.status(401).json({ message: 'Invalid 2FA code.' });
        return;
      }
    }

    const token: string = createSecretToken(user.id);
    res.cookie('token', token, {
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.json({ token: token });
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
    const decoded = jwt.verify(tempToken, process.env.TOKEN_KEY!);
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
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.status(200).json({ accessToken });

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid or expired temp token.' });
    return;
  }
});

router.post('/logout', (req: Request, res: Response): void => {
  try {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
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
    console.error(error);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});
export default router;
