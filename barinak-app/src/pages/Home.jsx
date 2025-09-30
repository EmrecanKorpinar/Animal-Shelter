import { useState } from "react";

export default function Home() {
  const [showTable, setShowTable] = useState(false);
  
  return (
    <div className="min-h-screen w-full bg-white p-8">
      <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Hayvan Barınağına Hoşgeldiniz</h1>
      
      <div className="max-w-4xl mx-auto bg-gray-50 p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Barınağımız Hakkında</h2>
        <p className="text-gray-600 mb-4">
          Barınağımız, sokakta yaşam mücadelesi veren hayvanlara güvenli bir yuva ve sevgi dolu bir ortam sunmak için kurulmuştur.
        </p>
        <p className="text-gray-600 mb-6">
          Kedi, köpek, kuş ve daha birçok türden dostumuz burada sağlık, bakım ve ilgiyle buluşuyor. Her biri yeni ailesini bekliyor.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-blue-800 font-medium">
            Barınağımızda onlarca sevimli hayvan yeni yuvasını bekliyor.
          </p>
        </div>
        
        <div className="text-center">
          <a 
            href="/adopt" 
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition duration-200"
          >
            Sahiplenme Formu
          </a>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Bir hayvan sahiplenmek, bir cana umut olmaktır.</p>
      </div>
    </div>
  );
}

