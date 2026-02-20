"use client";
import React from "react";
import { AiOutlineHeart } from "react-icons/ai";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import Listmywish from "./Listmywish";

const Wishlist: React.FC = () => {
  const wishlistItems = useSelector((state: RootState) => state.wishlist.items);

  return (
    <div>
      {wishlistItems.length > 0 ? (
        <Listmywish data={wishlistItems} />
      ) : (
        <div className="flex w-[200px] max-2xl:w-[180px] items-center justify-center gap-[8px] max-lg:w-fit text-white cursor-pointer select-none max-xl:hidden">
          <div className="relative my-auto mx-2">
            <AiOutlineHeart size={45} className="text-white" />
            <span className="w-4 flex justify-center h-4 items-center text-xs rounded-full absolute -top-1 -right-1 text-white bg-secondary">
              0
            </span>
          </div>
          <div className="flex flex-col">
            <p className="text-[#C1C4D6] max-2xl: text-xs">Préféré</p>
            <p className="text-white font-bold max-md:hidden max-2xl:text-sm">Liste souhaits</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wishlist;
