import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import SupplierList from './components/SupplierList';
import PurchaseForm from './components/PurchaseForm';
import CostReport from './components/CostReport';
import Navbar from './components/Navbar';

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/materials" element={<ProjectList />} />
          <Route path="/purchases" element={<PurchaseForm />} />
          <Route path="/cost-report/:id" element={<CostReport />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;