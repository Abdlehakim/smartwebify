"use client";
import React, { useState } from "react";
import { fetchData } from "@/lib/fetchData";

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressAdd: () => Promise<void> | void;
}

export default function AddAddressModal({
  isOpen,
  onClose,
  onAddressAdd,
}: AddAddressModalProps) {
  const [name, setName] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [country, setCountry] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetchData<unknown>("/client/address/postAddress", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: name,
          StreetAddress: streetAddress,
          Country: country,
          Province: province,
          City: city,
          PostalCode: postalCode,
        }),
      });

      await onAddressAdd();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div
        className="bg-white p-6 rounded shadow max-w-2xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-2">Add Address</h3>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <label className="font-medium">Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border p-2"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">Street Address:</label>
              <input
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className="border p-2"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">Country:</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="border p-2"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">Province:</label>
              <input
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="border p-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">City:</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="border p-2"
                required
              />
            </div>
            <div className="flex flex-col">
              <label className="font-medium">Postal Code:</label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="border p-2"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
