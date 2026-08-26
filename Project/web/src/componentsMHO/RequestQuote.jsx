"use client";
import React from "react";
import { useForm } from "react-hook-form";
import "react-phone-input-2/lib/material.css";
import { api } from "@/util";

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
import { Form } from "@/components";

import contact from "../validators/contact";
import { useToast } from "@/hooks";


const inputSx = {
  height: 56,
  borderRadius: "8px",
  color: "#151515",
  paddingX: 1,
  "& input::placeholder": {
    color: "#b0b4bc",
    opacity: 1,
    fontWeight: 500,
  },
  "& fieldset": {
    border: "none",
  },
};

export default function RequestQuote({ open, onClose }) {
  const {
    control,
    handleSubmit,
    reset,
    formState: {errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
    defaultValues: {
      firstname: "",
      lastname: "",
      email: "",
      phone: "",
      message: "",
    },
  });
 
  const onSubmit = async (data) => {
    const resp=await api.put("/api/v1/quote",data);
    useToast(resp);
    onClose();
    reset();
  }

  const handleClose = () => {
    if(document.activeElement instanceof HTMLElement){
      document.activeElement.blur();
    }
    onClose();
  }

  return (
    <Drawer
      anchor={"top"}
      open={open}
      onClose={handleClose}
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
        component="form"
        onSubmit={handleSubmit(onSubmit)}
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
          onClick={handleClose}
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
                  <Form.Input
                    name="firstname"
                    control={control}
                    validations={contact.firstname}
                    errors={errors.firstname}
                    inputSX={inputSx}
                    placeholder="First Name"  
                  />
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form.Input
                    name="lastname"
                    control={control}
                    validations={contact.lastname}
                    errors={errors.lastname}
                    inputSX={inputSx}
                    placeholder="Last Name"
                  />
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form.Input
                    name="email"
                    control={control}
                    validations={contact.email}
                    errors={errors.email}
                    inputSX={inputSx}
                    placeholder="Email"
                  />
                </Grid>{" "}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Form.Phone
                    name="phone"
                    control={control}
                    validations={contact.phone}
                    errors={errors.phone}
                    inputSX={{
                      height: 56,
                      borderRadius: "8px",
                      // backgroundColor: "#5B8FE8",
                      color: "#151515",
                      border: errors.phone
                        ? "1px solid #FFD9D9"
                        : "none",
                    }}
                  />
                </Grid>{" "}
                 <Grid size={12}>
                  <Form.TextEditor
                    name="message"
                    control={control}
                    inputSX={inputSx}
                    placeholder="Message"
                    height={300}
                    validations={contact.message}
                    errors={errors.message}
                  />
                </Grid>{" "}
               
                <Grid size={12} justifyContent="center" container>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
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
                    {isSubmitting ? "SENDING..." : "GET QUOTE"}
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
