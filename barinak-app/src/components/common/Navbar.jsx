import React, { useEffect, useState, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatRelativeTime, formatDateTR } from '../../utils/dateUtils';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [animalNameCache, setAnimalNameCache] = useState({});
  const [loadingAnimalId, setLoadingAnimalId] = useState(null);
  const notificationRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (!t) return;
      const payload = JSON.parse(atob(t.split('.')[1]));
      setUser(payload);
    } catch {
      setUser(null);
    }
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

  function logout() {
    localStorage.removeItem('token');
    window.location.reload();
  }

  return (
    <nav className="bg-white shadow-md py-2 px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src="/vite.svg" alt="Logo" className="h-8 w-8" />
        <span className="text-xl font-bold text-gray-800">BarınakApp</span>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Ana Sayfa</Link>
        <Link to="/animals" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Hayvanlar</Link>
        <Link to="/search" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Ara</Link>
        <Link to="/adopt" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Sahiplen</Link>
        {user && user.role === 'admin' && (
          <Link to="/admin" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">Admin</Link>
        )}
        {user ? (
          <>
            <Link to="/my-requests" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition">İsteklerim</Link>

            <div className="relative flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                }}
                className="relative p-1 text-gray-600 hover:text-gray-800 focus:outline-none"
                aria-label="Bildirimler"
              >
                <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29V4A2,2 0 0,1 12,2A2,2 0 0,1 14,4V4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A1,1 0 0,1 13,22H11A1,1 0 0,1 10,21H14M12,4A4,4 0 0,0 8,8V15H16V8A4,4 0 0,0 12,4Z"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Oturum açmış kullanıcının adı (çan düğmesinin hemen yanında) */}
              {user && (
                <span className="text-sm text-gray-700 font-medium truncate max-w-[120px]" title={user.username || user.name || ''}>
                  {user.username || user.name}
                </span>
              )}

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

            <button onClick={logout} className="text-red-600 text-sm font-medium">Çıkış</button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-blue-600 transition">Giriş</Link>
            <Link to="/register" className="hover:text-blue-600 transition">Kayıt</Link>
          </>
        )}
      </div>
    </nav>
  );
}
