import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function AdoptSuccess() {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const adopter = params.get('adopter') || 'Sevgili Sahiplenen';
  const animal = params.get('animal') || 'Sevimli Dostumuz';

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow text-center">
      <h1 className="text-3xl font-extrabold text-green-700 mb-4">Tebrikler! 🎉</h1>
      <p className="text-lg text-gray-700 mb-6">
        {adopter}, {animal} artık sizin ailenizin bir parçası! Ona sıcak bir yuva sunduğunuz için teşekkür ederiz.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-6">
        <h2 className="text-xl font-bold text-green-800 mb-2">Teşekkürler Köşesi</h2>
        <p className="text-gray-700">
          Hayvan sahiplenmek bir cana umut olmaktır. Destekleriniz için minnettarız. Lütfen ilk günlerde uyum süreci için sabırlı olun ve ihtiyaç duyarsanız bizimle iletişime geçin.
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <Link to="/animals" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Diğer Hayvanlar</Link>
        <Link to="/my-requests" className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300">İsteklerim</Link>
      </div>
    </div>
  );
}
