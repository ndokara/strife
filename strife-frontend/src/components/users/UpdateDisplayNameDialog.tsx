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
import { displayNameSchema } from '@/validators/userSchema.ts';
import axios from 'axios';

interface UpdateDisplayNameProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export default function UpdateDisplayName({ open, onClose, username }: UpdateDisplayNameProps) {
  const [displayName, setDisplayName] = React.useState('');
  const [displayNameError, setDisplayNameError] = useState(false);
  const [displayNameErrorMessage, setDisplayNameErrorMessage] = useState('');

  const resetFields = () => {
    setDisplayName('');
    setDisplayNameError(false);
    setDisplayNameErrorMessage('');
  };

  const handleCloseWithReset = () => {
    resetFields();
    onClose();
  };

  const validateInputs = useCallback((): boolean => {
    setDisplayNameError(false);
    setDisplayNameErrorMessage('');

    const validationResult = displayNameSchema.validate({
      displayName: displayName || null,
    }, { abortEarly: false });

    if (!validationResult.error) {
      return true;
    }

    validationResult.error.details.forEach((detail) => {
      const field = detail.path[0];

      switch (field) {
        case 'displayName':
          setDisplayNameError(true);
          setDisplayNameErrorMessage(detail.message);
          break;
      }
    });
    return false;
  }, [displayName]);

  const handleSubmit = async (event: React.FormEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();
    event.stopPropagation();

    if (!validateInputs()) {
      return;
    }

    try {
      if (!displayName) {
        await userApi.updateDisplayName(username);
      } else {
        await userApi.updateDisplayName(displayName);
      }
      handleCloseWithReset();
    } catch (err: unknown) {
      let errorCode;

      if (axios.isAxiosError(err)) {
        errorCode = err.response?.data?.error;
      } else if (err instanceof Error) {
        errorCode = err.message;
      }
      switch (errorCode) {
        default:
          setDisplayNameError(true);
          setDisplayNameErrorMessage('Something went wrong. Please try again.');
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
          onSubmit: handleSubmit,
          sx: { backgroundImage: 'none', minWidth: '600px', maxWidth: '100%' },
        },
      }}
    >
      <DialogTitle>Change Display Name</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your new display name.
        </DialogContentText>
        <DialogContentText variant='caption'>
          If you do not enter a new display name, your display name will be reverted to your username.
        </DialogContentText>

        <FormControl fullWidth variant="outlined" error={displayNameError}>
          <InputLabel>Display name</InputLabel>
          <OutlinedInput
            id="displayName"
            name="displayName"
            type="text"
            placeholder="New display name"
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          {displayNameError && <FormHelperText>{displayNameErrorMessage}</FormHelperText>}
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" type="submit">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
