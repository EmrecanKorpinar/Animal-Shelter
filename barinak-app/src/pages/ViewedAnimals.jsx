
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import AnimalCard from '../components/user/AnimalCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

export default function ViewedAnimals() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/user_views/list')
      .then(res => setAnimals(res.data.animals || []))
      .catch(() => setAnimals([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Görüntülediğiniz Hayvanlar</h1>
      {animals.length === 0 ? (
        <div className="text-gray-500">Henüz hiç hayvan görüntülemediniz.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {animals.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onAdopt={() => navigate(`/adoption/${animal.id}`)}
              showAdoptButton={!animal.adopted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

