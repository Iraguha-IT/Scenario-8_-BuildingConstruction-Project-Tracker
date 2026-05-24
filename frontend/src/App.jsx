import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';  // import
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import SupplierList from './components/SupplierList';
import PurchaseForm from './components/PurchaseForm';
import CostReport from './components/CostReport';
import LogoutButton from './components/LogoutButton';

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // ... rest of protected layout
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />  {/* new */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;