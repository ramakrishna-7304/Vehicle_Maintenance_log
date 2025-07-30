import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { maintenanceLogSchema } from '../../utils/validationSchemas';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import Toast from '../../components/Toast/Toast';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

const AddEditMaintenance = () => {
  const { vehicleId, logId } = useParams();
  const isEdit = Boolean(logId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(maintenanceLogSchema),
  });

  // Fetch companies for dropdown
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { data } = await axios.get('/api/admin/companies');
        setCompanies(data);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      axios.get(`/api/logs/${logId}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then(res => {
          const { title, description, date, mileage, assignedAdmin } = res.data;
          setValue('title', title);
          setValue('description', description);
          setValue('date', date ? date.substring(0, 10) : '');
          setValue('mileage', mileage);
          setValue('assignedAdminId', assignedAdmin?._id);
        })
        .catch(() => showToast('Failed to load log', 'error'))
        .finally(() => setLoading(false));
    }
  }, [isEdit, logId, setValue, showToast, user.token]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/api/logs/${logId}`, data, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        showToast('Log updated!', 'success');
      } else {
        await axios.post('/api/logs', { ...data, vehicleId }, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        showToast('Log submitted for approval!', 'success');
      }
      setTimeout(() => navigate(`/history/${vehicleId || data.vehicleId}`), 1200);
    } catch (error) {
      showToast('Error saving log', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 md:px-8 py-6 flex justify-center items-center transition-colors duration-300">
      <div className="max-w-screen-2xl mx-auto w-full flex justify-center items-center">
        {toast?.message && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-lg w-full max-w-md text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <h2 className="mb-5 text-center text-blue-600 dark:text-sky-300 text-2xl font-bold">{isEdit ? 'Edit Maintenance Log' : 'Add Maintenance Log'}</h2>
          <InputField label="Title" name="title" register={register} error={errors.title} />
          <InputField label="Description" name="description" register={register} error={errors.description} />
          <InputField label="Date" name="date" type="date" register={register} error={errors.date} />
          <InputField label="Mileage" name="mileage" type="number" register={register} error={errors.mileage} />
          
          {!isEdit && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Company
              </label>
              <select
                {...register('assignedAdminId')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-300 transition-colors duration-200"
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
              {errors.assignedAdminId && (
                <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.assignedAdminId.message}</p>
              )}
            </div>
          )}

          <Button type="submit">{isEdit ? 'Update' : 'Submit'} Log</Button>
        </form>
      </div>
    </div>
  );
};

export default AddEditMaintenance; 