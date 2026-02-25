"use client"
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
import PopUp from "@/componentsMHO/PopUp";
import { useMember } from "@/Context";
import { api,Page } from "@/util";
import { useToast } from "@/hooks";


export default function Socials() {
  const user=useMember();
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
    WhatsApp: <WhatsAppIcon sx={{ color: "#25D366" }} />,
    Instagram: <InstagramIcon sx={{ color: "#C13584" }} />,
    Facebook: <FacebookIcon sx={{ color: "#3b5998" }} />,
    Linkedin: <LinkedInIcon sx={{ color: "#0e76a8" }} />,
    YouTube: <YouTubeIcon sx={{ color: "#FF0000" }} />,
    Twitter: <XIcon sx={{ color: "black" }} />,
  };

  const socialChannels = [
    {
      name: "WhatsApp",
      key: "whatsapp",
      icon: <WhatsAppIcon sx={{ color: "#25D366" }} />,
      url: "https://wa.me/",
    },
    {
      name: "Instagram",
      key: "instagram",
      icon: <InstagramIcon sx={{ color: "#C13584" }} />,
      url: "https://instagram.com/",
    },
    {
      name: "Facebook",
      key: "facebook",
      icon: <FacebookIcon sx={{ color: "#3b5998" }} />,
      url: "https://facebook.com/",
    },
    {
      name: "LinkedIn",
      key: "linkedin",
      icon: <LinkedInIcon sx={{ color: "#0e76a8" }} />,
      url: "https://linkedin.com/in/",
    },
    {
      name: "YouTube",
      key: "youtube",
      icon: <YouTubeIcon sx={{ color: "#FF0000" }} />,
      url: "https://youtube.com/",
    },
    {
      name: "X (formerly Twitter)",
      key: "twitter",
      icon: <XIcon sx={{ color: "black" }} />,
      url: "https://x.com/",
    },
  ];

  return (
    <Grid
      size={{ xs: 12, lg: 6 }}
      container
      spacing={2}
      justifyContent="center"
    >
      <Box
        width="100%"
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={1}
        pt={1}
      >
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 600,
            borderBottom: (theme) =>
                `2px solid ${theme.palette.primary.main}`,
            pb: 0.5,
          }}
        >
          Social Contacts
        </Typography>
        <IconButton
          onClick={() => setOpenContact(true)}
          sx={{ color: "secondary.main" }}
        >
          <EditIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </Box>

      <Grid
        container
        size={12}
        direction="column"
        spacing={0}
        px={2}
        py={2}
        sx={{
           border: (theme) => `1px solid ${theme.palette.primary.main}`,
          bgcolor: (theme) => theme.palette.cardbg.main,
          borderRadius: 2,
        }}
      >
        {Object.entries(contact).filter(([_, value]) => value?.trim())
          .length ? (
          Object.entries(contact)
            .filter(([_, value]) => value?.trim())
            .map(([key, value], index, arr) => (
              <Grid
                key={index}
                container
                size={12}
                alignItems="center"
                borderBottom={
                  index !== arr.length - 1 ? "2px solid #fff" : "none"
                }
                py={1}
                px={2}
              >
                <Grid
                  size={{ xs: 12, lg: 4 }}
                  alignItems="center"
                  container
                  gap={1}
                >
                  {contactIcons[key]}
                  <Typography fontWeight={500}>{key}</Typography>
                </Grid>

                <Typography color="secondary" fontWeight={600}>
                  {value}
                </Typography>
              </Grid>
            ))
        ) : (
          <Typography>
            No social contact method added.{" "}
            <Typography
              color="secondary"
              component={"span"}
              fontWeight={600}
              sx={{ cursor: "pointer" }}
              onClick={() => setOpenContact(true)}
            >
              Click to add
            </Typography>
          </Typography>
        )}
      </Grid>

      <PopUp
        maxWidth="md"
        title="Add Contact"
        open={openContact}
        onClose={() => setOpenContact(false)}
      >
        <Grid
          size={12}
          container
          alignItems="center"
          justifyContent="center"
          px={2}
          pt={2}
          sx={{ bgcolor: "#f1f4f9" }}
        >
          <Grid size={12} container spacing={2} justifyContent="center" p={2}>
            {socialChannels.map(({ name, key, icon, url }, index) => (
              <Grid key={index} container size={6} spacing={0}>
                <Typography fontSize={16} fontWeight={600} color="secondary">
                  {name}
                </Typography>
                <Page.Input
                  value={contact[key]}
                  onChange={handleChange(key)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton edge="end" disabled>
                          {icon}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            ))}
          </Grid>

          <Button
            onClick={async () => {
              const socials = Object.entries(contact).map((c) => ({
                channel: c[0],
                account: c[1],
              }));
              const resp = await api.put(`/api/v1/me`, { socials });
              useToast(resp);
              setOpenContact(false);
              user.Reload();
            }}
            variant="contained"
            color="secondary"
            sx={{
              my: 3,
              fontWeight: 600,
              color: "white",
              px: 2,
              py: 0.5,
            }}
          >
            Save
          </Button>
        </Grid>
      </PopUp>
    </Grid>
  );
}
