// Form doğrulama fonksiyonları
export function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
