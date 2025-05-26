import bcrypt from 'bcrypt';
import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import User, { IUser } from '../models/user';
import { processAndUploadAvatar } from '../utils/processUploadAvatar';

const router = express.Router();

function createSecretToken(id: string): string {
  return jwt.sign({ sub: id }, process.env.TOKEN_KEY!, {
    expiresIn: 3 * 24 * 60 * 60, // 3 days
  });
}

router.post('/google', async (req: Request, res: Response): Promise<void> => {
  const { accessToken } = req.body;
  if (!accessToken) {
    res.status(400).json({ error: 'Missing access token' });
    return;
  }

  try {
    const userInfoRes = await fetch(`${process.env.GOOGLE_USER_INFO}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userInfoRes.ok) {
      res.status(403).json({ error: 'Failed to fetch user info from Google' });
      return;
    }

    const profile = await userInfoRes.json();
    const { email, name, picture, sub: googleId } = profile;
    if (!email || !googleId) {
      res.status(403).json({ error: 'Incomplete user info from Google' });
      return;
    }

    const user: IUser | null = await User.findOne({ $or: [{ email }, { email }] }).exec();

    if (!user) {
      const defaultUsername = email.split('@')[0];
      let username = defaultUsername;
      let counter = 1;

      while (await User.exists({ username })) {
        username = `${defaultUsername}_${counter}`;
        counter++;
      }

      const photoUrl = picture?.replace(/=s\d+-c$/, '=s800-c');
      let avatarUrl = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg`;

      if (photoUrl) {
        try {
          const response = await fetch(photoUrl);
          if (!response.ok) throw new Error('Failed to fetch avatar from Google');

          const imageBuffer = Buffer.from(await response.arrayBuffer());
          avatarUrl = await processAndUploadAvatar(googleId, imageBuffer);
        } catch (err) {
          console.warn('Failed to process Google avatar:', err);
        }
      }

      const tempUserData = {
        googleId,
        email,
        displayName: name,
        username,
        avatarUrl,
        accessToken,
      };

      res.status(200).json({
        needsCompletion: true,
        userData: tempUserData,
      });
    } else {
      user.googleAccessToken = accessToken;
      await user.save();

      if (user.isTwoFAEnabled) {
        const tempUserData = {
          googleId,
          username: user.username
        };
        res.status(200).json({
          twoFARequired: true,
          userData: tempUserData,
        });
        return;
      }

      const token = createSecretToken(user.id);
      res.cookie('token', token, {
        path: '/',
        expires: new Date(Date.now() + 86400000), // 1 day
        secure: true,
        httpOnly: true,
      });

      res.json({ token });
    }
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
    return;
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, displayName, username, password, dateOfBirth, googleId, avatarUrl, accessToken } = req.body;
    const existingUser: IUser | null = await User.findOne({ $or: [{ email }, { username }] }).exec();

    if (existingUser) {
      res.status(400).json({ message: 'Email or username already in use' });
      return;
    }

    let user: IUser;
    if (googleId && avatarUrl) {
      user = new User({
        email,
        displayName,
        username,
        dateOfBirth,
        avatarUrl,
        googleId,
        googleAccessToken: accessToken,
      });

    } else {
      const defaultAvatarUrl = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg`;
      user = new User({
        email,
        displayName,
        username,
        password,
        dateOfBirth,
        avatarUrl: defaultAvatarUrl,
      });
    }
    await user.save();
    const token = createSecretToken(user.id);

    res.cookie('token', token, {
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.json({ token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong.' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, code } = req.body;
    const user: IUser | null = await User.findOne({ username });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    if (!user.googleId) {
      if (!(await bcrypt.compare(password, user.password!))) {
        res.status(401).json({ message: 'Invalid credentials.' });
        return;
      }
    }

    if (user.isTwoFAEnabled) {
      if (!code) {
        res.status(200).json({
          message: '2FA required.',
          twoFARequired: true,
        });
        return;
      } else {
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
    }

    const token: string = createSecretToken(user.id);
    res.cookie('token', token, {
      path: '/',
      expires: new Date(Date.now() + 86400000),
      secure: true,
      httpOnly: true,
    });

    res.json({ token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong.' });
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
