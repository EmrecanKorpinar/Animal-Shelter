import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdoptionRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/adoption_requests'); // admin only
      setItems(res.data || []);
    } catch (err) {
      setError('İstekler yüklenemedi: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function act(id, action) {
    try {
      await api.put(`/adoption_requests/${id}/process`, { action });
      await load();
    } catch (err) {
      alert('İşlem başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Sahiplenme İstekleri</h2>
      {loading && <div className="text-gray-500">Yükleniyor...</div>}
      {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ID</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Kullanıcı</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Hayvan</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Mesaj</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Durum</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">İşlem</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{r.id}</td>
                <td className="px-4 py-2 text-sm">{r.requester_username || r.user_id}</td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    {r.animal_imageurl && (
                      <img src={r.animal_imageurl} alt={r.animal_name} className="w-8 h-8 object-cover rounded" />
                    )}
                    <span>{r.animal_name || r.animal_id}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm">{r.message}</td>
                <td className="px-4 py-2 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => act(r.id, 'approve')}
                      disabled={r.status !== 'pending'}
                      className={`px-3 py-1 rounded text-xs text-white ${r.status !== 'pending' ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                    >Onayla</button>
                    <button
                      onClick={() => act(r.id, 'reject')}
                      disabled={r.status !== 'pending'}
                      className={`px-3 py-1 rounded text-xs text-white ${r.status !== 'pending' ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                    >Reddet</button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={6}>Kayıt yok</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
