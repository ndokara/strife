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
    FormHelperText,
    InputLabel,
    OutlinedInput,
    FormHelperText,
} from '@mui/material';
import { userApi } from "@/api/parts/user.ts";
import { useState } from "react";
import VerificationCodeInput from "@/components/2fa/VerificationCodeInput.tsx";
import { twoFAApi } from "@/api/parts/2fa.ts";
import axios from "axios";

interface ForgotPasswordProps {
    open: boolean;
    handleClose: () => void;
    is2FAEnabled: boolean;
}

export default function UpdateEmail({ open, handleClose, is2FAEnabled}: ForgotPasswordProps) {
    const [email, setEmail] = React.useState('');
    const [token, setToken] = useState<string>("");
    const [newEmailError, setNewEmailError] = React.useState(false);
    const [newEmailErrorMessage, setNewEmailErrorMessage] = React.useState('');
    const [codeError, setCodeError] = React.useState(false);

    const handleCloseWithReset = () => {
        setNewEmailError(false);
        setNewEmailErrorMessage('');
        setEmail('');
        setToken('');
        setCodeError(false);
        handleClose();
    };

    // Email validation function
    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleEmailUpdateSubmit = async (event: React.FormEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!validateEmail(email)) {
            setNewEmailError(true);
            if(!email){
                setNewEmailErrorMessage('Please enter your email.')
            }
            else{
                setNewEmailErrorMessage('Invalid email format');
            }
            return;
        }
        if(is2FAEnabled && token.length < 6){
            setCodeError(true);
            return;
        }
        else{
            setCodeError(false);
        }
        try{
            if(is2FAEnabled){
                await twoFAApi.verifyTwoFAToken(token);
            }
            await userApi.updateEmail(email);
            setEmail('');
            setNewEmailError(false);
            setNewEmailErrorMessage('');
            handleClose();
        }
        catch (err: unknown) {
            if(axios.isAxiosError(err)){
                const errorCode = err.message;

                switch (errorCode) {
                    case "invalid_token":
                        setCodeError(true);
                        break;
                    default:
                        setNewEmailError(true);
                        setNewEmailErrorMessage("Something went wrong. Please try again.");
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
                    onSubmit: handleEmailUpdateSubmit,
                    sx: { backgroundImage: 'none', minWidth: '600px' },
                },
            }}
        >
            <DialogTitle>Change Email</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
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
                    />
                    {newEmailError && <FormHelperText>{newEmailErrorMessage}</FormHelperText>}
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
