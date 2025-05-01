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
import { twoFAApi } from "@/api/parts/2fa.ts";
import VerificationCodeInput from "@/components/2fa/VerificationCodeInput.tsx";
import axios from "axios";

interface UpdateUsernameProps {
    open: boolean;
    handleClose: () => void;
    isTwoFAEnabled: boolean;
}

export default function UpdateUsername({ open, handleClose, isTwoFAEnabled}: UpdateUsernameProps) {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [token, setToken] = useState<string>("");

    const [usernameError, setUsernameError] = React.useState(false);
    const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [codeError, setCodeError] = React.useState(false);

    const resetFields = () =>{
        setUsernameError(false);
        setUsernameErrorMessage('');
        setUsername('');
        setPasswordError(false);
        setPasswordErrorMessage('');
        setPassword('');
        setToken('');
        setCodeError(false);
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
        if(isTwoFAEnabled && token.length < 6){
            setCodeError(true);
        }
        else{
            setCodeError(false);
        }

        if (!isValid) return;

        try {
            if(isTwoFAEnabled){
                await twoFAApi.verifyTwoFAToken(token);
            }
            await userApi.updateUsername(password, username);

            resetFields();
            handleClose();
        } catch (err: unknown) {
            let errorCode;
            if(axios.isAxiosError(err)){
                errorCode = err.response?.data?.error;
            }
            else if (err instanceof Error){
                errorCode = err.message;
            }
            switch (errorCode) {
                case "invalid_password":
                    setPasswordError(true);
                    setPasswordErrorMessage("Incorrect password.");
                    break;
                case "username_taken":
                    setUsernameError(true);
                    setUsernameErrorMessage("This username is already taken.");
                    break;
                case "invalid_token":
                    setCodeError(true);
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
                    Enter your new username.
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
                {isTwoFAEnabled && (
                    <VerificationCodeInput
                        value={token}
                        onChange={(value) => {
                            setToken(value);
                            if (codeError) setCodeError(false);
                        }}
                        error={codeError}
                    />
                )}
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
