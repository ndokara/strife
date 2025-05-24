import { useEffect, useRef } from 'react';
import { Button, SvgIcon } from '@mui/material';
import { authApi } from '@/api/parts/auth.ts';
import { SvgIconProps } from '@mui/material/SvgIcon';

interface GoogleSignInCustomProps {
  onSuccess?: (data: any) => void;
  onFailure?: (data: any) => void;
}

const GoogleIcon = (props: SvgIconProps) => (
  <SvgIcon {...props} viewBox="0 0 533.5 544.3">
    <path
      fill="#4285F4"
      d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272v95.3h146.9c-6.3 34-25.1 62.8-53.4 82.1v68.2h86.4c50.5-46.6 81.6-115.4 81.6-195.2z"
    />
    <path
      fill="#34A853"
      d="M272 544.3c72.6 0 133.5-24.1 178-65.5l-86.4-68.2c-23.9 16-54.5 25.4-91.6 25.4-70.4 0-130-47.6-151.3-111.5H32.8v70.2c44.7 89.1 137.3 149.6 239.2 149.6z"
    />
    <path
      fill="#FBBC05"
      d="M120.7 324.5c-10.2-30.3-10.2-62.9 0-93.2V161.1H32.8c-35.9 70.3-35.9 152.9 0 223.2l87.9-59.8z"
    />
    <path
      fill="#EA4335"
      d="M272 107.7c39.5 0 75.1 13.6 103.1 40.3l77.1-77.1C405.5 24.3 344.6 0 272 0 170.1 0 77.5 60.5 32.8 149.6l87.9 70.2c21.3-63.9 80.9-111.5 151.3-111.5z"
    />
  </SvgIcon>
);

const GoogleSignInCustom = ({ onSuccess, onFailure }: GoogleSignInCustomProps) => {
  // @ts-ignore
  const tokenClient = useRef<google.accounts.oauth2.TokenClient | null>(null);

  useEffect(() => {
    /* Initialize Google Token Client */
    // @ts-ignore
    if (window.google && !tokenClient.current) {
      // @ts-ignore
      tokenClient.current = google.accounts.oauth2.initTokenClient({
        client_id: '165924738846-9nb1enrffdod6h6jjtcc2j8mk74g6jfs.apps.googleusercontent.com',
        scope: 'openid email profile',
        callback: async (tokenResponse: any) => {
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
    <Button
      variant="contained"
      startIcon={<GoogleIcon />}
      onClick={handleGoogleLogin}
    >
      Sign in with Google
    </Button>
  );
};
export default GoogleSignInCustom;
