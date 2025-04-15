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

interface UpdateUsernameProps {
    open: boolean;
    handleClose: () => void;
}

export default function UpdatePassword({ open, handleClose }: UpdateUsernameProps) {
    const [currentPassword, setCurrentPassword] = useState<string>("");
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const [currentPasswordError, setCurrentPasswordError] = React.useState(false);
    const [currentPasswordErrorMessage, setCurrentPasswordErrorMessage] = useState<string>("");
    const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);
    const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = useState<string>("");


    const resetFields = () => {
        setCurrentPasswordError(false);
        setConfirmPasswordError(false);
        setCurrentPasswordErrorMessage("");
        setConfirmPasswordErrorMessage("");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
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

        if (!newPassword.trim() || newPassword.length < 6) {
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

        if (!isValid) return;

        try {
            await userApi.updatePassword(currentPassword, confirmPassword);
            resetFields();
            handleClose();
        } catch (error: any) {
            const errorCode = error.message;

            switch (errorCode) {
                case "invalid_password":
                    setCurrentPasswordError(true);
                    setCurrentPasswordErrorMessage("Incorrect password.");
                    break;
                default:
                    setCurrentPasswordError(false);
                    setCurrentPasswordErrorMessage('');
                    setConfirmPasswordError(true);
                    setConfirmPasswordErrorMessage('Something went wrong. Please try again.');
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
