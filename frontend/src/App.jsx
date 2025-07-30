import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import ThemeToggler from './components/ThemeToggler/ThemeToggler';

// Page Imports
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AddEditVehicle from './pages/AddEditVehicle/AddEditVehicle';
import AddEditMaintenance from './pages/AddEditMaintenance/AddEditMaintenance';
import MaintenanceHistory from './pages/MaintenanceHistory/MaintenanceHistory';
import GlobalSearch from './pages/GlobalSearch/GlobalSearch';
import NotFound from './pages/NotFound/NotFound';
import VehicleCostHistory from './pages/VehicleCostHistory/VehicleCostHistory';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeToggler />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/add-vehicle" element={<ProtectedRoute><AddEditVehicle /></ProtectedRoute>} />
          <Route path="/edit-vehicle/:id" element={<ProtectedRoute><AddEditVehicle /></ProtectedRoute>} />
          <Route path="/add-log/:vehicleId" element={<ProtectedRoute><AddEditMaintenance /></ProtectedRoute>} />
          <Route path="/edit-log/:logId" element={<ProtectedRoute><AddEditMaintenance /></ProtectedRoute>} />
          <Route path="/history/:vehicleId" element={<ProtectedRoute><MaintenanceHistory /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><GlobalSearch /></ProtectedRoute>} />
          <Route path="/cost-history/:vehicleId" element={<ProtectedRoute><VehicleCostHistory /></ProtectedRoute>} />

          {/* Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Chatbot />
      </Router>
    </AuthProvider>
  );
}

export default App;
