"use client";

import React from "react";

export default function WelcomePage() {
  return (
    <div className=" min-h-screen flex items-center justify-center bg-green-50">
      <div className="p-8 bg-white shadow-md rounded">
        <h1 className="text-3xl font-bold">Welcome to the Dashboard!</h1>
        <p className="mt-4">You have successfully signed in.</p>
      </div>
    </div>
  );
}
