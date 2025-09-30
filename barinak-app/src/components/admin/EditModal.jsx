import React from "react";
import AnimalForm from "./AnimalForm";

export default function EditModal({ animal, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-center">Hayvanı Düzenle</h2>
        <AnimalForm initialData={animal} onSubmit={onSave} />
        <button
          onClick={onClose}
          className="mt-4 w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded font-semibold shadow"
        >Kapat</button>
      </div>
    </div>
  );
}
