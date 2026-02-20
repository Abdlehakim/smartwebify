import React, { useEffect, useState } from 'react';

interface PopupProps {
  handleClosePopup: () => void;
  Delete: (id: string) => void;
  id: string;
  name: string;
}

const Popup: React.FC<PopupProps> = ({ handleClosePopup, Delete, id, name }) => {
  const [isButtonVisible, setIsButtonVisible] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [buttonColor, setButtonColor] = useState('bg-primary');
  const isDeleteConfirmed = inputValue.toUpperCase();

  useEffect(() => {
    if (isDeleteConfirmed === 'DELETE') {
      setIsButtonVisible(false);
      setButtonColor('bg-primary');
    } else {
      setIsButtonVisible(true);
      setButtonColor('bg-primary');
    }
  }, [isDeleteConfirmed]);

  return (
    <div
      className="min-w-screen h-screen animated fadeIn faster fixed left-0 top-0 flex justify-center items-center inset-0 z-50 outline-none focus:outline-none bg-no-repeat bg-center bg-cover backdrop-filter backdrop-brightness-75"
    >
      <div className="flex flex-col gap-[10px] w-[90%] max-w-lg p-5 relative mx-auto my-auto rounded-xl shadow-lg bg-white">
        <div className="text-center flex flex-col gap-[10px] justify-center">
          <p className="text-lg text-gray-500">
            Voulez-vous vraiment supprimer{' '}
            <span className="text-red-500 font-bold">{name}</span> ?<br />
            Pour confirmer, tapez{' '}
            <span className="text-red-500 font-bold">DELETE</span> :
          </p>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="border-2 border-gray-400 rounded p-2 text-red-500 font-bold text-center uppercase"
          />

          <div className="mt-2 text-center space-x-4 md:block">
            <button
              onClick={handleClosePopup}
              className="mb-2 md:mb-0 bg-white px-5 py-2 text-sm shadow-sm font-medium tracking-wider border text-primary rounded-full hover:shadow-lg hover:bg-[#15335D] hover:border-[#15335D] hover:text-white"
            >
              Annuler
            </button>
            <button
              onClick={() => Delete(id)}
              disabled={isButtonVisible}
              className={`mb-2 md:mb-0 px-5 py-2 text-sm shadow-sm font-medium tracking-wider rounded-full ${
                isButtonVisible
                  ? 'bg-gray-300 border-gray-300 text-gray-600 cursor-not-allowed'
                  : buttonColor + ' border border-primary text-white hover:bg-[#15335D] hover:border-[#15335D]'
              }`}
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Popup;
