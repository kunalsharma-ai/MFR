import React from "react";
import data from "@/data/data.json";
import {
  Grid,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function page() {
  return (
    <Grid
      size={12}
      container
      direction="column"
      alignItems={"center"}
      className="scroll-target"
      mb={4}
    >
      <Grid
        size={12}
        sx={{
          position: "relative",
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
          fontSize={{ xs: 24, lg: 32 }}
          fontWeight={600}
          sx={{ color: "white", zIndex: 2 }}
        >
          FREQUENTLY ASKED QUESTIONS
        </Typography>
      </Grid>
      <Grid size={{ xs: 11, md: 8 }} container justifyContent={"center"} py={5}>
        <Typography fontWeight={"bold"} fontSize={"24px"}>
          Do You Have{" "}
          <Typography
            fontSize={"24px"}
            component="span"
            color="secondary.main"
            fontWeight={"bold"}
          >
            Any Question?
          </Typography>
        </Typography>

        <Grid size={12} container direction="column" spacing={2} mt={4}>
          {data.faqs.map((faq, index) => (
            <Accordion
              key={index}
              disableGutters
              sx={{
                boxShadow: 0,
                bgcolor: "#385e9e",
                border: `1px solid #e0e0e0`,
                p: 1.5,
                borderRadius: 3,
                minHeight: "50px",
                "&:first-of-type": {
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                },
                "&:last-of-type": {
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: "white" }} />}
                sx={{ borderRadius: 3 }}
              >
                <Typography fontSize={"18px"} fontWeight="500" color="white">
                  {faq.que}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  bgcolor: "white",
                  borderRadius: 2,
                  textAlign: "justify",
                  fontSize: 15,
                  "& ul, & ol": {
                    paddingLeft: "24px",
                    marginTop: 1,
                    marginBottom: 1,
                  },
                  "& li": {
                    marginBottom: "6px",
                  },
                }}
              >
                <div dangerouslySetInnerHTML={{ __html: faq.ans }} />
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
}

export default page;
