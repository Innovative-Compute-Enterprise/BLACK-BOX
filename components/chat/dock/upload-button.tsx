'use client';
import React, { ChangeEvent, useEffect, useRef, useCallback, useState, memo } from 'react';

declare global {
  class ImageCapture {
    constructor(track: MediaStreamTrack);
    grabFrame(): Promise<ImageBitmap>;
  }
}

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isScreenCaptureMenuOpen, setIsScreenCaptureMenuOpen] = useState(false);

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

  const handleScreenCapture = useCallback(async (mode: 'tab' | 'window' | 'screen') => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: mode
        }
      });
      
      const track = mediaStream.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();
      
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context?.drawImage(bitmap, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          onFilesSelected(dataTransfer.files);
        }
      }, 'image/png');

      track.stop();
      setIsScreenCaptureMenuOpen(false);
      setIsExpanded(false);
    } catch (err) {
      console.error('Screen capture failed:', err);
      setError('Screen capture failed. Please try again.');
    }
  }, [onFilesSelected]);

  const handleCameraClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.capture = 'environment';
      fileInputRef.current.accept = ACCEPTED_FILE_TYPES.images.extensions;
      fileInputRef.current.click();
    }
  }, []);

  const handleCombinedFilesClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.capture = '';
      fileInputRef.current.accept = Object.values(ACCEPTED_FILE_TYPES)
        .map(category => category.extensions)
        .join(',');
      fileInputRef.current.click();
    }
  }, []);

  const handleScreenCaptureClick = useCallback(() => {
    setIsScreenCaptureMenuOpen(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsScreenCaptureMenuOpen(false);
      }
      
      const target = event.target as Element;
      const isInput = target.matches('input:not([type="file"]), textarea');
      const isSubmitButton = target.matches('button[type="submit"]') ||
                           target.closest('button[type="submit"]');
      if (isInput || isSubmitButton) {
        setIsExpanded(false);
      }
    };

    if (isExpanded || isScreenCaptureMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded, isScreenCaptureMenuOpen]);

  return (
    <div className="relative ml-1" ref={containerRef}>
      <div className="flex items-center space-x-2">
        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 cursor-pointer text-black dark:text-white rounded-lg rounded-bl-xl focus:outline-none dark:hover:bg-zinc-900 hover:bg-zinc-100"
            title="Add files"
            aria-label="Add files"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                 viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        ) : (
          <div className="flex items-center space-x-2 transition-all duration-200 ease-in-out">

            <button
              onClick={handleCombinedFilesClick}
              className="p-1.5 text-black dark:text-white rounded-lg rounded-bl-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 focus:outline-none"
              title="Screen Capture"
              aria-label="Screen Capture"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                   viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
              </svg>
            </button>

            <button
              onClick={() => handleScreenCapture('screen')}
              className="p-1.5 text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg focus:outline-none"
              title="Upload Files"
              aria-label="Upload Files"
            >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
              <path fill-rule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
            </svg>
            </button>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept={`${ACCEPTED_FILE_TYPES.images.extensions},${ACCEPTED_FILE_TYPES.documents.extensions},${ACCEPTED_FILE_TYPES.spreadsheets.extensions}`}
        multiple
        aria-hidden="true"
      />
    </div>
  );
};

export default memo(FileUploadButton);