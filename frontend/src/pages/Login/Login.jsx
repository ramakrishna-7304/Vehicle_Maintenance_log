import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { loginSchema } from '../../utils/validationSchemas';
import InputField from '../../components/InputField/InputField';
import Button from '../../components/Button/Button';
import Toast from '../../components/Toast/Toast';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      showToast('Login successful!', 'success');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      showToast('Invalid credentials. Please try again.', 'error');
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
          <h2 className="mb-6 text-center text-blue-600 dark:text-sky-300 text-2xl tracking-wide font-bold">Login</h2>
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
          <Button type="submit">Login</Button>
          <p className="text-center mt-6 text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-sky-300 font-bold hover:text-blue-800 dark:hover:text-white transition-colors">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login; 