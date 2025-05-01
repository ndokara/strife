import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import AppTheme from '../theme/AppTheme.tsx';
import RegisterCard from '../components/auth/RegisterCard.tsx';
import ColorModeToggleButton from '../theme/ColorModeToggleButton.tsx';
import StrifeLogo from '../theme/StrifeLogo.tsx';
import Content from '@/components/auth/Content.tsx';
import { AuthContainer } from '@/components/auth/AuthContainer.tsx';

export default function RegisterPage(props: { disableCustomTheme?: boolean }) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme/>

      <AuthContainer
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            width: '100%',
            px: 0,
            py: 0,
          }}
        >
          <StrifeLogo
            sx={{
              width: { xs: '180px', sm: '136px' },
              height: { xs: '50px', sm: '33px' },
            }}
          />
          <ColorModeToggleButton/>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems="center"
          justifyContent="center"
          spacing={4}
          sx={{
            width: '100%',
            maxWidth: '1000px',
            mt: 4,
            mb: 4,
          }}
        >
          <RegisterCard/>
          <Content/>
        </Stack>
      </AuthContainer>
    </AppTheme>
  );
}
