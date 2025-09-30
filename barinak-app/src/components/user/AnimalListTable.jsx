import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import AdoptionModal from '../common/AdoptionModal';

// Fallback toast functions if context is not available
const useToastFallback = () => {
  const context = useToast();
  if (!context) {
    return {
      showError: (message) => console.error(message),
      showSuccess: (message) => console.log(message)
    };
  }
  return context;
};

export default function AnimalListTable() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlertId, setShowAlertId] = useState(null);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [adoptingId, setAdoptingId] = useState(null);
  const { showSuccess, showError } = useToastFallback();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/animals');
        if (!mounted) return;
        setAnimals(res.data || []);
      } catch (err) {
        if (!mounted) return;
        setError('Hayvanlar yüklenemedi: ' + (err?.response?.data?.error || err.message));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Sahiplenme isteği gönder
  const handleAdopt = async (animalId) => {
    try {
      setAdoptingId(animalId); // Loading state'i başlat
      const animal = animals.find(a => a.id === animalId);
      await api.post('/adoption_requests', { animal_id: animalId, message: '' });

      // Başarılıysa listede ilgili hayvanı adopted=true yap
      setAnimals(prev => prev.map(a => (a.id === animalId ? { ...a, adopted: true } : a)));

      // Modal'ı aç
      setSelectedAnimal(animal);
      setShowAdoptionModal(true);

    } catch (err) {
      showError('❌ Sahiplenme isteği gönderilemedi: ' + (err?.response?.data?.error || err.message));
    } finally {
      setAdoptingId(null); // Loading state'i temizle
    }
  };

  if (loading) {
    return (
      <div className="overflow-y-auto max-h-[32rem] border rounded-lg shadow relative">
        <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="overflow-y-auto max-h-[32rem] border rounded-lg shadow relative">
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hayvanlar Yüklenemedi</h3>
            <p className="text-gray-600 mb-4 max-w-md">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-[32rem] border rounded-lg shadow relative">
      {showAlertId !== null && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded shadow-lg z-50 text-sm font-bold">
          Zaten sahiplendi!
        </div>
      )}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tür</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yaş</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {animals.filter(a => !a.adopted).map(animal => (
            <tr key={animal.id} className="hover:bg-gray-100">
              <td className="px-6 py-4 whitespace-nowrap font-bold">{animal.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{animal.species}</td>
              <td className="px-6 py-4 whitespace-nowrap">{animal.age}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 rounded text-xs font-bold ${animal.adopted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {animal.adopted ? 'Sahiplendi' : 'Bekliyor'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    if (animal.adopted) {
                      setShowAlertId(animal.id);
                      setTimeout(() => setShowAlertId(null), 2000);
                    } else {
                      handleAdopt(animal.id);
                    }
                  }}
                  disabled={adoptingId === animal.id}
                  className={
                    animal.adopted
                      ? "bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                      : `px-3 py-1 rounded text-xs text-white ${
                          adoptingId === animal.id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`
                  }
                >
                  {adoptingId === animal.id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    animal.adopted ? "Sahiplendi" : "Sahiplen"
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Adoption Modal */}
      {showAdoptionModal && selectedAnimal && (
        <AdoptionModal
          isOpen={showAdoptionModal}
          onClose={() => setShowAdoptionModal(false)}
          animalName={selectedAnimal.name}
          animalImage={selectedAnimal.imageurl}
        />
      )}
    </div>
  );
}
