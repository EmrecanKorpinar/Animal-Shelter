const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const pool = require('../db/pool');

async function register(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    const existing = await User.getByUsername(username);
    if (existing) return res.status(409).json({ error: 'username taken' });
    const hash = await bcrypt.hash(password, 10);
    const created = await User.create({ username, password: hash });
    res.status(201).json({ id: created.id, username: created.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const jwt = require('jsonwebtoken');
// Lokal sabit gizli anahtar (dev ortamı için)
const JWT_SECRET = 'devsecret';

async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.getByUsername(username);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
    const payload = { id: user.id, username: user.username, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    // Record an application session (for active sessions view)
    try {
      const ua = req.headers['user-agent'] || null;
      const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '').toString();
      await pool.query(
        'INSERT INTO user_sessions (user_id, user_agent, ip) VALUES ($1, $2, $3)',
        [user.id, ua, ip]
      );
    } catch (e) {
      // do not block login if session write fails
    }
    res.json({ token, user: payload });
  } catch (err) {
    let msg = 'internal error';
    if (err && (err.code === 'ECONNREFUSED')) msg = 'veritabanına bağlanılamadı';
    else if (err && (err.code === '42P01')) msg = 'veritabanı şeması eksik (migrasyonlar çalıştırılmalı)';
    else if (err && (err.code === 'ETIMEDOUT' || /timeout/i.test(err.message || ''))) msg = 'veritabanı zaman aşımı';
    else if (err && err.message) msg = err.message;
    res.status(500).json({ error: msg, code: err?.code });
  }
}

async function list(req, res) {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    const updated = await User.update(id, data);
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    const deleted = await User.remove(id);
    if (!deleted) return res.status(404).json({ error: 'not found' });
    res.json({ deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function logout(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    await pool.query(
      'UPDATE user_sessions SET expires_at = NOW() WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())',
      [req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { register, login, list, update, remove, logout };
