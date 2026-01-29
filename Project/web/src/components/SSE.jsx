"use client";
import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
let eventSource;
function createEvent(name, detail) {
  if (typeof document === "undefined") return console.log("No Document");
  if (!name || !detail) return;
  document.dispatchEvent(new CustomEvent(name, { detail }));
}
const SSE = ({ onMessage, onError, onOpen }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  React.useEffect(() => {
    const url = `/event/subscribe`;
    if (eventSource) {
      eventSource.close();
    }
    eventSource = new EventSource(url);
    eventSource.onopen = (event) => {
      setIsConnected(true);
      let data = {};
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        data = event.data;
      }
      createEvent("sse-connected", data);
      onOpen?.(event);
    };

    eventSource.onmessage = (event) => {
      let data = {};
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        data = event.data;
      }
      createEvent("sse-message", data);
      onMessage?.(event);
    };
    eventSource.onerror = (event) => {
      setIsConnected(false);
      let data = {};
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        data = event.data;
      }
      createEvent("sse-disconnect", data);
      onError?.(event);
    };
  }, []);
  return <></>;
};

export default SSE;
