import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/user';
import { processAndUploadAvatar } from '../../utils/processUploadAvatar';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const defaultUsername = profile.emails?.[0].value.split('@')[0];
          let username = defaultUsername;
          let counter = 1;

          while (await User.exists({ username })) {
            username = `${defaultUsername}_${counter}`;
            counter++;
          }

          const photoUrl = profile.photos?.[0].value.replace(/=s\d+-c$/, '=s800-c');
          let avatarUrl = `${process.env.S3_ENDPOINT}/avatars/avatar-default.jpg`;
          if (!photoUrl) {
            console.warn('Could not fetch Google avatar raw image');
          } else {
            try {
              const response: Response = await fetch(photoUrl);
              if (!response.ok) throw new Error('Failed to fetch avatar from Google.');

              const imageBuffer: Buffer<ArrayBuffer> = Buffer.from(await response.arrayBuffer());
              avatarUrl = await processAndUploadAvatar(profile.id, imageBuffer);
            } catch (err) {
              console.warn('Failed to process Google avatar:', err);
            }
          }

          const registerToken: string = jwt.sign({
            googleId: profile.id,
            googleAccessToken: accessToken,
            email: profile.emails?.[0].value,
            displayName: profile.displayName,
            username: username,
            avatarUrl: avatarUrl,
          }, process.env.TOKEN_KEY!, { expiresIn: '10m' });

          return done(null, false, { message: 'redirect', registerToken });
        } else {
          if (user.isTwoFAEnabled) {
            const tempToken: string = jwt.sign(
              { userId: user.id, step: '2fa' },
              process.env.TOKEN_KEY!,
              { expiresIn: '5m' }
            );

            user.googleAccessToken = accessToken;
            await user.save();
            return done(null, false, { twoFARequired: true, tempToken });
          } else {
            user.googleAccessToken = accessToken;
            await user.save();
            return done(null, user);
          }
        }

      } catch (err) {
        return done(err as Error, undefined);
      }
    }
  )
);
