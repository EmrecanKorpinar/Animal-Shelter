import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import AnimalCard from '../components/user/AnimalCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Search() {
  const [q, setQ] = useState('');
  const [species, setSpecies] = useState('');
  const [adopted, setAdopted] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debounceRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const performSearch = useCallback(async (opts = {}) => {
    const { q: qv = q, species: sv = species, adopted: av = adopted, page: p = page } = opts;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/search', { params: { q: qv, species: sv, adopted: av, page: p, limit } });
      if (!mountedRef.current) return;
      setResults(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err?.response?.data?.error || err.message || 'Arama sırasında hata oluştu');
      setResults([]);
      setTotal(0);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [q, species, adopted, page, limit]);

  // Debounced search whenever q/species/adopted/page changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch({ page: 1 }), 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, species, adopted]);

  // page change handling
  useEffect(() => {
    performSearch({ page });
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Hayvan Arama</h1>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="text-sm text-gray-600">Arama</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İsim, tür veya açıklama ile arayın..."
              className="mt-1 w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="w-48">
            <label className="text-sm text-gray-600">Tür (opsiyonel)</label>
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Kedi, Köpek..."
              className="mt-1 w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="w-40">
            <label className="text-sm text-gray-600">Durum</label>
            <select value={adopted} onChange={(e) => setAdopted(e.target.value)} className="mt-1 w-full border border-gray-200 rounded px-3 py-2">
              <option value="">Hepsi</option>
              <option value="false">Müsait</option>
              <option value="true">Sahiplendi</option>
            </select>
          </div>

          <div className="md:w-40">
            <button
              onClick={() => { setPage(1); performSearch({ page: 1 }); }}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ara
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center"><LoadingSpinner /></div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-600">Toplam sonuç: {total} — Sayfa {page}/{totalPages}</div>

          {results.length === 0 ? (
            <div className="bg-white p-6 rounded shadow text-gray-600">Eşleşen hayvan bulunamadı.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.map(a => (
                <AnimalCard key={a.id} animal={a} onAdopt={() => window.location.href = `/adopt?animal=${a.id}`} />
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">Sayfa {page} / {totalPages}</div>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded border bg-white">Önceki</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded border bg-white">Sonraki</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

