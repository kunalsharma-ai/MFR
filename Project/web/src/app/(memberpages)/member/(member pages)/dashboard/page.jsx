"use client";
// Member hub redesign (Nov 2026): one dashboard per member type (Consumer, Professional, Teen), see ../../hub/dashboards.jsx.
// The old dashboard's survey history table moved to the Rewards and Activity pages (same /api/v1/rewards data).
import MemberDashboard from "../../hub/dashboards.jsx";

export default function page() {
  return <MemberDashboard />;
}

// The Surveys page (approved design, unchanged) imports its history table from here.
export { SurveyHistory } from "./legacy.jsx";
