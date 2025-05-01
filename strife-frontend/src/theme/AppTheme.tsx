import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';
import { colorSchemes, typography, shadows, shape } from './themePrimitives';
import { JSX } from 'react';
import { inputsCustomizations } from './customizations/inputs.tsx';
import { dataDisplayCustomizations } from './customizations/dataDisplay.tsx';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { navigationCustomizations } from './customizations/navigation.tsx';

interface AppThemeProps {
    children: React.ReactNode;
    disableCustomTheme?: boolean;
    themeComponents?: ThemeOptions['components'];
}

export default function AppTheme(props: AppThemeProps): JSX.Element {
  const { children, disableCustomTheme, themeComponents } = props;
  //* added type Theme
  const theme = React.useMemo(() => {
    return disableCustomTheme
      ? createTheme() //* this instead {}
      : createTheme({
        // For more details about CSS variables configuration, see https://mui.com/material-ui/customization/css-theme-variables/configuration/
        cssVariables: {
          colorSchemeSelector: 'data-mui-color-scheme',
          cssVarPrefix: 'template',
        },
        colorSchemes, // Recently added in v6 for building light & dark mode app, see https://mui.com/material-ui/customization/palette/#color-schemes
        typography,
        shadows,
        shape,
        //* what
        components: {
          ...navigationCustomizations,
          ...inputsCustomizations,
          ...dataDisplayCustomizations,
          ...themeComponents,
        } as Record<string, unknown> // had to do this, TS complains,
      });
  }, [disableCustomTheme, themeComponents]);
  if (disableCustomTheme) {
    return <React.Fragment>{children}</React.Fragment>;
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline/>
      <GlobalStyles
        styles={{
          'input:-webkit-autofill': {
            transition:
                            'background-color calc(infinity * 1s) step-end, background-image calc(infinity * 1s) step-end allow-discrete, color calc(infinity * 1s) step-end',
            color: theme.palette.mode === 'light' ? 'black' : 'white',
            backgroundColor: theme.palette.mode === 'light' ? '#fff' : '#333',
            WebkitTextFillColor: theme.palette.mode === 'light' ? 'black' : 'white',
          },
          'input:-webkit-autofill:focus': {
            transition: 'background-color 600000s 0s, color 600000s 0s',
          },
          'input[data-autocompleted]': {
            backgroundColor: 'transparent !important',
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
}
