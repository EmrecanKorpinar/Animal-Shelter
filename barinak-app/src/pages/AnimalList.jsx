import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import AnimalCard from "../components/user/AnimalCard";
import AnimalListTable from "../components/user/AnimalListTable";
import { useNotifications } from "../contexts/NotificationContext";
import { useToast } from "../contexts/ToastContext";
import AdoptionModal from "../components/common/AdoptionModal";

export default function AnimalList() {
  const navigate = useNavigate();
  const { notifications } = useNotifications();
  const { showError, showWarning } = useToast();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        console.log('Fetching animals...');
        setLoading(true);
        const res = await api.get('/animals');
        console.log('Animals API response:', res);
        if (!mounted) return;
        setAnimals(res.data || []);
      } catch (err) {
        console.error('Error fetching animals:', err);
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

  // Admin reddettiyse, bildirim üzerinden ilgili hayvan için local requestPending bayrağını temizle
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const rejected = notifications.filter(n => n.type === 'adoption_rejected' && n.data && n.data.animal_id);
    if (rejected.length === 0) return;
    const rejectedIds = new Set(rejected.map(n => n.data.animal_id));
    setAnimals(prev => prev.map(a => rejectedIds.has(a.id) ? { ...a, requestPending: false } : a));
  }, [notifications]);

  // Sadece sahiplenilmemiş hayvanlar (backend alan adları ile uyumlu)
  const notAdopted = animals.filter(a => !a.adopted);
  const speciesList = Array.from(new Set(animals.map(a => (a.species || '').trim()).filter(Boolean)));
  const visible = notAdopted.filter(a => {
    const matchesSpecies = speciesFilter ? (a.species || '').toLowerCase() === speciesFilter.toLowerCase() : true;
    const s = search.trim().toLowerCase();
    const matchesSearch = s
      ? (a.name || '').toLowerCase().includes(s) || (a.species || '').toLowerCase().includes(s)
      : true;
    return matchesSpecies && matchesSearch;
  });

  // Sahiplenme isteği gönder (ekran genelinde geri bildirim)
  const handleAdopt = async (animalId) => {
    const animal = animals.find(a => a.id === animalId);
    if (!animal) return;

    // Ön kontroller: kart içinde değil, ekran genelinde uyarı ver
    if (animal.adopted) {
      showWarning && showWarning('❗ Bu hayvan zaten sahiplendi.');
      return;
    }
    if (animal.requestPending) {
      showWarning && showWarning('⏳ Bu hayvan için zaten bir isteğiniz bulunuyor.');
      return;
    }

    try {
      await api.post('/adoption_requests', { animal_id: animalId, message: '' });
      // İstek gönderildi olarak işaretle
      setAnimals(prev => prev.map(a => 
        a.id === animalId ? { ...a, requestPending: true } : a
      ));
      // Başarılı: Sayfa seviyesinde modal aç
      setSelectedAnimal(animal);
      setShowAdoptionModal(true);
    } catch (err) {
      // Hata: Sayfa seviyesinde göster
      const msg = err?.response?.data?.error || err?.message || 'İstek gönderilemedi';
      showError && showError('❌ ' + msg);
    }
  };

  // Simple error boundary to prevent blank page
  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 rounded-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Bir hata oluştu</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Sayfayı Yenile
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full">
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Hayvan Barınağına Hoşgeldiniz</h1>
          <p className="text-lg text-gray-600 mb-2">Sevimli dostlarımızı sahiplenerek onlara sıcak bir yuva sunabilirsiniz.</p>
          <p className="text-md text-blue-600 font-semibold">Hayvan sahiplenmek, bir cana umut olmaktır!</p>
        </div>
        {/* Filtreler */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
          <div className="flex gap-2 items-center">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="İsim veya tür ara..."
              className="px-3 py-2 border rounded w-64"
            />
            <select
              value={speciesFilter}
              onChange={e => setSpeciesFilter(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Tüm Türler</option>
              {speciesList.map(sp => (
                <option key={sp} value={sp}>{sp}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Toplam: {animals.length} | Sahiplenilebilir: {notAdopted.length} | Görüntülenen: {visible.length}
          </div>
        </div>
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Hayvanlar yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-6 min-w-max" style={{width: '100%'}}>
              {visible.length === 0 ? (
                <div className="text-center w-full text-gray-500 font-bold text-lg py-10">
                  {animals.length === 0 
                    ? 'Henüz hiç hayvan bulunamadı.' 
                    : 'Sahiplenilecek hayvan kalmadı veya arama sonucu bulunamadı.'}
                </div>
              ) : (
                visible.map(animal => (
                  <div style={{minWidth: '24rem', maxWidth: '24rem'}} key={animal.id}>
                    <AnimalCard
                      animal={animal}
                      onAdopt={() => handleAdopt(animal.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {/* Hayvan kartlarının altındaki yazı */}
        <div className="mt-12 text-center relative z-10">
          <h2 className="text-2xl font-bold text-green-700 mb-2">Siz de bir dost sahiplenin!</h2>
          <p className="text-gray-700 mb-4">Barınağımızda onlarca sevimli hayvan yeni yuvasını bekliyor. Sahiplenmek için hemen başvurun!</p>
          <a href="/adopt" className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded shadow transition">Sahiplenme Formu</a>
        </div>
        {/* Hayvan Listesi Tablosu */}
        <div className="mt-16">
          <AnimalListTable />
        </div>
      </div>

      {/* Adoption Modal (page-level) */}
      {showAdoptionModal && selectedAnimal && (
        <AdoptionModal
          isOpen={showAdoptionModal}
          onClose={() => setShowAdoptionModal(false)}
          animalName={selectedAnimal.name}
          animalImage={selectedAnimal.imageurl || selectedAnimal.imageUrl}
        />
      )}
    </section>
  );
}
