import React, { useState } from 'react';

export default function AnimalCard({ animal, onAdopt }) {
  console.log('Rendering AnimalCard with animal:', animal);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  return (
    <div
      className="w-80 h-[400px] m-2 inline-block overflow-hidden relative"
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
          className="absolute w-full h-full rounded-xl shadow-lg overflow-hidden bg-white flex flex-col items-center justify-end"
          style={{ backfaceVisibility: "hidden", position: "absolute", width: "100%", height: "100%", top: 0, left: 0 }}
        >
          <img
            src={animal.imageUrl || animal.imageurl || '/default-animal.svg'}
            alt={animal.name}
            className="w-full h-[75%] object-cover rounded-t-xl shadow"
          />
          <div className="w-full px-4 py-3 text-left bg-white/90 rounded-b-xl">
            <h3 className="text-lg font-bold text-green-800 mb-1">{animal.name}</h3>
            <p className="text-sm text-gray-600">{animal.species} - {animal.age} yaşında</p>
          </div>
        </div>
        {/* Arka Yüz */}
        <div
          className="absolute w-full h-full rounded-xl shadow-lg overflow-hidden bg-green-50 flex items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", position: "absolute", width: "100%", height: "100%", top: 0, left: 0 }}
        >
          <div className="p-5 w-full text-left h-full flex flex-col">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-green-800 mb-2">{animal.name}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-semibold">Tür:</span> {animal.species}</p>
                <p><span className="font-semibold">Yaş:</span> {animal.age} yaşında</p>
                <p><span className="font-semibold">Durum:</span>
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${animal.adopted ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {animal.adopted ? 'Sahiplendirildi' : 'Müsait'}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex-1 mb-3">
              <p className="text-sm text-gray-700 leading-relaxed">{animal.description}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (animal.adopted || animal.requestPending) return;
                  try {
                    setIsAdopting(true);
                    await onAdopt();
                  } finally {
                    setIsAdopting(false);
                  }
                }}
                className={
                  animal.adopted || animal.requestPending
                    ? "bg-gray-400 text-white px-3 py-1 rounded text-xs flex-1 cursor-not-allowed"
                    : `px-3 py-1 rounded text-xs text-white flex-1 ${
                        isAdopting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-500 hover:bg-green-600"
                      }`
                }
                disabled={animal.adopted || animal.requestPending || isAdopting}
              >
                {isAdopting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Gönderiliyor...
                  </div>
                ) : (
                  animal.adopted ? "Sahiplendi" : 
                  animal.requestPending ? "İstek Gönderildi" : "Sahiplen"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
