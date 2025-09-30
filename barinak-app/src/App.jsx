import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import AnimalList from './pages/AnimalList';
import AdminDashboard from './pages/AdminDashboard';
import AnimalListTablePage from './pages/AnimalListTable';
import AdoptionForm from './pages/AdoptionForm';
import Login from './pages/Login';
import Register from './pages/Register';
import MyRequests from './pages/MyRequests';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import RequireAuth from './components/common/RequireAuth';
import RequireAdmin from './components/common/RequireAdmin';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Search from './pages/Search';

function App() {
  return (
    <NotificationProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-green-50 to-yellow-100 font-sans">
              <Navbar />
              <main className="flex-1 flex justify-center items-center">
                <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-8 animate-fade-in">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/animals" element={<AnimalList />} />
                    <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
                    <Route path="/animal-list" element={<AnimalListTablePage />} />
                    <Route path="/adopt" element={<RequireAuth><AdoptionForm /></RequireAuth>} />
                    <Route path="/my-requests" element={<RequireAuth><MyRequests /></RequireAuth>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/search" element={<Search />} />
                  </Routes>
                </div>
              </main>
              <Footer />
            </div>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </NotificationProvider>
  );
}

export default App
