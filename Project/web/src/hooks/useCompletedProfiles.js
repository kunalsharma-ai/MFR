"use client";
// The slugs of the profiles the member has completed (status >= 100 in POST /api/v1/profile).
// The Survey section uses it to hide the survey of a profile that was completed through its profile card.
import { useEffect, useState } from "react";
import { api } from "@/util";

export default function useCompletedProfiles(category) {
  const [slugs, setSlugs] = useState([]);
  useEffect(() => {
    if (!category) return;
    let live = true;
    api
      .post("/api/v1/profile", { category })
      .then((r) => {
        if (!live) return;
        const list = Array.isArray(r?.data) ? r.data : [];
        setSlugs(list.filter((p) => Number(p?.status) >= 100).map((p) => String(p.slug || "").toLowerCase()).filter(Boolean));
      })
      .catch(() => {});
    return () => { live = false; };
  }, [category]);
  return slugs;
}
