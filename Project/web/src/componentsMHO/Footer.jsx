"use client";
import React, { useEffect } from "react";
import { Box, Grid, IconButton, Typography, Container } from "@mui/material";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import CallIcon from "@mui/icons-material/Call";
import EmailIcon from "@mui/icons-material/Email";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function Footer({ sections = [] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle scroll for home page sections
  const handleScroll = (ref) => {
    if (ref?.current) {
      const element = ref.current;
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
          inline: "nearest",
        });
      }, 150);
    }
  };

  // Handle navigation
  const handleNavigation = (path, sectionLabel = null) => {
    if (pathname === path) {
      // If already on the target page
      if (path === "/" && sectionLabel) {
        const section = sections.find((s) => s.label === sectionLabel);
        if (section) handleScroll(section.ref);
      }
      return;
    }

    // If navigating to home with a section
    if (path === "/" && sectionLabel) {
      router.push(`/?section=${encodeURIComponent(sectionLabel)}`);
    } else {
      router.push(path);
    }
  };

  // Handle scrolling when arriving on home page with a section query
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

  // Handle external navigation
  const handleExternalNavigation = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (e, handler) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };

  const aboutSection = sections?.find((s) => s.label === "ABOUT US");

  return (
    <Grid
      size={12}
      sx={{
        bgcolor: "secondary.main",
        color: "white",
        backgroundImage: "url(/imagesmfr/call-bg.png)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
      container
      justifyContent="center"
    >
      <Container maxWidth="lg">
        <Grid size={12} container justifyContent="center" spacing={3}>
          <Grid
            size={{ xs: 12, lg: 4 }}
            container
            direction="column"
            spacing={2}
            py={4}
          >
            <Typography
              sx={{ fontWeight: "bold", fontSize: "24px", color: "white" }}
            >
              QUICK LINKS
            </Typography>
            {/* <Typography
            role="button"
            tabIndex={0}
            onClick={() => {
              handleNavigation("/", "ABOUT US");
            }}
            onKeyDown={(e) =>
              handleKeyDown(e, () => handleNavigation("/", "ABOUT US"))
            }
            sx={{
              "&:hover": {
                cursor: "pointer",
                color: "primary.main",
              },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "primary.main",
                outlineOffset: "2px",
              },
            }}
          >
            About Us
          </Typography> */}
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation("/privacy")}
              onKeyDown={(e) =>
                handleKeyDown(e, () => handleNavigation("/privacy"))
              }
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              Privacy Policy
            </Typography>{" "}
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation("/gdpr")}
              onKeyDown={(e) =>
                handleKeyDown(e, () => handleNavigation("/gdpr"))
              }
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              GDPR Compliance
            </Typography>
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation("/cookies")}
              onKeyDown={(e) =>
                handleKeyDown(e, () => handleNavigation("/cookies"))
              }
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              Cookies Policy
            </Typography>
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation("/terms")}
              onKeyDown={(e) =>
                handleKeyDown(e, () => handleNavigation("/terms"))
              }
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              Terms of Use
            </Typography>
            <Typography
              role="button"
              tabIndex={0}
              onClick={() =>
                handleExternalNavigation("//panels.frequentresearch.com/")
              }
              onKeyDown={(e) =>
                handleKeyDown(e, () =>
                  handleExternalNavigation("//panels.frequentresearch.com/")
                )
              }
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              Panel Book
            </Typography>
            <Typography
              role="button"
              tabIndex={0}
              onClick={() => handleNavigation("/faq")}
              onKeyDown={(e) =>
                handleKeyDown(e, () => handleNavigation("/faq"))
              }
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              FAQ
            </Typography>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 4 }}
            container
            direction="column"
            spacing={2}
            py={4}
          >
            <Box sx={{ position: "relative" }}>
              <img
                src="/images/logo/mfr-logo-white.png"
                alt="logo"
                width="250px"
                height="52.77px"
              />
              <Box
                component="img"
                src="/imagesmfr/dol-sign.gif"
                alt="logo"
                width={{ xs: 15, md: 20 }}
                sx={{ position: "absolute", left: 238, top: { xs: 4, md: 0 } }}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2} mt={1} pl={1}>
              <IconButton
                component="a"
                href="https://in.linkedin.com/company/frequentresearch"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="linkedin"
                sx={{
                  color: "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "primary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                <LinkedInIcon sx={{ fontSize: 36 }} />
              </IconButton>
              <IconButton
                component="a"
                target="_blank"
                href="https://www.facebook.com/frequentrfs/"
                rel="noopener noreferrer"
                aria-label="facebook"
                sx={{
                  color: "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "primary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                <FacebookIcon
                  sx={{
                    fontSize: "36px",
                  }}
                />
              </IconButton>
              <IconButton
                component="a"
                target="_blank"
                href="https://twitter.com/frequentrfs"
                rel="noopener noreferrer"
                aria-label="twitter"
                sx={{
                  color: "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "primary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                <XIcon
                  sx={{
                    fontSize: "30px",
                  }}
                />
              </IconButton>

              <IconButton
                component="a"
                target="_blank"
                href="https://www.youtube.com/channel/UCLxmn2kq4aACAHaL2eT6QIQ"
                rel="noopener noreferrer"
                aria-label="youtube"
                sx={{
                  color: "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "primary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                <YouTubeIcon
                  sx={{
                    fontSize: "36px",
                  }}
                />
              </IconButton>
            </Box>
          </Grid>

          <Grid
            size={{ xs: 12, lg: 4 }}
            container
            direction="column"
            spacing={2}
            py={4}
          >
            <Typography
              sx={{ fontWeight: "bold", fontSize: "24px", color: "white" }}
            >
              CONTACT US
            </Typography>
            <Box
              display="flex"
              component="a"
              href="https://goo.gl/maps/omWW4BDscx5fZpFdA"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },

                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              <LocationPinIcon
                sx={{
                  mr: 2,
                  color: "white",
                  fontSize: { xs: "22px", xl: "26px" },
                }}
              />
              <Box>
                <Typography sx={{ fontSize: { xs: "14px", xl: "16px" } }}>
                  Third Floor, B-96, Pushpanjali Enclave, Pitampura,
                </Typography>
                <Typography sx={{ fontSize: { xs: "14px", xl: "16px" } }}>
                  Delhi 110034 India
                </Typography>
              </Box>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              component="a"
              href="tel:+919810459700"
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              <CallIcon
                sx={{
                  mr: 2,
                  color: "white",
                  fontSize: { xs: "22px", xl: "26px" },
                }}
              />
              <Typography sx={{ fontSize: { xs: "14px", xl: "16px" } }}>
                +919810459700
              </Typography>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              component="a"
              href="mailto:support@frequentresearch.com"
              sx={{
                transition: "all 0.3s ease",
                "&:hover": {
                  cursor: "pointer",
                  color: "primary.main",
                  transform: "translateX(5px)",
                },
                "&:focus-visible": {
                  outline: "2px solid",
                  outlineColor: "primary.main",
                  outlineOffset: "2px",
                },
              }}
            >
              <EmailIcon
                sx={{
                  mr: 2,
                  color: "white",
                  fontSize: { xs: "22px", xl: "26px" },
                }}
              />
              <Typography sx={{ fontSize: { xs: "14px", xl: "16px" } }}>
                support@frequentresearch.com
              </Typography>
            </Box>
          </Grid>
        </Grid>{" "}
      </Container>
      <Grid
        size={12}
        sx={{
          textAlign: "center",
          borderTop: "1px solid #333",
          py: 0.5,
          color: "white",
          background: "rgba(255, 255, 255, 0.2)",
          fontWeight: 500,
          fontSize: 13,
        }}
      >
        Copyright 2026 ©{" "}
        <Typography
          component="a"
          href="https://frequentresearch.com/"
          target="_blank"
          rel="noopener noreferrer"
          color="primary.main"
          fontSize={13}
          sx={{
            color: "white",
            "&:hover": { textDecoration: "underline" },
            "&:focus-visible": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: "2px",
            },
          }}
        >
          Frequent Research Fieldwork Solutions Pvt. Ltd.
        </Typography>{" "}
        (d/b/a MyFrequentRewards). All Rights Reserved.
      </Grid>
    </Grid>
  );
}

export default Footer;
