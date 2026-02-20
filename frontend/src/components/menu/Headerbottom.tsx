// app/components/Headerbottom/Headerbottom.tsx
import React from "react";
import Headerbottomleft, { Categorie } from "./Headerbottomleft";
import Headerbottomright from "./Headerbottonright";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

export default async function Headerbottom() {
  let categories: Categorie[] = [];

  try {
    const fetched = await fetchData<Categorie[]>("categories/getAllName");
    if (Array.isArray(fetched)) {
      categories = fetched;
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
  }

  return (
    <header>
      <div className="w-full h-[80px] bg-primary flex justify-center items-center border-t-gray-600">
        <div className="w-[90%] h-full flex justify-between max-lg:justify-start items-center max-sm:justify-center">
          {categories.length > 0 && <Headerbottomleft categories={categories} />}
          <Headerbottomright />
        </div>
      </div>
    </header>
  );
}
