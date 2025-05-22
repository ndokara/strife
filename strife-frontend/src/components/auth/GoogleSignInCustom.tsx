import { useEffect, useRef } from 'react';
import { Button } from '@mui/material';
import { authApi } from '@/api/parts/auth.ts';

interface GoogleSignInCustomProps {
  onSuccess?: (data: any) => void;
  onFailure?: (data: any) => void;
};

const GoogleSignInCustom = ({ onSuccess, onFailure }: GoogleSignInCustomProps) => {
  const tokenClient = useRef<google.accounts.oauth2.TokenClient | null>(null);

  useEffect(() => {
    /* Initialize Google Token Client */
    if (window.google && !tokenClient.current) {
      tokenClient.current = google.accounts.oauth2.initTokenClient({
        client_id: '165924738846-9nb1enrffdod6h6jjtcc2j8mk74g6jfs.apps.googleusercontent.com',
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google token error:', tokenResponse);
            return;
          }

          const accessToken = tokenResponse.access_token;
          console.log('accessToken is: ', accessToken);

          // Send access token to your backend to exchange for user info / session
          try {
            const result = await authApi.google(accessToken);
            if(onSuccess) onSuccess(result);

          } catch (err) {
            if(onFailure) onFailure(err);
          }
        },
      });
    }
  }, []);

  const handleGoogleLogin = () => {
    if (tokenClient.current) {
      tokenClient.current.requestAccessToken();
    }
  };

  return (
    <Button variant="contained" onClick={handleGoogleLogin}>
      Sign in with Google
    </Button>
  );
};
export default GoogleSignInCustom;
