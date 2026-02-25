"use client";
export default function useToast(detail) {
  // Use typeof to safely check if we are in the browser
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (!detail || !detail.status) {
    console.log("No Status");
    return;
  }

  document.dispatchEvent(new CustomEvent("toast", { detail }));
}
