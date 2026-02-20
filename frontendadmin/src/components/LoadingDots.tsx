
//src/components/LoadingDots
"use client";

import React from "react";

interface LoadingDotsProps {
  /**
   * Message to display while loading (with dots)
   */
  loadingMessage?: string;
  /**
   * Message to display on success (without dots)
   */
  successMessage?: string;
  /**
   * If true, shows only the successMessage; otherwise shows loadingMessage + dots
   */
  isSuccess?: boolean;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({
  loadingMessage,
  successMessage,
  isSuccess = false,
}) => {
  if (isSuccess && successMessage) {
    return (
      <div className="w-full h-full bg-white bg-opacity-50 flex justify-center items-center rounded-xl">
        <p className="text-center text-lg text-green-500">
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white bg-opacity-50 flex flex-col justify-center items-center">  
      <div className="flex justify-center items-center space-x-1 z-10 w-full h-14">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
      </div>
      {loadingMessage && (
        <p className="text-center text-lg text-gray-800">
          {loadingMessage}
        </p>
      )}
    </div>
  );
};

export default LoadingDots;
