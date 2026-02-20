// components/SessionProviderWrapper.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { Session } from "next-auth";

interface SessionProviderWrapperProps {
  children: React.ReactNode;
  session: Session | null;
}

const SessionProviderWrapper: React.FC<SessionProviderWrapperProps> = ({ children, session }) => {
  return <SessionProvider session={session}>{children}</SessionProvider>;
};

export default SessionProviderWrapper;
