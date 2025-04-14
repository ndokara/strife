import * as React from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    OutlinedInput,
    FormControl,
    InputLabel,
    FormHelperText
} from '@mui/material';
import { useState } from "react";
import { userApi } from "@/api/parts/user.ts";

interface UpdateUsernameProps {
    open: boolean;
    handleClose: () => void;
}

export default function UpdateUsername({ open, handleClose }: UpdateUsernameProps) {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [usernameError, setUsernameError] = React.useState(false);
    const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');

    const resetFields = () =>{
        setUsernameError(false);
        setUsernameErrorMessage('');
        setUsername('');
        setPasswordError(false);
        setPasswordErrorMessage('');
        setPassword('');
    }

    const handleCloseWithReset = () => {
        resetFields();
        handleClose();
    };

    const handleUpdateUsernameSubmit = async (event: React.FormEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        let isValid = true;

        if (!password.trim() || password.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage("Password must be at least 6 characters long.");
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage("");
        }

        if (!username.trim() || username.length < 6) {
            setUsernameError(true);
            setUsernameErrorMessage("Username must be at least 6 characters long.");
            isValid = false;
        } else {
            setUsernameError(false);
            setUsernameErrorMessage("");
        }

        if (!isValid) return;

        try {
            await userApi.updateUsername(password, username);

            resetFields();
            handleClose();
        } catch (error: any) {
            const errorCode = error.message;

            switch (errorCode) {
                case "invalid_password":
                    setPasswordError(true);
                    setPasswordErrorMessage("Incorrect password.");
                    break;
                case "username_taken":
                    setUsernameError(true);
                    setUsernameErrorMessage("This username is already taken.");
                    break;
                default:
                    setUsernameError(true);
                    setUsernameErrorMessage("Something went wrong. Please try again.");
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
                    onSubmit: handleUpdateUsernameSubmit,
                    sx: { backgroundImage: 'none', minWidth: '600px' },
                },
            }}
        >
            <DialogTitle>Reset password</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
                <DialogContentText>
                    Enter your account&apos;s email address, and we&apos;ll send you a link to
                    reset your password.
                </DialogContentText>

                <FormControl fullWidth variant="outlined" error={passwordError}>
                    <InputLabel>Password</InputLabel>
                    <OutlinedInput
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Your current password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordError && <FormHelperText>{passwordErrorMessage}</FormHelperText>}
                </FormControl>
                <FormControl fullWidth variant="outlined" error={usernameError}>
                    <InputLabel>Username</InputLabel>
                    <OutlinedInput
                        id="username"
                        name="username"
                        type="text"
                        placeholder="New username"
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    {usernameError && <FormHelperText>{usernameErrorMessage}</FormHelperText>}
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
