"use client";
import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  FormGroup,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Select,
  MenuItem,
  Grid,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  MobileStepper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { parse } from "date-fns";
import { enGB } from "date-fns/locale";
import { useMember, useQuery as useQueryParameters } from "@/Context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, getCurrency, Page } from "@/util";
import { Form } from "@/components";
import LoadingOverlay from "@/componentsMHO/LoadingOverlay";
import Map from "@/components/Map";
import { useToast } from "@/hooks";
import PopUp from "@/componentsMHO/PopUp";

function CustomStepIcon(props) {
  const { active, completed, className } = props;
  const stepNumber = props.icon;

  return (
    <div
      className={ className }
      style={ {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 18,
        height: 18,
        borderRadius: "50%",
        backgroundColor: active
          ? "#063686 "
          : completed
            ? "#0c5adb"
            : "#e0e0e0",
        color: "white",
        fontWeight: active ? "bold" : "normal",
        fontSize: "12px",
      } }
    >
      { completed ? <CheckCircle sx={ { fontSize: 16 } } /> : stepNumber }
    </div>
  );
}

export default function page() {
  const [user, router, query, pathName] = [
    useMember(),
    useRouter(),
    useQueryParameters(),
    usePathname(),
  ];
  const [surveyCompleted, setSurveyCompleted] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [currentGroupIndex, setCurrentGroupIndex] = React.useState(0);
  const [validationError, setValidationError] = React.useState(null);
  const [errorPopup, setErrorPopup] = React.useState({
    title: "Security Check",
    message: null,
    btns: {
      ok: "Try Again",
      cancel: "Go Back",
    },
    onOk: (e) => {
      setErrorPopup({ ...errorPopup, message: null });
    },
    cancel: (e) => {
      router.push("/");
    },
  });
  const form = useForm({
    mode: "onChange",
    defaultValue: {},
  });
  const {
    handleSubmit,
    control,
    trigger,
    formState: { errors },
    watch,
  } = form;
  const {
    data: survey,
    isLoading: surveyLoading,
    isError: surveyError,
  } = useQuery({
    queryKey: ["survey", query?.name],
    queryFn: async ({ queryKey }) => {
      const [_key, slug] = queryKey;
      const resp = await api.put("/api/v1/me/survey", { slug });
      if (resp.status === "error") throw new Error(resp.message);
      return resp.data;
    },
    enabled: Boolean(query?.name && user?.category),
    retry: false,
  });
  const surveyTaken = Boolean(surveyError);
  const {
    data: questionList,
    isLoading: questionsLoading,
  } = useQuery({
    queryKey: ["questions", survey?.pages, currentGroupIndex],
    queryFn: async ({ queryKey }) => {
      const [_key, pages, index] = queryKey;
      const currentPage = (index > 0) ? pages[index - 1] : ["welcome"];
      const resp = await api.post("/api/v1/question", {
        name: { $in: currentPage },
      });
      return resp.data;
    },
    enabled: Boolean(survey?.pages?.length),
  });
  const {
    data: me
  } = useQuery({
    queryKey: ["answers", survey?.pages, currentGroupIndex],
    queryFn: async ({ queryKey }) => {
      console.log("Loading")
      const [_key, pages, index] = queryKey;
      const currentPage = (index > 0) ? pages[index - 1] : ["welcome"];
      const resp = await api.post("/api/v1/me", {
        questions: currentPage,
      });
      Object.fromEntries(
        Object.entries(resp.data)
          .filter(ans => currentPage.includes(ans[0]))
          .map(([key, value]) => {
            form.setValue(key, value)
            if (key === "age") {
              form.setValue(key, "")
            }
            return [key, value]
          })
      )
      return resp.data;
    },
    enabled: Boolean(survey?.pages?.length),
  });

  const isLoading = surveyLoading;
  const { steps, Questions, questionBank } = React.useMemo(() => {
    if (!survey || !questionList) {
      return { steps: [], Questions: [], questionBank: {} };
    }
    const sections = [];
    const pages = survey.pages.reduce((acc, page) => {
      sections.push(page[0]);
      acc.push(page.slice(1));
      return acc;
    }, []);

    const qb = questionList.reduce((a, c) => {
      a[c.name] = {
        label: c.label,
        name: c.name,
        type: c.type,
        options: c.options ?? [],
        parent: c.parent,
        size: c.size,
        required: c.required,
        disabled: c.disabled,
      };
      return a;
    }, {});

    qb.welcome = {
      label: survey.description,
      type: "note",
      name: "welcome",
      size: 12,
    };

    return {
      steps: ["Welcome", ...sections],
      Questions: [["welcome"], ...pages],
      questionBank: qb,
    };
  }, [survey, questionList]);

  const currentGroup =
    Questions.length > 0 ? Questions[currentGroupIndex] : Questions;

  const isLast = currentGroupIndex === Questions.length - 1;
  const saveOrUpdateAnswers = useMutation({
    mutationFn: (data) =>
      api.patch("/api/v1/me/survey", {
        ...data,
        respID: survey.respID,
      }),
    onSuccess: () => {
      setSurveyCompleted(true);
    },
    onError: (err) => {
      useToast(err);
    },
  });
  const onSubmit = (data) => {
    saveOrUpdateAnswers.mutate(data);
    // const resp = await api.patch(`/api/v1/me/survey`, {
    //   ...data,
    //   respID: survey.respID,
    // });
    // if (resp.status === "success") {
    //   setSurveyCompleted(true);
    // } else useToast(resp);
  };
  const onNext = async () => {
    const fieldsToValidate = currentGroup;
    const isValid = await trigger(fieldsToValidate);
    if (!isValid) {
      setValidationError("Please fill all required fields before proceeding.");
      return;
    }
    if (currentGroup.includes("age")) {
      let age = form.watch("age");
      let dob = new Date(user.dob);
      if (new Date().getFullYear() !== dob.getFullYear() + Number(age)) {
        setErrorPopup({
          title: "Security Check",
          btns: {
            ok: "Try Again",
            cancel: "Go Back",
          },
          onOk: (e) => {
            setErrorPopup({ ...errorPopup, message: null });
          },
          cancel: (e) => {
            router.push("/");
          },
          message: (
            <>
              <p>
                For security reasons, the age entered must match your registered
                information.
              </p>
              <p>&nbsp;</p>
              <p>Please check and re-enter the correct age.</p>
            </>
          ),
        });
        return;
      }
    }
    setValidationError(null);
    if (currentGroupIndex < Questions.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      handleSubmit(onSubmit);
    }
  }
  const visibleSteps = steps.filter((step) => step !== "Welcome");
  const visibleStepIndex = visibleSteps.indexOf(steps[currentGroupIndex]);

  return (
    <LocalizationProvider dateAdapter={ AdapterDateFns } adapterLocale={ enGB }>
      <Grid
        size={ 12 }
        container
        sx={ {
          bgcolor: "primary.main",
          backgroundImage: "url(/imagesmfr/facts-bg-last.png)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          minHeight: "100vh",
          minWidth: "100vw",
        } }
        justifyContent="center"
        alignItems="center"
        py={ 2 }
      >
        <Grid
          container
          direction="column"
          alignItems="center"
          spacing={ 0 }
          sx={ {
            width: { xs: "90vw", lg: "80vw", xl: "70vw" },
            minHeight: "90vh",
            overflow: "hidden",
            bgcolor: "white",
            borderRadius: 4,
            boxShadow: 24,
            border: 1.5,
            borderColor: "#33aaca",
            py: 3,
            px: { xs: 1, md: 4 },
            textAlign: "justify",
          } }
        >
          { isLoading && <LoadingOverlay /> }
          <Grid
            container
            size={ 12 }
            alignItems="center"
            justifyContent={ { xs: "center", md: "space-between" } }
            mb={ 2 }
            spacing={ { xs: 1, md: 2 } }
            direction={ { xs: "column", md: "row" } }
            sx={ { borderBottom: "1px solid #f4f4f4" } }
          >
            <Page.Box sx={ { position: "relative" } }>
              <Page.Box
                sx={ {
                  height: { xs: "60px", md: "80px" },
                  width: { xs: "180px", md: "300px" },
                } }
              >
                <img src="/images/logo/mfr-logo.png" alt="logo" width="100%" />
              </Page.Box>{ " " }
              <Page.Box
                component="img"
                src="/imagesmfr/dol-sign.gif"
                alt="logo"
                width={ { xs: 15, md: 20 } }
                sx={ {
                  position: "absolute",
                  right: -4.5,
                  top: { xs: 0, md: 5 },
                } }
              />
            </Page.Box>

            <Page.Text
              sx={ {
                flex: 1,
                textAlign: "center",
                ml: { xs: 0, md: "-320px" },
                fontSize: { xs: "18px", lg: "24px" },
                fontWeight: 600,
                color: "secondary.main",
              } }
            >
              { survey?.name }
            </Page.Text>
          </Grid>
          { !surveyTaken ? (
            !surveyCompleted ? (
              <>
                { steps[currentGroupIndex] !== "Welcome" && (
                  <Grid size={ 12 }>
                    { !isMobile ? (
                      <Stepper
                        activeStep={ visibleStepIndex }
                        alternativeLabel
                        connector={ <StepConnector /> }
                        sx={ {
                          my: 1,
                          width: "100%",
                        } }
                      >
                        { visibleSteps.map((label) => (
                          <Step key={ label }>
                            <StepLabel
                              StepIconComponent={ (props) => (
                                <CustomStepIcon { ...props } />
                              ) }
                              sx={ {
                                "& .MuiStepLabel-label": {
                                  fontSize: "12px",

                                  "& .Mui-active": {
                                    fontWeight: "bold",
                                  },
                                },
                              } }
                            >
                              { label }
                            </StepLabel>
                          </Step>
                        )) }
                      </Stepper>
                    ) : (
                      <Grid size={ 12 } container justifyContent={ "center" }>
                        <MobileStepper
                          variant="dots"
                          steps={ visibleSteps.length }
                          position="static"
                          activeStep={ visibleStepIndex }
                          sx={ { my: 1 } }
                        />
                      </Grid>
                    ) }
                  </Grid>
                ) }
                <Grid
                  component="form"
                  onFocus={ () => {
                    setValidationError(null);
                  } }
                  onSubmit={ handleSubmit(onSubmit) }
                  size={ 12 }
                  container
                  direction="column"
                  justifyContent="space-between"
                  sx={ {
                    minHeight:
                      steps[currentGroupIndex] !== "Welcome"
                        ? "calc(90vh - 230px)"
                        : "calc(90vh - 145px)",
                  } }
                >
                  <Grid
                    size={ 12 }
                    container
                    sx={ {
                      maxHeight: {
                        md:
                          steps[currentGroupIndex] !== "Welcome"
                            ? "calc(90vh - 300px)"
                            : "calc(90vh - 215px)",
                      },
                      maxWidth: "100%",
                      overflowY: "auto",
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.cardbg.main,
                      border: "1px solid #f4f4f4",
                      py: 2,
                      px: { xs: 0, md: 2 },
                      flex: 1,
                      flexDirection: "column",
                      justifyContent: "space-between",
                    } }
                  >
                    <Page.Box>
                      { validationError && (
                        <Page.Box sx={ { px: 1 } }>
                          <Alert
                            severity="error"
                            sx={ {
                              borderRadius: 2,
                              fontWeight: "500",
                              py: 0,
                              display: "flex",
                              alignItems: "center",
                              backgroundColor: "rgba(255, 219, 219, 1)",
                            } }
                          >
                            { validationError }
                          </Alert>
                        </Page.Box>
                      ) }
                      <Page.Box
                        sx={ {
                          display: "flex",
                          width: "100%",
                          flexWrap: "wrap",
                        } }
                      >
                        { currentGroup.map((que) => {
                          const question = questionBank[que] ?? null;
                          if (!question)
                            return (
                              <p key={ que } style={ { width: "50%" } }>
                                Abhi ye question nahi bna hai
                              </p>
                            );
                          return (
                            <Question
                              form={ form }
                              key={ question.name }
                              question={ question }
                              control={ control }
                              errors={ errors }
                              watch={ watch }
                            />
                          );
                        }) }
                      </Page.Box>
                    </Page.Box>
                  </Grid>
                  <Grid
                    container
                    size={ 12 }
                    spacing={ 2 }
                    sx={ {
                      justifyContent: "flex-end",
                      py: 2,
                    } }
                  >
                    { isLast ? <Page.MuiButton
                      variant="contained"
                      color="secondary"
                      sx={ {
                        fontWeight: 600,
                      } }
                      loading={ saveOrUpdateAnswers.isPending }
                      onClick={ handleSubmit(onSubmit) }
                    >
                      Submit
                    </Page.MuiButton> : <Page.MuiButton
                      variant="contained"
                      color="secondary"
                      sx={ {
                        fontWeight: 600,
                      } }
                      onClick={ onNext }
                    >
                      Next
                    </Page.MuiButton> }
                  </Grid>
                </Grid>
              </>
            ) : (
              <Grid
                size={ 12 }
                container
                alignItems="space-between"
                sx={ { minHeight: "calc(90vh - 125px)" } }
              >
                <Page.Box
                  component="div"
                  sx={ {
                    textAlign: "justify",
                    p: 3,
                    width: "100%",
                    minHeight: "calc(90vh - 215px)",
                    bgcolor: "#8cb2f333",
                    border: "1px solid #f4f4f4",
                    textShadow: "1px 1px 1px rgba(0, 0, 0, 0.1)",
                  } }
                  dangerouslySetInnerHTML={ { __html: survey.thankyou } }
                />
                <Grid size={ 12 } container justifyContent="center" mt={ 2 }>
                  <Page.MuiButton
                    variant="contained"
                    color="secondary"
                    sx={ {
                      height: "36px",
                      fontWeight: 600,
                    } }
                    onClick={ () => {
                      router.push("/member/dashboard");
                    } }
                  >
                    Go to Dashboard
                  </Page.MuiButton>
                </Grid>
              </Grid>
            )
          ) : (
            <Grid size={ 12 } container direction="column" spacing={ 3 }>
              <Grid
                size={ 12 }
                container
                spacing={ 2 }
                alignSelf="flex-start"
                alignItems="center"
                direction="column"
                mt={ 6 }
              >
                <ErrorIcon color="secondary" sx={ { fontSize: "80px" } } />
                <Page.Text
                  sx={ { fontSize: "32px", textAlign: "center", my: 2 } }
                >
                  Survey Already Taken
                </Page.Text>
                <Page.Text
                  sx={ {
                    fontSize: "16px",
                    width: { xs: "95%", lg: "75%" },
                    textAlign: "center",
                    py: 7,
                    px: 2,
                    bgcolor: "#8cb2f333",
                    border: `1px solid rgba(51, 169, 202, 0.4)`,
                    borderRadius: 2,
                  } }
                >
                  You have already completed this survey. You can now go to your
                  dashboard to view your rewards and other available surveys.
                </Page.Text>
                <Page.MuiButton
                  variant="contained"
                  color="secondary"
                  sx={ { fontWeight: "bold", mt: 2 } }
                  onClick={ () => {
                    router.push("/member/dashboard");
                  } }
                >
                  Go to Dashboard
                </Page.MuiButton>
              </Grid>
            </Grid>
          ) }
        </Grid>

        <ErrorPopup
          title={ errorPopup.title }
          errorMessage={ errorPopup.message }
          onOk={ errorPopup.onOk }
          onCancel={
            errorPopup.onCancel
          }
          btns={
            errorPopup.btns
          }
        />
      </Grid>
    </LocalizationProvider>
  );
}

