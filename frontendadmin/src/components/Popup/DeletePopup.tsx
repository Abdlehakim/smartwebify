// src/components/Popup/DeletePopup.tsx
import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa6";

interface PopupProps {
  handleClosePopup: () => void;
  Delete: (id: string) => Promise<void>;
  id: string;
  name: string;
  isLoading: boolean;
}

const Popup: React.FC<PopupProps> = ({
  handleClosePopup,
  Delete,
  id,
  name,
  isLoading,
}) => {
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const isDeleteConfirmed = inputValue.toUpperCase();

  useEffect(() => {
    // Exiger la saisie de "SUPPRIMER" pour confirmer
    setIsButtonVisible(isDeleteConfirmed !== "SUPPRIMER");
  }, [isDeleteConfirmed]);

  return (
    <div className="min-w-screen h-screen animated fadeIn faster fixed inset-0 z-50 flex justify-center items-center bg-no-repeat bg-center bg-cover backdrop-filter backdrop-brightness-75">
      <div className="relative flex flex-col gap-4 w-full max-w-lg p-6 mx-auto my-auto bg-white rounded-xl shadow-lg">
        <div className="text-center flex flex-col gap-4">
          <p className="text-lg text-black">
            Voulez-vous vraiment supprimer{" "}
            <span className="text-red-500 font-bold">{name}</span> ?<br />
            Pour confirmer, tapez{" "}
            <span className="text-red-500 font-bold">SUPPRIMER</span> :
          </p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="w-full border-2 border-gray-200 rounded p-2 text-center uppercase"
          />
        </div>

        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={() => Delete(id)}
            disabled={isButtonVisible || isLoading}
            className="btn-fit-white-outline disabled:opacity-50"
          >
            {isLoading ? <FaSpinner className="animate-spin text-xl" /> : "Supprimer"}
          </button>
          <button
            onClick={handleClosePopup}
            disabled={isLoading}
            className="btn-fit-white-outline"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
