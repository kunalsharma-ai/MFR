import React from "react";
import { Grid, Typography, Container, Box } from "@mui/material";
function page() {
  const data = [
    {
      img: "1",
      heading: "100% Free Membership",
      description:
        "To be of part of MyFrequent rewards  Panel community  you  are not charged a single amount of penny. You can be a member by Just completing the SignUp form and can enjoy free membership for lifetime",
    },
    {
      img: "2",
      heading: "High earning per survey",
      description:
        "We value your feedback and you are compensated for all the hard-work ,efforts and time that you put to share your valuable opinion on each survey with us in the form of high rewards earning and process those rewards into cash money .",
    },
    {
      img: "3",
      heading: "Information are secured and confidential",
      description:
        "Our panel is a community of people who have signed up to join our database. All of the information you share with us will remain confidential and secured and are not share with any third party without your permission. We only use your information for research purpose only.",
    },
    {
      img: "4",
      heading: "Quick modes of money transfer",
      description:
        "We understand your opinion and rewards your opinion by our exclusive gift card and PayPal cash. Once you Complete your paid survey and once you redeem your rewards points we Collect and transfer your earning from paid survey panel's account to your bank account through PayPal , UPI ,Cheque or Net Banking as per your prefererable mode of transfer.",
    },
    {
      img: "5",
      heading: "Share Your Opinion Anytime, Anywhere, Anyplace.",
      description:
        "We have a created a very quick and easy way of survey access to users with the help of that they can choose the surveys anytime and can share their Opinion anywhere at any point of time. They can install the application into their system and also on their mobile phones and can have updates on real time basis on their fingertips wherever they are.",
    },
    {
      img: "6",
      heading: "Profile Updation",
      description:
        "Our platform allows registered users to edit their information as per their need and preferences time to time. You can edit your profile preferences anytime as per your daily life style taste changes and professional  changes that will help you to engage in more and more opportunities to earn and will help to increase your ranking to have bonus points every months.",
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
          WHY CHOOSE US
        </Typography>
      </Grid>

      <Grid size={12} py={10}>
        <Container maxWidth="lg">
          <Grid
            size={12}
            container
            spacing={4}
            sx={{ minHeight: 200 }}
            mb={5}
            px={4}
          >
            {data.map((card, index) => (
              <Grid
                key={index}
                size={{ xs: 12, md: 6 }}
                container
                spacing={0}
                sx={{
                  boxShadow: 3,
                  position: "relative",
                  overflow: "hidden",
                  alignItems: "center",
                  bgcolor: "white",
                  py: 5,
                  px:1,
                  boxShadow: 1,
                  borderRadius: 3,
                  border: "1px solid #eee",
                  color: "black",
                  transition: "color 0.3s ease",

                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                    bgcolor: "primary.main",
                    transform: "scaleY(0)",
                    transformOrigin: "bottom",
                    transition: "transform 0.45s ease",
                    zIndex: 0,
                  },

                  "&:hover::before": {
                    transform: "scaleY(1)",
                  },

                  "& > *": {
                    position: "relative",
                    zIndex: 1,
                  },

                  "&:hover": {
                    "& .card-title, & .card-description": {
                      color: "white",
                    },

                    "& .card-btn": {
                      backgroundColor: "white",
                      color: "primary.main",

                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.15)",
                        color: "white",
                      },
                    },
                  },
                }}
              >
                <Grid
                  size={12}
                  alignItems="center"
                  justifyContent="center"
                  container
                >
                  <Box
                    className="icon-box"
                    sx={{
                      display: "inline-block",
                      padding: "20px",
                      borderRadius: 3,
                      marginBottom: "25px",
                      bgcolor: "#eee",
                      color: "primary.main",
                 
                    }}
                  >
                    <img
                      src={`/imagesmfr/${card?.img}.png`}
                      alt={card.title}
                      style={{
                        width: 45,
                        height: "auto",
                      }}
                    />
                  </Box>
                </Grid>
                <Typography
                  className="card-title"
                  sx={{
                    fontWeight: 500,
                    fontSize: 24,
                    mb: 1,
                    textAlign: "center",
                    width: "100%",
                    textTransform: "uppercase",
                    transition: "all 0.3s ease",
                  }}
                >
                  {card.heading}
                </Typography>
                <Typography
                  className="card-description"
                  sx={{
                    fontSize: 16,
                    mb: 3,
                    px: 2,
                    textAlign: "center",
                    transition: "all 0.3s ease",
                  }}
                >
                  {card.description}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Grid>
    </Grid>
  );
}

export default page;
