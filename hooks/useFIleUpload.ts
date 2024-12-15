import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { convertImageToWebp } from '@/utils/chat/convertImageToWebp';
import { MessageContent } from '@/types/chat';


type FileType = 'image' | 'document' | 'spreadsheet' | 'markdown' | 'pdf' | 'other';

interface FileProcessor {
  type: FileType;
  mimeTypes: string[];
  process: (file: File) => Promise<MessageContent>;
}

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[·]/g, '-')                    // Replace dot-like characters
    .replace(/[^a-zA-Z0-9.-]/g, '-')         // Replace any non-alphanumeric chars (except dots and dashes) with dash
    .replace(/--+/g, '-')                    // Replace multiple dashes with single dash
    .replace(/^-+|-+$/g, '')                 // Remove dashes from start and end
    .substring(0, 100);                      // Limit length to prevent too long filenames
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
    const fileName = createUploadFileName(file.name);
    const filePath = `${userId}/${folder}/${fileName}`;    
    const { error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    if (!urlData) throw new Error('Error getting public URL');
    return urlData.publicUrl;
  };

  const fileProcessors: FileProcessor[] = [
    {
      type: 'image',
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      process: async (file: File): Promise<MessageContent> => {
        // Only convert JPEG and PNG to WebP
        if (CONVERTIBLE_IMAGE_TYPES.includes(file.type)) {
          const webpFile = await convertImageToWebp(file);
          const url = await uploadFile(webpFile, 'images');
          return {
            type: 'image_url',
            image_url: { url }
          };
        } else {
          // For GIF and already WebP images, upload directly
          const url = await uploadFile(file, 'images');
          return {
            type: 'image_url',
            image_url: { url }
          };
        }
      }
    },
    {
      type: 'document',
      mimeTypes: [
        TEXT_BASED_MIME_TYPES.pdf,
        TEXT_BASED_MIME_TYPES.doc,
        TEXT_BASED_MIME_TYPES.docx,
        TEXT_BASED_MIME_TYPES.txt,
      ],
      process: async (file: File): Promise<MessageContent> => {
        const content = await file.text();
        const cleanedContent = content.replace(/\s+/g, ' ').trim();
        
        return {
          type: 'text',
          text: `File: ${file.name}\n\nContent:\n${cleanedContent}`
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
      process: async (file: File): Promise<MessageContent> => {
        if (file.type === TEXT_BASED_MIME_TYPES.csv) {
          const content = await file.text();
          return {
            type: 'text',
            text: `CSV File: ${file.name}\n\n${content}`
          };
        }
      }
    },
    {
      type: 'markdown',
      mimeTypes: [TEXT_BASED_MIME_TYPES.md],
      process: async (file: File): Promise<MessageContent> => {
        const content = await file.text();
        return {
          type: 'text',
          text: `Markdown File: ${file.name}\n\n${content}`
        };
      }
    }
  ];

  const getFileProcessor = (file: File): FileProcessor => {
    const processor = fileProcessors.find(p => p.mimeTypes.includes(file.type));
    
    if (processor) {
      return processor;
    }

    // For unsupported file types, just return the file name and type
    return {
      type: 'other',
      mimeTypes: ['*'],
      process: async (file: File) => ({
        type: 'text',
        text: `Unsupported file type: ${file.name} (${file.type})`
      })
    };
  };

  const handleFilesSelected = useCallback((files: FileList) => {
    const filesArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...filesArray]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const processAndUploadFiles = useCallback(async (files: File[]): Promise<MessageContent[]> => {
    const uploadPromises = files.map(async (file) => {
      try {
        const processor = getFileProcessor(file);
        return await processor.process(file);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return {
          type: 'text' as const,
          text: `Error processing file ${file.name}: ${error.message}`
        };
      }
    });

    return Promise.all(uploadPromises);
  }, [userId, supabase]);

  const getFileType = useCallback((file: File): FileType => {
    const processor = getFileProcessor(file);
    return processor.type;
  }, []);

  return {
    selectedFiles,
    setSelectedFiles,
    handleFilesSelected,
    handleRemoveFile,
    processAndUploadFiles,
    getFileType,
  };
};