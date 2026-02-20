// src/app/(auth)/layout.tsx
"use client";

import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/hooks/useAuth";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If the env var is missing, render without Google to avoid runtime errors
  if (!clientId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing — Google OAuth disabled on auth pages."
      );
    }
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}
