import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function getPayload() {
  try {
    const t = localStorage.getItem('token');
    if (!t) return null;
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

export default function RequireAdmin({ children }) {
  const loc = useLocation();
  const payload = getPayload();
  if (!payload) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (payload.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}
