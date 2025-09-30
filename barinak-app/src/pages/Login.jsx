import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api, { setAuthToken } from '../services/api';

export default function Login() {
  // Eski token’ı temizle (login sayfasına gelince bir kez çalışır)
  useEffect(() => {
    setAuthToken(null);
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const redirect = params.get('redirect') || '/';

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api.post('/users/login', { username, password });
      setAuthToken(res.data.token);
      // Professional UX: If no explicit redirect and user is admin, go to /admin
      const user = res?.data?.user;
      if (!user) {
        window.location.href = redirect || '/';
        return;
      }
      if (!redirect || redirect === '/' || redirect === '%2F') {
        if (user.role === 'admin') {
          window.location.href = '/admin';
          return;
        }
      }
      window.location.href = redirect || '/';
    } catch (err) {
      setStatus('Giriş başarısız: ' + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Giriş Yap</h2>
      <form onSubmit={submit}>
        <input className="w-full p-2 border rounded mb-2" placeholder="Kullanıcı adı" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Parola" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Giriş</button>
      </form>
      {status && <p className="mt-4 text-red-600">{status}</p>}
    </div>
  );
}
