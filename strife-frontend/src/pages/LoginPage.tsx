import { Button, CssBaseline, Link, Stack } from "@mui/material";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import * as React from "react";
import { useCallback, useState } from "react";
import AppTheme from "../theme/AppTheme.tsx";
import ColorModeToggleButton from "../theme/ColorModeToggleButton.tsx";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import { Link as RouterLink, useNavigate } from "react-router";
import Divider from "@mui/material/Divider";
import StrifeLogo from "../theme/StrifeLogo.tsx";
import ForgotPassword from "../components/auth/ForgotPasswordDialog.tsx";
import { RequiredStar } from "../components/auth/RequiredStar.tsx";
import { authApi, LoginResponse } from "@/api/parts/auth.ts";
import { AuthContainer } from "@/components/auth/AuthContainer.tsx";
import { AuthCard } from "@/components/auth/AuthCard.tsx";
import VerificationCodeInput from "@/components/2fa/VerificationCodeInput.tsx";
import { isAxiosError } from "axios";

const LoginPage = (props: { disableCustomTheme?: boolean }) => {

    const [usernameError, setUsernameError] = React.useState(false);
    const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');

    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');

    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [is2FARequired, setIs2FARequired] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState(false);

    const [loginError, setLoginError] = useState<string>("");
    const [open, setOpen] = React.useState(false);
    const navigate = useNavigate();

    const handleClickOpen = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };
    const handle2FASubmit = async () => {
        try {
            const { accessToken } = await authApi.verify2FAOnLogin(code, tempToken);
            localStorage.setItem('accessToken', accessToken);
            navigate('/dashboard/myaccount');
        } catch (error: any) {
            if (error.response.status === 401) {
                setCodeError(true);
            }
        }
    };

    const validateInputs = (): boolean => {
        let isValid = true;

        if (!username.trim() || username.length < 6) {
            setUsernameError(true);
            setUsernameErrorMessage("Username must be at least 6 characters long.");
            setLoginError("");
            isValid = false;
        } else {
            setUsernameError(false);
            setUsernameErrorMessage("");
        }

        if (!password.trim() || password.length < 6) {
            setPasswordError(true);
            setPasswordErrorMessage("Password must be at least 6 characters long.");
            setLoginError("");
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage("");
        }

        return isValid;
    };

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        if (!validateInputs()) return;

        try {
            const response: LoginResponse = await authApi.login(username, password);

            if ('token' in response) {
                // No 2FA required
                localStorage.setItem('token', response.accessToken);
                navigate('/dashboard/myaccount');
            } else if ('tempToken' in response) {
                // 2FA is required
                if (response.tempToken) {
                    setTempToken(response.tempToken);
                }
                setIs2FARequired(true);
            }
        } catch (err: unknown) {
            if (isAxiosError(err)){
                if (err.response && err.response.status === 400) {
                    setPasswordError(true);
                    setPasswordErrorMessage('Invalid username or password');
                }
            }
        }
    }, [username, password, navigate, validateInputs]);


    const handleChangeCode = (code: string): void => {
        setCode(code);
        setCodeError(false);
    }

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme/>
            <AuthContainer direction="column" justifyContent="space-between">
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                        width: '100%',
                        px: 0,
                        py: 0,
                    }}
                >
                    <StrifeLogo
                        sx={{
                            width: { xs: '180px', sm: '136px' },
                            height: { xs: '50px', sm: '33px' },
                        }}
                    />
                    <ColorModeToggleButton/>
                </Stack>
                {!is2FARequired ? (
                    <AuthCard variant="outlined">
                        <Typography component="h1" variant="h3" sx={{ width: "100%" }}>
                            Log in
                        </Typography>
                        <Box
                            component='form'
                            onSubmit={handleSubmit}
                            noValidate={true}
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                width: '100%',
                                gap: 2,
                            }}
                        >
                            <FormControl>
                                <FormLabel htmlFor="username">
                                    Username
                                    <RequiredStar/>
                                </FormLabel>
                                <TextField
                                    error={usernameError}
                                    helperText={usernameErrorMessage}
                                    id="username"
                                    type="text"
                                    onChange={(e) => setUsername(e.target.value)}
                                    value={username}
                                    name="username"
                                    placeholder="Your username"
                                    autoComplete="username"
                                    // autoFocus
                                    required
                                    fullWidth
                                    variant="outlined"
                                    color={usernameError ? 'error' : 'primary'}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel htmlFor="password">
                                    Password
                                    <RequiredStar/>
                                </FormLabel>
                                <TextField
                                    error={passwordError}
                                    helperText={passwordErrorMessage}
                                    name="password"
                                    placeholder="••••••"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    id="password"
                                    autoComplete="current-password"
                                    autoFocus
                                    required
                                    fullWidth
                                    variant="outlined"
                                    color={passwordError ? 'error' : 'primary'}
                                />
                            </FormControl>
                            <Divider></Divider>
                            {loginError && (
                                <Typography
                                    variant="body2"
                                    color="error"
                                    sx={{ textAlign: "center", mt: 1 }}
                                >
                                    {loginError}
                                </Typography>
                            )}
                            <ForgotPassword open={open} handleClose={onClose}/>
                            <Typography sx={{ textAlign: 'left' }}>
                                <Link
                                    component="button"
                                    type="button"
                                    color='inherit'
                                    onClick={handleClickOpen}
                                    variant="body2"
                                >
                                    Forgot your password?
                                </Link>
                            </Typography>
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                onClick={validateInputs}
                            >
                                Log in
                            </Button>
                            <Typography sx={{ textAlign: 'center' }}>
                                Don&apos;t have an account?{' '}
                                <Link component={RouterLink} to="/register" color="inherit">
                                    Register
                                </Link>
                            </Typography>
                        </Box>
                    </AuthCard>
                ) : (
                    <AuthCard variant="outlined">
                        <Typography component="h1" variant="h5">
                            Enter 2FA Code
                        </Typography>
                        {/*<TextField*/}
                        {/*    label="Verification Code"*/}
                        {/*    value={code}*/}
                        {/*    onChange={(e) => setCode(e.target.value)}*/}
                        {/*    error={!!codeError}*/}
                        {/*    helperText={codeError}*/}
                        {/*    fullWidth*/}
                        {/*/>*/}
                        <VerificationCodeInput
                            value={code}
                            // onChange={setCode}
                            onChange={(code) => handleChangeCode(code)}
                            onComplete={handle2FASubmit}
                            error={codeError}
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ mt: 2 }}
                            onClick={handle2FASubmit}
                        >
                            Verify
                        </Button>
                    </AuthCard>
                )}
            </AuthContainer>
        </AppTheme>
    );
};

export default LoginPage;
