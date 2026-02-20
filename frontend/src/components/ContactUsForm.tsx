// src/components/ContactUsForm.tsx
"use client";
import { useState, ChangeEvent, FormEvent } from "react";

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactUsForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch("/api/NavMenu/contactus/PostForm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const { error } = await res.json();
        setError(error || "Une erreur s'est produite.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error(err);
      setError("Une erreur s'est produite lors de l'envoi de votre message.");
    }
  };

  return (
    <section className="bg-white my-6">
      <div className="py-8 lg:py-4 px-4 mx-auto max-w-screen-md">
        {submitted ? (
          <p className="text-green-500 text-center" role="status" aria-live="polite">
            Merci pour votre message !
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Votre nom
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Votre nom"
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                Votre e-mail
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="nom@exemple.com"
                className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-400"
              >
                Votre message
              </label>
              <textarea
                id="message"
                name="message"
                rows={6}
                value={formData.message}
                onChange={handleChange}
                placeholder="Laissez votre message…"
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg shadow-sm border border-gray-300 
                  focus:ring-primary-500 focus:border-primary-500 
                  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                required
              ></textarea>
            </div>

            {error && (
              <p className="text-red-500" role="alert" aria-live="assertive">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="text-white bg-secondary px-8 py-2 border-2 border-secondary rounded text-center hover:bg-white hover:text-black"
            >
              Envoyer
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
