import React, { ChangeEvent, useEffect, useRef, useCallback, useState, memo, DragEvent } from 'react';

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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<'idle' | 'capturing' | 'processing' | 'success' | 'error'>('idle');

  // Modal reference
  const modalRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Clear error when popup closed
  useEffect(() => {
    if (!isPopupOpen) {
      setError('');
      setCaptureStatus('idle');
    }
  }, [isPopupOpen]);

  const validateFile = useCallback((file: File): boolean => {
    console.log(`Validating file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    if (file.size > maxFileSize) {
      const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const errorMsg = `File ${file.name} is too large (${fileSizeMB}MB). Max size is ${maxSizeMB}MB.`;
      console.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    const isValidType = Object.values(ACCEPTED_FILE_TYPES).some(category =>
      category.types.includes(file.type)
    );
    
    if (!isValidType) {
      const acceptedTypes = Object.values(ACCEPTED_FILE_TYPES)
        .flatMap(category => category.types)
        .join(', ');
      const errorMsg = `File type "${file.type}" is not supported. Accepted types: ${acceptedTypes}`;
      console.error(errorMsg);
      setError(errorMsg);
      return false;
    }
    
    console.log(`File ${file.name} passed validation`);
    return true;
  }, [maxFileSize]);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    setError('');
    const files = Array.from(fileList);
    console.log(`[FileUploadButton] Processing ${files.length} files:`, files.map(f => f.name));
    
    if (files.length > 0) {
      const validFiles = files.filter(validateFile);
      console.log(`[FileUploadButton] Valid files count: ${validFiles.length}`);
      
      if (validFiles.length > 0) {
        try {
          const dataTransfer = new DataTransfer();
          validFiles.forEach(file => dataTransfer.items.add(file));
          console.log(`[FileUploadButton] Calling onFilesSelected with ${dataTransfer.files.length} files`);
          onFilesSelected(dataTransfer.files);
          
          // Close popup immediately on success
          setIsPopupOpen(false);
        } catch (error) {
          console.error('[FileUploadButton] Error in file handling:', error);
          setError(`Error processing files: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.warn('[FileUploadButton] No valid files to process');
        // Keep popup open when there are errors
      }
    } else {
      console.warn('[FileUploadButton] No files provided for processing');
      setIsPopupOpen(false);
    }
  }, [validateFile, onFilesSelected, setIsPopupOpen]);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleScreenCapture = useCallback(async () => {
    try {
      setIsCapturing(true);
      setCaptureStatus('capturing');
      setError('');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setError('Screen capture is not supported in this browser.');
        setCaptureStatus('error');
        setIsCapturing(false);
        return;
      }
      
      // Request display media directly
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window'
        },
        audio: false
      });
      
      try {
        // Get the video track
        const track = mediaStream.getVideoTracks()[0];
        
        if (!track) {
          throw new Error('No video track found');
        }
        
        setCaptureStatus('processing');
        
        // Create a video element to capture a frame
        const video = document.createElement('video');
        video.srcObject = mediaStream;
        video.muted = true;
        
        // Wait for video metadata to load
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            video.play().then(() => resolve());
          };
        });
        
        // Create canvas to capture the frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not create canvas context');
        }
        
        // Draw the video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
        });
        
        if (!blob) {
          throw new Error('Failed to create screenshot');
        }
        
        // Create file from blob
        const file = new File([blob], `screenshot-${Date.now()}.png`, { type: 'image/png' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Process files
        onFilesSelected(dataTransfer.files);
        setCaptureStatus('success');
        
        // Close the popup after a short delay to show success state
        setTimeout(() => {
          setIsPopupOpen(false);
        }, 500);
        
      } catch (error) {
        console.error('Failed to capture image:', error);
        setError('Failed to capture image. Please try again.');
        setCaptureStatus('error');
      } finally {
        // Always stop all tracks to prevent resource leaks
        mediaStream.getTracks().forEach(t => t.stop());
      }
    } catch (err) {
      console.error('Screen capture error:', err);
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
        setCaptureStatus('idle');
        setIsPopupOpen(false);
        return;
      } else {
        setError('Failed to capture screen. Please try again.');
      }
      setCaptureStatus('error');
    } finally {
      setIsCapturing(false);
    }
  }, [onFilesSelected]);

  const handleFilesClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.capture = '';
      fileInputRef.current.accept = Object.values(ACCEPTED_FILE_TYPES)
        .map(category => category.extensions)
        .join(',');
      fileInputRef.current.click();
    }
  }, []);

  // Handle clicks outside modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Prevent closing the modal during screen capture
        if (!isCapturing) {
          setIsPopupOpen(false);
        }
      }
    };

    if (isPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopupOpen, isCapturing]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isCapturing) {
        setIsPopupOpen(false);
      }
    };

    if (isPopupOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isPopupOpen, isCapturing]);

  // Update body styles to prevent focus loss when modal is open
  useEffect(() => {
    if (isPopupOpen) {
      document.body.style.overflow = 'hidden';
      
      // Add a class to body to indicate capture mode when needed
      if (isCapturing) {
        document.body.classList.add('screen-capture-mode');
      } else {
        document.body.classList.remove('screen-capture-mode');
      }
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('screen-capture-mode');
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('screen-capture-mode');
    };
  }, [isPopupOpen, isCapturing]);

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
     <button
        onClick={() => setIsPopupOpen(true)}
        className="cursor-pointer dark:border-[#ffffff]/20 border-black/20 border text-black dark:text-white rounded-full p-1 focus:outline-none dark:hover:bg-zinc-900 hover:bg-zinc-100"
        title="Add files"
        aria-label="Add files"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
             viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      
      {isPopupOpen && (
        <div className="fixed inset-0  backdrop-blur-sm bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 relative transition-all duration-300 ${
              isDragging ? 'ring-4 ring-blue-500' : ''
            }`}
          >
            {/* Enhanced overlay during screen capture to maintain focus */}
            {isCapturing && (
              <div className="absolute inset-0 bg-black bg-opacity-70 rounded-xl z-20 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-white text-lg font-medium">
                  {captureStatus === 'capturing' ? 'Select a window to capture' : 'Processing screenshot...'}
                </p>
                <p className="text-white text-sm mt-2">
                  {captureStatus === 'capturing' ? 'Click on the window you want to capture' : 'Please wait...'}
                </p>
              </div>
            )}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attach</h3>
              <button 
                onClick={() => !isCapturing && setIsPopupOpen(false)}
                className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
                disabled={isCapturing}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Drop zone with drag and drop events */}
            <div 
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-6 ${isDragging ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            >
              <div className="flex flex-col items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 mb-2 text-gray-700 dark:text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">Upload files</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drag and drop to upload</p>
              </div>
              
              <button
                onClick={handleFilesClick}
                disabled={isCapturing}
                className="w-full py-2.5 px-4 mb-4 text-sm font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select files
              </button>
            </div>
            
            <div className="p-4 pt-0">
              <button
                onClick={handleScreenCapture}
                disabled={isCapturing}
                className="flex flex-row w-full gap-2 items-center justify-center px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!isCapturing && captureStatus === 'success' ? (
                  <div className="flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8 mb-3 text-green-500">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Captured!</span>
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 text-gray-700 dark:text-gray-300">
                      <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
                      <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Screenshot</span>
                  </>
                )}
              </button>
            </div>
            
            {/* URL Input Section */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Attach URL</h4>
              <div className="flex">
                <input 
                  type="url" 
                  placeholder="Enter a publicly accessible URL" 
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-700 dark:text-white"
                />
                <button 
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-r-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
                >
                  Attach
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 pb-4 mt-2 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-red-600 dark:text-red-400 font-medium">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 mr-2">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">Upload Error</span>
                </div>
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default memo(FileUploadButton);