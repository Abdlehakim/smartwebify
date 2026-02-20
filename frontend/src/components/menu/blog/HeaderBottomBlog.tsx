// src/app/components/HeaderBottomBlog/HeaderBottomBlog.tsx
import React from "react";
import BlogHeaderbottomleft, { CategoryDTO } from "./BlogHeaderbottomleft";
import BlogHeaderbottonright from "./BlogHeaderbottonright";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 60;

export default async function HeaderBottomBlog() {
  let categories: CategoryDTO[] = [];

  try {
    const fetched = await fetchData<CategoryDTO[]>("/blog/postCategories");
    if (Array.isArray(fetched)) categories = fetched;
  } catch (err) {
    console.error("Error fetching post categories:", err);
  }

  return (
    <header>
      <div className="w-full h-[80px] bg-primary flex justify-center items-center border-t-gray-600">
        <div className="w-[90%] h-full flex justify-between max-lg:justify-center items-center">
          {categories.length > 0 && <BlogHeaderbottomleft categories={categories} />}
          <BlogHeaderbottonright />
        </div>
      </div>
    </header>
  );
}
