import * as React from 'react';
import { useState } from 'react';
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
import { userApi } from "@/api/parts/user.ts";
import { twoFAApi } from "@/api/parts/2fa.ts";
import VerificationCodeInput from "@/components/2fa/VerificationCodeInput.tsx";
import axios from "axios";

interface UpdatePasswordProps {
    open: boolean;
    handleClose: () => void;
    is2FAEnabled: boolean;
}

export default function UpdatePassword({ open, handleClose, is2FAEnabled}: UpdatePasswordProps) {
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [token, setToken] = useState<string>("");

    const [currentPasswordError, setCurrentPasswordError] = React.useState(false);
    const [currentPasswordErrorMessage, setCurrentPasswordErrorMessage] = useState<string>("");
    const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);
    const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState<string>("");
    const [codeError, setCodeError] = React.useState(false);


    const resetFields = () => {
        setCurrentPasswordError(false);
        setConfirmPasswordError(false);
        setCurrentPasswordErrorMessage("");
        setConfirmPasswordErrorMessage("");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setToken('');
        setCodeError(false);
    }

    const handleCloseWithReset = () => {
        resetFields();
        handleClose();
    };

    const handleUpdatePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        event.stopPropagation();

        let isValid = true;

        if (!currentPassword.trim() || currentPassword.length < 6) {
            setCurrentPasswordError(true);
            setCurrentPasswordErrorMessage("Current password must be at least 6 characters long.");
            isValid = false;
        } else {
            setCurrentPasswordError(false);
            setCurrentPasswordErrorMessage("");
        }

        if (newPassword.trim().length < 6) {
            setConfirmPasswordError(true);
            setConfirmPasswordErrorMessage("New password must be at least 6 characters long.");
            isValid = false;
        } else if (!confirmPassword.trim()) {
            setConfirmPasswordError(true);
            setConfirmPasswordErrorMessage("Please confirm your new password.");
            isValid = false;
        } else if (newPassword !== confirmPassword) {
            setConfirmPasswordError(true);
            setConfirmPasswordErrorMessage("Passwords do not match.");
            isValid = false;
        } else {
            setConfirmPasswordError(false);
            setConfirmPasswordErrorMessage("");
        }
        if(is2FAEnabled && token.length < 6){
            setCodeError(true);
        }
        else{
            setCodeError(false);
        }

        if (!isValid) return;

        try {
            if(is2FAEnabled){
                await twoFAApi.verifyTwoFAToken(token);
            }
            await userApi.updatePassword(currentPassword, confirmPassword);
            resetFields();
            handleClose();
        } catch (err: unknown) {
            if(axios.isAxiosError(err)){
                const errorCode = err.message;
                switch (errorCode) {
                    case "invalid_password":
                        setCurrentPasswordError(true);
                        setCurrentPasswordErrorMessage("Incorrect password.");
                        break;
                    case "invalid_token":
                        setCodeError(true);
                        break;
                    default:
                        if(token){
                            setCurrentPasswordError(false);
                            setCurrentPasswordErrorMessage('');
                            setConfirmPasswordError(true);
                            setConfirmPasswordErrorMessage('Something went wrong. Please try again.');
                        }
                }
            }
        }

    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit: handleUpdatePasswordSubmit,
                    sx: { backgroundImage: 'none', minWidth: '600px' },
                },
            }}
        >
            <DialogTitle>Reset password</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
                <DialogContentText>
                    Enter your current password and your new password.
                </DialogContentText>

                <FormControl fullWidth variant="outlined" error={currentPasswordError}>
                    <InputLabel>Current Password</InputLabel>
                    <OutlinedInput
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        placeholder="Your current password"
                        label="Current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    {currentPasswordError && <FormHelperText>{currentPasswordErrorMessage}</FormHelperText>}
                </FormControl>
                {is2FAEnabled && (
                    <VerificationCodeInput
                        value={token}
                        onChange={(value) => {
                            setToken(value);
                            if (codeError) setCodeError(false);
                        }}
                        error={codeError}
                    />
                )}
                <FormControl fullWidth variant="outlined" error={confirmPasswordError}>
                    <InputLabel>New Password</InputLabel>
                    <OutlinedInput
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        placeholder="New password"
                        label="New password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </FormControl>
                <FormControl fullWidth variant="outlined" error={confirmPasswordError}>
                    <InputLabel>Confirm Password</InputLabel>
                    <OutlinedInput
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        label="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPasswordError && <FormHelperText>{confirmPasswordErrorMessage}</FormHelperText>}
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
