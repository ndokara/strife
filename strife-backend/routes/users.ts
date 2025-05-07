import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from 'express';
import uploadAvatar from '../middleware/uploadAvatar';
import { verifyToken } from '../middleware/verifyToken';
import User, { IUser } from '../models/user';
import router from './auth';
import { processAndUploadAvatar } from '../utils/processUploadAvatar';

//TODO: set max length of all credentials on registration and updating.

const defaultAvatarUrl: string = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg` as const;


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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded.' });
        return;
      }

      const imageBuffer: Buffer<ArrayBufferLike> = req.file.buffer;
      const avatarUrl: string = await processAndUploadAvatar(req.user!.id!, imageBuffer);
      await User.findByIdAndUpdate(req.user!.id, { avatarUrl });

      res.status(200).json({
        message: 'Avatar uploaded successfully.',
        avatarUrl,
      });

    } catch (err) {
      next(err);
    }
  });

router.delete('/avatar', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user!.id, { avatarUrl: defaultAvatarUrl });

    res.status(200).json({
      message: 'Avatar deleted successfully.',
      defaultAvatarUrl,
    });

  } catch (err) {
    return next(err);
  }
});

router.put('/google-avatar', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> =>{
  try{
    const user = await User.findById(req.user!.id);
    if (!user || !user.googleAccessToken) {
      res.status(403).json({ message: 'Google access token missing or user not found.' });
      return;
    }

    // Fetching updated Google profile using the OAuth token
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${user.googleAccessToken}`
      }
    });

    if (!googleRes.ok) {
      res.status(400).json({ message: 'Failed to fetch Google profile.' });
      return;
    }

    const profile = await googleRes.json();
    let googleAvatarUrl = profile.picture;

    if (!googleAvatarUrl) {
      res.status(400).json({ message: 'No avatar URL found in Google profile.' });
      return;
    }
    googleAvatarUrl = googleAvatarUrl.replace(/=s\d+-c$/, '=s800-c');
    if (!/=s\d+-c$/.test(googleAvatarUrl)) {
      googleAvatarUrl += '=s800-c';
    }
    const imageRes = await fetch(googleAvatarUrl);
    const imageBuffer: Buffer<ArrayBuffer> = Buffer.from(await imageRes.arrayBuffer());

    const avatarUrl: string = await processAndUploadAvatar(req.user!.id!, imageBuffer);
    await User.findByIdAndUpdate(req.user!.id, { avatarUrl });

    res.status(200).json({
      message: 'Avatar uploaded successfully.',
      avatarUrl,
    });

  } catch (err){
    return next(err);
  }

});

router.put('/display-name', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { displayName } = req.body;
    await User.findByIdAndUpdate(req.user!.id, { displayName });

    res.status(200).json({
      message: 'Display name updated successfully.',
    });
    return;
  } catch (err) {
    return next(err);
  }
});
router.put('/email', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    await User.findByIdAndUpdate(req.user!.id, { email });

    res.status(200).json({
      message: 'Email updated successfully.',
    });
    return;
  } catch (err) {
    return next(err);
  }
});
router.put('/date-of-birth', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { dateOfBirth } = req.body;
    await User.findByIdAndUpdate(req.user!.id, { dateOfBirth });

    res.status(200).json({
      message: 'Date of birth updated successfully.',
    });
    return;
  } catch (err) {
    return next(err);
  }
});

router.put('/username', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {

    const { currentPassword, newUsername } = req.body;
    const user: IUser | null = await User.findById(req.user!.id);
    if(!user){
      res.status(404).json({error: 'user_not_found', message: 'User not found.'});
      return;
    }

    if (!user!.password && !user!.googleId) {
      res.status(403).json({error: 'no_password', message: 'Password is required.'});
      return;
    }
    if(user.password){
      const passwordValid: boolean = await bcrypt.compare(currentPassword, user!.password!);
      if (!passwordValid) {
        res.status(403).json({ error: 'invalid_password', message: 'Incorrect password.' });
        return;
      }
    }

    const usernameTaken: { _id: unknown } | null = await User.exists({ username: newUsername });
    if (usernameTaken) {
      res.status(409).json({ error: 'username_taken', message: 'Username is already taken.' });
      return;
    }
    user!.username = newUsername;
    await user!.save();
    res.status(200).json({ message: 'Username updated successfully.' });

  } catch {
    res.status(500).json({ error: 'server_error', message: 'Something went wrong.' });
  }
});

router.put('/password', verifyToken, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user: IUser | null = await User.findById(req.user!.id);

    if (!user?.password) {
      return;
    }

    const passwordValid: boolean = await bcrypt.compare(currentPassword, user!.password);
    if (!passwordValid) {
      res.status(403).json({ error: 'invalid_password', message: 'Incorrect password.' });
      return;
    }

    user!.password = newPassword;
    await user!.save();
    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    return next(err);
  }
});

export default router;
