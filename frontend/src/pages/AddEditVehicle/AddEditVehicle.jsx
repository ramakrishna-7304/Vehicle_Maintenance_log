import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { vehicleSchema } from '../../utils/validationSchemas';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import Toast from '../../components/Toast/Toast';
import { useToast } from '../../hooks/useToast';
import useAuth from '../../hooks/useAuth';

const AddEditVehicle = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(vehicleSchema),
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      axios.get(`/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      })
        .then(res => {
          const { make, model, year, licensePlate, vin } = res.data;
          setValue('make', make);
          setValue('model', model);
          setValue('year', year);
          setValue('licensePlate', licensePlate);
          setValue('vin', vin);
        })
        .catch(() => showToast('Failed to load vehicle', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, setValue, showToast, user.token]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`/api/vehicles/${id}`, data, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        showToast('Vehicle updated!', 'success');
      } else {
        await axios.post('/api/vehicles', data, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        showToast('Vehicle added!', 'success');
      }
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (error) {
      showToast('Error saving vehicle', 'error');
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
          <h2 className="mb-5 text-center text-blue-600 dark:text-sky-300 text-2xl font-bold">{isEdit ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
          <InputField label="Make" name="make" register={register} error={errors.make} />
          <InputField label="Model" name="model" register={register} error={errors.model} />
          <InputField label="Year" name="year" type="number" register={register} error={errors.year} />
          <InputField label="License Plate" name="licensePlate" register={register} error={errors.licensePlate} />
          <InputField label="VIN" name="vin" register={register} error={errors.vin} />
          <Button type="submit">{isEdit ? 'Update' : 'Add'} Vehicle</Button>
        </form>
      </div>
    </div>
  );
};

export default AddEditVehicle; 