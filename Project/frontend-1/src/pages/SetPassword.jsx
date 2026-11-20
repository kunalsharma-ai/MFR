import { Autocomplete, TextField } from "@mui/material";
import InputAdornment from "@mui/material/InputAdornment";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import Field from "../components/SxField.jsx";
import SxRail, { railPct } from "../components/SxRail.jsx";
import { PageSeo } from "../components/PageHero.jsx";
import { PAGES } from "../data/pages.js";
import { CONSUMER_INTERESTS } from "../data/profiles.js";
import { OTHER, industryQuestion } from "../data/employmentProfile.js";
import {
  WORLD_FIELDS,
  clearBelow,
  loadWorldOptions,
  worldModel,
} from "../utils/worldForm.js";
import { STEPS } from "../data/signupSteps.js";
import { MEMBER_CATEGORIES, USER_API } from "../data/site.js";
import {
  STEP_FIELDS,
  passwordChecks,
  passwordScore,
  validateNewPassword,
  validateProfile,
} from "../utils/validate.js";
import { patchJSON, postJSON } from "../utils/api.js";
import { buildProfileAnswers } from "../utils/profileAnswers.js";
import { recallSignup, savePendingProfile } from "../utils/signupMemo.js";
import { recallNotify, forgetNotify } from "../utils/notifyMemo.js";

const page = PAGES.setPassword;
const WORLD_ICON = {
  empstat: "briefcase",
  freelancer: "briefcase",
  jobseeker: "question",
  industry: "layers",
  sector: "badge",
  department: "clipboard",
  jobrole: "user",
};
const WORLD_HINT = {
  empstat: "",
  freelancer: "Choose your employment status first.",
  jobseeker: "Choose your employment status first.",
  industry: "Choose your employment status first.",
  sector: "Choose your industry first.",
  department: "Choose your specialization first.",
  jobrole: "Choose your department first.",
};
const STRENGTH = ["Too weak", "Weak", "Fair", "Strong", "Excellent"];
const FIRST_STEP = 3; // steps 1–2 were done on /sign-up
const LAST_STEP = 4;

// Opened from the link in the verification / forgot-password email:
//   /auth/password?user=<id>&code=<otp>
// It continues the sign-up wizard where /sign-up stopped:
//   check the link → step 3 "Your world" → step 4 "Secure it" (choose a password) → save.
export default function SetPassword() {
  const [params] = useSearchParams();
  const userId = params.get("user") || "";
  const code = params.get("code") || "";

  // checking → steps ⇄ saving → done, or invalid when the link is missing, expired or already used.
  const [phase, setPhase] = useState("checking");
  const [reason, setReason] = useState("");
  const [step, setStep] = useState(FIRST_STEP);
  const [dir, setDir] = useState(1);
  const [memberType, setMemberType] = useState("consumer");
  const [firstName, setFirstName] = useState("");
  const [channels, setChannels] = useState([]);
  const [v, setV] = useState({
    empstat: "",
    hw: [],
    freelancer: "",
    jobseeker: "",
    industry: "",
    sector: "",
    department: "",
    jobrole: "",
    jobTitleOther: "",
    companyEmail: "",
    interests: [],
    password: "",
    confirm: "",
  });
  const [touched, setTouched] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  const cardRef = useRef(null);
  // Professional "Your world" choices come from the backend; 'loading' → 'api' (or 'static' if they cannot be loaded).
  const [worldMode, setWorldMode] = useState("loading");
  const [worldOpts, setWorldOpts] = useState({});
  const world = useMemo(
    () => worldModel(worldMode, worldOpts, v),
    [worldMode, worldOpts, v],
  );
  const errors = useMemo(
    () => ({
      ...validateProfile({ ...v, memberType, skip: world.na }),
      ...validateNewPassword(v),
    }),
    [v, memberType, world.na],
  );

  useEffect(() => {
    if (!userId || !code) {
      setReason(
        "This link is incomplete. Please open the link from your email again.",
      );
      setPhase("invalid");
      return undefined;
    }
    let live = true;
    setPhase("checking");
    (async () => {
      let verified = {};
      try {
        const res = await postJSON(
          `${USER_API}/${encodeURIComponent(userId)}`,
          { code },
        );
        verified = res.data || {};
      } catch (ex) {
        if (live) {
          setReason(ex.message || "This link is no longer valid.");
          setPhase("invalid");
        }
        return;
      }
      const saved = recallSignup(userId);

      const fromServer = Array.isArray(verified.notification)
        ? verified.notification.map((n) => n && n.channel).filter(Boolean)
        : [];
      if (live)
        setChannels(fromServer.length ? fromServer : recallNotify(userId));
      const type = verified.category
        ? verified.category === MEMBER_CATEGORIES.professional
          ? "professional"
          : "consumer"
        : saved?.memberType;
      if (live && type) setMemberType(type);
      const first = verified.name?.first || saved?.firstName;
      if (live && first) setFirstName(first);
      if (live) setPhase("steps");
    })();
    return () => {
      live = false;
    };
  }, [userId, code]);

  const set = (k, val) => setV((s) => ({ ...s, [k]: val }));
  const worldLabel = (f) =>
    ({
      empstat: "What is your current employment status?",
      hw: "Which role you play in your homemaking?",
      freelancer: "If you are a Freelancer, please specify your job profile?",
      jobseeker: "Are you seeking a job?",
      industry: v.empstat
        ? industryQuestion(v.empstat)
        : "Which industry do you work in?",
      sector: "What is your specialization?",
      department: "Which department do you work in?",
      jobrole: "What is your job title?",
    })[f];
  const pickWorld = (field, val) =>
    setV((s) => ({ ...clearBelow(s, field), [field]: val }));

  const worldHint = (f) => {
    if (f === "freelancer" || f === "jobseeker" || f === "industry") {
      return v.empstat ? "" : WORLD_HINT[f];
    }

    if (f === "sector") {
      return v.industry ? "" : WORLD_HINT[f];
    }

    if (f === "department") {
      return v.sector ? "" : WORLD_HINT[f];
    }

    if (f === "jobrole") {
      return v.department ? "" : WORLD_HINT[f];
    }

    return WORLD_HINT[f] || "";
  };

  useEffect(() => {
    if (
      phase !== "steps" ||
      memberType !== "professional" ||
      worldMode !== "loading"
    )
      return undefined;
    let live = true;
    loadWorldOptions([
      "empstat",
      "hw",
      "freelancer",
      "jobseeker",
      "industry",
      "sector",
      "department",
    ]).then((o) => {
      if (!live) return;
      setWorldOpts(o);
      setWorldMode(o.empstat.length ? "api" : "static");
    });
    return () => {
      live = false;
    };
  }, [phase, memberType, worldMode]);

  // The job-title list is large, so it is only fetched once the member gets to that question.
  useEffect(() => {
    if (worldMode !== "api" || !world.ready.jobrole || worldOpts.jobrole)
      return undefined;
    let live = true;
    loadWorldOptions(["jobrole"]).then((o) => {
      if (live) setWorldOpts((s) => ({ ...s, ...o }));
    });
    return () => {
      live = false;
    };
  }, [worldMode, world.ready.jobrole, worldOpts.jobrole]);
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k) => (touched[k] ? errors[k] : undefined);
  const ok = (k) => touched[k] && !errors[k];
  const aria = (k) => ({
    "aria-invalid": Boolean(err(k)),
    "aria-describedby": err(k) ? `${k}-err` : undefined,
    onBlur: () => touch(k),
  });

  const stepErrors = (n) => STEP_FIELDS[n].filter((k) => errors[k]);
  const pct = railPct(
    step,
    STEPS.length,
    STEP_FIELDS[step].length,
    stepErrors(step).length,
  );

  function go(n) {
    setDir(n > step ? 1 : -1);
    setStep(n);
    if (cardRef.current)
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // true when the current step is clean; otherwise marks its fields and focuses the first bad one
  function stepIsValid() {
    if (!stepErrors(step).length) return true;
    setTouched((t) => ({
      ...t,
      ...Object.fromEntries(STEP_FIELDS[step].map((k) => [k, true])),
    }));
    setTimeout(
      () => cardRef.current?.querySelector('[aria-invalid="true"]')?.focus(),
      30,
    );
    return false;
  }

  async function submit(e) {
    e.preventDefault();
    if (phase !== "steps") return;
    if (!stepIsValid()) return;
    if (step < LAST_STEP) {
      go(step + 1);
      return;
    }
    setPhase("saving");
    setServerMsg("");
    try {
      await patchJSON(USER_API, {
        userID: userId,
        emailOTP: code,
        password: v.password,
        confirmPassword: v.confirm,
      });
      savePendingProfile(
        userId,
        buildProfileAnswers(
          memberType,
          {
            ...v,
            jobrole: v.jobrole === OTHER ? v.jobTitleOther.trim() : v.jobrole,
          },
          channels,
        ),
      );
      forgetNotify(userId);
      setPhase("done");
    } catch (ex) {
      if (/expired|invalid/i.test(ex.message)) {
        setReason(ex.message);
        setPhase("invalid");
      } else {
        setServerMsg(
          ex.message || "We couldn’t save your password. Please try again.",
        );
        setPhase("steps");
      }
    }
  }

  const checks = passwordChecks(v.password);
  const score = passwordScore(v.password);
  const ringPct = (score / 4) * 100;
  const inWizard = phase === "steps" || phase === "saving";

  return (
    <>
      <PageSeo page={page} />
      <section className="sx">
        <div className="sx-bg" aria-hidden="true">
          <span className="sx-orb o1" />
          <span className="sx-orb o2" />
          <span className="sx-orb o3" />
          {Array.from({ length: 14 }).map((_, i) => (
            <i key={i} className="sx-coin" style={{ "--i": i }} />
          ))}
        </div>
        <div className="container sx-row">
          <aside className="sx-aside">
            <p className="eyebrow eyebrow-light">
              Email confirmed · almost done
            </p>
            <h1>{page.h1}</h1>
            <p className="muted-light">
              Two quick steps left. Choose a password, then tell us what you
              like. Your account is ready right after.
            </p>
            <div className="sx-stage" aria-hidden="true">
              <div className={`sx-badge s${inWizard ? step : 4}`}>
                <Icon
                  name={inWizard ? STEPS[step - 1].icon : "lock"}
                  size={44}
                  stroke={1.4}
                />
              </div>
              <p className="sx-stage-t">
                {inWizard ? STEPS[step - 1].art : "Lock in your account"}
              </p>
            </div>
            <ul className="sx-perks">
              <li>
                <Icon name="heart" size={18} /> 100% free membership
              </li>
              <li>
                <Icon name="wallet" size={18} /> PayPal · UPI · Bank · Gift
                cards
              </li>
              <li>
                <Icon name="lock" size={18} /> Your details are never sold or
                shared
              </li>
            </ul>
          </aside>

          <div className="sx-card" ref={cardRef}>
            {phase === "checking" ? (
              <div className="sx-done" role="status" aria-busy="true">
                <h2>Checking your link…</h2>
                <p>One moment while we confirm your email.</p>
              </div>
            ) : null}

            {phase === "invalid" ? (
              <div className="sx-done" role="alert">
                <div className="done-check">
                  <Icon name="close" size={40} stroke={2.6} />
                </div>
                <h2>This link can’t be used</h2>
                <p>{reason}</p>
                <p className="tiny muted">
                  Links stay valid for 24 hours and work once. If you already
                  created your password, just log in.
                </p>
                <div className="done-actions">
                  <Link to="/login" className="btn btn-dark">
                    Log in
                  </Link>
                  <Link to="/sign-up" className="btn btn-ghost-dark">
                    Back to sign up
                  </Link>
                </div>
                <p className="tiny muted">
                  Need help? <Link to="/contact-us">Contact us</Link>.
                </p>
              </div>
            ) : null}

            {inWizard ? (
              <form onSubmit={submit} noValidate>
                <SxRail
                  steps={STEPS}
                  step={step}
                  pct={pct}
                  onGo={go}
                  minGo={FIRST_STEP}
                />

                <div className={`sx-pane d${dir}`} key={step}>
                  {step === 4 ? (
                    <>
                      {memberType === "professional" ? (
                        <>
                          <h2 className="sx-h">Tell us about your work</h2>
                          <p className="sx-sub">
                            Verified professional details unlock higher-value
                            B2B studies. They are never shared with research
                            clients.
                          </p>

                          <div className="sx-grid">
                            {WORLD_FIELDS.filter(
                              (f) =>
                                !world.na.includes(f) &&
                                (f === "empstat" || Boolean(v.empstat)),
                            ).map((f) =>
                              f === "hw" ? (
                                <div
                                  key={f}
                                  className={`sx-field ${err(f) ? "bad" : ""}`}
                                  style={{ gridColumn: "1 / -1" }}
                                >
                                  <p
                                    id={`${f}-label`}
                                    className="sx-sub"
                                    style={{ margin: "0 0 6px" }}
                                  >
                                    {worldLabel(f)}
                                  </p>

                                  <div
                                    className="sx-interests"
                                    role="group"
                                    aria-labelledby={`${f}-label`}
                                  >
                                    {world.lists.hw.map((o) => {
                                      const on = v.hw.includes(o.value);

                                      return (
                                        <button
                                          type="button"
                                          key={o.value}
                                          aria-pressed={on}
                                          className={on ? "on" : ""}
                                          onClick={() => {
                                            pickWorld(
                                              "hw",
                                              on
                                                ? v.hw.filter(
                                                    (x) => x !== o.value,
                                                  )
                                                : [...v.hw, o.value],
                                            );
                                            touch("hw");
                                          }}
                                        >
                                          <Icon
                                            name={on ? "check" : "heart"}
                                            size={16}
                                            stroke={on ? 2.6 : 1.8}
                                          />{" "}
                                          {o.label}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {err(f) ? (
                                    <p
                                      className="f-err"
                                      id={`${f}-err`}
                                      role="alert"
                                    >
                                      {err(f)}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <div
                                  key={f}
                                  style={{ minWidth: 0, width: "100%" }}
                                >
                                  <Autocomplete
                                    id={f}
                                    fullWidth
                                    disabled={!world.ready[f]}
                                    options={world.lists[f]}
                                    value={
                                      world.lists[f].find(
                                        (o) => o.value === v[f],
                                      ) || null
                                    }
                                    getOptionLabel={(option) =>
                                      option.label || ""
                                    }
                                    isOptionEqualToValue={(option, value) =>
                                      option.value === value.value
                                    }
                                    groupBy={
                                      world.lists[f].some((o) => o.group)
                                        ? (option) => option.group || "Other"
                                        : undefined
                                    }
                                    onChange={(_, option) => {
                                      pickWorld(f, option?.value || "");
                                      touch(f);
                                    }}
                                    onBlur={() => touch(f)}
                                    slotProps={{
                                      listbox: {
                                        sx: {
                                          maxHeight: 200,
                                          overflowY: "auto",
                                        },
                                      },

                                      popper: {
                                        sx: { zIndex: 15000 },
                                      }
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        label={worldLabel(f)}
                                        variant="outlined"
                                        error={Boolean(err(f))}
                                        helperText={
                                          err(f) || worldHint(f) || " "
                                        }
                                        // MUI 7: Autocomplete still hands over legacy InputProps / inputProps; the ref to the
                                        // <input> lives in params.inputProps, so it must be carried into htmlInput or the
                                        // list never opens ("Unable to find the input element").
                                        slotProps={{
                                          ...params.slotProps,
                                          inputLabel: params.InputLabelProps,
                                          input: {
                                            ...params.InputProps,
                                            ...params.slotProps?.input,
                                            startAdornment: (
                                              <>
                                                <InputAdornment position="start">
                                                  <Icon
                                                    name={WORLD_ICON[f]}
                                                    size={18}
                                                  />
                                                </InputAdornment>
                                                {params.slotProps?.input
                                                  ?.startAdornment ??
                                                  params.InputProps
                                                    ?.startAdornment ??
                                                  null}
                                              </>
                                            ),
                                          },
                                          htmlInput: {
                                            ...params.inputProps,
                                            ...params.slotProps?.htmlInput,
                                            "aria-invalid": Boolean(err(f)),
                                            "aria-describedby": err(f)
                                              ? `${f}-err`
                                              : undefined,
                                          },
                                          formHelperText: {
                                            sx: { mx: 0, minHeight: "1.25em" },
                                          },
                                        }}
                                      />
                                    )}
                                    sx={{
                                      width: "100%",
                                      "& .MuiOutlinedInput-root": {
                                        borderRadius: "12px",
                                        backgroundColor: "background.paper",
                                      },
                                    }}
                                  />
                                </div>
                              ),
                            )}

                            {v.jobrole === OTHER ? (
                              <Field
                                id="jobTitleOther"
                                label="Type your job title"
                                error={err("jobTitleOther")}
                                ok={ok("jobTitleOther")}
                                icon="pen"
                              >
                                <input
                                  id="jobTitleOther"
                                  placeholder=" "
                                  autoComplete="organization-title"
                                  maxLength={80}
                                  value={v.jobTitleOther}
                                  onChange={(e) =>
                                    set("jobTitleOther", e.target.value)
                                  }
                                  {...aria("jobTitleOther")}
                                />
                              </Field>
                            ) : null}

                            <div style={{ minWidth: 0, width: "100%" }}>
                              <TextField
                                id="companyEmail"
                                name="companyEmail"
                                label="Company email (optional — speeds up verification)"
                                type="email"
                                variant="outlined"
                                fullWidth
                                value={v.companyEmail}
                                onChange={(e) =>
                                  set("companyEmail", e.target.value)
                                }
                                onBlur={() => touch("companyEmail")}
                                autoComplete="work email"
                                error={Boolean(err("companyEmail"))}
                                helperText={err("companyEmail") || " "}
                                slotProps={{
                                  htmlInput: {
                                    maxLength: 120,
                                    ...aria("companyEmail"),
                                  },
                                  input: {
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Icon name="mail" size={18} />
                                      </InputAdornment>
                                    ),
                                  },
                                  formHelperText: {
                                    sx: { mx: 0, minHeight: "1.25em" },
                                  },
                                }}
                                sx={{
                                  width: "100%",
                                  "& .MuiOutlinedInput-root": {
                                    borderRadius: "12px",
                                    backgroundColor: "background.paper",
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <h2 className="sx-h">
                            What are you into? <small>(optional)</small>
                          </h2>
                          <p className="sx-sub">
                            Pick a few interests so your first invitations feel
                            relevant. You can refine them later in profile
                            surveys.
                          </p>

                          <div className="sx-interests">
                            {CONSUMER_INTERESTS.map((c) => {
                              const on = v.interests.includes(c.id);

                              return (
                                <button
                                  type="button"
                                  key={c.id}
                                  aria-pressed={on}
                                  className={on ? "on" : ""}
                                  onClick={() =>
                                    set(
                                      "interests",
                                      on
                                        ? v.interests.filter((x) => x !== c.id)
                                        : [...v.interests, c.id],
                                    )
                                  }
                                >
                                  <Icon
                                    name={on ? "check" : c.icon}
                                    size={18}
                                    stroke={on ? 2.6 : 1.8}
                                  />{" "}
                                  {c.label}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </>
                  ) : null}

                  {step === 3 ? (
                    <>
                      <p className="sx-verified">
                        <Icon name="check" size={16} stroke={3} /> Email
                        confirmed{firstName ? ` — thanks, ${firstName}!` : "!"}
                      </p>
                      <h2 className="sx-h">Secure your account</h2>
                      <div className="sx-grid">
                        <Field
                          id="password"
                          label="Create password"
                          error={err("password")}
                          ok={ok("password")}
                          half
                          icon="lock"
                        >
                          <input
                            id="password"
                            type={showPw ? "text" : "password"}
                            placeholder=" "
                            autoComplete="new-password"
                            maxLength={128}
                            value={v.password}
                            onChange={(e) => set("password", e.target.value)}
                            {...aria("password")}
                          />
                          <button
                            type="button"
                            className="pw-eye"
                            onClick={() => setShowPw((s) => !s)}
                            aria-label={
                              showPw ? "Hide password" : "Show password"
                            }
                          >
                            <Icon name="eye" size={18} />
                          </button>
                        </Field>
                        <Field
                          id="confirm"
                          label="Confirm password"
                          error={err("confirm")}
                          ok={ok("confirm")}
                          half
                          icon="lock"
                        >
                          <input
                            id="confirm"
                            type={showPw ? "text" : "password"}
                            placeholder=" "
                            autoComplete="new-password"
                            maxLength={128}
                            value={v.confirm}
                            onChange={(e) => set("confirm", e.target.value)}
                            {...aria("confirm")}
                          />
                        </Field>
                      </div>
                      <div className="sx-pw">
                        <svg
                          viewBox="0 0 36 36"
                          className={`sx-ring s${score}`}
                          aria-hidden="true"
                        >
                          <circle cx="18" cy="18" r="15.5" className="bg" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            className="fg"
                            style={{ strokeDasharray: `${ringPct} 100` }}
                            pathLength="100"
                          />
                        </svg>
                        <div>
                          <strong aria-live="polite">
                            {v.password ? STRENGTH[score] : "Password strength"}
                          </strong>
                          <ul>
                            {checks.map((c) => (
                              <li key={c.k} className={c.ok ? "ok" : ""}>
                                <Icon
                                  name={c.ok ? "check" : "close"}
                                  size={12}
                                  stroke={3}
                                />{" "}
                                {c.label}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {serverMsg ? (
                        <p className="form-error" role="alert">
                          {serverMsg}
                        </p>
                      ) : null}
                    </>
                  ) : null}
                </div>

                <div className="sx-nav">
                  {step > FIRST_STEP ? (
                    <button
                      type="button"
                      className="btn btn-ghost-dark"
                      onClick={() => go(step - 1)}
                    >
                      <Icon name="arrow" size={16} className="flip" /> Back
                    </button>
                  ) : (
                    <span />
                  )}
                  {step < LAST_STEP ? (
                    <button
                      key="next"
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={() => stepIsValid() && go(step + 1)}
                    >
                      Continue <Icon name="arrow" size={18} />
                    </button>
                  ) : (
                    <button
                      key="submit"
                      type="submit"
                      className="btn btn-primary btn-lg btn-shine"
                      disabled={phase === "saving"}
                    >
                      {phase === "saving" ? (
                        <>
                          <span className="spinner" /> Saving…
                        </>
                      ) : (
                        <>
                          Create my account <Icon name="sparkle" size={18} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            ) : null}

            {phase === "done" ? (
              <div className="sx-done" role="status">
                <div className="done-burst" aria-hidden="true">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <i key={i} style={{ "--i": i }} />
                  ))}
                </div>
                <div className="done-check">
                  <Icon name="check" size={44} stroke={2.8} />
                </div>
                <h2>You’re in{firstName ? `, ${firstName}` : ""}! 🎉</h2>
                <p>
                  Your password is saved and your email is verified. Log in to
                  complete your profile surveys and start earning.
                </p>
                <ol className="sx-next">
                  <li>
                    <Icon name="layers" size={18} /> Complete profile surveys
                  </li>
                  <li>
                    <Icon name="gift" size={18} /> Start earning rewards
                  </li>
                </ol>
                <div className="done-actions">
                  <Link to="/login" className="btn btn-primary btn-lg">
                    Log in
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
