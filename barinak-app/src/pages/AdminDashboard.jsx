// src/pages/AdminDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import AnimalTable from "../components/admin/AnimalTable";
import EditModal from "../components/admin/EditModal";
import DeleteConfirm from "../components/admin/DeleteConfirm";
import AdoptionRequests from "../components/admin/AdoptionRequests";
import api from "../services/api";
import { useNotifications } from "../contexts/NotificationContext";
import { formatRelativeTime, formatDateTR } from "../utils/dateUtils";

export default function AdminDashboard() {
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState('animals');
  const [_showImportModal, _setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('csv');
  const [cacheStats, setCacheStats] = useState(null);

  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // ref for notification panel click-outside handling
  const notificationRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [expandedNotifId, setExpandedNotifId] = useState(null);
  const [animalNameCache, setAnimalNameCache] = useState({});
  const [loadingAnimalId, setLoadingAnimalId] = useState(null);

  async function loadAnimals() {
    try {
      setLoading(true);
      const res = await api.get('/animals');
      setAnimals(res.data || []);
    } catch (err) {
      setError('Hayvan listesi yüklenemedi: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnimals();
  }, []);

  // Click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  async function ensureAnimalName(animalId) {
    if (!animalId || animalNameCache[animalId]) return;
    try {
      setLoadingAnimalId(animalId);
      const res = await api.get(`/animals/${animalId}`);
      const name = res?.data?.name || '';
      setAnimalNameCache(prev => ({ ...prev, [animalId]: name }));
    } catch (e) {
      // ignore
    } finally {
      setLoadingAnimalId(null);
    }
  }

  const handleEdit = (animal) => {
    setSelectedAnimal(animal);
    setShowEditModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  async function saveAnimal(updated) {
    try {
      const payload = {
        name: updated.name,
        species: updated.species,
        age: updated.age,
        imageurl: updated.imageUrl || updated.imageurl || null,
        adopted: !!updated.adopted,
      };
      if (updated.id) {
        await api.put(`/animals/${updated.id}`, payload);
      } else {
        await api.post(`/animals`, payload);
      }
      setShowEditModal(false);
      setSelectedAnimal(null);
      await loadAnimals();
    } catch (err) {
      alert('Güncelleme başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(`/animals/${deleteId}`);
      setDeleteId(null);
      await loadAnimals();
    } catch (err) {
      alert('Silme başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function handleExport(format) {
    try {
      let url = `/api/import-export/export/${format}`;
      const link = document.createElement('a');
      link.href = url;
      link.download = `hayvanlar.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Export işlemi başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function loadCacheStats() {
    try {
      const res = await api.get('/api/cache/stats');
      setCacheStats(res.data);
    } catch (err) {
      console.error('Cache stats yüklenemedi:', err);
    }
  }

  async function clearCacheStats() {
    try {
      await api.post('/api/cache/clear');
      setCacheStats(null);
    } catch (err) {
      console.error('Cache stats temizlenemedi:', err);
    }
  }

  async function warmCache() {
    try {
      await api.post('/api/cache/warm');
      alert('Cache başarıyla önceden yüklendi');
    } catch (err) {
      alert('Cache warming başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  async function handleImport() {
    if (!importFile) return;
    const form = new FormData();
    form.append('file', importFile);
    try {
      setImportLoading(true);
      const res = await api.post(`/import-export/import/${importType}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const msg = res?.data?.message || 'İçe aktarma başarılı';
      const imported = res?.data?.imported;
      const errors = res?.data?.errors;
      alert(imported != null ? `${msg} (Başarılı: ${imported}${errors != null ? `, Hatalı: ${errors}` : ''})` : msg);
      setImportFile(null);
      await loadAnimals();
    } catch (err) {
      alert('İçe aktarma başarısız: ' + (err?.response?.data?.error || err.message));
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Admin Paneli</h1>

          {/* Bildirim Butonu */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29V4A2,2 0 0,1 12,2A2,2 0 0,1 14,4V4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A1,1 0 0,1 13,22H11A1,1 0 0,1 10,21H14M12,4A4,4 0 0,0 8,8V15H16V8A4,4 0 0,0 12,4Z"/>
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Bildirim Paneli */}
            {showNotifications && (
              <div ref={notificationRef} className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Bildirimler</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Tümünü Okundu İşaretle
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">Henüz bildirim yok</p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                          !notification.read ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => {
                          markAsRead(notification.id);
                          setExpandedNotifId(prev => prev === notification.id ? null : notification.id);
                          if (notification?.data?.animal_id) {
                            ensureAnimalName(notification.data.animal_id);
                          }
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatRelativeTime(notification.created_at)}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-2"></div>
                          )}
                        </div>
                        {expandedNotifId === notification.id && (
                          <div className="mt-3 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded p-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <div className="font-semibold">İstek ID:</div>
                              <div>{notification?.data?.adoption_request_id ?? '-'}</div>
                              <div className="font-semibold">Hayvan ID:</div>
                              <div>{notification?.data?.animal_id ?? '-'}</div>
                              <div className="font-semibold">Hayvan Adı:</div>
                              <div>
                                {notification?.data?.animal_name || (
                                  notification?.data?.animal_id
                                    ? (loadingAnimalId === notification.data.animal_id
                                        ? 'Yükleniyor...'
                                        : (animalNameCache[notification.data.animal_id] || '—')
                                      )
                                    : '—'
                                )}
                              </div>
                              <div className="font-semibold">Oluşturulma:</div>
                              <div>{formatDateTR(notification.created_at)}</div>
                              <div className="font-semibold">Tip:</div>
                              <div>{notification.type}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <>
           {loading && <div className="text-center text-gray-500">Yükleniyor...</div>}
           {error && <div className="text-center text-red-600 font-semibold mb-4">{error}</div>}
         </>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-4">
            <button
              onClick={() => setActiveTab('animals')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'animals' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Hayvanlar
            </button>
            <button
              onClick={() => setActiveTab('adoptions')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'adoptions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Sahiplenme İstekleri
            </button>
            <button
              onClick={() => setActiveTab('import-export')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'import-export' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              İçe/Dışa Aktarma
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'animals' && (
          <AnimalTable animals={animals} onEdit={handleEdit} onDelete={handleDelete} />
        )}

        {activeTab === 'adoptions' && (
          <AdoptionRequests />
        )}

        {activeTab === 'import-export' && (
          <div className="space-y-8">
            {/* Cache Statistics */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Redis Cache Performansı</h3>
                <div className="flex gap-2">
                  <button
                    onClick={loadCacheStats}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Yenile
                  </button>
                  <button
                    onClick={clearCacheStats}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Sıfırla
                  </button>
                  <button
                    onClick={warmCache}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Önceden Yükle
                  </button>
                </div>
              </div>

              {cacheStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{cacheStats.hits}</div>
                    <div className="text-sm text-green-800">Cache Hit</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{cacheStats.misses}</div>
                    <div className="text-sm text-red-800">Cache Miss</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{cacheStats.hitRate}</div>
                    <div className="text-sm text-blue-800">Hit Oranı</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{cacheStats.totalRequests}</div>
                    <div className="text-sm text-purple-800">Toplam İstek</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Cache istatistikleri yükleniyor...</p>
              )}
            </div>

            {/* Export Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Veri Dışa Aktarma</h3>
              <p className="text-gray-600 mb-4">Tüm hayvan verilerini CSV veya Excel formatında dışa aktarabilirsiniz.</p>

              <div className="flex gap-4">
                <button
                  onClick={() => handleExport('csv')}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2h3m-3 0h-3m-6 0H3m0 0v3m0-3v-3" />
                  </svg>
                  CSV Olarak İndir
                </button>

                <button
                  onClick={() => handleExport('excel')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l4-4m-4 4l-4-4m8 2h3m-3 0h-3m-6 0H3m0 0v3m0-3v-3" />
                  </svg>
                  Excel Olarak İndir
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Veri İçe Aktarma</h3>
              <p className="text-gray-600 mb-4">CSV veya Excel dosyasından hayvan verilerini toplu olarak içe aktarabilirsiniz.</p>

              {/* Yardım kutusu */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-900">
                <div className="font-semibold mb-2">Excel dosyası nasıl olmalı?</div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gerekli sütunlar: <strong>Hayvan Adı</strong>, <strong>Tür</strong></li>
                  <li>Opsiyonel sütunlar: Yaş, Açıklama, Resim URL, Sahiplendi</li>
                  <li>"Sahiplendi" için geçerli değerler: <em>Evet/Hayır</em> veya <em>true/false</em> ya da <em>1/0</em></li>
                  <li>Hazır şablonu indirmek için aşağıdaki butonu kullanabilirsiniz.</li>
                </ul>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await api.get('/import-export/template/excel', { responseType: 'blob' });
                        const url = window.URL.createObjectURL(new Blob([res.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'hayvan_import_sablon.xlsx');
                        document.body.appendChild(link);
                        link.click();
                        link.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (e) {
                        alert('Şablon indirilemedi: ' + (e?.response?.data?.error || e.message));
                      }
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded"
                  >
                    Excel Şablonunu İndir
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosya Formatı</label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="csv">CSV Dosyası</option>
                    <option value="excel">Excel Dosyası</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dosya Seçin</label>
                  <input
                    type="file"
                    accept={importType === 'csv' ? '.csv' : '.xlsx,.xls'}
                    onChange={(e) => setImportFile(e.target.files[0])}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                  className={`w-full py-3 px-4 rounded-lg flex items-center justify-center gap-2 ${
                    !importFile || importLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600'
                  } text-white`}
                >
                  {importLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Aktarılıyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Verileri Aktar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showEditModal && (
        <EditModal
          animal={selectedAnimal}
          onClose={() => setShowEditModal(false)}
          onSave={saveAnimal}
        />
      )}
      {deleteId && (
        <DeleteConfirm
          animalName={(animals.find(a => a.id === deleteId) || {}).name || "Seçilen Hayvan"}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
