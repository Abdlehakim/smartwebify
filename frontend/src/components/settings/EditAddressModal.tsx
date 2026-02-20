"use client";
import React, { useState, useEffect } from "react";
import { fetchData } from "@/lib/fetchData";

interface EditAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: {
    _id: string;
    Name: string;
    StreetAddress: string;
    Country: string;
    Province?: string;
    City: string;
    PostalCode: string;
  };
  onAddressUpdated: () => Promise<void> | void;
}

export default function EditAddressModal({
  isOpen,
  onClose,
  address,
  onAddressUpdated,
}: EditAddressModalProps) {
  const [name, setName] = useState(address.Name);
  const [streetAddress, setStreetAddress] = useState(address.StreetAddress);
  const [country, setCountry] = useState(address.Country);
  const [province, setProvince] = useState(address.Province || "");
  const [city, setCity] = useState(address.City);
  const [postalCode, setPostalCode] = useState(address.PostalCode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(address.Name);
    setStreetAddress(address.StreetAddress);
    setCountry(address.Country);
    setProvince(address.Province || "");
    setCity(address.City);
    setPostalCode(address.PostalCode);
  }, [address]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetchData<unknown>(`/client/address/updateAddress/${address._id}`, {
        method: "PUT",
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

      await onAddressUpdated();
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
        <h3 className="text-lg font-semibold mb-2">Edit Address</h3>
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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
