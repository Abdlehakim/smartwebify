"use client";
import { useEffect } from "react";

export default function AsyncStyles() {
  useEffect(() => {
    const sheet = document.createElement("link");
    sheet.rel = "stylesheet";
    sheet.href = "/styles/noncritical.css";
    sheet.media = "print";                // non-blocking
    sheet.onload = () => { sheet.media = "all"; };
    document.head.appendChild(sheet);
    return () => { sheet.remove(); };
  }, []);
  return null;
}
