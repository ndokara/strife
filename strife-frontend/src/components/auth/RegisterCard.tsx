import { Button, FormHelperText, Link } from '@mui/material';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import * as React from 'react';
import { useCallback, useState } from 'react';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import TextField from '@mui/material/TextField';
import { Link as RouterLink, useNavigate } from 'react-router';
import Divider from '@mui/material/Divider';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import CakeIcon from '@mui/icons-material/Cake';
import { RequiredStar } from './RequiredStar.tsx';
import { AuthCard } from '@/components/auth/AuthCard.tsx';
import { authApi } from '@/api/parts/auth.ts';

function RegisterCard() {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [dateOfBirthError, setDateOfBirthError] = React.useState(false);
  const [dateOfBirthErrorMessage, setDateOfBirthErrorMessage] = React.useState('');

  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const defaultDate: Dayjs = dayjs('2000-01-01'); // Ensure this is a valid Dayjs object
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(defaultDate);
  const navigate = useNavigate();

  const checkExistingCredentials = useCallback(async (): Promise<boolean> => {
    let credentialsExist: boolean = false;
    const { emailExists, usernameExists } = await authApi.checkCredentials(email, username);
    if (emailExists) {
      setEmailError(true);
      setEmailErrorMessage('An account with this email already exists.');
      credentialsExist = true;
    }
    if (usernameExists) {
      setUsernameError(true);
      setUsernameErrorMessage('This username is already taken.');
      credentialsExist = true;
    }
    return credentialsExist;
  }, [email, username]);

  const validateInputs = useCallback(async (): Promise<boolean> => {
    let isValid = true;

    if ((!email.trim() || !/\S+@\S+\.\S+/.test(email))) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if ((!username.trim() || username.length < 6)) {
      setUsernameError(true);
      setUsernameErrorMessage('Username must be at least 6 characters long.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!password.trim() || password.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    const today = dayjs();
    const minAgeDate = today.subtract(13, 'years');
    const maxDate = today;
    const minValidDate = today.subtract(100, 'years');

    if (dateOfBirth && dateOfBirth.isSame(defaultDate, 'day')) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Please select a valid date of birth.');
      isValid = false;
    } else if (dateOfBirth && dateOfBirth.isAfter(maxDate)) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Date of birth cannot be in the future.');
      isValid = false;
    } else if (dateOfBirth && dateOfBirth.isAfter(minAgeDate)) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('You must be at least 13 years old.');
      isValid = false;
    } else if (dateOfBirth && dateOfBirth.isBefore(minValidDate)) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Please enter a realistic date of birth.');
      isValid = false;
    } else {
      setDateOfBirthError(false);
      setDateOfBirthErrorMessage('');
    }

    return isValid;
  }, [email, username, password, dateOfBirth, defaultDate]);


  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); // Prevent default form submission
    const valid: boolean = await validateInputs();
    const credentialsExist: boolean = await checkExistingCredentials();
    if (valid && !credentialsExist) {
      try {
        const { accessToken } = await authApi.register(email, displayName, username, password, dateOfBirth);
        localStorage.setItem('accessToken', accessToken);
        navigate('/profile');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  }, [email, displayName, username, password, dateOfBirth, checkExistingCredentials, validateInputs, navigate]);

  return (
    <AuthCard variant="outlined">
      <Typography component="h1" variant="h3" sx={{ width: '100%' }}>
        Register
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
        <FormControl>
          <FormLabel>
            Email
            <RequiredStar/>
          </FormLabel>
          <TextField
            error={emailError}
            helperText={emailErrorMessage}
            id="email"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            name="email"
            // placeholder="Your email"
            autoComplete="email"
            required
            fullWidth
            variant="outlined"
            color={emailError ? 'error' : 'primary'}
            slotProps={{
              input: {
                autoComplete: 'new-password',
              },
            }}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Display name</FormLabel>
          <TextField
            id="displayName"
            type="text"
            onChange={(e) => setDisplayName(e.target.value)}
            value={displayName}
            name="display"
            fullWidth
            variant="outlined"
            color={'primary'}
            slotProps={{
              input: {
                autoComplete: 'new-password',
              },
            }}
          />
        </FormControl>
        <FormControl>
          <FormLabel>
            Username
            <RequiredStar/>
          </FormLabel>
          <TextField
            error={usernameError}
            helperText={usernameErrorMessage}
            id="username"
            type="text"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            name="username"
            required
            fullWidth
            variant="outlined"
            color={usernameError ? 'error' : 'primary'}
            slotProps={{
              input: {
                autoComplete: 'new-password',
              },
            }}
          />
        </FormControl>
        <FormControl>
          <FormLabel>
            Password
            <RequiredStar/>
          </FormLabel>
          <TextField
            error={passwordError}
            helperText={passwordErrorMessage}
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={passwordError ? 'error' : 'primary'}
            slotProps={{
              input: {
                autoComplete: 'new-password',
              },
            }}
          />
        </FormControl>
        <FormControl error={dateOfBirthError} fullWidth>
          <FormLabel>
            Date of Birth
            <RequiredStar/>
          </FormLabel>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              slots={{ openPickerIcon: CakeIcon }}
              value={dateOfBirth}
              onChange={(newDate => setDateOfBirth(newDate))}
              slotProps={{
                textField: {
                  error: dateOfBirthError,
                },
              }}
            />
          </LocalizationProvider>
          {dateOfBirthError && <FormHelperText>{dateOfBirthErrorMessage}</FormHelperText>}
        </FormControl>
        <Divider></Divider>
        <Button
          type="submit"
          fullWidth
          variant="contained"
        >
          Register
        </Button>
        <Typography sx={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" color="inherit">
            Log in
          </Link>
        </Typography>
      </Box>
    </AuthCard>
  );
}

export default RegisterCard;
