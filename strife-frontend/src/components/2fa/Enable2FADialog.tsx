import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import { twoFAApi } from '@/api/parts/2fa.ts';
import VerificationCodeInput from '@/components/2fa/VerificationCodeInput.tsx';
import axios from 'axios';

interface Enable2FADialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const Enable2FADialog: React.FC<Enable2FADialogProps> = ({ open, onClose, onSuccess }) => {
  const [qrCode, setQrCode] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setCodeError(false);
      setError('');
      setToken('');
      twoFAApi
        .twoFASetup()
        .then((res) => {
          setQrCode(res.qrCode);
          setStep(2);
        })
        .catch(() => {
          setError('Failed to generate QR code');
        })
        .finally(() => setLoading(false));
    } else {
      setQrCode('');
      setToken('');
      setError('');
      setCodeError(false);
      setStep(1);
    }
  }, [open]);

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');
      await twoFAApi.verifyTwoFASetup(token);

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setCodeError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{
      paper: {
        component: 'form',
        sx: { backgroundImage: 'none' },
      },
    }}>
      <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress/>
        ) : step === 2 ? (
          <>
            <Typography mb={2}>
                            Scan the QR code below with Google Authenticator or a compatible app:
            </Typography>
            {qrCode && (
              <img src={qrCode} alt="2FA QR Code" style={{ width: '100%', marginBottom: '1rem' }}/>
            )}
            <VerificationCodeInput
              value={token}
              onChange={(value) => {
                setToken(value);
                if (codeError) setCodeError(false);
              }}
              onComplete={handleVerify}
              error={codeError}
            />
            {error && (
              <Typography color="error" variant="body2" mt={1}>
                {error}
              </Typography>
            )}
          </>
        ) : (
          <Typography>Preparing QR Code...</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
                    Cancel
        </Button>
        <Button onClick={handleVerify} disabled={loading || token.length < 6}>
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Enable2FADialog;
