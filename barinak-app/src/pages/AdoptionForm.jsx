import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function AdoptionForm() {
  const [animalId, setAnimalId] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);
  // Teşekkürler Köşesi için durumlar
  const [adopted, setAdopted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      // Post using authenticated user token
      await api.post('/adoption_requests', { animal_id: Number(animalId), message });
      setStatus('İstek gönderildi. Admin onay bekliyor.');
    } catch (err) {
      setStatus('Hata: ' + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sol: Başvuru Formu */}
        <div className="p-6 bg-white rounded-2xl shadow">
          <h2 className="text-2xl font-bold mb-4">Sahiplenme İsteği Gönder</h2>
          <form onSubmit={submit}>
            <label className="block mb-2">Hayvan ID</label>
            <input className="w-full p-2 border rounded mb-4" value={animalId} onChange={e => setAnimalId(e.target.value)} />

            <label className="block mb-2">Mesaj</label>
            <textarea className="w-full p-2 border rounded mb-4" value={message} onChange={e => setMessage(e.target.value)} />

            <button className="px-4 py-2 bg-green-600 text-white rounded" type="submit">Gönder</button>
          </form>
          {status && <p className="mt-4">{status}</p>}
        </div>

        {/* Sağ: Teşekkürler Köşesi (mini) */}
        <div className="p-6 bg-white rounded-2xl shadow">
          <h3 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">💚</span>
            Teşekkürler Köşesi
          </h3>

          {/* Verileri yükle */}
          <ThankYouMini adopted={adopted} loading={loading} error={error} setAdopted={setAdopted} setLoading={setLoading} setError={setError} />
        </div>
      </div>
    </div>
  );
}

function ThankYouMini({ adopted, loading, error, setAdopted, setLoading, setError }) {
  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get('/animals/adopted');
        if (!ignore) setAdopted(res.data || []);
      } catch (err) {
        if (!ignore) setError(err?.response?.data?.error || err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 30000);
    return () => { ignore = true; clearInterval(t); };
  }, [setAdopted, setLoading, setError]);

  return (
    <div>
      {loading && <p className="text-gray-500">Yükleniyor...</p>}
      {error && <p className="text-red-600">Hata: {error}</p>}
      {!loading && !error && (
        <div className="space-y-3">
          {adopted.length === 0 ? (
            <p className="text-gray-500 italic">Şu anda listelenecek kayıt yok.</p>
          ) : (
            adopted.slice(0, 6).map((a) => (
              <div key={a.id} className="p-3 rounded-lg border border-green-200 bg-green-50">
                <p className="text-gray-800">
                  <span className="font-semibold text-green-700">{a.name}</span>
                  {a.species ? (
                    <span className="text-gray-600"> ({a.species})</span>
                  ) : null}
                  {" "}
                  <span className="text-gray-700">sahiplendirildi.</span>
                </p>
                <p className="text-gray-700">
                  {a.adopter_username ? (
                    <>
                      <span className="text-sm">Teşekkürler </span>
                      <span className="font-semibold">@{a.adopter_username}</span>
                      <span className="text-sm">!</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">(Sahiplendiren kullanıcı bilgisi yok)</span>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
