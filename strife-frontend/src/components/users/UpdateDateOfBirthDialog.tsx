import * as React from 'react';
import { useCallback, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { userApi } from '@/api/parts/user.ts';
import { dateOfBirthSchema } from '@/validators/userSchema.ts';

interface UpdateDateOfBirthProps {
  open: boolean;
  onClose: () => void;
}

export default function UpdateDateOfBirth({ open, onClose }: UpdateDateOfBirthProps) {
  const defaultDate: Dayjs = dayjs('2000-01-01'); // Ensure this is a valid Dayjs object
  const [dateOfBirth, setDateOfBirth] = useState<Dayjs | null>(defaultDate);
  const [dateOfBirthError, setDateOfBirthError] = useState(false);
  const [dateOfBirthErrorMessage, setDateOfBirthErrorMessage] = useState('');

  const resetFields = () =>{
    setDateOfBirthError(false);
    setDateOfBirthErrorMessage('');
    setDateOfBirth(defaultDate);
  };

  const handleCloseWithReset = () => {
    resetFields();
    onClose();
  };
  const validateInputs = useCallback((): boolean => {
    resetFields();
    const validationResult = dateOfBirthSchema.validate({
      dateOfBirth: dateOfBirth?.toDate?.() || null, // Joi expects JS Date
    }, {abortEarly: false });

    if(!validationResult.error) {
      return true;
    }
    validationResult.error.details.forEach((detail) =>{
      const field = detail.path[0];
      switch (field) {
        case 'dateOfBirth':
          setDateOfBirthError(true);
          setDateOfBirthErrorMessage(detail.message);
          break;
      }
    });
    return false;
  }, [dateOfBirth]);

  const handleSubmit = async (event: React.FormEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault();
    event.stopPropagation();

    if(!validateInputs())
      return;
    
    await userApi.updateDateOfBirth(dateOfBirth!);
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
            <FormHelperText sx={{ textAlign: 'center' }}>{dateOfBirthErrorMessage}</FormHelperText>
          )}
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleCloseWithReset}>Cancel</Button>
        <Button variant="contained" type="submit">
          Set
        </Button>
      </DialogActions>
    </Dialog>
  );
}
