import { useEffect } from 'react';
import api from '../../services/api';

// AnimalProfile component
export default function AnimalProfile({ animal }) {
  useEffect(() => {
    if (animal?.id) {
      api.post('/user_views/add', { animalId: animal.id }).catch(() => {});
    }
  }, [animal?.id]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
        <div className="flex justify-center items-center">
          <img
            src={animal.imageUrl || '/vite.svg'}
            alt={animal.name}
            className="w-40 h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 object-cover rounded-lg"
            style={{ minHeight: '10rem', minWidth: '10rem' }}
          />
        </div>
        <div className="flex flex-col justify-center items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 break-words text-center">{animal.name}</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-2 break-words text-center">{animal.species} • {animal.age} yaşında</p>
          <div className="flex items-center justify-center mb-4">
            <span className={`inline-block w-24 text-center px-3 py-1 rounded text-xs sm:text-sm font-bold whitespace-nowrap ${animal.adopted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {animal.adopted ? 'Sahiplendi' : 'Bekliyor'}
            </span>
          </div>
          <p className="text-gray-500 break-words text-center">Açıklama: {animal.description || 'Açıklama yok.'}</p>
        </div>
      </div>
    </div>
  );
}
