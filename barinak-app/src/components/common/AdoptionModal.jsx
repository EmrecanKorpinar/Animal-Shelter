import React from 'react';

const AdoptionModal = ({ isOpen, onClose, animalName, animalImage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform animate-bounce-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-t-2xl p-6 text-center">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sahiplenme İsteği Gönderildi!</h2>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="mb-6">
            <img
              src={animalImage || "/vite.svg"}
              alt={animalName}
              className="w-20 h-20 object-cover rounded-full mx-auto mb-4 border-4 border-green-200"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">{animalName}</h3>
            <p className="text-gray-600">
              Sahiplenme isteğiniz başarıyla gönderildi. Admin ekibimiz en kısa sürede değerlendirecek.
            </p>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Süreç:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Sahiplenme isteği gönderildi
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Admin incelemesi bekleniyor
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Onay/red durumunda bildirim alacaksınız
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Anladım
            </button>
            <button
              onClick={() => {
                onClose();
                window.location.href = '/my-requests';
              }}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              İsteklerimi Gör
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionModal;
