import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  OutlinedInput,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';

interface ForgotPasswordProps {
  open: boolean;
  handleClose: () => void;
}

export default function ForgotPassword({ open, handleClose }: ForgotPasswordProps) {
  const [email, setEmail] = React.useState('');
  const [newEmailError, setNewEmailError] = React.useState(false);
  const [newEmailErrorMessage, setNewEmailErrorMessage] = React.useState('');

  const handleCloseWithReset = () => {
    setNewEmailError(false);
    setNewEmailErrorMessage('');
    setEmail('');
    handleClose();
  };

  // Email validation function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePasswordResetSubmit = (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!validateEmail(email)) {
      setNewEmailError(true);
      if (!email) {
        setNewEmailErrorMessage('Please enter your email.');
      } else {
        setNewEmailErrorMessage('Invalid email format');
      }
      return;
    }

    setEmail('');
    setNewEmailError(false);
    setNewEmailErrorMessage('');
    handleClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handlePasswordResetSubmit,
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a link to
          reset your password.
        </DialogContentText>

        <FormControl fullWidth variant="outlined" error={newEmailError}>
          <InputLabel htmlFor="email">Email address</InputLabel>
          <OutlinedInput
            id="email"
            name="email"
            type="text"
            placeholder="Email address"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {newEmailError && <FormHelperText>{newEmailErrorMessage}</FormHelperText>}
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
