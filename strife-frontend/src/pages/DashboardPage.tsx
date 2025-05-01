import {
  Box,
  CssBaseline,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { Home, Settings } from '@mui/icons-material';
import { useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import AppTheme from '../theme/AppTheme.tsx';
import ColorModeToggleButton from '../theme/ColorModeToggleButton.tsx';
import StrifeLogo from '../theme/StrifeLogo.tsx';
import MyAccount from '@/components/users/MyAccount.tsx';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { ThemedAppBar } from '@/theme/themedAppBar.tsx';

const drawerWidth = 240;

function DashboardHome() {
  return (
    <>
      <Typography variant="h4">Dashboard Home</Typography>
      <Typography variant="body1">Welcome to your dashboard overview.</Typography>
    </>
  );
}

function DashboardSettings() {
  return (
    <>
      <Typography variant="h4">System Settings</Typography>
      <Typography variant="body1">Configure your application preferences.</Typography>
    </>
  );
}

export default function ProfilePage(props: { disableCustomTheme?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const menuItems = [
    { text: 'My Account', icon: <AccountCircleIcon/>, path: '/dashboard/myaccount' },
    { text: 'Home', icon: <Home/>, path: '/dashboard/home' },
    { text: 'Settings', icon: <Settings/>, path: '/dashboard/settings' },
  ];

  const handleListItemClick = (index: number, path: string) => {
    setSelectedIndex(index);
    navigate(path);
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme/>
      <Box sx={{ display: 'flex' }}>
        {/* AppBar */}
        <ThemedAppBar position="fixed">
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <StrifeLogo
              sx={{
                width: { xs: '180px', sm: '136px' },
                height: { xs: '50px', sm: '33px' },
              }}
            />
            <ColorModeToggleButton />
          </Toolbar>
        </ThemedAppBar>

        {/* Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            ['& .MuiDrawer-paper']: {
              width: drawerWidth,
              boxSizing: 'border-box',
            },
          }}
        >
          <Toolbar/>
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {menuItems.map((item, index) => (
                <ListItem disablePadding key={item.text}>
                  <ListItemButton
                    selected={selectedIndex === index}
                    onClick={() => handleListItemClick(index, item.path)}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: 'background.default',
            p: 3,
            mt: 8,
          }}
        >
          <Routes>
            <Route path="myaccount" element={<MyAccount/>}/>
            <Route path="home" element={<DashboardHome/>}/>
            <Route path="settings" element={<DashboardSettings/>}/>
          </Routes>
        </Box>
      </Box>
    </AppTheme>
  );
}