import '@mui/material/Typography';
import '@mui/material/Stack';

declare module '@mui/material/Typography' {
  interface TypographyProps {
    fontWeight?: number | string;
  }
  interface TypographyOwnProps {
    fontWeight?: number | string;
  }
}

declare module '@mui/material/Stack' {
  interface StackProps {
    alignItems?: string | object;
    justifyContent?: string | object;
    gap?: number | string | object;
    flexWrap?: string | object;
    alignSelf?: string | object;
  }
  interface StackOwnProps {
    alignItems?: string | object;
    justifyContent?: string | object;
    gap?: number | string | object;
    flexWrap?: string | object;
    alignSelf?: string | object;
  }
}
