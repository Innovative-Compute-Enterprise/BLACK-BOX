'use client';

import React, { ChangeEvent, useEffect, useRef, useCallback, useState, memo } from 'react';

const ACCEPTED_FILE_TYPES = {
  documents: {
    title: 'Documents',
    extensions: '.pdf,.doc,.docx,.txt,.rtf,.odt',
    types: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf',
      'application/vnd.oasis.opendocument.text'
    ]
  },
  images: {
    title: 'Images',
    extensions: '.jpg,.jpeg,.png,.webp,.gif',
    types: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]
  },
  spreadsheets: {
    title: 'Spreadsheets',
    extensions: '.xlsx,.xls,.csv,.ods',
    types: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/vnd.oasis.opendocument.spreadsheet'
    ]
  }
};

interface FileUploadButtonProps {
  onFilesSelected: (files: FileList) => void;
  maxFileSize?: number;
  onInputFocus?: () => void;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFilesSelected,
  maxFileSize = 10 * 1024 * 1024,
  onInputFocus
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > maxFileSize) {
      setError(`File ${file.name} is too large. Max size is ${(maxFileSize / (1024 * 1024)).toFixed(2)}MB.`);
      return false;
    }

    const isValidType = Object.values(ACCEPTED_FILE_TYPES).some(category =>
      category.types.includes(file.type)
    );

    if (!isValidType) {
      setError(`File type ${file.type} is not supported.`);
      return false;
    }

    return true;
  }, [maxFileSize]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(validateFile);
      if (validFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => dataTransfer.items.add(file));
        onFilesSelected(dataTransfer.files);
      }
      e.target.value = '';
    }
  }, [validateFile, onFilesSelected]);

  const handleCameraClick = useCallback(() => {
    setError('');
    imageInputRef.current?.click();
  }, []);

  const handleGalleryClick = useCallback(() => {
    setError('');
    imageInputRef.current?.click();
  }, []);

  const handleDocumentClick = useCallback(() => {
    setError('');
    documentInputRef.current?.click();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      const isInput = target.matches('input:not([type="file"]), textarea');
      const isSubmitButton = target.matches('button[type="submit"]') ||
                             target.closest('button[type="submit"]');
      if (isInput || isSubmitButton) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (onInputFocus) {
      const handleInputFocus = () => setIsExpanded(false);
      document.addEventListener('focus', handleInputFocus, true);
      return () => {
        document.removeEventListener('focus', handleInputFocus, true);
      };
    }
  }, [onInputFocus]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center space-x-2">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1 min-w-8 h-8 text-black dark:text-white rounded-2xl focus:outline-none dark:hover:bg-zinc-800 hover:bg-zinc-300"
            title="Add files"
            aria-label="Add files"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                 viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-[24px]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center space-x-2 transition-all duration-200 ease-in-out">
            <button
              onClick={handleCameraClick}
              className="p-1 text-black min-w-8 h-8 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl focus:outline-none"
              title="Take Photo"
              aria-label="Take Photo"
            >
              {/* Camera icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" 
                   fill="currentColor" className="size-[24px]">
                <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={handleGalleryClick}
              className="p-1 text-black min-w-8 h-8 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl focus:outline-none"
              title="Upload from Gallery"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-[24px]">
                <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
              </svg>
            </button>

            <button
              onClick={handleDocumentClick}
              className="p-1 text-black min-w-8 h-8 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-2xl focus:outline-none"
              title="Upload Document"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-[24px]">
                <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
              </svg>
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <div 
          className="absolute right-0 mb-1 p-2 text-sm text-red-500 bg-white dark:bg-black rounded-md shadow-lg ring-1 ring-red-500 z-50"
          style={{ bottom: '100%' }}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={ACCEPTED_FILE_TYPES.images.extensions}
        multiple
        aria-hidden="true"
      />
      
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={`${ACCEPTED_FILE_TYPES.documents.extensions},${ACCEPTED_FILE_TYPES.spreadsheets.extensions}`}
        multiple
        aria-hidden="true"
      />
    </div>
  );
};

export default memo(FileUploadButton);
