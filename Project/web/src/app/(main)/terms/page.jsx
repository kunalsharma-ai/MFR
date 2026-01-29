import React from "react";
import data from "@/data/data.json";
import { Grid, Container, Typography, Box } from "@mui/material";
function page() {
  return (
    <Grid size={12} className="scroll-target">
      <Grid
        size={12}
        sx={{
          position: "relative",
          height: "200px",
          height: "200px",
          backgroundImage: "url(/imagesmfr/testi-bg.webp)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
        }}
        container
        justifyContent="center"
        alignItems="center"
      >
        {" "}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgb(6, 54, 134, 0.7)",
            zIndex: 1,
          }}
        />
        <Typography
          fontSize={32}
          fontWeight={600}
          sx={{ color: "white", zIndex: 2 }}
        >
          TERMS & CONDITIONS
        </Typography>
      </Grid>

      <Grid size={12} py={10}>
        <Container
          maxWidth="lg"
          sx={{
            textAlign: "justify",
            "& p": {
              fontSize: 16,
              mb: 2,
              lineHeight: 1.7,
            },
            "& h5": {
              fontSize: 20,
              mt: 4,
              mb: 2,
              fontWeight: 600,
            },
            "& ul": {
              pl: 3,
              mb: 2,
            },
            "& li": {
              fontSize: 16,
              mb: 1,
            },
            "& a": {
              color: "#063686",
              textDecoration: "none",
            },
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: data.terms }} />
        </Container>
      </Grid>
    </Grid>
  );
}

export default page;
