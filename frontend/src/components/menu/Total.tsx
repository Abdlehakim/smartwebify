import React from "react";
import { useCurrency } from "@/contexts/CurrencyContext";

// ---------- props ----------
interface TotalProps {
  totalPrice: number;
}

const Total: React.FC<TotalProps> = ({ totalPrice }) => {
  const { fmt } = useCurrency(); // currency formatter

  return (
    <span className="w-[120px] text-sm max-2xl:text-sm max-md:hidden">
      {fmt(totalPrice)}
    </span>
  );
};

export default Total;
