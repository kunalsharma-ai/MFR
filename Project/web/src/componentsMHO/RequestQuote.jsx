"use client";
import React from "react";
import {
  Drawer,
  IconButton,
  Grid,
  Box,
  Typography,
  Container,
  TextField,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function RequestQuote({ open, onClose }) {
  const [data, setData] = React.useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  return (
    <Drawer
      anchor={"top"}
      open={open}
      onClose={() => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        onClose();
      }}
      sx={{ zIndex: 7000 }}
      ModalProps={{
        BackdropProps: {
          sx: {
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(1px)",
            pointerEvents: "none",
          },
        },
      }}
    >
      <Box
        id="drawer-container"
        sx={{
          width: "100vw",
          height: "100vh",
          bgcolor: "primary.main",
          color: "white",
          backgroundImage: "url(/imagesmfr/facts-bg-last.png)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          p: 2,
          overflowY: "auto",
          position: "relative",
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            color: "#007acc",
            p: {xs:1,md:2},
            bgcolor: "white",
            position: "absolute",
            right: 15,
            zIndex: 2000,
            border: "1px solid #007acc",
            "&:hover": {
              color: "white",
              bgcolor: "primary.main",
              borderColor: "white",
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 28 }} />
        </IconButton>

        <Grid
          size={12}
          container
          alignItems="center"
          justifyContent="center"
          sx={{ height: "100%" }}
        >
          <Container maxWidth="md">
            <Grid
              size={12}
              container
              direction="column"
              alignItems="center"
              justifyContent="center"
            >
              <Typography
                fontSize={16}
                sx={{ letterSpacing: 5, mb: 1, fontWeight: 500 }}
              >
                GET QUOTE
              </Typography>
              <Box
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "16px", md: "28px" },
                  display: "inline-block",
                  letterSpacing: 2.5,
                }}
              >
                MAKE A FREE CONSULTANT
                <Box
                  sx={{
                    width: "40%",
                    mx: "auto",
                    mt: 1,
                    height: 5,
                    bgcolor: "#cfd8ffa0",
                    borderRadius: 5,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      bgcolor: "primary.main",
                      borderRadius: "50%",
                      position: "absolute",
                      top: "50%",
                      transform: "translateY(-50%)",
                      animation: "moveBall 3s ease-in-out infinite alternate",
                      "@keyframes moveBall": {
                        from: { left: 0 },
                        to: { left: "calc(100% - 10px)" },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Grid size={12} container spacing={4} mt={6}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="name"
                    value={data.name}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Name"
                    variant="outlined"
                    InputProps={{
                      sx: {
                        height: 56,
                        borderRadius: "8px",
                        backgroundColor: "#5B8FE8",
                        color: "#fff",
                        paddingX: 1,
                        "& input::placeholder": {
                          color: "#EAF1FF",
                          opacity: 1,
                          fontWeight: 500,
                        },
                        "& fieldset": {
                          border: "none",
                        },
                      },
                    }}
                  />
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Email"
                    variant="outlined"
                    InputProps={{
                      sx: {
                        height: 56,
                        borderRadius: "8px",
                        backgroundColor: "#5B8FE8",
                        color: "#fff",
                        paddingX: 1,
                        "& input::placeholder": {
                          color: "#EAF1FF",
                          opacity: 1,
                          fontWeight: 500,
                        },
                        "& fieldset": {
                          border: "none",
                        },
                      },
                    }}
                  />
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="phone"
                    value={data.phone}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Phone"
                    variant="outlined"
                    InputProps={{
                      sx: {
                        height: 56,
                        borderRadius: "8px",
                        backgroundColor: "#5B8FE8",
                        color: "#fff",
                        paddingX: 1,
                        "& input::placeholder": {
                          color: "#EAF1FF",
                          opacity: 1,
                          fontWeight: 500,
                        },
                        "& fieldset": {
                          border: "none",
                        },
                      },
                    }}
                  />
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    name="subject"
                    value={data.subject}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Subject"
                    variant="outlined"
                    InputProps={{
                      sx: {
                        height: 56,
                        borderRadius: "8px",
                        backgroundColor: "#5B8FE8",
                        color: "#fff",
                        paddingX: 1,
                        "& input::placeholder": {
                          color: "#EAF1FF",
                          opacity: 1,
                          fontWeight: 500,
                        },
                        "& fieldset": {
                          border: "none",
                        },
                      },
                    }}
                  />
                </Grid>{" "}
                <Grid size={12}>
                  <TextField
                    name="message"
                    value={data.message}
                    onChange={handleChange}
                    fullWidth
                    placeholder="Message"
                    variant="outlined"
                    multiline
                    rows={4}
                    InputProps={{
                      sx: {
                        borderRadius: "8px",
                        backgroundColor: "#5B8FE8",
                        color: "#fff",
                        paddingX: 1,
                        "& .MuiInputBase-input": {
                          padding: "14px",
                        },

                        "& textarea": {
                          padding: "14px",
                        },
                        "& input::placeholder": {
                          color: "#EAF1FF",
                          opacity: 1,
                          fontWeight: 500,
                        },
                        "& textarea::placeholder": {
                          color: "#EAF1FF",
                          opacity: 1,
                          fontWeight: 500,
                        },
                        "& fieldset": {
                          border: "none",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid size={12} justifyContent="center" container>
                  <Button
                    onClick={() => console.log(data)}
                    sx={{
                      bgcolor: "white",
                      width: { xs: "100%", md: "230px" },
                      height: 55,
                      fontWeight: 600,
                      fontSize: 16,
                      color: "primary.main",
                      borderRadius: 2,
                      "&:hover": {
                        bgcolor: "secondary.main",
                        color: "white",
                      },
                    }}
                  >
                    GET QUOTE
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        </Grid>
      </Box>
    </Drawer>
  );
}
