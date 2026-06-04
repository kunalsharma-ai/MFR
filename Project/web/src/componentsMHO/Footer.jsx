"use client";
import React from "react";
import { Box, Grid, IconButton, Typography, Container } from "@mui/material";
import LocationPinIcon from "@mui/icons-material/LocationPin";
import CallIcon from "@mui/icons-material/Call";
import EmailIcon from "@mui/icons-material/Email";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { useRouter } from "next/navigation";

function Footer() {
  const router = useRouter();

  const handleKeyDown = (e, handler) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };

  return (
    <React.Suspense fallback={<></>}>
      <Grid
        size={12}
        sx={{
          bgcolor: "primary.main",
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
          <Grid
            size={12}
            container
            justifyContent="center"
            spacing={{ xs: 1, lg: 3 }}
          >
            <Grid
              size={{ xs: 12, sm: 6, lg: 4 }}
              container
              order={{ xs: 2, lg: 1 }}
              direction="column"
              spacing={2}
              py={{ xs: 2, lg: 4 }}
            >
              <Typography
                sx={{ fontWeight: "bold", fontSize: "24px", color: "white" }}
              >
                QUICK LINKS
              </Typography>
              <Typography
                role="button"
                tabIndex={0}
                onClick={() => router.push("/privacy")}
                onKeyDown={(e) =>
                  handleKeyDown(e, () => router.push("/privacy"))
                }
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                Privacy Policy
              </Typography>{" "}
              <Typography
                role="button"
                tabIndex={0}
                onClick={() => router.push("/gdpr")}
                onKeyDown={(e) => handleKeyDown(e, () => router.push("/gdpr"))}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                GDPR Compliance
              </Typography>
              <Typography
                role="button"
                tabIndex={0}
                onClick={() => router.push("/cookies")}
                onKeyDown={(e) =>
                  handleKeyDown(e, () => router.push("/cookies"))
                }
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                Cookies Policy
              </Typography>
              <Typography
                role="button"
                tabIndex={0}
                onClick={() => router.push("/terms")}
                onKeyDown={(e) => handleKeyDown(e, () => router.push("/terms"))}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                Terms of Use
              </Typography>
              <Typography
                role="button"
                tabIndex={0}
                onClick={() => router.push("/profiling")}
                onKeyDown={(e) =>
                  handleKeyDown(e, () => router.push("/profiling"))
                }
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                Profiling and Quality Score
              </Typography>
              <Typography
                role="button"
                tabIndex={0}
                onClick={() =>
                  window.open(
                    "https://panels.frequentresearch.com/",
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
                onKeyDown={(e) =>
                  handleKeyDown(e, () =>
                    window.open(
                      "https://panels.frequentresearch.com/",
                      "_blank",
                      "noopener,noreferrer",
                    ),
                  )
                }
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                Panel Book
              </Typography>
              <Typography
                role="button"
                tabIndex={0}
                onClick={() => router.push("/faq")}
                onKeyDown={(e) => handleKeyDown(e, () => router.push("/faq"))}
                sx={{
                  transition: "all 0.3s ease",
                  "&:hover": {
                    cursor: "pointer",
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
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
              order={{ xs: 1, lg: 3 }}
              justifyContent={{ sm: "center", md: "flex-start" }}
              direction={{ xs: "column", sm: "row", lg: "column" }}
              spacing={{ xs: 2, sm: 6, lg: 2 }}
              py={4}
            >
              <Box sx={{ position: "relative" }}>
                <img
                  src="/images/logo/mfr-logo.png"
                  alt="logo"
                  width={270}
                  style={{
                    filter: "brightness(0) saturate(100%) invert(100%)",
                  }}
                  // width="250px"
                  // height="52.77px"
                />
                {/* <Box
                  component="img"
                  src="/imagesmfr/dol-sign.gif"
                  alt="logo"
                  width={{ xs: 15, md: 20 }}
                  sx={{
                    position: "absolute",
                    left: 238,
                    top: { xs: 4, md: 0 },
                  }}
                /> */}
              </Box>
              <Box display="flex" alignItems="center" gap={2} mt={1} pl={1}>
                <IconButton
                  component="a"
                  href="https://www.linkedin.com/company/my-frequent-rewards"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="linkedin"
                  sx={{
                    color: "white",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      cursor: "pointer",
                      color: "secondary.main",
                      transform: "translateX(5px)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "secondary.main",
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
                      color: "secondary.main",
                      transform: "translateX(5px)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "secondary.main",
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
                      color: "secondary.main",
                      transform: "translateX(5px)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "secondary.main",
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
                      color: "secondary.main",
                      transform: "translateX(5px)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid",
                      outlineColor: "secondary.main",
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
              size={{ xs: 12, sm: 6, lg: 4 }}
              container
              order={3}
              direction="column"
              spacing={2}
              py={{ xs: 2, lg: 4 }}
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
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },

                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
                    outlineOffset: "2px",
                  },
                }}
              >
                <LocationPinIcon
                  sx={{
                    mr: 2,
                    mt: 0.5,
                    color: "white",
                    fontSize: { xs: "22px", xl: "26px" },
                  }}
                />
                <Box>
                  <Typography sx={{ fontSize: { xs: "14px", xl: "16px" } }}>
                    Mangolpur Kalan,
                  </Typography>
                  <Typography sx={{ fontSize: { xs: "14px", xl: "16px" } }}>
                    New Delhi - 110085
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
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
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
                    color: "secondary.main",
                    transform: "translateX(5px)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "secondary.main",
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
            fontSize={13}
            sx={{
              fontWeight: "bold",
              color: "secondary.main",
              "&:hover": { textDecoration: "underline" },
              "&:focus-visible": {
                outline: "2px solid",
                outlineColor: "secondary.main",
                outlineOffset: "2px",
              },
            }}
          >
            Frequent Research Fieldwork Solutions Pvt. Ltd.
          </Typography>{" "}
          (d/b/a MyFrequentRewards). All Rights Reserved.
        </Grid>
      </Grid>{" "}
    </React.Suspense>
  );
}

export default Footer;
