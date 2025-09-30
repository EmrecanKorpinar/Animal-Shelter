const Adoption = require('../models/adoptionModel');
const Animal = require('../models/animalModel');
const { publishAdoptionApproved, publishAdoptionRejected, publishAnimalAdopted, invalidateCache } = require('../utils/pubsub');
const { createNotification } = require('./notificationController');

async function create(req, res) {
  try {
    const user_id = req.user.id;
    const { animal_id, message } = req.body;

    // Validation
    if (!animal_id) {
      return res.status(400).json({
        error: 'Hayvan ID\'si gereklidir',
        details: 'Lütfen sahiplenmek istediğiniz hayvanı seçin'
      });
    }

    if (isNaN(animal_id) || animal_id <= 0) {
      return res.status(400).json({
        error: 'Geçersiz hayvan ID\'si',
        details: 'Lütfen geçerli bir hayvan ID\'si girin (pozitif sayı olmalı)'
      });
    }

    // Aynı kullanıcı aynı hayvan için zaten pending istek var mı kontrol et
    const existingRequests = await Adoption.getByUser(user_id);
    const hasPendingRequest = existingRequests.some(request =>
      request.animal_id === parseInt(animal_id) && request.status === 'pending'
    );

    if (hasPendingRequest) {
      return res.status(409).json({
        error: 'Zaten bekleyen isteğiniz var',
        details: 'Bu hayvan için zaten bir sahiplenme isteğiniz bulunuyor. Lütfen admin onayını bekleyin veya mevcut isteğinizi iptal edin.',
        existing_request: true
      });
    }

    const created = await Adoption.create({ user_id, animal_id, message });

    // WebSocket bildirimi gönder
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers') || new Map();

    // Kullanıcıya bildirim gönder
    if (connectedUsers.has(user_id)) {
      io.to(connectedUsers.get(user_id)).emit('notification', {
        type: 'adoption_request_created',
        title: 'Sahiplenme İsteği Gönderildi',
        message: 'Sahiplenme isteğiniz başarıyla gönderildi. Admin onayı bekleniyor.',
        data: { adoption_request_id: created.id, animal_id }
      });
    }

    // Veritabanına bildirim kaydet
    await createNotification(user_id, 'adoption_request_created', 'Sahiplenme İsteği Gönderildi',
      'Sahiplenme isteğiniz başarıyla gönderildi. Admin onayı bekleniyor.', { adoption_request_id: created.id, animal_id });

    res.status(201).json(created);
  } catch (err) {
    console.error('Adoption create error:', err);

    // Özel hata mesajları
    if (err.code === '23503') { // Foreign key constraint
      if (err.message.includes('animal_id')) {
        return res.status(400).json({
          error: 'Geçersiz hayvan',
          details: 'Seçtiğiniz hayvan bulunamadı. Lütfen başka bir hayvan seçin.'
        });
      }
      if (err.message.includes('user_id')) {
        return res.status(401).json({
          error: 'Oturum hatası',
          details: 'Lütfen tekrar giriş yapın'
        });
      }
    }

    if (err.message.includes('duplicate key')) {
      return res.status(409).json({
        error: 'Çoklu istek',
        details: 'Bu hayvan için zaten sahiplenme isteğiniz var. Lütfen bekleyin veya mevcut isteğinizi iptal edin.'
      });
    }

    res.status(500).json({
      error: 'İstek gönderilemedi',
      details: 'Bir hata oluştu. Lütfen tekrar deneyin veya admin ile iletişime geçin.'
    });
  }
}

async function list(req, res) {
  try {
    const rows = await Adoption.getAll();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listMine(req, res) {
  try {
    const user_id = req.user.id;
    const rows = await Adoption.getByUserWithDetails(user_id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function process(req, res) {
  try {
    const id = Number(req.params.id);
    const { action } = req.body; // 'approve' or 'reject'
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ error: 'invalid action' });
    const ar = await Adoption.getById(id);
    if (!ar) return res.status(404).json({ error: 'not found' });

    if (action === 'approve') {
      // mark animal adopted using safe helper
      await Animal.markAdopted(ar.animal_id, true, ar.user_id);
      const updated = await Adoption.updateStatus(id, 'approved');

      // Pub/Sub bildirimleri gönder
      await publishAdoptionApproved(id, ar.user_id, ar.animal_id);
      await publishAnimalAdopted(ar.animal_id, ar.user_id);

      // WebSocket bildirimi gönder
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers') || new Map();

      // Kullanıcıya bildirim gönder
      if (connectedUsers.has(ar.user_id)) {
        io.to(connectedUsers.get(ar.user_id)).emit('notification', {
          type: 'adoption_approved',
          title: 'Sahiplenme İsteğiniz Onaylandı!',
          message: 'Tebrikler! Sahiplenme isteğiniz admin tarafından onaylandı.',
          data: { adoption_request_id: id, animal_id: ar.animal_id }
        });
      }

      // Adminlere bildirim gönder
      connectedUsers.forEach((socketId, userId) => {
        // Bu kullanıcıyı admin olarak kontrol etmek için veritabanı sorgusu yapabiliriz
        // Şimdilik basit olarak tüm bağlı kullanıcılara bildirim gönderelim
        io.to(socketId).emit('notification', {
          type: 'adoption_processed',
          title: 'Sahiplenme İsteği İşlendi',
          message: `Sahiplenme isteği ${action === 'approve' ? 'onaylandı' : 'reddedildi'}`,
          data: { adoption_request_id: id, animal_id: ar.animal_id, action }
        });
      });

      // Veritabanına bildirim kaydet
      await createNotification(ar.user_id, 'adoption_approved', 'Sahiplenme İsteğiniz Onaylandı!',
        'Tebrikler! Sahiplenme isteğiniz admin tarafından onaylandı.', { adoption_request_id: id, animal_id: ar.animal_id });

      // Cache'i invalidate et
      await invalidateCache('animals:*');
      await invalidateCache(`animal:${ar.animal_id}`);

      return res.json(updated);
    } else {
      const updated = await Adoption.updateStatus(id, 'rejected');

      // Pub/Sub bildirimi gönder
      await publishAdoptionRejected(id, ar.user_id, ar.animal_id, 'Admin tarafından reddedildi');

      // WebSocket bildirimi gönder
      const io = req.app.get('io');
      const connectedUsers = req.app.get('connectedUsers') || new Map();

      if (connectedUsers.has(ar.user_id)) {
        io.to(connectedUsers.get(ar.user_id)).emit('notification', {
          type: 'adoption_rejected',
          title: 'Sahiplenme İsteğiniz Reddedildi',
          message: 'Üzgünüz, sahiplenme isteğiniz admin tarafından reddedildi.',
          data: { adoption_request_id: id, animal_id: ar.animal_id }
        });
      }

      // Veritabanına bildirim kaydet
      await createNotification(ar.user_id, 'adoption_rejected', 'Sahiplenme İsteğiniz Reddedildi',
        'Üzgünüz, sahiplenme isteğiniz admin tarafından reddedildi.', { adoption_request_id: id, animal_id: ar.animal_id });

      // Cache'i invalidate et ki hayvan listesi tekrar sahiplendirilebilir olarak görünsün
      await invalidateCache('animals:*');
      await invalidateCache(`animal:${ar.animal_id}`);

      return res.json(updated);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function cancelMine(req, res) {
  try {
    const user_id = req.user.id;
    const id = Number(req.params.id);
    const deleted = await Adoption.removeIfOwnerPending(id, user_id);
    if (!deleted) return res.status(400).json({ error: 'only pending requests can be canceled by owner' });

    // WebSocket bildirimi gönder
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers') || new Map();

    // Kullanıcıya bildirim gönder
    if (connectedUsers.has(user_id)) {
      io.to(connectedUsers.get(user_id)).emit('notification', {
        type: 'adoption_request_cancelled',
        title: 'Sahiplenme İsteği İptal Edildi',
        message: 'Sahiplenme isteğiniz başarıyla iptal edildi.',
        data: { adoption_request_id: id }
      });
    }

    // Veritabanına bildirim kaydet
    await createNotification(user_id, 'adoption_request_cancelled', 'Sahiplenme İsteği İptal Edildi',
      'Sahiplenme isteğiniz başarıyla iptal edildi.', { adoption_request_id: id });

    res.json({ deleted: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { create, list, listMine, process, cancelMine };
