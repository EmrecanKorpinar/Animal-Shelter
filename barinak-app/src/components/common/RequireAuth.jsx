import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

function getToken() {
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
}

export default function RequireAuth({ children }) {
  const loc = useLocation();
  const token = getToken();
  if (!token) {
    const redirect = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return children;
}
