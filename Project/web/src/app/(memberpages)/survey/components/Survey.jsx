"use client";
import React from "react";
import {
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  MobileStepper,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import CustomStepIcon from "./CustomStepIcon";
import { Page, api } from "@/util";
import Question from "./Question";
import { useToast } from "@/hooks";

export default function Survey({
  survey,
  user,
  onError,
  onComplete,
  start = null,
  hideSteps = false,
  editMode = true,
  setEditMode,
  endpage = "/api/v1/me/survey",
  isProfile = false,
}) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = React.useState(start);
  const [validationError, setValidationError] = React.useState(null);

  const pages = survey.pages;
  const form = useForm({
    mode: "onChange",
    // defaultValues: {...user,age:""}
  });
  let questions = pages[currentPage];
  if (questions?.includes("phone")) questions.push("phone-whatsapp");
  if (questions?.includes("alternate-phone"))
    questions.push("alternate-phone-whatsapp");
  questions = questions?.unique();
  const { data: me } = useQuery({
    queryKey: ["answers", pages?.[currentPage]?.[0], currentPage],
    queryFn: async ({ queryKey }) => {
      const resp = await api.post("/api/v1/me", {
        questions,
      });
      Object.fromEntries(
        Object.entries(resp.data)
          .filter((ans) => questions.includes(ans[0]))
          .map(([key, value]) => {
            form.setValue(key, value);
            if (key === "age") {
              form.setValue(key, "");
            }
            return [key, value];
          }),
      );
      return resp.data;
    },
    enabled:
      ![null, undefined].includes(currentPage) &&
      Boolean(pages?.[currentPage]?.length),
  });
  const saveOrUpdateAnswers = useMutation({
    mutationFn: (data) =>
      api.patch(endpage, {
        ...data,
        respID: survey.respID,
      }),
    onSuccess: () => {
      onComplete(true);
    },
    onError: (err) => {
      console.log(err);
      useToast(err);
    },
  });
  const onSubmit = (data) => {
    saveOrUpdateAnswers.mutate(data);
  };
  async function onNext() {
    let { link } = survey;
    if (link && link != "") {
      link = link.replace(/\$uid/g, survey.respID);
      return redirect(link);
    }
    if ([null, undefined].includes(currentPage)) return setCurrentPage(0);
    const isValid = await form.trigger(pages[currentPage]);
    if (!isValid)
      return setValidationError(
        "Please fill all required fields before proceeding.",
      );
    if (pages[currentPage].includes("age")) {
      let age = form.watch("age");
      let dob = new Date(user.dob);
      if (new Date().getFullYear() - dob.getFullYear() !== Number(age)) {
        onError({
          title: "Invalid Age",
          btns: {
            ok: "Try Again",
            cancel: "Go Back",
          },
          onOk: (e) => {
            onError({ message: null });
          },
          onCancel: (e) => {
            router.push("/");
          },
          message: (
            <>
              <p>
                The age you entered doesn't match the information on your
                profile. Please check and correct your age and try again.
              </p>
            </>
          ),
        });
        return;
      }
    }
    // console.log("sab theek hai, Next page load kar lete hain");
    setCurrentPage(currentPage + 1);
  }

  return (
    <>
      {hideSteps || [undefined, null].includes(currentPage) ? (
        <></>
      ) : (
        <SurveySteps currentPage={currentPage} steps={pages.map((p) => p[0])} />
      )}
      <Grid
        component="form"
        onFocus={() => {
          setValidationError(null);
        }}
        onSubmit={form.handleSubmit(onSubmit)}
        size={12}
        container
        direction="column"
        justifyContent="space-between"
        sx={{
          minHeight: [undefined, null].includes(currentPage)
            ? "calc(90vh - 170px)"
            : "calc(90vh - 214px)",
          // steps[currentGroupIndex] !== "Welcome"
          //   ? "calc(90vh - 230px)"
        }}
      >
        <Grid
          size={12}
          container
          sx={{
            maxHeight: {
              md: editMode ? "calc(90vh - 240px)" : "calc(90vh - 185px)",
              // steps[currentGroupIndex] !== "Welcome"
              //   ? "calc(90vh - 300px)"
              //   : "calc(90vh - 215px)",
            },
            maxWidth: "100%",
            overflowY: "auto",
            borderRadius: 2,
            borderTopLeftRadius: isProfile ? 0 : "16px",
            borderTopRightRadius: isProfile ? 0 : "16px",

            scrollbarWidth: "thin",
            scrollbarColor: (theme) =>
              `${theme.palette.primary.main} ${theme.palette.page.main}`,

            "&::-webkit-scrollbar": {
              width: "8px",
            },

            "&::-webkit-scrollbar-track": {
              backgroundColor: (theme) => theme.palette.page.main,
              borderRadius: "10px",
            },

            "&::-webkit-scrollbar-thumb": {
              backgroundColor: (theme) => theme.palette.primary.main,
              borderRadius: "10px",
              border: "2px solid",
              borderColor: (theme) => theme.palette.page.main,
            },

            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: (theme) => theme.palette.secondary.main,
            },
            bgcolor: (theme) => theme.palette.secondary.main,
            border: (theme) => `1px solid ${theme.palette.divider}`,
            py: 2,
            px: { xs: 0, md: 2 },
            flex: 1,
            // flexDirection: "column",
            justifyContent: "space-between",
            alignContent: "flex-start",
          }}
        >
          {[null, undefined].includes(currentPage) ? (
            <SurveyDescription survey={survey} />
          ) : (
            pages[currentPage]
              ?.slice(1)
              ?.map((que, index) => (
                <Question
                  key={`${que}-${index}`}
                  que={que}
                  user={user}
                  form={form}
                  disabled={!editMode}
                />
              ))
          )}
        </Grid>
        {editMode && (
          <Grid
            container
            size={12}
            spacing={2}
            sx={{
              justifyContent: "flex-end",
              py: 2,
              px: isProfile ? 2 : 0,
            }}
          >
            {isProfile && (
              <Page.MuiButton
                onClick={() => {
                  setEditMode(false);
                }}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              >
                Cancel
              </Page.MuiButton>
            )}
            {currentPage + 1 === pages.length ? (
              <Page.MuiButton
                variant="contained"
                color="primary"
                sx={{
                  fontWeight: 600,
                }}
                loading={saveOrUpdateAnswers?.isPending}
                onClick={form.handleSubmit(onSubmit)}
              >
                Submit
              </Page.MuiButton>
            ) : (
              <Page.MuiButton
                variant="contained"
                color="primary"
                sx={{
                  fontWeight: 600,
                }}
                onClick={onNext}
              >
                {[null, undefined].includes(currentPage) ? "Start" : "Next "}
              </Page.MuiButton>
            )}
          </Grid>
        )}
      </Grid>
    </>
  );
}

function SurveySteps({ currentPage, steps }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Grid size={12}>
      <Tabs
        value={currentPage}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            textTransform: "none",
            minHeight: 48,
            fontSize: 13,
            fontWeight: 500,
          },
          "& .Mui-selected": {
            fontWeight: 700,
          },
        }}
      >
        {steps.map((label, index) => (
          <Tab
            key={label}
            value={index}
            label={index < currentPage ? `✓ ${label}` : label}
            disabled
          />
        ))}
      </Tabs>
    </Grid>
  );
}

function SurveyDescription({ survey }) {
  return (
    <Page.Box
      component="div"
      sx={{
        textAlign: "justify",
        p: 3,
        textShadow: "1px 1px 1px rgba(0, 0, 0, 0.1)",
      }}
      dangerouslySetInnerHTML={{ __html: survey.description }}
    />
  );
}
