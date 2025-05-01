import { AppBar, AppBarProps } from '@mui/material';
import { styled } from '@mui/material/styles';

export const ThemedAppBar = styled(AppBar)<AppBarProps>(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundImage: 'none',
  backgroundColor: theme.palette.background.paper,

  ...theme.applyStyles('dark', {
    backgroundImage: 'radial-gradient(circle, rgba(19,51,125,1) 0%, rgba(48,6,68,1) 100%)',
    backgroundColor: 'transparent',
  }),
}));