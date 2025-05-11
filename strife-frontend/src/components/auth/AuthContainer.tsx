import { styled } from '@mui/material/styles';
import { Stack } from '@mui/material';

export const AuthContainer = styled(Stack)(({ theme }) => ({
  'position': 'relative',
  'minHeight': '100vh',
  'padding': theme.spacing(2),
  'overflow': 'auto',
  'flexGrow': 1,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(200,200,215,1) 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(circle, rgba(19,51,125,1) 0%, rgba(48,6,68,1) 100%)',
    }),
  },
}));
