import React, { useState } from "react";

export default function AdminAnimalCard({ animal, onEdit, onDelete }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-80 h-[420px] m-4 inline-block overflow-hidden relative"
      style={{ perspective: "1200px" }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className="w-full h-full"
        style={{
          transition: "transform 0.7s cubic-bezier(.4,2,.3,.7)",
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          width: "100%",
          height: "100%",
        }}
      >
        {/* Ön Yüz */}
        <div
          className="absolute w-full h-full rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-cyan-100 to-white flex flex-col items-center justify-end"
          style={{
            backfaceVisibility: "hidden",
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
        >
          <img
            src={animal.imageUrl || animal.imageurl || animal.photo || "https://placehold.co/400x300?text=Hayvan"}
            alt={animal.name}
            className="w-full h-[85%] object-cover rounded-t-2xl shadow"
          />
          <div className="w-full px-4 py-2 text-left bg-white/80 rounded-b-2xl">
            <h3 className="text-lg font-bold text-blue-700 mb-1">{animal.name}</h3>
            <span
              className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                animal.adopted
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {animal.adopted ? "Sahiplendi" : "Bekliyor"}
            </span>
          </div>
        </div>
        {/* Arka Yüz */}
        <div
          className="absolute w-full h-full rounded-2xl shadow-lg overflow-hidden bg-gradient-to-br from-yellow-50 to-teal-100 flex items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
          }}
        >
          <div className="p-8 w-full text-left">
            <p className="text-base mb-3 text-gray-700">
              <b>Tür:</b> {animal.species}
            </p>
            <p className="text-base mb-3 text-gray-700">
              <b>Yaş:</b> {animal.age}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => onEdit(animal)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                Düzenle
              </button>
              <button
                onClick={() => onDelete(animal.id)}
                className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}