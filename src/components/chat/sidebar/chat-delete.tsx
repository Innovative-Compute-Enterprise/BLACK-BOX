import React, { useEffect } from 'react';

interface DeleteModalProps {
  confirmDelete: () => void;
  setIsDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  multiDelete?: boolean;
  count?: number;
}

const DeleteModal = ({ confirmDelete, setIsDeleteModalOpen, multiDelete = false, count = 1 }: DeleteModalProps) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDeleteModalOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [setIsDeleteModalOpen]);

  // Prevent scroll on mount and enable on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setIsDeleteModalOpen(false)}
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Content */}
        <div 
          className="relative w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 shadow-xl transform transition-all"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Header */}
          <div className="p-6">
            <h3 
              id="modal-title"
              className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
            >
              Confirm Deletion
            </h3>
            <div className="mt-3">
              <p className="text-sm text-gray-500 dark:text-gray-300">
                {multiDelete 
                  ? `Are you sure you want to delete ${count} selected ${count === 1 ? 'chat' : 'chats'}? This action cannot be undone.`
                  : 'Are you sure you want to delete this chat? This action cannot be undone.'}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-4 rounded-b-lg flex flex-row-reverse gap-3">
            <button
              onClick={confirmDelete}
              className="inline-flex justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;