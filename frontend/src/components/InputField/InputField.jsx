import React from 'react';

const InputField = ({ label, name, type = 'text', register, error, placeholder }) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block mb-1 text-blue-600 dark:text-sky-300 font-medium">
        {label}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name)}
        className={`w-full px-3 py-2 rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-300 transition-colors duration-200 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
      />
      {error && (
        <p className="text-red-500 text-xs mt-1">{error.message}</p>
      )}
    </div>
  );
};

export default InputField; 