"use client";
// Round 9 (Kunal, 24 Nov 2026): the Services section was removed. Members now work only from My Profile and Surveys,
// so old links and bookmarks to /member/services land on Surveys.
import React from "react";
import { useRouter } from "next/navigation";

export default function ServicesMoved() {
  const router = useRouter();
  React.useEffect(() => { router.replace("/member/surveys"); }, [router]);
  return null;
}
