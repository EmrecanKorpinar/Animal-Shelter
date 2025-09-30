// src/utils/dateUtils.js
// Normalize date from various formats and fix timezone issues
// IMPORTANT: For strings WITHOUT timezone info, parse as LOCAL time to avoid +3h drift in TR.
function normalizeDate(input) {
  if (!input) return null;
  if (input instanceof Date) return input;
  // numeric timestamp (seconds or ms)
  if (typeof input === 'number') {
    const ms = input < 1e12 ? input * 1000 : input;
    return new Date(ms);
  }
  if (typeof input === 'string') {
    const s = input.trim();
    // If string already has timezone info (Z or +/-HH:MM), use as-is (UTC-aware)
    if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) {
      return new Date(s);
    }
    // Common SQL/ISO without TZ -> parse as LOCAL time (no artificial Z)
    const dtMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
    if (dtMatch) {
      const [_, y, mo, d, h, mi, se = '0', ms = '0'] = dtMatch;
      return new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        Number(se),
        Number(ms.padEnd(3, '0'))
      );
    }
    // Date-only string -> local midnight
    const dMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dMatch) {
      const [_, y, mo, d] = dMatch;
      return new Date(Number(y), Number(mo) - 1, Number(d));
    }
    // Fallback
    return new Date(s);
  }
  try {
    return new Date(input);
  } catch {
    return null;
  }
}

export const formatDateTR = (dateString) => {
  if (!dateString) return '';

  try {
    const date = normalizeDate(dateString);

    // Kullanıcının lokal saati (browser'ın kendi timezone'i)
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };

    const formatter = new Intl.DateTimeFormat('tr-TR', options);
    return formatter.format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString;
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  try {
    // Backend timestamp'ini doğru parse et (timezone güvenli)
    const date = normalizeDate(dateString);

    // Geçersiz tarih kontrolü
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Bilinmeyen zaman';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Az önce';
    if (diffMinutes < 60) return `${diffMinutes} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;

    return formatDateTR(dateString);
  } catch (error) {
    console.error('Relative time formatting error:', error);
    return 'Bilinmeyen zaman';
  }
};

export const formatDateShort = (dateString) => {
  if (!dateString) return '';

  try {
    const date = normalizeDate(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    const formatter = new Intl.DateTimeFormat('tr-TR', options);
    return formatter.format(date);
  } catch (error) {
    console.error('Short date formatting error:', error);
    return dateString;
  }
};
