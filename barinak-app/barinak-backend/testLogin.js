(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'adminpass' })
    });
    console.log('Status:', res.status);
    const text = await res.text();
    try { console.log('Body (parsed):', JSON.parse(text)); }
    catch { console.log('Body (raw):', text); }
  } catch (e) {
    console.error('Request failed:', e.message || e);
  }
})();
