import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';
import { formatRelativeTime, formatDateTR } from '../utils/dateUtils';
import ConfirmationModal from '../components/common/ConfirmationModal';

export default function MyRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const notificationRef = useRef(null);

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [expandedId, setExpandedId] = useState(null);
  const [animalNameCache, setAnimalNameCache] = useState({});
  const [loadingAnimalId, setLoadingAnimalId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const res = await api.get('/adoption_requests/mine');
      setItems(res.data || []);
    } catch (err) {
      setError('İstekler yüklenemedi: ' + (err?.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // decode username from token for success page payload
    try {
      const t = localStorage.getItem('token');
      if (t) {
        const payload = JSON.parse(atob(t.split('.')[1]));
        if (payload?.username) setUsername(payload.username);
      }
    } catch {}
    load();
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

  async function cancel(id) {
    setSelectedRequestId(id);
    setShowConfirmModal(true);
  }

  async function confirmCancel() {
    try {
      await api.delete(`/adoption_requests/mine/${selectedRequestId}`);
      await load();
      setShowConfirmModal(false);
      setSelectedRequestId(null);
    } catch (err) {
      alert('İptal başarısız: ' + (err?.response?.data?.error || err.message));
      setShowConfirmModal(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Sahiplenme İsteklerim</h2>

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
                        setExpandedId(prev => prev === notification.id ? null : notification.id);
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
                      {expandedId === notification.id && (
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

      {loading && <div className="text-gray-500">Yükleniyor...</div>}
      {error && <div className="text-red-600 font-semibold mb-2">{error}</div>}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">ID</th>
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
                    {r.status === 'approved' ? 'Onaylandı' : r.status === 'rejected' ? 'Reddedildi' : 'Bekliyor'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => cancel(r.id)}
                      disabled={r.status !== 'pending'}
                      className={`px-3 py-1 rounded text-xs text-white ${r.status !== 'pending' ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`}
                    >İptal</button>
                    {/* Teşekkür butonu kaldırıldı. Teşekkürler Köşesi herkese açık /sahiplen sayfasında gösterilmektedir. */}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>Henüz sahiplenme isteğiniz yok</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedRequestId(null);
          }}
          onConfirm={confirmCancel}
          title="İsteği İptal Et"
          message="Bu sahiplenme isteğini iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
          confirmText="Evet, İptal Et"
          cancelText="Vazgeç"
        />
      )}
    </div>
  );
}
