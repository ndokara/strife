import { Button, CssBaseline, FormControl, FormHelperText } from '@mui/material';
import * as React from 'react';
import { useState } from 'react';
import AppTheme from '../theme/AppTheme.tsx';
import { AuthContainer } from '@/components/auth/AuthContainer.tsx';
import dayjs, { Dayjs } from 'dayjs';
import { useLocation, useNavigate } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { authApi } from '@/api/parts/auth.ts';
import Stack from '@mui/material/Stack';
import StrifeLogo from '@/theme/StrifeLogo.tsx';
import ColorModeToggleButton from '@/theme/ColorModeToggleButton.tsx';
import { AuthCard } from '@/components/auth/AuthCard.tsx';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

interface LocationState {
  userData: {
    googleId: string;
    email: string;
    displayName: string;
    username: string;
    avatarUrl: string;
  };
}

const CompleteRegisterPage = (props: { disableCustomTheme?: boolean }) => {
  const defaultDate: Dayjs = dayjs('2000-01-01');
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(defaultDate);
  const [dateOfBirthError, setDateOfBirthError] = useState(false);
  const [dateOfBirthErrorMessage, setDateOfBirthErrorMessage] = useState('');
  const navigate = useNavigate();

  const location = useLocation();
  const state = location.state as LocationState | null;
  const userData = state?.userData;

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!dateOfBirth) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Date of birth is required.');
      return;
    }

    // TODO: duplicate code

    const today = dayjs();
    const minAgeDate = today.subtract(13, 'years');
    const minValidDate = today.subtract(100, 'years');

    if (dateOfBirth.isAfter(today)) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Date of birth cannot be in the future.');
      return;
    }

    if (dateOfBirth.isAfter(minAgeDate)) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('You must be at least 13 years old.');
      return;
    }

    if (dateOfBirth.isBefore(minValidDate)) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Please enter a realistic date of birth.');
      return;
    }

    try {
      //TODO:this:
      //afaik: the backend sets the access token in cookies which is called 'token'.
      //on every route it should send it and let the frontend set it. i think.

      // const { accessToken } = await authApi.register(email, displayName, username, dateOfBirth, password, undefined, undefined, undefined);

      const { accessToken } = await authApi.register(
        userData!.email, userData!.displayName, userData!.username, dateOfBirth,undefined, userData!.googleId, userData!.avatarUrl
      );
      localStorage.setItem('accessToken', accessToken);

      navigate('/dashboard/myaccount');
    } catch (err) {
      console.error(err);
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Something went wrong during registration.');
    }
  };

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
          <AuthCard variant="outlined">
            <Typography component="h1" variant="h3" sx={{ width: '100%' }}>
              Complete Registration
            </Typography>
            <Typography component="h5" variant="h6" sx={{ width: '100%' }}>
              Enter Date of Birth
            </Typography>
            <Box
              component='form'
              onSubmit={handleSubmit}
              noValidate={true}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                gap: 2,
              }}
            >
              <FormControl error={dateOfBirthError} fullWidth>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <StaticDatePicker
                    value={dateOfBirth}
                    onChange={(newDate) => setDateOfBirth(newDate)}
                    slots={{ actionBar: () => null }}
                  />
                </LocalizationProvider>
                {dateOfBirthError && (
                  <FormHelperText sx={{ textAlign: 'center' }}>
                    {dateOfBirthErrorMessage}
                  </FormHelperText>
                )}
              </FormControl>
              <Divider></Divider>
              <Button
                type="submit"
                fullWidth
                variant="contained"
              >
                Register
              </Button>
            </Box>
          </AuthCard>
        </Stack>
      </AuthContainer>
    </AppTheme>
  );
};

export default CompleteRegisterPage;
