import React from "react";
import { Grid, Typography, Container, Box } from "@mui/material";
function page() {
  const data = [
    {
      img: "verify",
      heading: "REGISTER ONLINE",
      description:
        "<p>We have a lifetime free membership to join our research community , we have a very simple and quick way to join ,you just need to register with your active email id and in a single click you become our community member. Once you make registration you are able to get free bonus points of 220Pts .</p><p>You do not have to spend much time on being a member, as you will receive an email invitation, when there is a new survey available. So you do not have to login to the site to check yourself every time.</p>",
    },
    {
      img: "clipboard",
      heading: "Profiler Survey",
      description:
        "<p>Click on Profile Survey as soon as you get enter into your Dashboard to get rewarded with your first Reward and complete your profiling with few quick inputs to earn more rewards value.</p><p>You will be rewarded with value points to complete each your profiling. Our profiling points system have a higher pay-out to achieve your threshold therefore as compare to other earning portals, it does not take too long to reach the threshold on MyFrequent Rewards.</p>",
    },
    {
      img: "call-center",
      heading: "DAILY SURVEYS",
      description:
        "<p>Once you complete your all profiling survey you start receiving wide range of Surveys daily according to your profiling. After each survey participation and achieving your threshold or more, you will be rewarded with value points and those points will be redeemed to your PayPal account on every month billing Cycle into cash.</p><p>Incase, you are unable to achieve your threshold in current month then all your existing rewards point will be forwarded to your coming month points and it will be continued till the threshold will not be achieved , you will be paid once you achieve your threshold or more.</p>",
    },
    {
      img: "bars",
      heading: "HOW YOU GROW",
      description:
        "<p>The higher your survey participation , climbs you in the survey ranking, and the more attractive it becomes for potential participants - and the more people participate in it.</p><p>The better your survey is ranked in the Survey Ranking, the more points others receive for their participation (You will get Incentivise Points of 1500 every month with your current points if you achieve your threshold or more continuously for 6 months in the Survey Ranking).</p>",
    },
  ];
  return (
    <Grid size={12} className="scroll-target">
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
          fontSize={32}
          fontWeight={600}
          sx={{ color: "white", zIndex: 2 }}
        >
          HOW IT WORKS
        </Typography>
      </Grid>

      <Grid size={12} py={10}>
        <Container maxWidth="lg">
          <Grid size={12} container spacing={3} px={{xs:2,lg:0}}>
            {data.map((item, i) => {
              return (
                <Grid size={12} key={i}>
                  <Box
                    className="icon-box"
                    sx={{
                      display: "inline-block",
                      padding: "20px",
                      borderRadius: "30% 70% 60% 40% / 34% 30% 70% 66%",
                      marginBottom: "25px",
                      bgcolor: "#eee",
                      color: "primary.main",
                    }}
                  >
                    <img
                      src={`/imagesmfr/${item?.img}.png`}
                      alt="icon"
                      width={45}
                      height="auto"
                    />
                  </Box>
                  <Typography fontSize={24} mb={1} fontWeight={500}>
                    {item?.heading}
                  </Typography>
                  <Box
                    sx={{
                      textAlign:"justify",
                      "& p": {
                        fontSize: 16,
                        marginBottom: "12px",
                      },
                    }}
                    dangerouslySetInnerHTML={{ __html: item?.description }}
                  />
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Grid>
    </Grid>
  );
}

export default page;
