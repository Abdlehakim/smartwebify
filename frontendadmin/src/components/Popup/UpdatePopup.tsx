"use client";

import React from 'react';

interface UpdatePopupProps {
  handleClosePopup: () => void;
  onConfirm: (id: string) => void;
  id: string;
  userName: string;
  fieldName: string;
  currentValue: string;
  newValue: string;
}

const UpdatePopup: React.FC<UpdatePopupProps> = ({
  handleClosePopup,
  onConfirm,
  id,
  userName,
  fieldName,
  currentValue,
  newValue,
}) => {
  return (
    <div className="min-w-screen h-screen fixed left-0 top-0 flex justify-center items-center inset-0 z-50 backdrop-filter backdrop-brightness-75">
      <div className="flex flex-col gap-4 w-full max-w-md p-6 mx-auto my-auto rounded-xl shadow-lg bg-white">
        <p className="text-lg text-gray-800 text-center">
          Update <span className="font-semibold text-red-500">{userName}&apos;s {fieldName}</span> from{' '}
          <span className="font-bold text-red-500">{currentValue}</span> to{' '}
          <span className="font-bold text-green-500">{newValue}</span>?
        </p>
        <div className="flex justify-center gap-4 mt-4">  <button
            onClick={() => onConfirm(id)}
            className="px-5 py-2 bg-tertiary text-white rounded hover:bg-hoverButton transition"
          >
            Yes
          </button>
          <button
            onClick={handleClosePopup}
            className="px-5 py-2 bg-quaternary text-white rounded hover:bg-hoverButton transition"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePopup;
