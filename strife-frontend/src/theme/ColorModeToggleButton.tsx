import DarkModeIcon from '@mui/icons-material/DarkModeRounded';
import LightModeIcon from '@mui/icons-material/LightMode';
import IconButton, {IconButtonOwnProps} from '@mui/material/IconButton';
import {useColorScheme} from '@mui/material/styles';

export default function ColorModeToggleButton(props: IconButtonOwnProps) {
  const {mode, setMode} = useColorScheme();

  const handleToggleMode = () => {
    setMode(mode === 'light' ? 'dark' : 'light');
  };

  if (!mode) {
    return null;
  }

  const icon = mode === 'light' ? <LightModeIcon fontSize='large'/> :
    <DarkModeIcon fontSize='large'/>;

  return (
    <IconButton
      data-screenshot="toggle-mode"
      onClick={handleToggleMode}
      disableRipple
      size="large"
      {...props}
    >
      {icon}
    </IconButton>
  );
}
