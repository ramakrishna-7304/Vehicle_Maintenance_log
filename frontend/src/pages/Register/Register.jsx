import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { registrationSchema } from '../../utils/validationSchemas';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import Toast from '../../components/Toast/Toast';

const Register = () => {
  const [role, setRole] = useState('user');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(registrationSchema),
  });
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const onSubmit = async (data) => {
    try {
      const registrationData = {
        ...data,
        role,
        ...(role === 'admin' && {
          companyName: data.companyName,
          companyPassword: data.companyPassword,
        }),
      };

      await registerUser(registrationData);
      showToast('Registration successful! Please login.', 'success');
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      showToast('Registration failed. Please try again.', 'error');
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 px-4 md:px-8 py-6 flex justify-center items-center transition-colors duration-300">
      <div className="max-w-screen-2xl mx-auto w-full flex justify-center items-center">
        {toast?.message && <Toast message={toast.message} type={toast.type} onDone={hideToast} />}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/90 dark:bg-gray-800/90 px-9 pt-11 pb-8 rounded-2xl shadow-2xl w-full max-w-md border-l-8 border-blue-500 dark:border-sky-300 backdrop-blur text-gray-900 dark:text-gray-100 relative animate-fadeIn transition-colors duration-300"
        >
          <h2 className="mb-6 text-center text-blue-600 dark:text-sky-300 text-2xl tracking-wide font-bold">Register</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Register as</label>
            <div className="flex gap-4">
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  value="user"
                  checked={role === 'user'}
                  onChange={(e) => setRole(e.target.value)}
                  className="mr-2"
                />
                User
              </label>
              <label className="flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value)}
                  className="mr-2"
                />
                Admin
              </label>
            </div>
          </div>

          <InputField
            label="Name"
            name="name"
            register={register}
            error={errors.name}
          />
          <InputField
            label="Email"
            name="email"
            register={register}
            error={errors.email}
          />
          <InputField
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password}
          />
          <InputField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            register={register}
            error={errors.confirmPassword}
          />

          {role === 'admin' && (
            <>
              <InputField
                label="Company Name"
                name="companyName"
                register={register}
                error={errors.companyName}
              />
              <InputField
                label="Company Password"
                name="companyPassword"
                type="password"
                register={register}
                error={errors.companyPassword}
                placeholder="Enter: 123123"
              />
            </>
          )}

          {/* ✅ Hidden input to pass 'role' to validation schema */}
          <input type="hidden" value={role} {...register('role')} />

          <Button type="submit">Register</Button>

          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-sky-300 font-bold hover:text-blue-800 dark:hover:text-white transition-colors">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
