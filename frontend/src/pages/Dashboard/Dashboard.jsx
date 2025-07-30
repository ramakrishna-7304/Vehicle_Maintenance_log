import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/Loader/Loader';
import Button from '../../components/Button/Button';
import Toast from '../../components/Toast/Toast';
import { useToast } from '../../hooks/useToast';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast();

  // Stats
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Redirect admins to admin dashboard
    if (user?.role === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data: vehiclesData } = await axios.get('/api/vehicles', config);
        setVehicles(vehiclesData);
        let allLogs = [];
        for (const v of vehiclesData) {
          const { data: logsData } = await axios.get(`/api/logs?vehicleId=${v._id}`, config);
          allLogs = allLogs.concat(logsData.map(log => ({ ...log, vehicle: v })));
        }
        setLogs(allLogs);
        // Calculate reminders: logs with a future nextDueDate
        const now = new Date();
        const upcoming = allLogs
          .filter(log => log.nextDueDate && new Date(log.nextDueDate) > now)
          .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
        setReminders(upcoming);
        // Calculate total cost - use adminPrice for accepted logs, cost for others
        const totalCost = allLogs.reduce((sum, log) => {
          if (log.status === 'accepted' && log.adminPrice) {
            return sum + Number(log.adminPrice);
          } else {
            return sum + (Number(log.cost) || 0);
          }
        }, 0);
        setTotalCost(totalCost);
      } catch (error) {
        setVehicles([]);
        setLogs([]);
        setReminders([]);
        setTotalCost(0);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400';
      case 'accepted':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getLogPrice = (log) => {
    if (log.status === 'accepted' && log.adminPrice) {
      return log.adminPrice;
    }
    return log.cost || 0;
  };

  const handleCancelLog = async (logId) => {
    try {
      console.log('Attempting to cancel log:', logId);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const response = await axios.delete(`/api/logs/${logId}`, config);
      console.log('Cancel response:', response.data);
      
      // Remove the log from local state
      setLogs(logs.filter(log => log._id !== logId));
      showToast('Maintenance log cancelled successfully!', 'success');
      
      // Refresh dashboard data
      const fetchDashboardData = async () => {
        try {
          const { data: vehiclesData } = await axios.get('/api/vehicles', config);
          setVehicles(vehiclesData);
          let allLogs = [];
          for (const v of vehiclesData) {
            const { data: logsData } = await axios.get(`/api/logs?vehicleId=${v._id}`, config);
            allLogs = allLogs.concat(logsData.map(log => ({ ...log, vehicle: v })));
          }
          setLogs(allLogs);
          const totalCost = allLogs.reduce((sum, log) => {
            if (log.status === 'accepted' && log.adminPrice) {
              return sum + Number(log.adminPrice);
            } else {
              return sum + (Number(log.cost) || 0);
            }
          }, 0);
          setTotalCost(totalCost);
        } catch (error) {
          console.error('Error refreshing dashboard data:', error);
        }
      };
      fetchDashboardData();
    } catch (error) {
      console.error('Cancel log error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to cancel maintenance log';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Log not found';
      } else if (error.response?.status === 403) {
        errorMessage = 'Not authorized to cancel this log';
      } else if (error.response?.status === 400) {
        errorMessage = 'Cannot cancel this log (may be approved or rejected)';
      }
      
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-gray-100 px-2 sm:px-4 md:px-8 py-4 sm:py-6">
      <div className="max-w-screen-2xl mx-auto">
        <nav className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center bg-gray-800 px-3 sm:px-6 py-3 sm:py-4 rounded-xl mb-5 sm:mb-7 shadow-md w-full">
          <Link to="/dashboard" className="text-sky-300 no-underline font-bold text-base md:text-[1.1rem] transition-colors duration-200 px-2 py-1 rounded hover:text-white hover:bg-gray-900">Dashboard</Link>
          <Link to="/search" className="text-sky-300 no-underline font-bold text-base md:text-[1.1rem] transition-colors duration-200 px-2 py-1 rounded hover:text-white hover:bg-gray-900">Global Search</Link>
          <Link to="/add-vehicle" className="text-sky-300 no-underline font-bold text-base md:text-[1.1rem] transition-colors duration-200 px-2 py-1 rounded hover:text-white hover:bg-gray-900">Add Vehicle</Link>
          <Button onClick={handleLogout} variant="secondary">Logout</Button>
        </nav>
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-2 w-full">
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left w-full">Welcome, {user?.name}</h1>
        </header>

        <div className="flex flex-col md:flex-row gap-3 sm:gap-5 mb-6 sm:mb-8 w-full">
          <div className="bg-gray-800 text-white rounded-lg px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow text-center flex-1">
            <h3 className="m-0 mb-2 text-base md:text-[1.1rem] text-sky-300">Vehicles</h3>
            <p className="text-lg sm:text-xl md:text-2xl m-0 font-bold">{vehicles.length}</p>
          </div>
          <div className="bg-gray-800 text-white rounded-lg px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow text-center flex-1">
            <h3 className="m-0 mb-2 text-base md:text-[1.1rem] text-sky-300">Pending Requests</h3>
            <p className="text-lg sm:text-xl md:text-2xl m-0 font-bold">{logs.filter(log => log.status === 'pending').length}</p>
          </div>
          <div className="bg-gray-800 text-white rounded-lg px-4 sm:px-6 md:px-8 py-4 sm:py-6 shadow text-center flex-1">
            <h3 className="m-0 mb-2 text-base md:text-[1.1rem] text-sky-300">Total Cost Spent</h3>
            <p className="text-lg sm:text-xl md:text-2xl m-0 font-bold">₹{totalCost.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 sm:gap-8 w-full">
          <div>
            <h2 className="mb-4 sm:mb-5 text-sky-300 text-lg md:text-xl font-semibold">My Vehicles</h2>
            <Link to="/add-vehicle">
              <Button>Add Vehicle</Button>
            </Link>
            <div className="mt-4 sm:mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
              {vehicles.length === 0 ? (
                <p>No vehicles added yet.</p>
              ) : (
                vehicles.map((vehicle) => (
                  <div key={vehicle._id} className="bg-gray-800 p-4 sm:p-5 rounded-lg shadow text-gray-100">
                    <h3 className="font-semibold text-base md:text-lg">{vehicle.make} {vehicle.model} ({vehicle.year})</h3>
                    <p>License Plate: {vehicle.licensePlate}</p>
                    <p>VIN: {vehicle.vin}</p>
                    <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                      <Link to={`/edit-vehicle/${vehicle._id}`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <Link to={`/history/${vehicle._id}`}>
                        <Button>View Logs</Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-4 sm:mb-5 text-sky-300 text-lg md:text-xl font-semibold">Recent Logs</h2>
            {logs.length === 0 ? (
              <p>No logs yet.</p>
            ) : (
              <ul className="list-none p-0">
                {logs.slice(0, 5).map((log) => (
                  <li key={log._id} className="bg-gray-900 p-3 rounded mb-2.5 text-gray-100 shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-sky-300">{log.vehicle?.make} {log.vehicle?.model}</strong> - {log.title} <br />
                        <span className="text-sm text-gray-400">{new Date(log.date).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                        {log.status?.toUpperCase()}
                      </span>
                    </div>
                    {log.status === 'accepted' && log.adminPrice && (
                      <div className="text-green-400 text-sm mt-1">
                        <p><strong>Price:</strong> ₹{log.adminPrice}</p>
                        <p><strong>Completion:</strong> {new Date(log.completionDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {log.status !== 'accepted' && getLogPrice(log) > 0 && (
                      <div className="text-gray-300 text-sm mt-1">
                        <p><strong>Cost:</strong> ₹{getLogPrice(log)}</p>
                      </div>
                    )}
                    {log.status === 'pending' && (
                      <div className="mt-2">
                        <Button 
                          onClick={() => handleCancelLog(log._id)}
                          variant="secondary"
                          className="bg-red-600 hover:bg-red-700 text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Toast message={toast?.message} type={toast?.type} onDone={hideToast} />
    </div>
  );
};

export default Dashboard; 