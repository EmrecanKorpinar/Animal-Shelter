import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'success', duration = 4000, onClose }) => {
  // Başarılı toast'ları hiç göstermiyoruz
  if (type === 'success') return null;

  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animasyon için hafif gecikme
    const timer = setTimeout(() => setIsVisible(true), 100);

    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => {
        onClose();
      }, 300); // Animasyon süresi
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [duration, onClose]);

  const getToastStyles = () => {
    // 30px daha aşağıda göstermek için top-4 yerine top-[64px] kullanıldı
    const baseStyles = "fixed top-[64px] right-4 z-50 max-w-sm w-full p-4 rounded-lg shadow-lg transition-all duration-300";

    if (isLeaving) {
      return `${baseStyles} transform translate-x-full opacity-0`;
    }

    if (isVisible) {
      return `${baseStyles} transform translate-x-0 opacity-100`;
    }

    return `${baseStyles} transform translate-x-full opacity-0`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={getToastStyles()} role="alert">
      <div className="flex items-center">
        {getIcon()}
        <span className="ml-3 text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
