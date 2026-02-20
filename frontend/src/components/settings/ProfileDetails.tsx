/* ------------------------------------------------------------------
   ProfileDetails — formulaire de mise à jour du profil (FR, simplifié)
------------------------------------------------------------------ */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchData } from '@/lib/fetchData';

export default function ProfileDetails() {
  const { user, loading } = useAuth();

  // 👉 On se base sur votre champ `isGoogleAccount`
  const isGoogleUser = Boolean(user?.isGoogleAccount);

  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (!loading && user) {
      setUsername(user.username ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone   ?? '');
    }
  }, [loading, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      // On n’envoie username/email que si ce n’est pas un compte Google
      const payload: Record<string,string> = { phone };
      if (!isGoogleUser) {
        payload.username = username;
        payload.email    = email;
      }

      await fetchData('clientSetting/update', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue');
    }
  };

  return (
    <section className="w-[90%] mx-auto flex flex-col lg:flex-row gap-10 border-b-2 py-6">
      <aside className="lg:w-1/5 space-y-2">
        <h2 className="text-lg font-semibold text-black">
          Informations personnelles
        </h2>
        <p className="text-sm text-gray-400">
          Utilisez une adresse permanente où vous pouvez recevoir du courrier.
        </p>
      </aside>

      <form onSubmit={handleSubmit} className="flex-1 space-y-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Nom d’utilisateur */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="username" className="text-sm font-medium text-black">
              Nom d’utilisateur
            </label>
            <input
              id="username"
              type="text"
              placeholder="exemple.com/ jeandupont"
              className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md max-lg:text-xs"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required={!isGoogleUser}
              disabled={isGoogleUser}
            />
          </div>

          {/* Email */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="email" className="text-sm font-medium text-black">
              Adresse e‑mail
            </label>
            <input
              id="email"
              type="email"
              className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md max-lg:text-xs"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required={!isGoogleUser}
              disabled={isGoogleUser}
            />
            {isGoogleUser && (
              <p className="text-xs text-gray-500">
                Les comptes Google ne peuvent pas modifier leur email ou nom d’utilisateur.
              </p>
            )}
          </div>

          {/* Téléphone */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="phone" className="text-sm font-medium text-black">
              Téléphone
            </label>
            <input
              id="phone"
              type="text"
              className="w-full h-12 border border-gray-300 px-4 rounded-md focus:outline-none text-md max-lg:text-xs"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-4">
          {success && <p className="text-green-400 text-sm">{success}</p>}
          {error   && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md border border-gray-300 px-4 py-2.5 text-sm text-black hover:text-white hover:bg-primary"
          >
            {loading ? 'En cours…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </section>
  );
}
