import React, { useEffect, useRef, useState } from 'react';
import { Card, Stack, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';

interface VerificationCodeInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (code: string) => void;
    error?: boolean;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps>
    = ({ length = 6, value, onChange, onComplete, error = false }) => {

      const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
      const paddedValue = value.padEnd(length, ''); // ensures we can safely index all digits

      const [localError, setLocalError] = useState(error);

      useEffect(() => {
        setLocalError(error);
      }, [error]);

      const handleChange = (index: number, val: string) => {
        if (!/^\d?$/.test(val)) return;

        const chars = paddedValue.split('');
        chars[index] = val;
        const newValue = chars.join('');

        setLocalError(false);
        onChange(newValue);

        if (val && index < length - 1) {
          inputsRef.current[index + 1]?.focus();
        }

        const isComplete = newValue.length === length && !newValue.includes('');
        if (isComplete && onComplete) {
          onComplete(newValue);
        }
      };

      const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace') {
          const chars = paddedValue.split('');
          if (!chars[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
          }
        }
      };

      useEffect(() => {
        inputsRef.current[0]?.focus();
      }, []);

      return (
        <Card
          elevation={3}
          sx={{
            p: 2,
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            alignItems: 'center',
            width: 'fit-content',
            mx: 'auto',
          }}
        >
          <Stack direction='column' spacing={2} justifyContent='center' alignItems='center'>
            <Typography variant='body1'>Enter the 6-digit verification code</Typography>
            <Stack direction='row' spacing={2}>
              {Array.from({ length }).map((_, idx) => (
                <TextField
                  key={idx}
                  inputRef={(el) => (inputsRef.current[idx] = el)}
                  value={paddedValue[idx] || ''}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  error={localError}
                  variant="outlined"
                  autoComplete="off"
                  inputProps={{
                    inputMode: 'numeric',
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: '1rem',
                      width: '0.7rem',
                      height: '0.7rem',
                    },
                  }}
                />
              ))}
            </Stack>
            {error && (
              <Typography color="error" variant="body2">
                        Invalid 2FA code.
              </Typography>
            )}
          </Stack>
        </Card>
      );
    };

export default VerificationCodeInput;
