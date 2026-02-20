 "use client"
import React, { FormEvent, useState } from 'react';

const Milanotorino = () => {
    // Define state for each field
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    // Handle changes in input fields
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // Handle form submission
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault(); // Prevent the default form submission
        for (const key in formData) {
            // Narrow down the type of key to be a key of formData
            if (formData.hasOwnProperty(key)) {
                // Use key as keyof typeof formData to tell TypeScript it's a valid key
                if (formData[key as keyof typeof formData] === '') {
                    console.error(`The field ${key} is empty.`);
                    return; // Return early if any field is empty
                }
            }
        }
    fetch('/api/constactus', {
   method: 'POST',
    body: JSON.stringify(formData),
      headers: {
          'Content-Type': 'application/json'
       }
      })
    .then(response => response.json())
    .then(() => {
        setFormData({ name: '', email: '', message: '' });
      })
    .catch(error => console.error('Error:', error));
    };

    return (
        <div className='desktop  flex flex-col justify-center items-center gap-[32px] py-8'>
            <div className='flex justify-center w-4/5 max-lg:w-full gap-[40px] max-lg:flex-col'>
                <div className='flex flex-col w-[100%] gap-[24px] max-lg:w-full max-lg:flex-col'>
                    <p className='text-3xl flex justify-center font-bold'>Contactez-nous</p>
                    <form className='grid gap-[8px]' onSubmit={handleSubmit}>
                        <div className='flex-col flex gap-[12px]'>
                            <input 
                                value={formData.name}
                                name="name"
                                onChange={handleChange}
                                type="text"
                                className="bg-gray-50 border w-full border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="name"
                                required
                            />
                            <input 
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Email"
                                required
                            />
                            <textarea  
                                value={formData.message}
                                name="message"
                                onChange={handleChange}
                                className="bg-gray-50 border h-[200px] border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full px-2.5 py-3 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Écrivez votre message..."
                                required
                            />
                        </div>
                        <div className='flex justify-end'>
                            <button 
                                type="submit" 
                                className='w-[50%] bg-slate-600 hover:bg-[#15335D] rounded-md px-8 py-3 font-bold text-white'
                            >
                                <p>Envoyer le message</p>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Milanotorino;
