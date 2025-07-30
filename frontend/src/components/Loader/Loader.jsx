import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center h-full bg-transparent">
      <div className="w-10 h-10 border-4 border-gray-300 dark:border-gray-800 border-t-blue-500 dark:border-t-sky-300 rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader; 