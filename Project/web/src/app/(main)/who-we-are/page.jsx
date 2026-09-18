import React from "react";
import { Grid, Typography, Container, Box } from "@mui/material";
function page() {
  const data = [
    {
      img: "wwr1",
      heading: "100% FREE AND EASY TO JOIN",
      subheading:
        "Free Joining Survey Earning Platform you can use to earn unlimited money for free online at home. ",
      content:
        "MyFrequent Rewards is an interesting survey platform and app that gives quite a lot of survey offers to earn money where ever you are and access the surveys over mobile as well as on Laptop/Desktop & Tablets. You get paid in cash through PayPal UPI or gift cards.",
    },
    {
      img: "wwr2",
      heading: "QUICK THRESHOLD OF $ 15 USD",
      subheading:
        "Very less threshold to be achieve in a minimum time efforts and claim your money rewards ",
      content:
        "Our free platform offers you a great way of earning by participating in daily volume of survey offers to reach your threshold goals of USD 15 and you can claim anytime with your achieved threshold rewards points .We ensure our members maximum opportunities of high earnings. After registering and completing the profile, you will soon start receiving surveys via email & registered Mobile number. Once you complete them ,you will be credited your first dollars points. When you reach the threshold you can receive the money via your PayPal / UPI account or convert them into amazing gift vouchers",
    },
    {
      img: "wwr3",
      heading: "QUICK ACCESS OF SURVEYS WITH ONE ACCOUNT",
      subheading:
        "Being as our community members you would be able to access multiple surveys in a single account.",
      content:
        "Our Platform offers you a single window accounts with a multiple high money value survey access daily to earn more and more money. The more and more surveys you complete, the more your rewards balance will grow. With a single account window you can grab multiple surveys at once.",
    },
    {
      img: "wwr4",
      heading: "WELCOME GLOBAL USERS",
      subheading:
        "Our platform give access to the 95+ Countries users to get registered free !",
      content:
        "We allow global users to be a member of our online research community across the globe among 95+ countries to share their loyal opinion and earn more and more money at a one stop earning solution with Myfrequentrewards. Also , Our survey offers in native language that avoid the issues of Language complexity for users and give them opportunity to share their opinions in their comfortable native language. ",
    },
    {
      img: "wwr5",
      heading: "ALL DEVICE SUPPORT SURVEYS",
      subheading:
        "We supports all major devices to do surveys quite efficiently",
      content:
        "Our survey users have has no device limitations .Our survey offers are compatible with all device format whether its Mobile,Tabs, Desktops or Laptops. You can access the survey on any device anywhere at any point of time. Also, you can install the Myfrequentrewards mobile application which is compatible and available with your android as well IOS support to have quick real time access of available surveys.",
    },
    {
      img: "wwr6",
      heading: "EASY REWARDS THORUGH PAYPAL AND GIFT VOUCHERS",
      subheading:
        "We List 4 trusted Ways to Claim your rewards- Paypal, UPI ,Direct Bank transfer & Gift Vouchers",
      content:
        'Our "Rewards Claim" is simple, easy, and fun. All within the palm of your hands to claim quickly. Once you claim your achieved threshold and more achieved points ,its offer you multiple choice to claim your rewards where you can claim your cash via Paypal,UPI,Direct bank Transfer or in any gift Voucher conversion and we make it process as per your choice of claim preference.',
    },
    {
      img: "wwr7",
      heading: "HUGE RANGE OF SURVEY OFFERS",
      subheading: " You get wide range of Surveys in a week with high pay-outs",
      content:
        "Myfrequentrewards Platform keeps you engage with wide range of surveys daily to have your insightful feedback and to give you maximum high earning opportunities. Your successful survey participation history and activity records allow you to have access on more and more survey on your survey account window.",
    },
    {
      img: "wwr8",
      heading:
        "DIVERSE COMMUNITY WITH 1.85+ MILLION BUSINESS AND 2.20M+ CONSUMER AUDIeNCES",
      subheading:
        "We allow diverse community of audiences on our platform for Consumers & Business profiles",
      content:
        "Our Current community consist of 1.85M= Consumers and 2.20M+ of Business audiences that offers you a multicultural platform to helps you to connect or access the diverse surveys of various brands and these brands can undeniably benefit from reaching diverse audiences like you and more new other multicultural consumers in different racial, ethnic, culture to have right opinion for their business growth",
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
          WHO WE ARE
        </Typography>
      </Grid>

      <Grid size={12} py={10}>
        <Container maxWidth="lg">
          <Grid
            size={12}
            container
            spacing={3}
            sx={{ display: { xs: "flex", md: "none" } }}
          >
            {data.map((item, i) => {
              return (
                <Grid
                  container
                  alignItems="center"
                  size={12}
                  sx={{ bgcolor: "#eee", borderLeft: "5px solid #0c5adb" }}
                  p={4}
                >
                  <Box
                    sx={{
                      width: 200,
                      height: 150,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img src={`/imagesmfr/${item?.img}.png`} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontSize={24} fontWeight={500} mb={1}>
                      {item?.heading}
                    </Typography>
                    <Typography mb={1} fontWeight={500} fontStyle="italic">
                      {item?.subheading}
                    </Typography>
                    <Typography fontSize={16}>{item?.content}</Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
          <Grid
            size={12}
            container
            spacing={3}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {data.map((item, i) => {
              const isEven = i % 2 === 0;
              return isEven ? (
                <Grid
                  container
                  alignItems="center"
                  size={12}
                  sx={{ bgcolor: "#eee", borderLeft: "5px solid #0c5adb" }}
                  p={4}
                >
                  <Box
                    sx={{
                      width: 200,
                      height: 150,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img src={`/imagesmfr/${item?.img}.png`} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography fontSize={21} fontWeight={500} mb={1}>
                      {item?.heading}
                    </Typography>
                    <Typography mb={1} fontWeight={500} fontStyle="italic">
                      {item?.subheading}
                    </Typography>
                    <Typography fontSize={16}>{item?.content}</Typography>
                  </Box>
                </Grid>
              ) : (
                <Grid
                  container
                  alignItems="center"
                  size={12}
                  sx={{ bgcolor: "#eee", borderRight: "5px solid #0c5adb" }}
                  p={4}
                >
                  <Box sx={{ flex: 1, textAlign: "justify" }}>
                    <Typography fontSize={21} fontWeight={500} mb={1}>
                      {item?.heading}
                    </Typography>
                    <Typography mb={1} fontWeight={500} fontStyle="italic">
                      {item?.subheading}
                    </Typography>
                    <Typography fontSize={16}>{item?.content}</Typography>
                  </Box>{" "}
                  <Box
                    sx={{
                      width: 200,
                      height: 150,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img src={`/imagesmfr/${item?.img}.png`} />
                  </Box>
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
