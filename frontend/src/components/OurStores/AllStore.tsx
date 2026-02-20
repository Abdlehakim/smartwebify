"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { BsFillTelephoneFill } from "react-icons/bs";
import { FaMapMarkerAlt } from "react-icons/fa";
import Pagination from "@/components/PaginationClient";

interface OpeningHour {
  open: string;
  close: string;
  _id: string;
}

interface OpeningHours {
  Monday?: OpeningHour[];
  Tuesday?: OpeningHour[];
  Wednesday?: OpeningHour[];
  Thursday?: OpeningHour[];
  Friday?: OpeningHour[];
  Saturday?: OpeningHour[];
  Sunday?: OpeningHour[];
}

interface Store {
  _id: string;
  name: string;
  image: string;
  phoneNumber: string;
  address: string;
  city: string;
  localisation: string;
  openingHours: OpeningHours;
}

interface AllStoreProps {
  store: Store[]; // Must match the name you pass in from the server component
}

const AllStore: React.FC<AllStoreProps> = ({ store }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);

  useEffect(() => {
    // Whenever the `store` data changes, reset the filtered list and page
    setFilteredStores(store);
    setCurrentPage(1);
  }, [store]);

  const productsPerPage = 6;
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentStores = filteredStores.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredStores.length / productsPerPage);

  return (
    <div className="mx-[2%] py-8">
      <div className="grid grid-cols-1 gap-[32px] py-8 
                      lg:grid-cols-2 
                      2xl:grid-cols-3">
        {currentStores.map((item) => (
          <div key={item._id} className="bg-white shadow-lg flex overflow-hidden rounded-lg">
            {/* Image Section */}
            <div className="w-1/3">
              {item.image && (
                <Image
                  src={item.image}
                  alt="Store Image"
                  className="w-full h-full object-cover"
                  width={1920}
                  height={1080}
                  priority
                  sizes="33vw"
                />
              )}
            </div>

            {/* Info Section */}
            <div className="bg-white w-2/3 h-full overflow-hidden">
              <div className="p-6">
                <h2 className="font-bold text-2xl text-HomePageTitles capitalize">
                  {item.name}
                </h2>
                <div className="text-center text-black flex justify-center items-center gap-[16px]">
                  {/* Phone */}
                  <div className="flex justify-center items-center">
                    <span className="inline-block bg-black p-1 font-semibold mr-2 rounded-md">
                      <BsFillTelephoneFill className="text-white" size={15} />
                    </span>
                    <span className="font-bold">{item.phoneNumber}</span>
                  </div>

                  {/* Address */}
                  <div className="flex justify-center items-center">
                    <span className="inline-block text-black font-semibold mr-2">
                      <FaMapMarkerAlt size={23} />
                    </span>
                    <span className="font-bold">
                      {item.address} {item.city}
                    </span>
                  </div>
                </div>

                {/* Opening Hours */}
                <div className="mt-4 flex flex-col justify-center w-fit mx-auto">
                  <h3 className="text-center text-black font-bold mb-4">
                    TEMPS OUVERT :
                  </h3>
                  <ul className="text-center text-sm space-y-1">
                    {item.openingHours &&
                      Object.entries(item.openingHours).map(([day, hours]) => (
                        <li key={day} className="flex gap-[32px] text-left">
                          <span className="font-medium w-20">{day}:</span>
                          {Array.isArray(hours) && hours.length > 0
                            ? hours
                                .map((hour) => {
                                  const openTime = hour.open || "";
                                  const closeTime = hour.close || "";
                                  if (!openTime && !closeTime) return "";
                                  return `${openTime} - ${closeTime}`;
                                })
                                .filter(Boolean)
                                .join(" / ") || "Closed"
                            : "Closed"}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default AllStore;
