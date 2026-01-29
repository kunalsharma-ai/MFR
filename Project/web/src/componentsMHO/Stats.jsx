"use client";
import { Grid, Typography, Container } from "@mui/material";
import Counter from "./Counter";

const stats = [
  { label: "REWARDS PAID", value: 1233332, prefix: "$", showPlus: true },
  {
    label: "TOTAL SURVEYS COMPLETED (THIS MONTH)",
    value: 323,
    showPlus: false,
  },
  { label: "MONTHLY AVAILABLE SURVEYS", value: 42, showPlus: true },
  { label: "PANELISTS REGISTERED", value: 3212, showPlus: false },
];

function Stats() {
  return (
    <Grid
      size={12}
      sx={{
        bgcolor: "primary.main",
        color: "white",
        backgroundImage: "url(/imagesmfr/dot1-bg.png)",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      <Container maxWidth="lg">
        <Grid
          size={12}
          container
          spacing={3}
          px={2}
          pt={6}
          pb={{ xs: 6, md: 0 }}
          justifyContent="center"
        >
          {stats.map((stat, index) => {
            return (
              <Grid
                container
                size={{ xs: 12, md: 6, lg: 3 }}
                key={index}
                direction="column"
                alignItems="center"
                justifyContent="flex-start"
                spacing={1}
                sx={{
                  py: 2,
                  minHeight: { xs: "140px", md: "190px" },
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: "bold",
                    fontSize: "36px",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "normal",
                  }}
                >
                  <Counter
                    value={stat.value}
                    prefix={stat?.prefix}
                    showPlus={stat?.showPlus}
                  />
                </Typography>
                <Typography sx={{ fontSize: { xs: "16px", xl: "18px" } }}>
                  {stat?.label}
                </Typography>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Grid>
  );
}

export default Stats;
