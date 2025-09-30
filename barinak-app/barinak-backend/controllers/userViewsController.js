/* eslint-env node */
const UserViews = require('../models/userViewsModel');

const addView = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animalId } = req.body;
    if (!animalId) return res.status(400).json({ error: 'animalId zorunlu' });
    const view = await UserViews.addView(userId, animalId);
    res.json({ success: true, view });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getViewedAnimals = async (req, res) => {
  try {
    const userId = req.user.id;
    const animals = await UserViews.getViewedAnimals(userId);
    res.json({ success: true, animals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getViewCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await UserViews.getViewCount(userId);
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { addView, getViewedAnimals, getViewCount };
