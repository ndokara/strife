import * as React from 'react';
import { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { userApi } from '@/api/parts/user.ts';

interface UpdateDateOfBirthProps {
    open: boolean;
    handleClose: () => void;
}

export default function UpdateDateOfBirth({ open, handleClose }: UpdateDateOfBirthProps) {
  const defaultDate: Dayjs = dayjs('2000-01-01'); // Ensure this is a valid Dayjs object
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(defaultDate);
  const [dateOfBirthError, setDateOfBirthError] = useState(false);
  const [dateOfBirthErrorMessage, setDateOfBirthErrorMessage] = useState('');

  const handleCloseWithReset = () => {
    setDateOfBirthError(false);
    setDateOfBirthErrorMessage('');
    setDateOfBirth(defaultDate);
    handleClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();
    event.stopPropagation();

    if (!dateOfBirth) {
      setDateOfBirthError(true);
      setDateOfBirthErrorMessage('Date of birth is required.');
      return;
    }

    const today = dayjs();
    const minAgeDate = today.subtract(13, 'years');
    const maxDate = today;
    const minValidDate = today.subtract(100, 'years');

    if (dateOfBirth.isAfter(maxDate)) {
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

    setDateOfBirthError(false);
    setDateOfBirthErrorMessage('');

    await userApi.updateDateOfBirth(dateOfBirth);
    handleClose();
  };


  return (
    <Dialog
      open={open}
      onClose={handleClose}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: { backgroundImage: 'none', width: '500px', maxWidth: '100%' },
        },
      }}
    >
      <DialogTitle>
                Change Date of Birth
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        <FormControl error={dateOfBirthError} fullWidth>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <StaticDatePicker
              value={dateOfBirth}
              onChange={(newDate) => setDateOfBirth(newDate)}
              slots={{
                actionBar: (): null => null,
              }}
            />
          </LocalizationProvider>
          {dateOfBirthError && (
            <FormHelperText sx={{textAlign: 'center'}}>{dateOfBirthErrorMessage}</FormHelperText>
          )}
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
