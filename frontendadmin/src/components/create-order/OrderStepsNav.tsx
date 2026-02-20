/* ------------------------------------------------------------------
   components/OrderStepsNav.tsx
   Indicateur horizontal pour l’assistant de création de commande
------------------------------------------------------------------ */
"use client";

import React from "react";
import { AiOutlineCheckCircle } from "react-icons/ai";

type Step = 1 | 2 | 3;

interface OrderStepsNavProps {
  /** Étape courante (1 : Produits, 2 : Livraison, 3 : Aperçu) */
  currentStep: Step;
  /** Libellés personnalisés (optionnel) */
  labels?: [string, string, string];
}

const OrderStepsNav: React.FC<OrderStepsNavProps> = ({
  currentStep,
  labels = ["Produits", "Livraison", "Aperçu"],
}) => {
  const getClasses = (idx: Step) =>
    `after:border-1 flex items-center after:mx-6 after:hidden after:h-1 after:w-full after:border-b after:border-gray-200
     sm:after:inline-block sm:after:content-[''] md:w-full xl:after:mx-10
     ${
       currentStep === idx
         ? "text-blue-500 font-bold"
         : "text-primary-700"
     }`;

  return (
    <div className="w-full h-[80px] flex justify-center">
      <ol className="items-center justify-center flex w-full max-w-2xl text-center text-sm font-medium text-gray-500">
        {/* Step 1 */}
        <li className={getClasses(1)}>
          <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] sm:after:hidden">
            <AiOutlineCheckCircle className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
            {labels[0]}
          </span>
        </li>

        {/* Step 2 */}
        <li className={getClasses(2)}>
          <span className="flex items-center after:mx-2 after:text-gray-200 after:content-['/'] sm:after:hidden">
            <AiOutlineCheckCircle className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
            {labels[1]}
          </span>
        </li>

        {/* Step 3 */}
        <li
          className={`flex shrink-0 items-center ${
            currentStep === 3 ? "text-blue-500 font-bold" : "text-primary-700"
          }`}
        >
          <AiOutlineCheckCircle className="me-2 h-4 w-4 sm:h-5 sm:w-5" />
          {labels[2]}
        </li>
      </ol>
    </div>
  );
};

export default OrderStepsNav;
