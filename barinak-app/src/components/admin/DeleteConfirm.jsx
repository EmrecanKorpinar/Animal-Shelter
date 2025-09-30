// src/components/admin/DeleteConfirm.jsx
import React from "react";

export default function DeleteConfirm({ animalName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm text-center">
        <p className="mb-6 text-gray-700 font-medium">
          <span className="font-bold text-red-600">{animalName}</span> adlı hayvanı silmek istediğine emin misin?
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onConfirm}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold shadow"
          >Evet, Sil</button>
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold shadow"
          >Vazgeç</button>
        </div>
      </div>
    </div>
  );
}
