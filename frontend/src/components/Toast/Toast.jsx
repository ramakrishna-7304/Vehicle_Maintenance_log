import React, { useState, useEffect } from 'react';

const Toast = ({ message, type, onDone, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDone) {
          onDone();
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onDone]);

  if (!visible) return null;

  const typeStyles = {
    success: 'border-l-green-600 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200',
    error: 'border-l-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200',
    info: 'border-l-blue-500 dark:border-l-sky-300 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-sky-200',
  };

  return (
    <div
      className={`fixed top-5 right-5 px-4 py-3 rounded min-w-[250px] text-center z-[1000] bg-white dark:bg-gray-800 border-l-8 shadow-lg transition-all duration-300 ${typeStyles[type] || typeStyles.info}`}
    >
      <div className="flex justify-between items-center">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={() => {
              setVisible(false);
              onClose();
            }}
            className="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast; 