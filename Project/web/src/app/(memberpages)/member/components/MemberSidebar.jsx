"use client";

import React from "react";
import {
  Box,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRouter, usePathname } from "next/navigation";

import SurveyPointsSidebar from "./SurveyPointsSidebar";
import CurrentUser from "./CurrentUser";
import { Page } from "@/util";

const sidebarItems = [
  { icon: "icon-drawer", label: "Dashboard", link: "/member/dashboard" },
  { icon: "icon-user", label: "My Account", link: "/member/myaccount" },
  { icon: "icon-people", label: "Profiles", link: "/member/profiles" },
  { icon: "icon-docs", label: "Surveys", link: "/member/surveys" },
  { icon: "icon-wallet", label: "Rewards", link: "/member/rewards" },
  { icon: "icon-share-alt", label: "Referrals", link: "/member/referrals" },
  { icon: "icon-settings", label: "Settings", link: "/member/settings" },
  { icon: "icon-support", label: "Help & Support", link: "/member/support" },
];

export default function MemberSidebar({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const theme = useTheme();
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

  return (
    <Box display="flex">
      {/* Sidebar */ }
      <Box
        sx={ {
          width: { xs: 72, lg: 290 },
          height: {
            xs: "calc(100vh - 122px)",
            sm: "calc(100vh - 104px)",
          },
          mt: "78px",
          bgcolor: "#ffffff",
          borderRight: "1px solid #eef2f7",
          px: { xs: 1, lg: 2 },
          py: 2,
          overflowY: "auto",
          flexShrink: 0,

          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        } }
      >
        {/* Menu */ }
        <Box
          sx={ {
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          } }
        >
          { sidebarItems.map((item, index) => {
            const isActive = pathname === item.link;

            const content = (
              <Box
                key={ index }
                role="button"
                tabIndex={ 0 }
                onClick={ () => {
                  console.log(router);
                  router.replace(item.link)
                } }
                onKeyDown={ (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    
                    router.replace(item.link);
                  }
                } }
                sx={ {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "center", lg: "flex-start" },
                  gap: 2,
                  px: { xs: 0, lg: 2.2 },
                  height: 54,
                  borderRadius: "16px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",

                  bgcolor: isActive ? "primary.main" : "transparent",

                  color: isActive ? "#ffffff" : "#667085",

                  "&:hover": {
                    bgcolor: isActive ? "secondary.main" : "#f5f3ff",
                    color: isActive ? "#ffffff" : "secondary.main",
                  },
                } }
              >
                <i
                  className={ item.icon }
                  style={ {
                    fontSize: "20px",
                  } }
                />

                <Typography
                  sx={ {
                    display: { xs: "none", lg: "block" },
                    fontSize: 15,
                    fontWeight: isActive ? 700 : 600,
                    letterSpacing: "-0.1px",
                  } }
                >
                  { item.label }
                </Typography>
              </Box>
            );

            return isLgUp ? (
              content
            ) : (
              <Tooltip key={ index } title={ item.label } placement="right">
                { content }
              </Tooltip>
            );
          }) }
        </Box>

        {/* Bottom Section */ }
        <Box
          sx={ {
            mt: 3,
            display: { xs: "none", lg: "block" },
          } }
        >
          <Box
            sx={ {
              borderRadius: "24px",
              background: "linear-gradient(180deg, #faf7ff 0%, #f4efff 100%)",
              border: "1px solid #ede9fe",
              p: 2.2,
              overflow: "hidden",
              position: "relative",

              "& .MuiGrid-root": {
                width: "100%",
              },

              "& .MuiBox-root": {
                minWidth: "100% !important",
                background: "transparent !important",
                border: "none !important",
                boxShadow: "none !important",
                backdropFilter: "none !important",
                WebkitBackdropFilter: "none !important",
                padding: "0px !important",
                textAlign: "left !important",
              },

              "& .MuiTypography-root": {
                textAlign: "left !important",
              },
            } }
          >
            <Typography
              sx={ {
                fontSize: 13,
                fontWeight: 700,
                color: "primary.main",
                mb: 1,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
              } }
            >
              Reward Balance
            </Typography>

            <SurveyPointsSidebar onUpdate={ () => { } } />
          </Box>
          <Box
            sx={ {
              borderRadius: "24px",
              background: "linear-gradient(180deg, #faf7ff 0%, #f4efff 100%)",
              border: "1px solid #ede9fe",
              p: 2.2,
              mt: 2,
              overflow: "hidden",
              position: "relative",

              "& .MuiGrid-root": {
                width: "100%",
              },
            } }
          >
            <CurrentUser />
          </Box>
        </Box>
      </Box>

      {/* Main Content */ }
      <Box
        sx={ {
          width: {
            xs: "calc(100vw - 72px)",
            lg: "calc(100vw - 290px)",
          },
          height: {
            xs: "calc(100vh - 122px)",
            sm: "calc(100vh - 104px)",
          },
          mt: "78px",
          overflow: "auto",
          bgcolor: "#f8fafc",
        } }
      >
        { children }
      </Box>
    </Box>
  );
}
