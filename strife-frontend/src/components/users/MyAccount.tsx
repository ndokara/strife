import React, { useCallback, useEffect, useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router';
import { User, userApi } from '@/api/parts/user.ts';
import { isApiError } from '@/api/core.ts';
import { authApi } from '@/api/parts/auth.ts';
import { HttpStatusCode } from '@/api/http.ts';
import ImageCropper from '@/components/ImageCropper.tsx';
import { Avatar, Button, Card, CardContent, Popover, Stack } from '@mui/material';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import UpdateDisplayName from '@/components/users/UpdateDisplayNameDialog.tsx';
import UpdateEmail from '@/components/users/UpdateEmailDialog.tsx';
import UpdateDateOfBirth from '@/components/users/UpdateDateOfBirthDialog.tsx';
import UpdateUsername from '@/components/users/UpdateUsernameDialog.tsx';
import UpdatePassword from '@/components/users/UpdatePasswordDialog.tsx';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import Enable2FADialog from '@/components/2fa/Enable2FADialog.tsx';
import Disable2FADialog from '@/components/2fa/Disable2FADialog.tsx';

const MyAccount: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const navigate: NavigateFunction = useNavigate();

  const [displayNameOpen, setDisplayNameOpen] = React.useState(false);
  const [emailOpen, setEmailOpen] = React.useState(false);
  const [dateOfBirthOpen, setDateOfBirthOpen] = React.useState(false);
  const [usernameOpen, setUsernameOpen] = React.useState(false);
  const [passwordOpen, setPasswordOpen] = React.useState(false);
  const [twoFAOpen, setTwoFAOpen] = React.useState(false);
  const [disableTwoFAOpen, setDisableTwoFAOpen] = React.useState(false);

  const [popoverAnchor, setPopoverAnchor] = useState<null | HTMLElement>(null);

  const handleTwoFAOpen = () => {
    setTwoFAOpen(true);
  };
  const handleTwoFAClose = () => {
    setTwoFAOpen(false);
    fetchProfile();
  };
  const handleDisableTwoFAOpen = () => {
    setDisableTwoFAOpen(true);
  };
  const handleDisableTwoFAClose = () => {
    setDisableTwoFAOpen(false);
    fetchProfile();
  };

  const handleUsernameOpen = () => {
    setUsernameOpen(true);
  };

  const onUsernameClose = () => {
    setUsernameOpen(false);
    fetchProfile();
  };
  const handlePasswordOpen = () => {
    setPasswordOpen(true);
  };
  const onPasswordClose = () => {
    setPasswordOpen(false);
  };

  const handleDisplayNameOpen = () => {
    setDisplayNameOpen(true);
  };

  const onDisplayNameClose = () => {
    setDisplayNameOpen(false);
    fetchProfile();
  };
  const handleEmailOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (user?.googleId) {
      setPopoverAnchor(event.currentTarget);
    } else setEmailOpen(true);
  };

  const onEmailClose = () => {
    setEmailOpen(false);
    fetchProfile();
  };

  const popoverClose = () => setPopoverAnchor(null);

  const handleDateOfBirthOpen = () => {
    setDateOfBirthOpen(true);
  };

  const onDateOfBirthClose = () => {
    setDateOfBirthOpen(false);
    fetchProfile();
  };

  const fetchProfile = useCallback(async (): Promise<void> => {
    try {
      const user = await userApi.getProfile();
      setUser(user);
      setAvatarUrl(`${user.avatarUrl}?t=${Date.now()}`);
    } catch (err: unknown) {
      if (isApiError(err) && err.response?.status === HttpStatusCode.UNAUTHORIZED) {
        setError('Unauthorized. Please log in.');
      } else {
        setError('An unexpected error occurred.');
      }
      console.error('Error fetching profile:', err);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState(null, '', '/dashboard/myaccount');
    }
    fetchProfile();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      navigate('/login');
    } catch (err: unknown) {
      console.error('Error logging out:', err);
      setError('Failed to log out. Please try again.');
    }
  };
  const handleRemoveAvatar = async () => {
    await userApi.removeAvatar();
    fetchProfile();
  };
  const handleGoogleAvatar = async () => {
    await userApi.googleAvatar();
    fetchProfile();
  };

  if (error) {
    return <div>{error}</div>;
  }
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 2,
        maxWidth: 1200,
        margin: 'auto',
      }}
    >
      <Card sx={{ maxWidth: 600, width: '100%', marginBottom: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} mb={3}>
            <Avatar
              alt={user.displayName}
              src={avatarUrl || '/default-avatar.jpg'}
              sx={{ width: 150, height: 150 }}
            />
            <Stack direction="column" justifyContent="center">
              <Typography variant="h3" component="div">
                {user.displayName}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                @{user.username}
              </Typography>
            </Stack>
          </Stack>
          <Stack direction='column' spacing={1}>
            <Box>
              <Typography variant='h6'>Email</Typography>
              <Typography variant='body1'>{user.email}</Typography>
            </Box>
            <Box>
              <Typography variant='h6'>Date of Birth</Typography>
              <Typography variant='body1'>{user.dateOfBirth.toDateString()}</Typography>
            </Box>
            <Button variant="contained" onClick={handleLogout}>
              Log out
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {avatarUrl && (
        <Card sx={{ maxWidth: 600, width: '100%' }}>
          <CardContent>
            <Typography variant="h4" component="div" mb={2}>
              User profile
            </Typography>
            <Stack direction='column' spacing={1}>
              <Stack direction='row' justifyContent='space-between'>
                <Stack direction='column'>
                  <Typography variant='h6'>Username</Typography>
                  <Typography variant='body1'> {user.username}</Typography>
                </Stack>
                <UpdateUsername open={usernameOpen} onClose={onUsernameClose} isTwoFAEnabled={user.isTwoFAEnabled}
                  isGoogleUser={!!user.googleId}/>
                <Button variant='contained'
                  onClick={handleUsernameOpen}>Edit</Button>
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Stack direction='column'>
                  <Typography variant='h6'>Display name</Typography>
                  <Typography variant='body1'> {user.displayName}</Typography>
                </Stack>
                <UpdateDisplayName open={displayNameOpen} onClose={onDisplayNameClose}
                  username={user.username}/>
                <Button variant='contained'
                  onClick={handleDisplayNameOpen}>Edit</Button>
              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Stack direction='column'>
                  <Typography variant='h6'>Email</Typography>
                  <Typography variant='body1'> {user.email}</Typography>
                </Stack>
                {!user.googleId && (
                  <UpdateEmail open={emailOpen} onClose={onEmailClose} isTwoFAEnabled={user.isTwoFAEnabled}/>
                )}

                <Button variant='contained'
                  onClick={handleEmailOpen}>Edit
                </Button>

                <Popover
                  open={Boolean(popoverAnchor)}
                  anchorEl={popoverAnchor}
                  onClose={popoverClose}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                  <Typography sx={{ p: 2, maxWidth: 500 }}>
                    Your email is linked to your Google profile and cannot be changed.
                  </Typography>
                </Popover>

              </Stack>
              <Stack direction='row' justifyContent='space-between'>
                <Stack direction='column'>
                  <Typography variant='h6'>Date of Birth</Typography>
                  <Typography variant='body1'> {user.dateOfBirth.toDateString()}</Typography>
                </Stack>
                <UpdateDateOfBirth open={dateOfBirthOpen} onClose={onDateOfBirthClose}/>
                <Button variant='contained'
                  onClick={handleDateOfBirthOpen}>Edit</Button>
              </Stack>
              <Typography variant='h5'>Change Avatar</Typography>
              <Stack direction='row' justifyContent='space-between'>
                <ImageCropper onAvatarUpdated={fetchProfile}/>
                {user.googleId && (
                  <Button variant='contained' onClick={handleGoogleAvatar}>
                    Use Google Avatar
                  </Button>
                )}
                <Button variant='contained' color='error' onClick={handleRemoveAvatar}>
                  Remove avatar
                </Button>
              </Stack>
              {!user.googleId && (
                <Typography variant='h5'>Password and Authentication</Typography>
              )}
              {user.googleId && (
                <Typography variant='h5'>Authentication</Typography>
              )}
              {!user.isTwoFAEnabled && (
                <Stack direction='row' spacing={1}>
                  <LockOpenIcon color='error'/>
                  <Typography variant='h6' color='error'>Two Factor Authentication is not enabled.</Typography>
                </Stack>
              )}
              {user.isTwoFAEnabled && (
                <Stack direction='row' spacing={1}>
                  <LockIcon color='success'/>
                  <Typography variant='h6' color='success'>Two Factor Authentication is enabled.</Typography>
                </Stack>
              )}
              {!user.isTwoFAEnabled && (
                <Stack direction='row'>
                  <Enable2FADialog
                    open={twoFAOpen}
                    onClose={handleTwoFAClose}
                  />
                  <Button variant='contained' onClick={handleTwoFAOpen}>Add Authenticator App</Button>
                </Stack>
              )}
              {user.isTwoFAEnabled && (
                <Stack direction='row'>
                  <Disable2FADialog
                    open={disableTwoFAOpen}
                    onClose={handleDisableTwoFAClose}
                  />
                  <Button variant='contained' color='error' onClick={handleDisableTwoFAOpen}>Remove Authenticator
                    App</Button>
                </Stack>
              )}
              {!user.googleId && (
                <Stack direction='row' justifyContent='space-between'>
                  <UpdatePassword open={passwordOpen} onClose={onPasswordClose}
                    isTwoFAEnabled={user.isTwoFAEnabled}/>
                  <Button variant='contained' color='primary' onClick={handlePasswordOpen}>
                    Change password
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
export default MyAccount;
