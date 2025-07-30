import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/Loader/Loader';
import Button from '../../components/Button/Button';
import Toast from '../../components/Toast/Toast';
import { useToast } from '../../hooks/useToast';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalEarned: 0,
    pendingVehicles: 0,
    acceptedVehicles: 0,
    totalLogs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionData, setActionData] = useState({
    price: '',
    completionDate: '',
    adminNotes: '',
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        
        const [logsResponse, statsResponse] = await Promise.all([
          axios.get('/api/admin/logs', config),
          axios.get('/api/admin/stats', config),
        ]);
        
        setLogs(logsResponse.data);
        setStats(statsResponse.data);
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAccept = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.put(`/api/admin/logs/${selectedLog._id}/accept`, actionData, config);
      
      // Update local state
      setLogs(logs.map(log => 
        log._id === selectedLog._id 
          ? { ...log, status: 'accepted', adminPrice: actionData.price, completionDate: actionData.completionDate }
          : log
      ));
      
      setShowAcceptModal(false);
      setSelectedLog(null);
      setActionData({ price: '', completionDate: '', adminNotes: '' });
      showToast('Log accepted successfully!', 'success');
      
      // Refresh stats
      const { data: newStats } = await axios.get('/api/admin/stats', config);
      setStats(newStats);
    } catch (error) {
      showToast('Failed to accept log', 'error');
    }
  };

  const handleReject = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.put(`/api/admin/logs/${selectedLog._id}/reject`, { adminNotes: actionData.adminNotes }, config);
      
      // Update local state
      setLogs(logs.map(log => 
        log._id === selectedLog._id 
          ? { ...log, status: 'rejected' }
          : log
      ));
      
      setShowRejectModal(false);
      setSelectedLog(null);
      setActionData({ price: '', completionDate: '', adminNotes: '' });
      showToast('Log rejected successfully!', 'success');
      
      // Refresh stats
      const { data: newStats } = await axios.get('/api/admin/stats', config);
      setStats(newStats);
    } catch (error) {
      showToast('Failed to reject log', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'accepted':
        return 'text-green-600 dark:text-green-400';
      case 'rejected':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-2 sm:px-4 md:px-8 py-4 sm:py-6 transition-colors duration-300">
      <div className="max-w-screen-2xl mx-auto">
        <nav className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-white dark:bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 rounded-xl mb-5 sm:mb-7 shadow-md w-full transition-colors duration-300">
          <Link to="/admin-dashboard" className="text-blue-600 dark:text-sky-300 no-underline font-bold text-base md:text-[1.1rem] transition-colors duration-200 px-2 py-1 rounded hover:text-blue-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Admin Dashboard</Link>
          <Button onClick={handleLogout} variant="secondary">Logout</Button>
        </nav>
        
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2 w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left w-full text-gray-900 dark:text-white">
            Welcome, {user?.name} ({user?.companyName})
          </h1>
        </header>

        <div className="flex flex-col md:flex-row gap-3 sm:gap-5 mb-6 sm:mb-8 w-full">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow text-center flex-1 transition-colors duration-300">
            <h3 className="m-0 mb-2 text-base md:text-[1.1rem] text-blue-600 dark:text-sky-300">Total Earned</h3>
            <p className="text-lg sm:text-xl md:text-2xl m-0 font-bold">₹{stats.totalEarned.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow text-center flex-1 transition-colors duration-300">
            <h3 className="m-0 mb-2 text-base md:text-[1.1rem] text-blue-600 dark:text-sky-300">Pending Vehicles</h3>
            <p className="text-lg sm:text-xl md:text-2xl m-0 font-bold">{stats.pendingVehicles}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow text-center flex-1 transition-colors duration-300">
            <h3 className="m-0 mb-2 text-base md:text-[1.1rem] text-blue-600 dark:text-sky-300">Accepted Vehicles</h3>
            <p className="text-lg sm:text-xl md:text-2xl m-0 font-bold">{stats.acceptedVehicles}</p>
          </div>
        </div>

        <div className="w-full">
          <h2 className="mb-4 sm:mb-5 text-blue-600 dark:text-sky-300 text-lg md:text-xl font-semibold">Pending Maintenance Requests</h2>
          {logs.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No pending requests.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {logs.map((log) => (
                <div key={log._id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-gray-900 dark:text-gray-100 transition-colors duration-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-base">{log.title}</h3>
                    <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>Vehicle:</strong> {log.vehicle?.make} {log.vehicle?.model} ({log.vehicle?.licensePlate})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>Customer:</strong> {log.user?.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <strong>Date:</strong> {new Date(log.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    <strong>Mileage:</strong> {log.mileage.toLocaleString()}
                  </p>
                  {log.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{log.description}</p>
                  )}
                  
                  {log.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowAcceptModal(true);
                        }}
                        className="flex-1"
                      >
                        Accept
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedLog(log);
                          setShowRejectModal(true);
                        }}
                        variant="secondary"
                        className="flex-1"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {log.status === 'accepted' && (
                    <div className="text-green-400 text-sm">
                      <p><strong>Price:</strong> ₹{log.adminPrice}</p>
                      <p><strong>Completion Date:</strong> {new Date(log.completionDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {log.status === 'rejected' && (
                    <div className="text-red-400 text-sm">
                      <p>Request rejected</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accept Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Accept Maintenance Request</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Price (₹)</label>
                <input
                  type="number"
                  value={actionData.price}
                  onChange={(e) => setActionData({ ...actionData, price: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  placeholder="Enter price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Completion Date</label>
                <input
                  type="date"
                  value={actionData.completionDate}
                  onChange={(e) => setActionData({ ...actionData, completionDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                <textarea
                  value={actionData.adminNotes}
                  onChange={(e) => setActionData({ ...actionData, adminNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 transition-colors duration-200"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleAccept} className="flex-1">Accept</Button>
              <Button onClick={() => setShowAcceptModal(false)} variant="secondary" className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md transition-colors duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Reject Maintenance Request</h3>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Reason (Optional)</label>
              <textarea
                value={actionData.adminNotes}
                onChange={(e) => setActionData({ ...actionData, adminNotes: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 transition-colors duration-200"
                rows="3"
                placeholder="Reason for rejection..."
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleReject} variant="secondary" className="flex-1">Reject</Button>
              <Button onClick={() => setShowRejectModal(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {toast?.message && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
    </div>
  );
};

export default AdminDashboard; 