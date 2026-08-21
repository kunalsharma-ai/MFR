import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  // palette: {

  //   primary: {
  //     main: "#0c5adb",
  //   },
  //   secondary: {
  //     main: "#063686",
  //   },
  //   page: {
  //     main: "#f4f4f4",
  //   },
  //   card: {
  //     main: "#ffffff",
  //   },
  //   cardbg:{
  //     main: "#e8f0fd"// "#c6e3f4"  //   "#8cb2f333",
  //   }
  // },
    palette: {
    primary: {
      main: "#001B66",
    },
    secondary: {
      main: "#fe7e00",
    },

    page: {
      main: "#f4f4f4",
    },
    card: {
      main: "#ffffff",
    },
    cardbg: {
      main: "#FFD4AD",  // #FFE4CC
    },
     cardtext: {
      main: "#001B66", 
    },
  },
  typography: {
    color: "black",
    fontSize: 14,
    fontFamily: "'Fira Sans', ui-sans-serif, system-ui, sans-serif"
    
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: 14,
          color: "black",
        },
        '[role="presentation"].MuiPopover-root': {
          zIndex: 15000,
        },
        ".MuiTooltip-arrow::before": {
          border: "1px solid #ccc",
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          boxSizing: "border-box",
        },
        "*": {
          scrollbarWidth: "thin",
          scrollbarColor: "#fe7e00 transparent",
        },
        "*::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
        },
        "*::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "*::-webkit-scrollbar-thumb": {
          backgroundColor: "#fe7e00",
          borderRadius: "8px",
          border: "2px solid transparent",
          backgroundClip: "content-box",
        },
        "*::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "#fe7e00",
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          fontSize: 14,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: 14,
        },
        shrink: {
          fontWeight: 500,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          fontSize: 14,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: 13,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: 12,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: "bold",
          fontSize: "14px",
          "&.Mui-selected": {
            color: "#063686",
          },
        },
        indicator: {
          backgroundColor: "#063686",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "secondary.main",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
            color: "primary.main",
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          "&:before": {
            display: "none",
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 13,
          fontWeight: "500",
          border: "1px solid #ccc",
          borderRadius: 4,
          background: "#effeff",
          color: "black",
          px: 3,
          py: 5,
          whiteSpace: "normal",
          hyphens: "auto",
          maxWidth: 350,
        },
        arrow: {
          color: "#effeff",
        },
      },
      defaultProps: {
        arrow: true,
        enterTouchDelay: 10,
        leaveTouchDelay: 3000,
        PopperProps: {
          modifiers: [
            {
              name: "zIndex",
              enabled: true,
              phase: "write",
              fn: ({ state }) => {
                state.styles.popper.zIndex = 9999;
              },
            },
          ],
        },
      },
    },
  },
});

export default theme;
