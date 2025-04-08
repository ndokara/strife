import {Theme} from "@mui/material/styles";

export interface CustomTheme extends Theme {
    vars: {
        shape: {
            borderRadius: string;
        };
        palette: {
            background: {
                default: string;
                paper: string;
            };
            text: {
                primary: string;
                secondary: string;
            };
            divider: string;
            grey: Record<string, string>;
            primary: {
                main: string;
                light: string;
            };
            success: {
                main: string;
                light: string;
            };
        };
        applyStyles: (mode: 'dark' | 'light', styles: unknown) => unknown;
    };
}
