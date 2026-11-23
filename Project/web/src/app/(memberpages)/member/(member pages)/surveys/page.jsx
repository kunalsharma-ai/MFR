"use client";
// Member hub v3 (Nov 2026): the survey discovery screen lives in ../../hub/surveys.jsx; this file only mounts it.
// The data, the lock until the four basic profiles are complete, and Start (/survey?name=<slug>) are unchanged.
import SurveysPage from "../../hub/surveys.jsx";
import { SurveyHistory } from "../dashboard/page";

export default function page() {
  return <SurveysPage SurveyHistory={SurveyHistory} />;
}
