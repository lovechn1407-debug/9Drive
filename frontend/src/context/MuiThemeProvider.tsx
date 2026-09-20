import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material'

type ThemeMode = 'light' | 'dark'

type MuiThemeContextType = {
  mode: ThemeMode
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const MuiThemeContext = createContext<MuiThemeContextType>({
  mode: 'dark',
  toggleTheme: () => undefined,
  setMode: () => undefined,
})

export function useMuiTheme() {
  return useContext(MuiThemeContext)
}

export function MuiThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('9drive:theme')
    if (saved === 'light' || saved === 'dark') return saved
    return 'dark'
  })

  useEffect(() => {
    localStorage.setItem('9drive:theme', mode)
  }, [mode])

  function toggleTheme() {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  function setMode(newMode: ThemeMode) {
    setModeState(newMode)
  }

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                primary: {
                  main: '#0b57d0',
                  light: '#d3e3fd',
                  dark: '#041e49',
                  contrastText: '#ffffff',
                },
                secondary: {
                  main: '#00639b',
                  light: '#c2e7ff',
                  dark: '#001d35',
                  contrastText: '#ffffff',
                },
                error: { main: '#b3261e', light: '#f9dedc', dark: '#410e0b' },
                background: {
                  default: '#f8f9ff',
                  paper: '#ffffff',
                },
                text: {
                  primary: '#1f1f1f',
                  secondary: '#444746',
                },
                divider: 'rgba(196,199,197,0.5)',
                action: {
                  hover: 'rgba(11,87,208,0.06)',
                  selected: 'rgba(11,87,208,0.12)',
                },
              }
            : {
                primary: {
                  main: '#a8c7fa',
                  light: '#d3e3fd',
                  dark: '#0842a0',
                  contrastText: '#062e6f',
                },
                secondary: {
                  main: '#7fcfff',
                  light: '#c2e7ff',
                  dark: '#004a77',
                  contrastText: '#001d35',
                },
                error: { main: '#f2b8b5', light: '#8c1d18', dark: '#f9dedc' },
                background: {
                  default: '#131314',
                  paper: '#1e1f20',
                },
                text: {
                  primary: '#e3e2e6',
                  secondary: '#c4c7c5',
                },
                divider: 'rgba(68,71,70,0.5)',
                action: {
                  hover: 'rgba(168,199,250,0.08)',
                  selected: 'rgba(168,199,250,0.16)',
                },
              }),
        },
        typography: {
          fontFamily: 'Roboto, "Google Sans", system-ui, sans-serif',
          button: { textTransform: 'none', fontWeight: 500 },
        },
        shape: { borderRadius: 16 },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 9999,
                padding: '8px 20px',
                fontSize: '0.875rem',
                boxShadow: 'none',
                '&:hover': { boxShadow: '0px 1px 3px rgba(0,0,0,0.12)' },
              },
              sizeSmall: { padding: '5px 14px', fontSize: '0.8125rem' },
              sizeLarge: { padding: '12px 24px', fontSize: '1rem', borderRadius: 20 },
            },
          },
          MuiIconButton: {
            styleOverrides: {
              root: { borderRadius: 9999 },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 24,
                backgroundImage: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              },
              outlined: {
                border: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: { backgroundImage: 'none' },
              rounded: { borderRadius: 24 },
              outlined: { 
                border: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              },
            },
          },
          MuiDialog: {
            styleOverrides: {
              paper: {
                borderRadius: 28,
                backgroundImage: 'none',
              },
            },
          },
          MuiDialogTitle: {
            styleOverrides: {
              root: { fontSize: '1.25rem', fontWeight: 700 },
            },
          },
          MuiTextField: {
            defaultProps: { variant: 'outlined', size: 'small', fullWidth: true },
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 12,
                },
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: { borderRadius: 12 },
            },
          },
          MuiSelect: {
            styleOverrides: {
              outlined: { borderRadius: 12 },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: {
                borderRadius: 0,
                backgroundImage: 'none',
              },
            },
          },
          MuiListItemButton: {
            styleOverrides: {
              root: { borderRadius: 9999, margin: '2px 0' },
            },
          },
          MuiMenu: {
            styleOverrides: {
              paper: { borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' },
            },
          },
          MuiMenuItem: {
            styleOverrides: {
              root: { borderRadius: 12, margin: '2px 4px', padding: '8px 12px' },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: { borderRadius: 9999 },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: { borderRadius: 16 },
            },
          },
          MuiTableCell: {
            styleOverrides: {
              root: { borderColor: 'rgba(196,199,197,0.25)', padding: '10px 16px' },
              head: { fontWeight: 700 },
            },
          },
          MuiTableRow: {
            styleOverrides: {
              root: {
                '&:hover': { backgroundColor: 'action.hover' },
                '&:last-child td': { borderBottom: 0 },
              },
            },
          },
          MuiBottomNavigation: {
            styleOverrides: {
              root: { height: 72 },
            },
          },
          MuiBottomNavigationAction: {
            styleOverrides: {
              root: { borderRadius: 12, padding: '6px 0', minWidth: 48 },
            },
          },
          MuiLinearProgress: {
            styleOverrides: {
              root: { borderRadius: 9999, height: 8 },
            },
          },
          MuiToggleButton: {
            styleOverrides: {
              root: { borderRadius: 9999, textTransform: 'none', fontWeight: 700, border: 'none' },
            },
          },
          MuiToggleButtonGroup: {
            styleOverrides: {
              root: { borderRadius: 9999 },
              grouped: { '&:not(:first-of-type)': { borderRadius: 9999 }, '&:first-of-type': { borderRadius: 9999 } },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: { backgroundImage: 'none', boxShadow: 'none' },
            },
          },
          MuiDivider: {
            styleOverrides: {
              root: { borderColor: 'rgba(196,199,197,0.3)' },
            },
          },
        },
      }),
    [mode]
  )

  const contextValue = useMemo(
    () => ({ mode, toggleTheme, setMode }),
    [mode]
  )

  return (
    <MuiThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </MuiThemeContext.Provider>
  )
}
