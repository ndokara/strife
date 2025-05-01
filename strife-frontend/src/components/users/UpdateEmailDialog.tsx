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
    OutlinedInput,
    FormHelperText,
    CircularProgress,
    Typography,
    Stack,
} from '@mui/material';
import { userApi } from "@/api/parts/user.ts";
import { useEffect, useState } from "react";
import VerificationCodeInput from "@/components/2fa/VerificationCodeInput.tsx";
import { twoFAApi } from "@/api/parts/2fa.ts";
import axios, { AxiosError } from "axios";

interface ForgotPasswordProps {
    open: boolean;
    handleClose: () => void;
    isTwoFAEnabled: boolean;
}

export default function UpdateEmail({ open, handleClose, isTwoFAEnabled }: ForgotPasswordProps) {
    const [email, setEmail] = React.useState('');
    const [token, setToken] = useState<string>("");
    const [newEmailError, setNewEmailError] = React.useState(false);
    const [newEmailErrorMessage, setNewEmailErrorMessage] = React.useState('');
    const [codeError, setCodeError] = React.useState(false);

    const [newToken, setNewToken] = useState<string>("");
    const [newCodeError, setNewCodeError] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [showSetupStep, setShowSetupStep] = useState(false);

    useEffect(() => {
        if (!open) {
            setQrCode('');
            setToken('');
            setError('');
            setCodeError(false);
            setShowSetupStep(false);
            setNewToken('');
            setTempToken('');
            setEmail('');
            setNewEmailError(false);
            setNewEmailErrorMessage('');
        }
    }, [open]);

    const handleCloseWithReset = () => {
        setNewEmailError(false);
        setNewEmailErrorMessage('');
        setEmail('');
        setToken('');
        setCodeError(false);
        setShowSetupStep(false);
        handleClose();
    };

    const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleGenerateNew2FA = async () => {
        setNewEmailError(false);
        setNewEmailErrorMessage('');
        setCodeError(false);
        setError('');

        if (!validateEmail(email)) {
            setNewEmailError(true);
            setNewEmailErrorMessage(!email ? 'Please enter your email.' : 'Invalid email format');
            return;
        }

        try {
            await twoFAApi.verifyTwoFAToken(token);
            setLoading(true);
            const res = await twoFAApi.twoFASetupNew(email);
            setQrCode(res.qrCode);
            setTempToken(res.tempToken);
            setShowSetupStep(true);
        } catch (err: unknown) {
            if (err instanceof AxiosError) {
                throw new Error(err.response?.data?.error);
            }
            setError('Verification failed or failed to generate QR code');
            setCodeError(true);

            throw new Error('unknown_error');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailUpdateSubmit = async (event: React.FormEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!validateEmail(email)) {
            setNewEmailError(true);
            setNewEmailErrorMessage(!email ? 'Please enter your email.' : 'Invalid email format');
            return;
        }

        if (isTwoFAEnabled && (!tempToken || !newToken)) {
            setNewCodeError(true);
            return;
        }

        try {
            if (isTwoFAEnabled) {
                await twoFAApi.verifyTwoFAToken(token);
                await twoFAApi.verifyTwoFASetupAndUpdate(tempToken, newToken);
            }

            await userApi.updateEmail(email);
            handleCloseWithReset();
        } catch (err: unknown) {
            let errorCode;
            if (axios.isAxiosError(err)) {
                errorCode = err.response?.data?.error;
            } else if (err instanceof Error) {
                errorCode = err.message;
            }

            switch (errorCode) {
                case "invalid_token":
                    setCodeError(true);
                    break;
                case "invalid_new_token":
                    setNewCodeError(true);
                    break;
                default:
                    setNewEmailError(true);
                    setNewEmailErrorMessage("Something went wrong. Please try again.");
            }
        }
    };

    const isContinueDisabled = !validateEmail(email) || (isTwoFAEnabled && !showSetupStep);

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
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
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
                        disabled={showSetupStep}
                    />
                    {newEmailError && <FormHelperText>{newEmailErrorMessage}</FormHelperText>}
                </FormControl>

                <Stack direction='column' justifyContent='center' alignContent='center'>
                    {isTwoFAEnabled && !showSetupStep && (
                        <>
                            <VerificationCodeInput
                                value={token}
                                onChange={(value) => {
                                    setToken(value);
                                    if (codeError) setCodeError(false);
                                }}
                                error={codeError}
                            />
                            <Button variant="contained" onClick={handleGenerateNew2FA} sx={{ mt: 2 }}>
                                Generate New 2FA Setup
                            </Button>
                        </>
                    )}

                    {loading && <CircularProgress/>}

                    {showSetupStep && !loading && (
                        <>
                            <Typography mb={2}>
                                Scan the QR code below with Google Authenticator or a compatible app:
                            </Typography>
                            {qrCode && (
                                <img
                                    src={qrCode}
                                    alt="2FA QR Code"
                                    style={{ width: '100%', height: '100%', marginBottom: '1rem' }}
                                />
                            )}
                            <VerificationCodeInput
                                value={newToken}
                                onChange={(value) => {
                                    setNewToken(value);
                                    if (newCodeError) setNewCodeError(false);
                                }}
                                error={newCodeError}
                            />
                            {error && (
                                <Typography color="error" variant="body2" mt={1}>
                                    {error}
                                </Typography>
                            )}
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ pb: 3, px: 3 }}>
                <Button onClick={handleCloseWithReset}>Cancel</Button>
                {!isContinueDisabled && (
                    <Button variant="contained" type="submit">
                        Continue
                    </Button>)}
            </DialogActions>
        </Dialog>
    );
}
