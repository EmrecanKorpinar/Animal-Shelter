import AnimalListTable from '../components/user/AnimalListTable';

export default function AnimalListTablePage() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-yellow-100 flex items-center justify-center py-10">
      <div className="w-full max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-green-800 mb-8">Hayvan Listesi</h1>
        <AnimalListTable />
      </div>
    </section>
  );
}
