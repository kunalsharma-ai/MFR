"use client";
import React from "react";
import { Grid, Typography, Button, Container, IconButton } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { useRouter } from "next/navigation";

export default function page() {
  const router = useRouter();
  return (
    <Grid
      container
      direction="column"
      alignItems="center"
      justifyContent="center"
      size={12}
      sx={{
        textAlign: "center",
        minHeight: "100vh",
        background: "linear-gradient(90deg, #fff 0, #9fb0caff 100%)",
      }}
    >
      <Container maxWidth="lg">
        <IconButton disabled>
          <ErrorIcon sx={{ color: "info.main", fontSize: 120 }} />
        </IconButton>
        <Typography
          sx={{
            my: 6,
            fontSize: 48,
            fontWeight: "bold",
            background: "#667db6",
            background:
              "-webkit-linear-gradient(to right, #667db6, #0082c8, #0082c8, #667db6)",
            background:
              "linear-gradient(to right, #667db6, #0082c8, #0082c8, #667db6)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            color: "transparent",
          }}
        >
          Page Not Found
        </Typography>
        <Typography
          variant="h1"
          sx={{
            fontSize: 26,
            fontWeight: 700,
            lineHeight: 1.2,
            mt: 2,
            color: "black",
          }}
        >
          The Page you are looking is not available or has been removed.
        </Typography>

        <Typography
          variant="h5"
          sx={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.5,
            mt: 4,
            mb: 2,
            color: "#777",
          }}
        >
          Go to home page using button below
        </Typography>

        <Button
          variant="contained"
          onClick={() => {
            router.replace("/");
          }}
          sx={{
            height: 58,
            background: "#667db6",
            background:
              "-webkit-linear-gradient(to right, #667db6, #0082c8, #0082c8, #667db6)",
            background:
              "linear-gradient(to right, #667db6, #0082c8, #0082c8, #667db6)",

            color: "white",
            borderRadius: 20,
            fontSize: 16,
            fontWeight: 700,
            padding: "18px 40px",
            "&:hover": {
              background:
                "linear-gradient(to right,  #0082c8, #0082c8, #667db6,#667db6)",
            },
          }}
        >
          Go to Home Page
        </Button>
      </Container>
    </Grid>
  );
}
