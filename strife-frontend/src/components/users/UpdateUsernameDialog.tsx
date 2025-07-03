import * as React from 'react';
import { useCallback, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import { userApi } from '@/api/parts/user.ts';
import { twoFAApi } from '@/api/parts/2fa.ts';
import VerificationCodeInput from '@/components/2fa/VerificationCodeInput.tsx';
import axios from 'axios';
import { loginSchema } from '@/validators/userSchema.ts';

interface UpdateUsernameProps {
  open: boolean;
  onClose: () => void;
  isTwoFAEnabled: boolean;
  isGoogleUser: boolean;
}

export default function UpdateUsername({ open, onClose, isTwoFAEnabled, isGoogleUser }: UpdateUsernameProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  const [usernameError, setUsernameError] = useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [codeError, setCodeError] = useState(false);


  const resetFields = () => {
    setUsernameError(false);
    setUsernameErrorMessage('');
    setUsername('');
    setPasswordError(false);
    setPasswordErrorMessage('');
    setPassword('');
    setToken('');
    setCodeError(false);
  };

  const handleCloseWithReset = () => {
    resetFields();
    onClose();
  };

  const validateInputs = useCallback((): boolean => {
    setUsernameError(false);
    setUsernameErrorMessage('');
    setPasswordError(false);
    setPasswordErrorMessage('');

    const validationResult = loginSchema.validate({
      username,
      password
    }, { abortEarly: false });

    if (!validationResult.error) {
      return true;
    }
    validationResult.error.details.forEach((detail) => {
      const field = detail.path[0];

      switch (field) {
        case 'username':
          setUsernameError(true);
          setUsernameErrorMessage(detail.message);
          break;
        case 'password':
          setPasswordError(true);
          setPasswordErrorMessage(detail.message);
          break;
      }
    });
    return false;

  }, [username, password]);

  const handleUpdateUsernameSubmit = async (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!validateInputs())
      return;

    try {
      if (isTwoFAEnabled) {
        await twoFAApi.verifyTwoFAToken(token);
      }
      await userApi.updateUsername(password, username);
      resetFields();
      onClose();
    } catch (err: unknown) {
      let errorCode;
      if (axios.isAxiosError(err)) {
        errorCode = err.response?.data?.error;
      } else if (err instanceof Error) {
        errorCode = err.message;
      }
      switch (errorCode) {
        case 'invalid_password':
          setPasswordError(true);
          setPasswordErrorMessage('Incorrect password.');
          break;
        case 'username_taken':
          setUsernameError(true);
          setUsernameErrorMessage('An account with this username already exists.');
          break;
        case 'invalid_token':
          setCodeError(true);
          break;
        default:
          setUsernameError(true);
          setUsernameErrorMessage('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleUpdateUsernameSubmit,
          sx: { backgroundImage: 'none', minWidth: '600px' },
        },
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your new username.
        </DialogContentText>

        {!isGoogleUser && (
          <FormControl fullWidth variant="outlined" error={passwordError}>
            <InputLabel>Password</InputLabel>
            <OutlinedInput
              id="password"
              name="password"
              type="password"
              placeholder="Your current password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && <FormHelperText>{passwordErrorMessage}</FormHelperText>}
          </FormControl>
        )}

        {isTwoFAEnabled && (
          <VerificationCodeInput
            value={token}
            onChange={(value) => {
              setToken(value);
              if (codeError) setCodeError(false);
            }}
            error={codeError}
          />
        )}
        <FormControl fullWidth variant="outlined" error={usernameError}>
          <InputLabel>Username</InputLabel>
          <OutlinedInput
            id="username"
            name="username"
            type="text"
            placeholder="New username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {usernameError && <FormHelperText>{usernameErrorMessage}</FormHelperText>}
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleCloseWithReset}>Cancel</Button>
        <Button variant="contained" type="submit">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
