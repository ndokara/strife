import Button from '@mui/material/Button';
import { SvgIcon } from '@mui/material';
import { SvgIconProps } from '@mui/material/SvgIcon';

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

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/google`;
  };

  return (
    <Button
      variant="contained"
      startIcon={<GoogleIcon />}
      onClick={handleGoogleLogin}
      sx={{
        'textTransform': 'none',
        'backgroundColor': 'white',
        'color': '#444',
        'border': '1px solid #ccc',
        'boxShadow': 1,
        '&:hover': {
          backgroundColor: '#f5f5f5',
        },
      }}
    >
      Sign in with Google
    </Button>
  );
};

export default GoogleLoginButton;
