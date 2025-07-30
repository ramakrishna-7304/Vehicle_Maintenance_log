import React, { useEffect, useState } from 'react';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/Loader/Loader';
import Button from '../../components/Button/Button';
import Toast from '../../components/Toast/Toast';
import { useToast } from '../../hooks/useToast';
import { Link } from 'react-router-dom';

const GlobalSearch = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sort, setSort] = useState('desc');
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const fetchAllLogs = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data: vehiclesData } = await axios.get('/api/vehicles', config);
        setVehicles(vehiclesData);
        let allLogs = [];
        for (const v of vehiclesData) {
          const { data: logsData } = await axios.get(`/api/logs?vehicleId=${v._id}`, config);
          allLogs = allLogs.concat(logsData.map(log => ({ ...log, vehicle: v })));
        }
        setLogs(allLogs);
      } catch (error) {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAllLogs();
  }, [user.token]);

  let filteredLogs = logs.filter(log =>
    log.title.toLowerCase().includes(search.toLowerCase()) &&
    (!filterDate || log.date?.slice(0, 10) === filterDate)
  );
  filteredLogs = filteredLogs.sort((a, b) =>
    sort === 'asc' ? a.mileage - b.mileage : b.mileage - a.mileage
  );

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

  return (
    <div className="h-screen w-full bg-gray-900 text-gray-100 px-4 md:px-8 py-6">
      <div className="max-w-screen-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-sky-300 text-center">Global Log Search</h2>
        <div className="flex gap-2.5 mb-5 flex-wrap">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-3 py-2 rounded bg-gray-800 text-gray-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <option value="desc">Sort by Mileage (High to Low)</option>
            <option value="asc">Sort by Mileage (Low to High)</option>
          </select>
        </div>
        {loading ? (
          <Loader />
        ) : filteredLogs.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No logs found.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
            {filteredLogs.map(log => (
              <div key={log._id} className="bg-gray-800 p-5 rounded-lg shadow text-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{log.title}</h3>
                  <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                    {log.status?.toUpperCase()}
                  </span>
                </div>
                <p>Date: {log.date?.slice(0, 10)}</p>
                <p>Mileage: {log.mileage?.toLocaleString()}</p>
                {getLogPrice(log) > 0 && (
                  <p>Cost: ₹{getLogPrice(log)}</p>
                )}
                <p>Vehicle: {log.vehicle?.make} {log.vehicle?.model} ({log.vehicle?.year})</p>
                {log.description && <p className="text-gray-300">{log.description}</p>}
                
                {log.status === 'accepted' && log.adminPrice && (
                  <div className="text-green-400 text-sm mt-2">
                    <p><strong>Completion Date:</strong> {new Date(log.completionDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {log.status === 'rejected' && (
                  <div className="text-red-400 text-sm mt-2">
                    <p>Request rejected</p>
                  </div>
                )}
                
                <div className="mt-3 flex gap-2">
                  {log.status === 'pending' && (
                    <>
                      <Link to={`/edit-log/${log._id}`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <Button 
                        onClick={() => handleCancelLog(log._id)}
                        variant="secondary"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                  <Link to={`/history/${log.vehicle?._id}`}>
                    <Button>View History</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <Toast message={toast?.message} type={toast?.type} onDone={hideToast} />
      </div>
    </div>
  );
};

export default GlobalSearch; 