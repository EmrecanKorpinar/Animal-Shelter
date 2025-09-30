const Notification = require('../models/notificationModel');

async function getMine(req, res) {
  try {
    const user_id = req.user.id;
    const notifications = await Notification.getByUser(user_id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getUnreadCount(req, res) {
  try {
    const user_id = req.user.id;
    const count = await Notification.getUnreadCount(user_id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function markAsRead(req, res) {
  try {
    const user_id = req.user.id;
    const id = Number(req.params.id);
    const updated = await Notification.markAsRead(id, user_id);
    if (!updated) return res.status(404).json({ error: 'Notification not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    const user_id = req.user.id;
    const count = await Notification.markAllAsRead(user_id);
    res.json({ updated: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const user_id = req.user.id;
    const id = Number(req.params.id);
    const deleted = await Notification.remove(id, user_id);
    if (!deleted) return res.status(404).json({ error: 'Notification not found' });
    res.json({ deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createNotification(user_id, type, title, message, data = {}) {
  try {
    return await Notification.create({ user_id, type, title, message, data });
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}

module.exports = {
  getMine,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  remove,
  createNotification
};
