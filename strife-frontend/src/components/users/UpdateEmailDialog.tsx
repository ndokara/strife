import * as React from 'react';
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

interface ForgotPasswordProps {
    open: boolean;
    handleClose: () => void;
}

export default function UpdateEmail({ open, handleClose }: ForgotPasswordProps) {
  const [email, setEmail] = React.useState('');
  const [newEmailError, setNewEmailError] = React.useState(false);
  const [newEmailErrorMessage, setNewEmailErrorMessage] = React.useState('');

  const handleCloseWithReset = () => {
    setNewEmailError(false);
    setNewEmailErrorMessage('');
    setEmail('');
    handleClose();
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailUpdateSubmit = async (event: React.FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!validateEmail(email)) {
      setNewEmailError(true);
      setNewEmailErrorMessage(!email ? 'Please enter your email.' : 'Invalid email format');
      return;
    }

    await userApi.updateEmail(email);
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
          onSubmit: handleEmailUpdateSubmit,
          sx: { backgroundImage: 'none', minWidth: '600px' },
        },
      }}
    >
      <DialogTitle>Change Email</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
                    Enter your new email address.
        </DialogContentText>

        <FormControl fullWidth variant="outlined" error={newEmailError}>
          <InputLabel>New Email address</InputLabel>
          <OutlinedInput
            id="email"
            name="email"
            type="text"
            placeholder="New Email address"
            label="New email address"
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
