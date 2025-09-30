import React, { useState } from 'react';
import api, { setAuthToken } from '../services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/users/register', { username, password });
      // auto-login after register
      const login = await api.post('/users/login', { username, password });
      setAuthToken(login.data.token);
      window.location.href = '/';
    } catch (err) {
      setStatus('Hata: ' + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-8 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Kayıt Ol</h2>
      <form onSubmit={submit}>
        <input className="w-full p-2 border rounded mb-2" placeholder="Kullanıcı adı" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Parola" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Kayıt</button>
      </form>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
