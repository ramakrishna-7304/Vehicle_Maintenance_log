import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/Loader/Loader';
import Button from '../../components/Button/Button';

const VehicleCostHistory = () => {
  const { vehicleId } = useParams();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data: vehicleData } = await axios.get(`/api/vehicles/${vehicleId}`, config);
        setVehicle(vehicleData);
        const { data: logsData } = await axios.get(`/api/logs?vehicleId=${vehicleId}`, config);
        setLogs(logsData);
      } catch (error) {
        setLogs([]);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token, vehicleId]);

  const getLogPrice = (log) => {
    if (log.status === 'accepted' && log.adminPrice) {
      return log.adminPrice;
    }
    return log.cost || 0;
  };

  const totalCost = logs.reduce((sum, log) => sum + Number(getLogPrice(log)), 0);

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

  return (
    <div className="h-screen w-full bg-gray-900 text-gray-100 px-4 md:px-8 py-6">
      <div className="max-w-screen-2xl mx-auto">
        <h2 className="text-sky-300 mb-4 text-2xl text-center font-bold">Cost History for {vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.year})` : 'Vehicle'}</h2>
        <div className="text-lg mb-4 text-center text-white">Total Spent: <span className="text-sky-300 font-bold">₹{totalCost.toLocaleString()}</span></div>
        <Link to={`/dashboard`}><Button variant="secondary">Back to Dashboard</Button></Link>
        {loading ? (
          <Loader />
        ) : logs.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No maintenance logs found for this vehicle.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {logs.map(log => (
              <div key={log._id} className="bg-gray-800 rounded-lg p-5 shadow">
                <div className="flex justify-between mb-2 text-gray-400 text-base">
                  <span>{log.date?.slice(0, 10)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                      {log.status?.toUpperCase()}
                    </span>
                    <span className="text-sky-300 font-bold">₹{getLogPrice(log).toLocaleString()}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1">{log.title}</h3>
                <p>{log.description}</p>
                
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleCostHistory; 