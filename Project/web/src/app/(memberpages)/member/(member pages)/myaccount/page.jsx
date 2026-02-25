"use client";
import React from "react";
import {
  Avatar,
  Box,
  Button,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  Typography,
  InputAdornment,
  Tooltip,
  Tabs,
  Tab,
  Fade,
  Collapse,
  Rating,
  Chip,
} from "@mui/material";
import { useRouter } from "next/navigation";
import {
  Male as MaleIcon,
  Female as FemaleIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
  X as XIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  Star as StarIcon,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";

import { Form } from "@/components";
import PopUp from "@/componentsMHO/PopUp";
import { api, Page } from "@/util";
import DataList from "@/componentsMHO/DataList";
import { useMember } from "@/Context";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import { useToast } from "@/hooks";

import Payment from "./component/Payment";
import Socials from "./component/Socials";
const iconStyle = {
  color: "secondary.main",
  verticalAlign: "middle",
  ml: 1,
  mb: 0.5,
  fontSize: 24,
};

const getGenderIcon = (gender) => {
  switch (gender) {
    case "Male":
      return (
        <Tooltip title="Male" placement="top">
          <MaleIcon sx={ iconStyle } />
        </Tooltip>
      );
    case "Female":
      return (
        <Tooltip title="Female" placement="top">
          <FemaleIcon sx={ iconStyle } />
        </Tooltip>
      );
    case "Other":
      return (
        <Tooltip title="Others" placement="top">
          <PersonIcon sx={ iconStyle } />
        </Tooltip>
      );
    default:
      return null;
  }
};

export default function page() {
  const user = useMember();

  return (
    <Grid container size={ 12 }>
      <Stats user={ user } />
      <Grid
        size={ 12 }
        container
        spacing={ 2 }
        py={ 2 }
        px={ { xs: 2, md: 3 } }
        justifyContent="center"
        alignItems={ "flex-start" }
      >
        <Payment />
        {/* <SocialAccounts user={ user } /> */}
        <Socials/>
      </Grid>
      <Summary />
    </Grid>
  );
}

function Stats({ user }) {
  const [statistics, setStatistics] = React.useState({});
  React.useEffect(() => {
    api
      .get(`/api/v1/me/statistics`)
      .then((resp) => {
        if (!resp.data) return useToast(resp);
        let data = resp.data;
        setStatistics(data);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => { });
  }, []);

  const stats = [
    {
      label: "Current Rewards",
      value: statistics?.totalRewards ?? 0,
      icon: "/images/myaccount/currentreward.png",
    },
    {
      label: "Claimed Rewards",
      value: 0,
      icon: "/images/myaccount/claimedreward.png",
    },
    {
      label: "Total Rewards Earned",
      value: statistics?.totalRewards ?? 0,
      icon: "/images/myaccount/totalreward.png",
    },
    {
      label: "Profile Status",
      value: "42%",
      icon: "/images/myaccount/profilestatus.png",
    },
    {
      label: "Profile Completion",
      value: "8/19",
      icon: "/images/myaccount/totalprofilecompletion.png",
    },
    {
      label: "Total Surveys Taken",
      value: (statistics?.total ?? 0).toLocaleString("en-US"),
      icon: "/images/myaccount/totalsurveytaken.png",
    },
    {
      label: "Completed Suveys",
      value: (statistics?.complete ?? 0).toLocaleString("en-US"),
      icon: "/images/myaccount/completedsurvey.png",
    },
    {
      label: "Disqualified Surveys",
      value: (statistics?.disqualified ?? 0).toLocaleString("en-US"),
      icon: "/images/myaccount/disqualifiedsurvey.png",
    },
    {
      label: "Abandoned Surveys",
      value: (statistics?.abdoned ?? 0).toLocaleString("en-US"),
      icon: "/images/myaccount/abandonedsurvey.png",
    },
  ];

  return (
    <Grid
      size={ 12 }
      container
      spacing={ 3 }
      py={ 3 }
      px={ { xs: 2, md: 3 } }
      sx={ { border: `1px solid #e0e0e0` } }
    >
      <UserInfo user={ user } />
      <Grid size={ { xs: 12, lg: 8 } } container spacing={ 2 }>
        { stats.map((stat, index) => {
          return (
            <Grid
              container
              size={ { xs: 12, md: 6, lg: 4 } }
              key={ index }
              // direction={{ xs: "row", md: "column", lg: "row" }}
              alignItems="center"
              justifyContent="space-between"
              spacing={ 1 }
              sx={ {
                border: (theme) => `1px solid ${theme.palette.primary.main}`,
                bgcolor: (theme) => theme.palette.cardbg.main,
                borderRadius: 4,
                px: { xs: 3, md: 1, xl: 3 },
                py: 3,
                minHeight: "120px",
              } }
            >
              <Grid
                // size={6}
                direction="column"
                alignItems="flex-start"
                justifyContent="center"
              >
                <Typography fontSize={ { xs: 14, md: 13, xl: 14 } }>
                  { stat?.label }
                </Typography>
                <Typography
                  sx={ {
                    fontWeight: "600",
                    fontSize: { xs: "22px", xl: "26px" },
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "normal",
                  } }
                >
                  { stat.value.toLocaleString("en-US") }
                </Typography>
              </Grid>

              <Page.Box
                component="img"
                src={ stat.icon }
                height={ 60 }
                alt="stats logo"
              />
            </Grid>
          );
        }) }
      </Grid>
    </Grid>
  );
}

function UserInfo({ user }) {
  const [openVerificationDialog, setOpenVerificationDialog] =
    React.useState(false);
  const form = useForm();
  React.useEffect(() => {
    if (!user) return;
    form.reset({
      profilePicture: user.profilePicture ?? "/images/logo/user.png",
    });
  }, [user]);
  const userData = [
    {
      label: "Birth Date",
      value: new Date(user?.dob).showDate(),
    },
    {
      label: "Joined on",
      value: new Date(user?.createdAt).showDate(),
    },
    {
      label: "Mobile",
      value: `+${user?.phone}`,
    },
  ];

  return (
    <Grid
      size={ { xs: 12, lg: 4 } }
      container
      px={ { xs: 2, xl: 4 } }
      py={ 2 }
      spacing={ 0 }
      alignItems={ "center" }
      alignSelf={ { md: "flex-start", xl: "stretch" } }
      justifyContent={ "space-between" }
      sx={ {
        border: (theme) => `1px solid ${theme.palette.primary.main}`,
        bgcolor: (theme) => theme.palette.cardbg.main,
        borderRadius: 4,
      } }
    >
      <Grid
        size={ 12 }
        container
        component="form"
        onSubmit={ form.handleSubmit(async (e) => {
          e.preventDefault();
          console.log(e);
        }) }
        justifyContent={ { xs: "center", md: "space-between" } }
        alignItems={ "center" }
        pb={ 2 }
        mb={ 2 }
        borderBottom={ { md: `1px solid #e0e0e0`, xs: "none" } }
        spacing={ 2 }
      >
        <Grid
          size={ { xs: 12, md: 6 } }
          position={ "relative" }
          container
          justifyContent="center"
          alignItems="center"
          p={ 1 }
        >
          <Form.Upload
            form={ form }
            name="profilePicture"
            tooltipTitle={ "Profile Picture" }
            endpoint="/api/v1/upload/image"
            accept={ "image/*" }
            sx={ {
              height: "140px",
              width: "140px",
            } }
            onUpload={ async (e) => {
              const updatedValue = form.watch();
              let temp = await api.put(`/api/v1/me`, updatedValue);
              useToast(temp);
              user.Reload();
            } }
          />
        </Grid>
        <Grid
          size={ { xs: 12, md: 6 } }
          container
          spacing={ 2 }
          justifyContent="flex-start"
          direction={ "column" }
          alignItems={ { xs: "center", md: "flex-end" } }
          borderTop={ { xs: `1px solid #e0e0e0`, md: "none" } }
          borderBottom={ { xs: `1px solid #e0e0e0`, md: "none" } }
          py={ { xs: 1, md: 0 } }
        >
          { userData.map((u, index) => {
            return (
              <Grid
                key={ index }
                size={ 12 }
                container
                textAlign={ { xs: "center", md: "right" } }
                spacing={ 0 }
                direction="column"
              >
                <Typography>{ u.label }</Typography>
                <Typography
                  component="span"
                  fontSize={ { xs: "16px", md: "18px" } }
                  color="secondary"
                  fontWeight={ "500" }
                  pb={ 1 }
                >
                  { u.value }
                </Typography>
                { }
                { u.label === "Mobile" && !!u.value && (
                  <Grid
                    size={ 12 }
                    container
                    justifyContent={ { xs: "center", md: "flex-end" } }
                  >
                    <Chip
                      onClick={
                        user?.isVerified?.phone === "unverified"
                          ? () => setOpenVerificationDialog(true)
                          : undefined
                      }
                      icon={ <WhatsAppIcon /> }
                      label={ user?.isVerified?.phone }
                      color={
                        user?.isVerified?.phone === "unverified"
                          ? "error"
                          : "success"
                      }
                      size="small"
                      sx={ {
                        width: 100,
                        textTransform: "capitalize",
                        cursor:
                          user?.isVerified?.phone === "unverified"
                            ? "pointer"
                            : "default",
                      } }
                    />
                  </Grid>
                ) }
              </Grid>
            );
          }) }
        </Grid>
      </Grid>

      <Grid size={ 12 } container direction="column">
        <Box display={ "flex" } alignItems="center">
          <Typography fontSize={ "16px" } color="secondary" fontWeight={ "600" }>
            { user?.fullName }
          </Typography>
          { getGenderIcon(user?.gender) }
        </Box>

        <Typography fontWeight={ 600 } fontSize={ { xs: 12, md: 14 } }>
          { user?.mail }
        </Typography>

        <Rating
          name="account-rating"
          value={ 4 }
          // precision={0.5}
          readOnly
          size="large"
          emptyIcon={ <StarIcon style={ { opacity: 0.55 } } fontSize="inherit" /> }
          sx={ { py: 1, mt: 3 } }
        />
      </Grid>

      <PopUp
        open={ openVerificationDialog }
        onClose={ () => {
          setOpenVerificationDialog(false);
        } }
        hideTitle={ true }
        maxWidth={ "xs" }
      >
        <Grid size={ 12 } container direction="column" alignItems="center" py={ 1 }>
          <Typography color="secondary" variant="h6" p={ 2 }>
            Verify WhatsApp Number
          </Typography>
          <Typography textAlign="center">
            To verify your phone number, <br />
            Please Message <b>CODE</b> on WhatsApp to <b>987654321</b>
          </Typography>

          <Button
            variant="outlined"
            onClick={ () => {
              setOpenVerificationDialog(false);
            } }
            size="medium"
            sx={ { my: 3, borderWidth: 2, fontWeight: 600 } }
          >
            OK
          </Button>
        </Grid>
      </PopUp>
    </Grid>
  );
}


function SocialAccounts({ user }) {
  const [openContact, setOpenContact] = React.useState(false);

  const [contact, setContact] = React.useState({
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    twitter: "",
  });

  React.useEffect(() => {
    if (!user) return;
    // console.log(user.socials);
    setContact(
      user.socials.reduce((a, c) => {
        a[c.channel] = c.account;
        return a;
      }, {}),
    );
  }, [user]);
  const handleChange = (key) => (e) => {
    setContact((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const contactIcons = {
    WhatsApp: <WhatsAppIcon sx={ { color: "#25D366" } } />,
    Instagram: <InstagramIcon sx={ { color: "#C13584" } } />,
    Facebook: <FacebookIcon sx={ { color: "#3b5998" } } />,
    Linkedin: <LinkedInIcon sx={ { color: "#0e76a8" } } />,
    YouTube: <YouTubeIcon sx={ { color: "#FF0000" } } />,
    Twitter: <XIcon sx={ { color: "black" } } />,
  };

  const socialChannels = [
    {
      name: "WhatsApp",
      key: "whatsapp",
      icon: <WhatsAppIcon sx={ { color: "#25D366" } } />,
    },
    {
      name: "Instagram",
      key: "instagram",
      icon: <InstagramIcon sx={ { color: "#C13584" } } />,
    },
    {
      name: "Facebook",
      key: "facebook",
      icon: <FacebookIcon sx={ { color: "#3b5998" } } />,
    },
    {
      name: "LinkedIn",
      key: "linkedin",
      icon: <LinkedInIcon sx={ { color: "#0e76a8" } } />,
    },
    {
      name: "YouTube",
      key: "youtube",
      icon: <YouTubeIcon sx={ { color: "#FF0000" } } />,
    },
    {
      name: "X (formerly Twitter)",
      key: "twitter",
      icon: <XIcon sx={ { color: "black" } } />,
    },
  ];

  return (
    <Grid
      size={ { xs: 12, lg: 6 } }
      container
      spacing={ 2 }
      justifyContent="center"
    >
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={ 1 }
        pt={ 1 }
        minHeight={ 46 }
      >
        <Typography
          sx={ {
            fontSize: "16px",
            fontWeight: 600,
            borderBottom: (theme) => `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
          } }
        >
          Social Contacts
        </Typography>
        { Object.values(contact).some((value) => value?.trim()) && (
          <IconButton
            onClick={ () => setOpenContact(true) }
            sx={ { color: "secondary.main" } }
          >
            <EditIcon sx={ { fontSize: 22 } } />
          </IconButton>
        ) }
      </Box>

      <Grid
        container
        size={ 12 }
        direction="column"
        spacing={ 0 }
        px={ 2 }
        py={ 2 }
        sx={ {
          border: (theme) => `1px solid ${theme.palette.primary.main}`,
          bgcolor: (theme) => theme.palette.cardbg.main,
          borderRadius: 2,
        } }
      >
        { Object.entries(contact).filter(([_, value]) => value?.trim())
          .length ? (
          Object.entries(contact)
            .filter(([_, value]) => value?.trim())
            .map(([key, value], index, arr) => (
              <Grid
                key={ index }
                container
                size={ 12 }
                alignItems="center"
                borderBottom={
                  index !== arr.length - 1 ? "1px solid #fff" : "none"
                }
                py={ 1 }
                px={ 2 }
              >
                <Grid
                  size={ { xs: 12, lg: 4 } }
                  alignItems="center"
                  container
                  gap={ 1 }
                >
                  { contactIcons[key] }
                  <Typography fontWeight={ 500 }>{ key }</Typography>
                </Grid>

                <Typography color="secondary" fontWeight={ 600 }>
                  { value }
                </Typography>
              </Grid>
            ))
        ) : (
          <Typography>
            No social contact method added.{ " " }
            <Typography
              color="secondary"
              component={ "span" }
              fontWeight={ 600 }
              sx={ { cursor: "pointer" } }
              onClick={ () => setOpenContact(true) }
            >
              Click to add
            </Typography>
          </Typography>
        ) }
      </Grid>

      <PopUp
        maxWidth="md"
        title="Add Contact"
        open={ openContact }
        onClose={ () => setOpenContact(false) }
      >
        <Grid
          size={ 12 }
          container
          alignItems="center"
          justifyContent="center"
          px={ 2 }
          pt={ 2 }
          sx={ { bgcolor: (theme) => theme.palette.cardbg.main } }
        >
          <Grid size={ 12 } container spacing={ 2 } justifyContent="center" p={ 2 }>
            { socialChannels.map(({ name, key, icon }, index) => (
              <Grid key={ index } container size={ 6 } spacing={ 0 }>
                <Typography fontSize={ 16 } fontWeight={ 600 } color="secondary">
                  { name }
                </Typography>
                <Page.Input
                  value={ contact[key] }
                  onChange={ handleChange(key) }
                  InputProps={ {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" disabled>
                          { icon }
                        </IconButton>
                      </InputAdornment>
                    ),
                  } }
                />
              </Grid>
            )) }
          </Grid>

          <Button
            onClick={ async () => {
              const socials = Object.entries(contact).map((c) => ({
                channel: c[0],
                account: c[1],
              }));
              const resp = await api.put(`/api/v1/me`, { socials });
              useToast(resp);
              setOpenContact(false);
              user.Reload();
            } }
            variant="contained"
            color="secondary"
            sx={ {
              my: 3,
              fontWeight: 600,
              color: "white",
              px: 2,
              py: 0.5,
            } }
          >
            Save
          </Button>
        </Grid>
      </PopUp>
    </Grid>
  );
}

function TabPanel({ children, value, index }) {
  return (
    <Fade in={ value === index } timeout={ 1000 } unmountOnExit>
      <Box hidden={ value !== index } sx={ { width: "100%" } }>
        { " " }
        { value === index && children }
      </Box>
    </Fade>
  );
}

function Summary() {
  const router = useRouter();
  const [points, setPoints] = React.useState(0); //todo: set from api call
  const [conversionRate, setConversionRate] = React.useState(1); //todo: set conversion rate from api call
  const [threshold, setThreshold] = React.useState(1500); //todo: set from server config
  React.useEffect(() => {
    api
      .get(`/api/v1/me/points`)
      .then((resp) => {
        if (resp.status === "error") router.replace("/survey?name=welcome");
        // if (!resp.data) return useToast(resp);
        let data = resp.data;
        setPoints(data.totalPoints);
        setThreshold(data.threshold);
        setConversionRate(data.conversionRate);
      })
      .catch((err) => { })
      .finally(() => { });
  }, []);
  const rewardSummary = [
    {
      label: "Current Rewards",
      value: `${points}pts`,
    },
    {
      label: "Conversion",
      value: `$${(Number(points) * Number(conversionRate)).toFixed(2)}`,
    },
    {
      label: "Needed reward points for payout",
      value: `${threshold - points}pts`,
    },
  ];
  const [activeTab, setActiveTab] = React.useState(0);
  const tabs = [
    {
      label: "Rewards Summary",
      render: (
        <Grid size={ 12 }>
          <DataList dataList={ rewardSummary } />
        </Grid>
      ),
    },
    {
      label: "Rewards Processed Summary",
      render: (
        <Grid size={ 12 } container justifyContent="center" py={ 7 }>
          No Reward Processed yet.
        </Grid>
      ),
    },
    {
      label: "Rejected Responses",
      render: (
        <Grid size={ 12 } container justifyContent="center" py={ 7 }>
          No Rejected Responses.
        </Grid>
      ),
    },
  ];

  return (
    <Grid
      size={ 12 }
      container
      px={ { xs: 2, md: 3 } }
      mt={ 2 }
      justifyContent="center"
    >
      <Tabs
        value={ activeTab }
        onChange={ (e, v) => {
          setActiveTab(v);
        } }
        variant="fullWidth"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={ {
          width: "100%",
          borderBottom: "3px solid whitesmoke",
          "& .MuiTabs-indicator": {
            backgroundColor: "secondary.main",
            height: "3px",
          },
          "& .MuiTab-root": {
            color: "gray",
            fontSize: { xs: 14, md: 16 },
            fontWeight: 500,
          },
          "& .Mui-selected": {
            color: "secondary.main !important",

            fontWeight: 600,
          },
        } }
      >
        { tabs.map((tab) => (
          <Tab label={ tab.label } key={ tab.label } />
        )) }
      </Tabs>
      { tabs.map((tab, index) => (
        <TabPanel key={ tab.label } value={ activeTab } index={ index }>
          { tab.render }
        </TabPanel>
      )) }
    </Grid>
  );
}
