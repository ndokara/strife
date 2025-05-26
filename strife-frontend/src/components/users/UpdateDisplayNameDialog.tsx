import * as React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  OutlinedInput
} from '@mui/material';
import { userApi } from '@/api/parts/user.ts';

interface UpdateDisplayNameProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export default function UpdateDisplayName({ open, onClose, username }: UpdateDisplayNameProps) {
  const [displayName, setDisplayName] = React.useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();
    event.stopPropagation();
    if (!displayName) {
      await userApi.updateDisplayName(username);
    } else {
      await userApi.updateDisplayName(displayName);
    }
    onClose();
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

        <FormControl fullWidth variant="outlined">
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
