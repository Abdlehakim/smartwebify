import React from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";

interface CheckoutNavProps {
  currentStep: "cart" | "checkout" | "order-summary";
}

const CheckoutNav: React.FC<CheckoutNavProps> = ({ currentStep }) => {
  return (
    <div className="w-full h-[80px] flex justify-center">
      <ol className="items-center justify-center flex w-full max-w-2xl text-center text-sm font-medium text-gray-500">
        {/* Étape Panier */}
        <li
          className={`after:border-1 flex items-center after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10 ${
            currentStep === "cart"
              ? "text-blue-500 dark:text-blue-500 font-bold"
              : "text-primary-700 dark:text-primary-500"
          }`}
        >
          <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] dark:after:text-gray-500 sm:after:hidden">
            <AiOutlineCheckCircle className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
            Panier
          </span>
        </li>

        {/* Étape Paiement */}
        <li
          className={`after:border-1 flex items-center after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200 sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10 ${
            currentStep === "checkout"
              ? "text-blue-500 dark:text-blue-500 font-bold"
              : "text-primary-700 dark:text-primary-500"
          }`}
        >
          <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] dark:after:text-gray-500 sm:after:hidden">
            <AiOutlineCheckCircle className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
            Paiement
          </span>
        </li>

        {/* Étape Récapitulatif */}
        <li
          className={`flex shrink-0 items-center ${
            currentStep === "order-summary"
              ? "text-blue-500 dark:text-blue-500 font-bold"
              : "text-primary-700 dark:text-primary-500"
          }`}
        >
          <AiOutlineCheckCircle className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
          Récapitulatif de commande
        </li>
      </ol>
    </div>
  );
};

export default CheckoutNav;
