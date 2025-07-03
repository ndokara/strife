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
import { registerSchema } from '@/validators/userSchema.ts';

function RegisterCard() {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [displayNameError, setDisplayNameError] = React.useState(false);
  const [displayNameErrorMessage, setDisplayNameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = React.useState('');
  const [dateOfBirthError, setDateOfBirthError] = React.useState(false);
  const [dateOfBirthErrorMessage, setDateOfBirthErrorMessage] = React.useState('');

  const [email, setEmail] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
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
    setEmailError(false);
    setEmailErrorMessage('');
    setDisplayNameError(false);
    setDisplayNameErrorMessage('');
    setUsernameError(false);
    setUsernameErrorMessage('');
    setPasswordError(false);
    setPasswordErrorMessage('');
    setDateOfBirthError(false);
    setDateOfBirthErrorMessage('');
    setConfirmPasswordError(false);
    setConfirmPasswordErrorMessage('');

    const validationResult = registerSchema.validate(
      {
        email,
        displayName: displayName || null, // Ensure null is allowed
        username,
        password,
        confirmPassword,
        dateOfBirth: dateOfBirth?.toDate?.() || null, // Joi expects JS Date
      },
      { abortEarly: false }
    );

    if (!validationResult.error) {
      return true;
    }

    // Mapping Joi errors to state
    validationResult.error.details.forEach((detail) => {
      const field = detail.path[0];

      switch (field) {
        case 'email':
          setEmailError(true);
          setEmailErrorMessage(detail.message);
          break;
        case 'username':
          setUsernameError(true);
          setUsernameErrorMessage(detail.message);
          break;
        case 'password':
          setPasswordError(true);
          setPasswordErrorMessage(detail.message);
          break;
        case 'confirmPassword':
          setConfirmPasswordError(true);
          setConfirmPasswordErrorMessage(detail.message);
          break;
        case 'dateOfBirth':
          setDateOfBirthError(true);
          setDateOfBirthErrorMessage(detail.message);
          break;
        case 'displayName':
          setDisplayNameError(true);
          setDisplayNameErrorMessage(detail.message);
      }
    });

    return false;
  }, [email, displayName, username, password, confirmPassword, dateOfBirth]);


  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    let credentialsExist: boolean = false;
    const valid: boolean = await validateInputs();
    if (valid) {
      credentialsExist = await checkExistingCredentials();
    }
    if (valid && !credentialsExist) {
      try {
        const { accessToken } = await authApi.register(email, displayName, username, dateOfBirth, password, undefined, undefined, undefined);
        localStorage.setItem('accessToken', accessToken);
        navigate('/dashboard/myaccount');
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
            error={displayNameError}
            helperText={displayNameErrorMessage}
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
        <FormControl>
          <FormLabel>
            Confirm password
            <RequiredStar/>
          </FormLabel>
          <TextField
            error={confirmPasswordError}
            helperText={confirmPasswordErrorMessage}
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoFocus
            required
            fullWidth
            variant="outlined"
            color={confirmPasswordError ? 'error' : 'primary'}
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
