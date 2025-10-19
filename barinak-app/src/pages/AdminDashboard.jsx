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
  const [systemStats, setSystemStats] = useState(null);
  const [queueStats, setQueueStats] = useState(null);

  // Import states
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);

  // ID Search states
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

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
    } catch {
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
      const res = await api.get('/cache/stats');
      setCacheStats(res.data);
    } catch (err) {
      console.error('Cache stats yüklenemedi:', err);
      setCacheStats({ error: err?.response?.data?.error || err.message || String(err) });
    }
  }

  async function clearCacheStats() {
    try {
      await api.post('/cache/clear');
      setCacheStats(null);
    } catch (err) {
      console.error('Cache stats temizlenemedi:', err);
    }
  }

  async function warmCache() {
    try {
      await api.post('/cache/warm');
      alert('Cache başarıyla önceden yüklendi');
    } catch (err) {
      alert('Cache warming başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  // Poll cache stats every 10 seconds while admin panel is open
  useEffect(() => {
    let mounted = true;
    let interval = null;
    (async () => {
      if (!mounted) return;
      await loadCacheStats();
      interval = setInterval(() => {
        loadCacheStats();
      }, 10000);
    })();
    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, []);

  // Load system stats
  async function loadSystemStats() {
    try {
      const res = await api.get('/system/stats');
      setSystemStats(res.data);
    } catch (err) {
      console.error('System stats yüklenemedi:', err);
      setSystemStats({ error: err?.response?.data?.error || err.message || String(err) });
    }
  }

  // ID ile hayvan arama
  async function searchAnimalById() {
    if (!searchId || searchId.trim() === '') {
      setSearchError('Lütfen bir ID girin');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);

    try {
      const res = await api.get(`/animals/search/${searchId.trim()}`);
      setSearchResult(res.data);
    } catch (err) {
      console.error('ID ile arama hatası:', err);
      if (err.response?.status === 404) {
        setSearchError('Bu ID\'ye sahip hayvan bulunamadı');
      } else {
        setSearchError(err?.response?.data?.error || 'Arama sırasında hata oluştu');
      }
    } finally {
      setSearchLoading(false);
    }
  }

  // Arama sonucunu düzenle
  const handleEditSearchResult = () => {
    if (searchResult) {
      setSelectedAnimal(searchResult);
      setShowEditModal(true);
    }
  };

  // Arama sonucunu sil
  const handleDeleteSearchResult = () => {
    if (searchResult) {
      setDeleteId(searchResult.id);
    }
  };

  // Poll system stats every 5 seconds when monitoring tab is active
  useEffect(() => {
    if (activeTab !== 'monitoring') return;
    
    let mounted = true;
    let interval = null;
    (async () => {
      if (!mounted) return;
      await loadSystemStats();
      interval = setInterval(() => {
        loadSystemStats();
      }, 5000);
    })();
    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, [activeTab]);

  // Load queue stats
  async function loadQueueStats() {
    try {
      const res = await api.get('/import-export/queue/status');
      setQueueStats(res.data);
    } catch (err) {
      console.error('Queue stats yüklenemedi:', err);
      setQueueStats({ error: err?.response?.data?.error || err.message || String(err) });
    }
  }

  // Poll queue stats every 3 seconds when import-export tab is active
  useEffect(() => {
    if (activeTab !== 'import-export') return;
    
    let mounted = true;
    let interval = null;
    (async () => {
      if (!mounted) return;
      await loadQueueStats();
      interval = setInterval(() => {
        loadQueueStats();
      }, 3000);
    })();
    return () => { mounted = false; if (interval) clearInterval(interval); };
  }, [activeTab]);

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
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`px-3 py-2 text-sm font-medium ${activeTab === 'monitoring' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              Sistem İzleme
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'animals' && (
          <>
            {/* ID ile Arama Bölümü */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ID ile Hayvan Arama</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="searchId" className="block text-sm font-medium text-gray-700 mb-2">
                    Hayvan ID
                  </label>
                  <input
                    type="number"
                    id="searchId"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder="Örn: 123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        searchAnimalById();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={searchAnimalById}
                  disabled={searchLoading}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-2 rounded-md flex items-center gap-2"
                >
                  {searchLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Arıyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Ara
                    </>
                  )}
                </button>
              </div>

              {searchError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Hayvan Bulundu!</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>ID:</strong> {searchResult.id}</div>
                        <div><strong>İsim:</strong> {searchResult.name}</div>
                        <div><strong>Tür:</strong> {searchResult.species}</div>
                        <div><strong>Yaş:</strong> {searchResult.age}</div>
                        <div><strong>Durum:</strong> {searchResult.adopted ? 'Sahiplendirildi' : 'Sahiplendirilebilir'}</div>
                        <div><strong>Ekleme Tarihi:</strong> {new Date(searchResult.created_at).toLocaleDateString('tr-TR')}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={handleEditSearchResult}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={handleDeleteSearchResult}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                  {searchResult.imageurl && (
                    <div className="mt-3">
                      <img 
                        src={searchResult.imageurl} 
                        alt={searchResult.name}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  // show a generic confirm modal for bulk delete
                  const ok = window.confirm('Tüm hayvanları kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.');
                  if (!ok) return;
                  (async () => {
                    try {
                      await api.delete('/animals/all');
                      alert('Tüm hayvanlar silindi');
                      await loadAnimals();
                    } catch (e) {
                      alert('Toplu silme başarısız: ' + (e?.response?.data?.error || e.message));
                    }
                  })();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded mr-4"
              >
                Tümünü Sil
              </button>
            </div>
            <AnimalTable animals={animals} onEdit={handleEdit} onDelete={handleDelete} />
          </>
        )}

        {activeTab === 'adoptions' && (
          <AdoptionRequests />
        )}

        {activeTab === 'import-export' && (
          <div className="space-y-8">
            {/* Queue Status */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">İş Kuyruğu Durumu</h3>
                <button
                  onClick={loadQueueStats}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Yenile
                </button>
              </div>

              {queueStats && queueStats.error ? (
                <div className="p-4 text-red-600 bg-red-50 rounded-lg">
                  Kuyruk durumu alınamadı: {queueStats.error}
                </div>
              ) : queueStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Import Queue */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-3">Excel/CSV İçe Aktarma</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bekleyen:</span>
                        <span className="font-semibold text-orange-600">{queueStats.import?.counts?.waiting || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>İşleniyor:</span>
                        <span className="font-semibold text-blue-600">{queueStats.import?.counts?.active || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tamamlanan:</span>
                        <span className="font-semibold text-green-600">{queueStats.import?.counts?.completed || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Başarısız:</span>
                        <span className="font-semibold text-red-600">{queueStats.import?.counts?.failed || 0}</span>
                      </div>
                    </div>
                    
                    {(queueStats.import?.counts?.waiting || 0) > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>İlerleme</span>
                          <span>{Math.round(((queueStats.import?.counts?.completed || 0) / ((queueStats.import?.counts?.completed || 0) + (queueStats.import?.counts?.waiting || 0) + (queueStats.import?.counts?.active || 0))) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round(((queueStats.import?.counts?.completed || 0) / ((queueStats.import?.counts?.completed || 0) + (queueStats.import?.counts?.waiting || 0) + (queueStats.import?.counts?.active || 0))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Queue */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-3">Fotoğraf Optimizasyonu</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Bekleyen:</span>
                        <span className="font-semibold text-orange-600">{queueStats.imageOptimize?.counts?.waiting || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>İşleniyor:</span>
                        <span className="font-semibold text-blue-600">{queueStats.imageOptimize?.counts?.active || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tamamlanan:</span>
                        <span className="font-semibold text-green-600">{queueStats.imageOptimize?.counts?.completed || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Başarısız:</span>
                        <span className="font-semibold text-red-600">{queueStats.imageOptimize?.counts?.failed || 0}</span>
                      </div>
                    </div>

                    {(queueStats.imageOptimize?.counts?.waiting || 0) > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>İlerleme</span>
                          <span>{Math.round(((queueStats.imageOptimize?.counts?.completed || 0) / ((queueStats.imageOptimize?.counts?.completed || 0) + (queueStats.imageOptimize?.counts?.waiting || 0) + (queueStats.imageOptimize?.counts?.active || 0))) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.round(((queueStats.imageOptimize?.counts?.completed || 0) / ((queueStats.imageOptimize?.counts?.completed || 0) + (queueStats.imageOptimize?.counts?.waiting || 0) + (queueStats.imageOptimize?.counts?.active || 0))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Kuyruk durumu yükleniyor...</span>
                </div>
              )}
            </div>
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

              {cacheStats && cacheStats.error ? (
                <div className="p-4 text-red-600">Cache istatistikleri alınamadı: {cacheStats.error}</div>
              ) : cacheStats && cacheStats.cache ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{cacheStats.cache.hits}</div>
                      <div className="text-sm text-green-800">Cache Hit</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{cacheStats.cache.misses}</div>
                      <div className="text-sm text-red-800">Cache Miss</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{cacheStats.cache.hitRate}</div>
                      <div className="text-sm text-blue-800">Hit Oranı</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-sm text-gray-600">Toplam İstek</div>
                      <div className="text-xl font-bold">{cacheStats.cache.totalRequests}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-sm text-gray-600">Cache Set</div>
                      <div className="text-xl font-bold">{cacheStats.cache.sets}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="text-sm text-gray-600">Hata</div>
                      <div className="text-xl font-bold text-red-600">{cacheStats.cache.errors}</div>
                    </div>
                  </div>

                  {/* Redis details */}
                  <div className="bg-white p-4 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-600">Redis Durumu</div>
                        <div className={`font-bold ${cacheStats.redis && cacheStats.redis.parsed && cacheStats.redis.parsed.connected ? 'text-green-600' : 'text-red-600'}`}>
                          {cacheStats.redis && cacheStats.redis.parsed && cacheStats.redis.parsed.connected ? 'Connected' : 'Disconnected'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Sürüm</div>
                        <div className="font-semibold">{cacheStats.redis && cacheStats.redis.parsed && cacheStats.redis.parsed.redisVersion ? cacheStats.redis.parsed.redisVersion : '-'}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Bellek</div>
                        <div className="font-medium">{cacheStats.redis && cacheStats.redis.parsed && cacheStats.redis.parsed.memory ? cacheStats.redis.parsed.memory : '-'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Anahtar Sayısı (db0)</div>
                        <div className="font-medium">{cacheStats.redis && cacheStats.redis.parsed && cacheStats.redis.parsed.keyCount != null ? cacheStats.redis.parsed.keyCount : '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Son güncelleme: {new Date().toLocaleString('tr-TR')}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">Cache istatistikleri yükleniyor...</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'import-export' && (
          <div>
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
                      Kuyruğa Ekleniyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Kuyruğa Ekle ve İşle
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            {systemStats && systemStats.error ? (
              <div className="p-4 text-red-600 bg-red-50 rounded-lg">
                Sistem istatistikleri alınamadı: {systemStats.error}
              </div>
            ) : systemStats ? (
              <>
                {/* System Resources */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Sistem Kaynakları</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-blue-600">Bellek Kullanımı</div>
                          <div className="text-2xl font-bold text-blue-800">{systemStats.system.memory.usagePercent}%</div>
                          <div className="text-xs text-blue-600">{systemStats.system.memory.used} / {systemStats.system.memory.total}</div>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-green-600">CPU Yükü</div>
                          <div className="text-2xl font-bold text-green-800">{systemStats.system.cpu.loadAverage}</div>
                          <div className="text-xs text-green-600">{systemStats.system.cpu.cores} çekirdek</div>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-purple-600">Çalışma Süresi</div>
                          <div className="text-lg font-bold text-purple-800">{systemStats.system.uptime.formatted}</div>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Stats */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Veritabanı İstatistikleri</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-2xl font-bold text-gray-800">{systemStats.database.total_animals || 0}</div>
                      <div className="text-sm text-gray-600">Toplam Hayvan</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">{systemStats.database.adopted_animals || 0}</div>
                      <div className="text-sm text-green-700">Sahiplenildi</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">{systemStats.database.total_users || 0}</div>
                      <div className="text-sm text-blue-700">Toplam Kullanıcı</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">{systemStats.database.total_requests || 0}</div>
                      <div className="text-sm text-yellow-700">Başvuru</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded">
                      <div className="text-2xl font-bold text-orange-600">{systemStats.database.pending_requests || 0}</div>
                      <div className="text-sm text-orange-700">Bekleyen</div>
                    </div>
                  </div>
                </div>

                {/* Active Users */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Aktif Kullanıcılar ({systemStats.activeUsers.length})
                  </h3>
                  {systemStats.activeUsers.length > 0 ? (
                    <div className="space-y-2">
                      {systemStats.activeUsers.map((user, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${user.role === 'admin' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <span className="font-medium">{user.username}</span>
                            <span className={`px-2 py-1 text-xs rounded ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {user.role}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(user.lastSeen).toLocaleTimeString('tr-TR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Şu anda aktif kullanıcı yok</p>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Performans</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Ortalama Yanıt Süresi</span>
                        <span className="font-semibold">{systemStats.response.avgResponseTime.toFixed(0)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Toplam İstek</span>
                        <span className="font-semibold">{systemStats.response.requestCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hata Oranı</span>
                        <span className="font-semibold text-red-600">{systemStats.response.errorRate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Disk Kullanımı</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Upload Dosyaları</span>
                        <span className="font-semibold">{systemStats.disk.uploadFiles || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Toplam Boyut</span>
                        <span className="font-semibold">{systemStats.disk.uploadSize || '0 MB'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  Son güncelleme: {new Date(systemStats.timestamp).toLocaleString('tr-TR')}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Sistem istatistikleri yükleniyor...</span>
              </div>
            )}
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
