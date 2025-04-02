import { useState, useCallback } from 'react';
import { createClient } from '@/src/utils/supabase/client';
import { convertImageToWebp } from '@/src/utils/chat/convertImageToWebp';
import { MessageContent } from '@/src/types/chat';
import { useChatStore } from '@/src/hooks/useChatStore';

type FileType = 'image' | 'document' | 'spreadsheet' | 'markdown' | 'pdf' | 'other';

// Update MessageContent interface if necessary to include the new standardized file structure
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mime_type: string;
  isImage: boolean;
}

interface FileProcessor {
  type: FileType;
  mimeTypes: string[];
  process: (file: File) => Promise<FileAttachment>;
}

interface ProcessedFile {
  originalFile: File;
  processedFile?: FileAttachment;
  isProcessing: boolean;
  error?: string;
}

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[·]/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
};

const createUploadFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(originalName);
  const extension = sanitizedName.split('.').pop() || '';
  const baseName = sanitizedName.replace(`.${extension}`, '');
  
  return `${baseName}-${timestamp}.${extension}`;
};

const TEXT_BASED_MIME_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls: 'application/vnd.ms-excel',
  md: 'text/markdown'
};

const CONVERTIBLE_IMAGE_TYPES = ['image/jpeg', 'image/png'];

export const useFileUpload = (userId: string) => {
  const supabase = createClient();
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const zustandSetSelectedFiles = useChatStore((state) => state.setSelectedFiles);

  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
    if (!userId) {
      console.error('No user ID provided for file upload');
      throw new Error('Authentication required for file upload');
    }
    
    console.log(`Uploading file: ${file.name} to ${folder} folder, size: ${file.size} bytes`);
    const fileName = createUploadFileName(file.name);
    const filePath = `${userId}/${folder}/${fileName}`;
    
    try {
      const { error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (error) {
        console.error('Supabase storage upload error:', error);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      if (!urlData) {
        console.error('Failed to get public URL for uploaded file');
        throw new Error('Error getting public URL');
      }
      
      console.log(`File upload successful: ${fileName}, URL obtained`);
      return urlData.publicUrl;
    } catch (error) {
      console.error(`File upload failed for ${fileName}:`, error);
      throw error;
    }
  };

  const fileProcessors: FileProcessor[] = [
    {
      type: 'image',
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      process: async (file: File): Promise<FileAttachment> => {
        let uploadedFile = file;
        if (CONVERTIBLE_IMAGE_TYPES.includes(file.type)) {
          uploadedFile = await convertImageToWebp(file);
        }
        
        const url = await uploadFile(uploadedFile, 'images');
        
        return {
          id: generateId(),
          name: file.name,
          type: 'image',
          size: file.size,
          url: url,
          mime_type: file.type,
          isImage: true
        };
      }
    },
    {
      type: 'pdf',
      mimeTypes: [TEXT_BASED_MIME_TYPES.pdf],
      process: async (file: File): Promise<FileAttachment> => {
        const url = await uploadFile(file, 'documents');
        return {
          id: generateId(),
          name: file.name,
          type: 'pdf',
          size: file.size,
          url: url,
          mime_type: file.type,
          isImage: false
        };
      }
    },
    {
      type: 'document',
      mimeTypes: [
        TEXT_BASED_MIME_TYPES.doc,
        TEXT_BASED_MIME_TYPES.docx,
        TEXT_BASED_MIME_TYPES.txt,
      ],
      process: async (file: File): Promise<FileAttachment> => {
        // For text files, we could still extract and include content separately if needed
        const url = await uploadFile(file, 'documents');
        return {
          id: generateId(),
          name: file.name,
          type: 'document',
          size: file.size,
          url: url,
          mime_type: file.type,
          isImage: false
        };
      }
    },
    {
      type: 'spreadsheet',
      mimeTypes: [
        TEXT_BASED_MIME_TYPES.csv,
        TEXT_BASED_MIME_TYPES.xlsx,
        TEXT_BASED_MIME_TYPES.xls,
      ],
      process: async (file: File): Promise<FileAttachment> => {
        const url = await uploadFile(file, 'documents');
        return {
          id: generateId(),
          name: file.name,
          type: 'spreadsheet',
          size: file.size,
          url: url,
          mime_type: file.type,
          isImage: false
        };
      }
    },
    {
      type: 'markdown',
      mimeTypes: [TEXT_BASED_MIME_TYPES.md],
      process: async (file: File): Promise<FileAttachment> => {
        const url = await uploadFile(file, 'documents');
        return {
          id: generateId(),
          name: file.name,
          type: 'markdown',
          size: file.size,
          url: url,
          mime_type: file.type,
          isImage: false
        };
      }
    }
  ];

  const getFileProcessor = useCallback((file: File): FileProcessor => {
    const processor = fileProcessors.find(p => p.mimeTypes.includes(file.type));
    
    if (processor) {
      return processor;
    }

    // For unsupported file types
    return {
      type: 'other',
      mimeTypes: ['*'],
      process: async (file: File) => ({
        id: generateId(),
        name: file.name,
        type: 'other',
        size: file.size,
        url: '', // No URL for unsupported files
        mime_type: file.type,
        isImage: false
      })
    };
  }, []);

  // Process a single file immediately upon upload
  const processFile = useCallback(async (file: File, indexGetter: (prev: ProcessedFile[]) => number) => {
    let processedResult: ProcessedFile | null = null;
    try {
      console.log(`[useFileUpload] Starting processing for file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      setProcessingQueue(prev => [...prev, file.name]);
      const processor = getFileProcessor(file);
      console.log(`[useFileUpload] Processing file: ${file.name}, type: ${processor.type}`);
      
      // Handle unsupported file types better
      if (processor.type === 'other') {
        console.warn(`[useFileUpload] File type ${file.type} is not directly supported. Using generic processing.`);
      }
      
      // Process the file
      const processedFileData = await processor.process(file);
      console.log(`[useFileUpload] File processed successfully: ${file.name}`, processedFileData);
      
      // Update internal state
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        const index = indexGetter(prev);
        if (index >= 0 && index < newFiles.length) {
          processedResult = {
            ...newFiles[index],
            processedFile: processedFileData,
            isProcessing: false,
            error: undefined
          };
          newFiles[index] = processedResult;
        }
        return newFiles;
      });
    } catch (error) {
      console.error(`[useFileUpload] Error processing file ${file.name}:`, error);
      
      // Update internal state with the error
      setSelectedFiles(prev => {
        const newFiles = [...prev];
        const index = indexGetter(prev);
        if (index >= 0 && index < newFiles.length) {
          processedResult = {
            ...newFiles[index],
            isProcessing: false,
            error: error.message || 'Error processing file'
          };
          newFiles[index] = processedResult;
        }
        return newFiles;
      });
    } finally {
      // Update Zustand store with the final result (success or error)
      if (processedResult) {
        const finalResult = processedResult;
        zustandSetSelectedFiles(prevGlobal => {
           const globalIndex = prevGlobal.findIndex(f => f.originalFile.name === finalResult.originalFile.name && f.isProcessing);
           if (globalIndex !== -1) {
             const newGlobalFiles = [...prevGlobal];
             newGlobalFiles[globalIndex] = finalResult;
             console.log('[useFileUpload] Updating Zustand store with final file state for:', finalResult.originalFile.name);
             return newGlobalFiles;
           }
           console.warn('[useFileUpload] Could not find matching processing file in Zustand store for:', finalResult.originalFile.name);
           return prevGlobal; // Return previous state if no match found
        });
      }
      // Always remove from processing queue
      setProcessingQueue(prev => prev.filter(name => name !== file.name));
    }
  }, [getFileProcessor, zustandSetSelectedFiles]);

  // Handle file selection and trigger immediate processing
  const handleFilesSelected = useCallback((files: FileList) => {
    console.log(`handleFilesSelected called with ${files.length} files`);
    
    if (!userId) {
      console.error('No user ID available for file upload');
      // Instead of failing silently, add files but mark them with an error
      const filesWithErrors = Array.from(files).map(file => ({
        originalFile: file,
        isProcessing: false,
        error: 'User authentication required for file upload'
      }));
      // Update both internal and Zustand state with errors
      setSelectedFiles(prev => [...prev, ...filesWithErrors]);
      zustandSetSelectedFiles(prev => [...prev, ...filesWithErrors]);
      return;
    }
    
    const prevLength = selectedFiles.length;
    const filesArray = Array.from(files).map(file => ({
      originalFile: file,
      isProcessing: true
    }));
    
    console.log(`Adding ${filesArray.length} files to be processed`);
    // Update both internal and Zustand state with placeholders
    setSelectedFiles(prev => [...prev, ...filesArray]);
    zustandSetSelectedFiles(prev => [...prev, ...filesArray]);
    
    // Process each file immediately
    filesArray.forEach((fileWrapper, index) => {
      processFile(fileWrapper.originalFile, prev => prevLength + index);
    });
  }, [selectedFiles.length, processFile, userId, zustandSetSelectedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    // Update both internal and Zustand state
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    zustandSetSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, [zustandSetSelectedFiles]);

  // Return the processed files for message sending
  const getProcessedFiles = useCallback((): FileAttachment[] => {
    return selectedFiles
      .filter(file => file.processedFile)
      .map(file => file.processedFile!);
  }, [selectedFiles]);

  // For backward compatibility - convert file attachments to content items if needed
  const getMessageContentItems = useCallback((): MessageContent[] => {
    return selectedFiles.map(file => {
      if (!file.processedFile) {
        return {
          type: 'text' as const,
          text: file.error 
            ? `Error processing file ${file.originalFile.name}: ${file.error}`
            : `Unable to process file ${file.originalFile.name}`
        };
      }
      
      const processedFile = file.processedFile;
      
      if (processedFile.isImage) {
        return {
          type: 'image_url' as const,
          image_url: { url: processedFile.url }
        };
      } else {
        return {
          type: 'file_url' as const,
          file_url: { url: processedFile.url },
          mime_type: processedFile.mime_type,
          file_name: processedFile.name
        };
      }
    });
  }, [selectedFiles]);

  const getFileType = useCallback((file: ProcessedFile): FileType => {
    const processor = getFileProcessor(file.originalFile);
    return processor.type;
  }, [getFileProcessor]);

  const isProcessingAny = processingQueue.length > 0;

  // Add a debug method
  const getFileStatus = useCallback(() => {
    return {
      totalFiles: selectedFiles.length,
      processingQueue,
      fileDetails: selectedFiles.map(file => ({
        name: file.originalFile.name,
        type: file.originalFile.type,
        size: file.originalFile.size,
        isProcessing: file.isProcessing,
        hasProcessedFile: !!file.processedFile,
        error: file.error || null
      }))
    };
  }, [selectedFiles, processingQueue]);

  // Return additional debugging helpers
  return {
    selectedFiles,
    handleFilesSelected,
    handleRemoveFile,
    getProcessedFiles,
    getMessageContentItems,
    getFileType,
    isProcessingFiles: isProcessingAny,
    getFileStatus, // New debug helper
    clearAllFiles: useCallback(() => {
      setSelectedFiles([]); // Clear internal state
      zustandSetSelectedFiles([]); // Clear Zustand state
    }, [setSelectedFiles, zustandSetSelectedFiles]) // Add dependencies
  };
};