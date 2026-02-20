// src/components/Stepper.tsx

import React from "react";

export interface StepperProps {
  /** Labels for each step */
  steps: string[];
  /** Currently active step (1-based index) */
  currentStep: number;
  /** Optional click handler to navigate to a step */
  onStepClick?: (step: number) => void;
}

export default function Stepper({
  steps,
  currentStep,
  onStepClick,
}: StepperProps) {
  return (
    <div className="flex justify-center items-center gap-4 my-6 w-[60%] mx-auto">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;

        return (
          <React.Fragment key={label}>
            {/* Step circle */}
            <div
              onClick={() => onStepClick?.(stepNum)}
              className={`flex flex-col items-center cursor-pointer ${
                onStepClick ? "hover:opacity-80" : ""
              }`}
            >
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  isCompleted || isActive
                    ? "border-tertiary bg-tertiary text-white"
                    : "border-gray-300 bg-white text-gray-500"
                }`}
              >
                {stepNum}
              </div>
              <span
                className={`mt-2 max-md:hidden text-sm ${
                  isActive ? "text-tertiary" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line, except after last step */}
            {stepNum < steps.length && (
              <div className="flex-1 h-[2px] bg-gray-300"></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
