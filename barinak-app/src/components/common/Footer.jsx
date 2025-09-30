// Footer component
export default function Footer() {
  return (
    <footer className="bg-white border-t mt-8">
      <div className="container mx-auto px-4 py-4 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} BarınakApp. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
