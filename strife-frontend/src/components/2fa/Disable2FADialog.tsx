import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, } from '@mui/material';
import VerificationCodeInput from '@/components/2fa/VerificationCodeInput.tsx';
import { twoFAApi } from '@/api/parts/2fa.ts';
import axios from "axios";

interface Disable2FADialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const Disable2FADialog: React.FC<Disable2FADialogProps> = ({ open, onClose, onSuccess }) => {
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [codeError, setCodeError] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (!open) {
            setPassword('');
            setToken('');
            setCodeError(false);
            setPasswordError('');
        }
    }, [open]);

    const handleDisable2FA = async () => {
        setLoading(true);
        setCodeError(false);
        setPasswordError('');

        try {
            await twoFAApi.verifyTwoFAToken(token);
            await twoFAApi.removeTwoFA(password);

            onSuccess?.();
            onClose();
        } catch (err: unknown) {

            let errorCode;
            if (axios.isAxiosError(err)) {
                errorCode = err.response?.data?.error;
            } else if (err instanceof Error) {
                errorCode = err.message;
            }

            switch (errorCode) {
                case "invalid_password":
                    setPasswordError("Incorrect password.");
                    break;
                case "invalid_token":
                    setCodeError(true);
                    break;
                default:
                    setPasswordError("Something went wrong. Please try again.");
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
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogContent>
                <Box mt={1} display="flex" flexDirection="column" gap={2} alignItems='center'>
                    <TextField
                        label="Password"
                        type="password"
                        placeholder="Your current password"
                        fullWidth
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!passwordError}
                        helperText={passwordError}
                        disabled={loading}
                    />

                    <VerificationCodeInput
                        value={token}
                        onChange={(value) => {
                            setToken(value);
                            if (codeError) setCodeError(false);
                        }}
                        onComplete={handleDisable2FA}
                        error={codeError}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleDisable2FA} disabled={loading || password.length === 0 || token.length < 6}>
                    {loading ? 'Processing...' : 'Disable 2FA'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default Disable2FADialog;
