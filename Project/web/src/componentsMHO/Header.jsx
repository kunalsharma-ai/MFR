"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Typography,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Grid,
  Container,
} from "@mui/material";
import { motion } from "framer-motion";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { usePathname } from "next/navigation";
import { useMember, useQuery } from "@/Context";

export default function Header({ sections = [], open, setOpen }) {
  const [profileAnchorEl, setProfileAnchorEl] = React.useState(null);
  const [showLogin, setShowLogin] = React.useState(true);
  const user = useMember();
  const pathname = usePathname();
  const query = useQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!query) return;
    if (![null, undefined].includes(query.login)) {
      setOpen(true);
    }
  }, [query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = (ref) => {
    if (ref?.current) {
      const element = ref.current;
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 5);
    }
  };

  const handleNavigation = (path, sectionLabel = null) => {
    if (pathname === path) {
      // If already on the target page
      if (path === "/") {
        const scrollContainer = document.getElementById("scroll-container");
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
        // Scroll to section if on home page
        if (sectionLabel) {
          const section = sections.find((s) => s.label === sectionLabel);
          if (section) handleScroll(section.ref);
        }
      }
      return;
    }

    // If navigating to home with a section
    if (path === "/" && sectionLabel) {
      router.push(`/?section=${encodeURIComponent(sectionLabel)}`);
    } else {
      router.push(path); // Regular navigation for other pages
    }
  };

  useEffect(() => {
    if (pathname === "/") {
      const sectionLabel = searchParams.get("section");
      if (sectionLabel) {
        const section = sections.find(
          (s) => s.label === decodeURIComponent(sectionLabel)
        );
        if (section) {
          handleScroll(section.ref);
          // Clear the query parameter after scrolling
          router.replace("/", { scroll: false });
        }
      }
    }
  }, [pathname, searchParams, sections, router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  const getNavigationItems = () => {
    // if (pathname === "/") {
    //   // Home page - use sections with scroll functionality
    //   // Override "CONTACT" to navigate to /contact page
    //   return sections.map((section) => ({
    //     label: section.label, // Already uppercase
    //     onClick: () => {
    //       if (section.label === "CONTACT") {
    //         handleNavigation("/contact");
    //       } else {
    //         handleScroll(section.ref);
    //       }
    //       handleDrawerClose();
    //     },
    //     isExternalPage: section.label === "COVERAGE",
    //     path: section.label === "CONTACT" ? "//panels.frequentresearch.com/" : "/",
    //   }));
    // } else
    {
      // Other pages - navigate to home sections or other pages, with uppercase labels
      return [
        {
          label: "ABOUT US",
          onClick: () => {
            handleNavigation("/", "ABOUT US");
            handleDrawerClose();
          },
          path: "/",
          sectionLabel: "ABOUT US",
        },

        {
          label: "HOW IT WORKS",
          onClick: () => {
            handleNavigation("/", "HOW IT WORKS");
            handleDrawerClose();
          },
          path: "/",
          sectionLabel: "HOW IT WORKS",
        },
        {
          label: "WHY US",
          onClick: () => {
            handleNavigation("/", "WHY US");
            handleDrawerClose();
          },
          path: "/",
          sectionLabel: "WHY US",
        },
        {
          label: "STEPS TO JOIN",
          onClick: () => {
            handleNavigation("/", "STEPS TO JOIN");
            handleDrawerClose();
          },
          path: "/",
          sectionLabel: "STEPS TO JOIN",
        },
        {
          label: "COVERAGE",
          onClick: () => {
            window.open(
              "//panels.frequentresearch.com/",
              "_blank",
              "noopener,noreferrer"
            ),
              //  router.push("//panels.frequentresearch.com/")
              handleDrawerClose();
          },
          path: null,
          sectionLabel: null,
        },
      ];
    }
  };
  const navigationItems = getNavigationItems();

  const drawer = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",

        width: "100vw",
        height: "100vh",
        bgcolor: "primary.main",
        color: "white",
        backgroundImage: "url(/imagesmfr/facts-bg-last.png)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        pt: 2,
        pb: 2,
        position: "relative",
      }}
    >
      <Box
        sx={{
          px: 3,
          pb: 2,
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            position: "relative",
            cursor: "pointer",
            scale: 1.1,
            marginRight: { lg: "50px" },
          }}
          onClick={() => {
            handleNavigation("/");
            handleDrawerClose();
          }}
        >
          <Box
            component="img"
            src="/images/logo/mfr-logo-white.png"
            alt="logo"
            width={220}
          />
          <Box
            component="img"
            src="/imagesmfr/dol-sign.gif"
            alt="logo"
            width={{ xs: 15, lg: 20 }}
            sx={{ position: "absolute", right: -5, top: 4 }}
          />
        </Box>

        <IconButton
          aria-label="close drawer"
          onClick={handleDrawerClose}
          sx={{
            p: 1,
            bgcolor: "white",
            ml: 4,
            borderRadius: 20,
            border: "1px solid white",
            borderColor: "primary.main",
            color: "primary.main",
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
        }}
      >
        <List>
          {navigationItems.map((item, index) => (
            <ListItem
              key={index}
              onClick={item.onClick}
              sx={{
                cursor: "pointer",
                fontWeight: 500,

                px: 3,
                py: 1.5,
                "&:hover": {
                  bgcolor: "rgba(0, 0, 0, 0.04)",
                  borderRadius: 1,
                },
                position: "relative",
                // "&::after": {
                //   content: '""',
                //   position: "absolute",
                //   width: 0,
                //   height: "2px",
                //   bottom: 0,
                //   left: 24,
                //   bgcolor: "primary.main",
                //   transition: "width 0.3s ease",
                // },
                // "&:hover::after": {
                //   width: "calc(100% - 48px)",
                // },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: "400",
                  fontSize: "22px",
                }}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ px: 3, mt: 3 }} position="absolute" bottom="20px">
          {/* <Button
          fullWidth
          variant="outlined"
          color="black"
          onClick={() => {
            setOpen(!open);

            handleDrawerClose();
          }}
          sx={{
            fontSize: "16px",
            borderRadius: 1,
            fontWeight: "bold",
            height: "45px",
            "&:hover": {
              boxShadow: 12,
            },
          }}
        >
          Login
        </Button> */}
          {user === null ? (
            <Button
              variant="outlined"
              color="black"
              onClick={() => {
                setOpen(!open);
              }}
              sx={{
                boxShadow: 2,
                fontSize: "16px",
                borderRadius: 1,
                fontWeight: "bold",
                height: "36px",

                "&:hover": {
                  boxShadow: 5,
                },
              }}
            >
              Login
            </Button>
          ) : (
            <Box
              display={"flex"}
              alignItems="center"
              justifyContent="space-between"
            >
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    width: "40px",
                    height: "40px",
                    bgcolor: user?.profilePicture
                      ? "transparent"
                      : "primary.main",
                  }}
                  src={user?.profilePicture || ""}
                  alt={user?.name?.first ?? "U"}
                />
                <Typography
                  sx={{
                    ml: 1,
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {user?.name?.first ?? "User"}
                </Typography>
              </Box>
              <Box display={"flex"} alignItems="center" gap={2} ml={3}>
                <Tooltip
                  title="Dashboard"
                  enterTouchDelay={0}
                  leaveTouchDelay={1500}
                  placement="top"
                >
                  <IconButton
                    sx={{ fontSize: "26px", color: "black" }}
                    onClick={() => {
                      handleNavigation("/member/dashboard");
                      handleDrawerClose();
                    }}
                  >
                    <DashboardIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip
                  title="Log Out"
                  enterTouchDelay={0}
                  leaveTouchDelay={1500}
                  placement="top"
                >
                  <IconButton
                    sx={{ fontSize: "26px", color: "black" }}
                    onClick={async () => {
                      localStorage.removeItem("token");
                      user.Reload();
                      window.location.pathname = "/";
                      handleDrawerClose();
                    }}
                  >
                    <PowerSettingsNewIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        width: "100%",
        bgcolor: "white",
        color: "black",
        py: { xs: 0, lg: 0.5 },
        boxShadow: 3,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          size={12}
          container
          alignItems="center"
          justifyContent="space-between"
          spacing={6}
          sx={{
            height: "70px",
          }}
        >
          <Box
            sx={{
              position: "relative",
              cursor: "pointer",
              scale: 1.1,
              marginRight: { lg: "50px" },
            }}
            onClick={() => {
              router.push("/");
            }}
          >
            <Box
              component="img"
              src="/images/logo/mfr-logo.png"
              alt="logo"
              width={{ xs: "180px", sm: "225px" }}
              height={{xs:"38px", sm:"48px"}}
            />
            <Box
              component="img"
              src="/imagesmfr/dol-sign.gif"
              alt="logo"
              width={{ xs: 15, md: 20 }}
              sx={{
                position: "absolute",
                right: { xs: -5, md: -6.5 },
                top: { xs: 2, sm: 5, md: 0 },
              }}
            />
          </Box>

          <Box
            sx={{ display: { xs: "none", lg: "flex" }, gap: { xs: 2, xl: 4 } }}
          >
            {navigationItems.map((item, index) => (
              <Box
                component="button"
                tabIndex={0}
                key={index}
                className="hover-line"
                onClick={item.onClick}
                sx={{
                  fontFamily: "Fira Sans, sans-serif",
                  bgcolor: "transparent",
                  border: "none",

                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: "2px",
                  },
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: { xs: "12px", lg: "13px", xl: "16px" },
                  position: "relative",
                  "&:after": {
                    content: '""',
                    position: "absolute",
                    width:
                      mounted && pathname === item.path && !item.isExternalPage
                        ? "100%"
                        : 0,
                    height: "2px",
                    bottom: -4,
                    left: 0,
                    bgcolor: "primary.main",
                    transition: "width 0.3s ease",
                  },
                  "&:hover": {
                    color: "secondary.main",
                    "&:after": {
                      width: "100%",
                    },
                  },
                }}
              >
                {item.label}
              </Box>
            ))}
          </Box>

          <Box
            sx={{ display: { xs: "flex", lg: "none" }, alignItems: "center" }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ mx: 0.5, color: "secondary.main" }}
            >
              <MenuIcon fontSize="large" />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: { xs: "none", lg: "block" },
              alignItems: "center",
              // mr: 7,
              // minWidth: "145px",
            }}
          >
            {showLogin &&
              (user === null ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setOpen(!open);
                  }}
                  sx={{
                    position: "relative",
                    overflow: "hidden",
                    fontSize: "16px",
                    fontWeight: "500",
                    height: "30px",
                    borderRadius: 0,
                    p: 2.5,
                    px: 3,
                    zIndex: 1,

                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "0%",
                      height: "100%",
                      bgcolor: "secondary.main",
                      transition: "width 0.35s ease",
                      zIndex: -1,
                    },

                    "&:hover::before": {
                      width: "100%",
                    },
                  }}
                >
                  <PersonIcon />{" "}
                  <span
                    style={{
                      verticalAlign: "middle",
                      marginTop: 2,
                      marginLeft: 5,
                    }}
                  >
                    Login
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={(event) => setProfileAnchorEl(event.currentTarget)}
                  color="inherit"
                  sx={{ textTransform: "none", px: 2 }}
                >
                  <Avatar
                    sx={{
                      width: "40px",
                      height: "40px",
                      bgcolor: user?.profilePicture
                        ? "transparent"
                        : "primary.main",
                    }}
                    src={user?.profilePicture || ""}
                    alt={"user photo"}
                  />
                  <Typography
                    sx={{
                      display: { xs: "none", lg: "block" },
                      ml: 1,
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    {user?.name?.first ?? "User"}
                  </Typography>
                </Button>
              ))}
          </Box>
        </Grid>
      </Container>

      <Menu
        anchorEl={profileAnchorEl}
        open={Boolean(profileAnchorEl)}
        onClose={() => setProfileAnchorEl(null)}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        PaperProps={{
          sx: {
            // bgcolor: "#016550",
            color: "white",
            boxShadow: 24,
            mt: 1.5,
            overflow: "visible",
            "::before": {
              content: '""',
              display: "block",
              position: "absolute",
              width: 10,
              height: 10,
              bgcolor: "white",
              transform: "rotate(45deg)",
              top: -5,
              left: 16,
              zIndex: 0,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setProfileAnchorEl(null);
            router.replace("/member/dashboard");
          }}
          sx={{ gap: 1, px: 3, py: 1, color: "black", fontWeight: 500 }}
        >
          <i className="icon-drawer" />
          Dashboard
        </MenuItem>
        <MenuItem
          onClick={async () => {
            setProfileAnchorEl(null);
            localStorage.removeItem("token");
            user.Reload();
          }}
          sx={{
            gap: 1,
            px: 3,
            py: 1,
            borderTop: "1px solid whitesmoke",
            color: "black",
            fontWeight: 500,
          }}
        >
          <i className="icon-power" />
          Logout
        </MenuItem>
      </Menu>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            position: "relative",
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}
