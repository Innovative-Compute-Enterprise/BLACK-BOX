'use client';

import React, { memo, useEffect, useState, useRef } from "react";

// Match the ProcessedFile interface from useChatStore
interface ProcessedFile {
  originalFile: File;
  processedFile?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    mime_type: string;
    isImage: boolean;
  };
  isProcessing: boolean;
  error?: string;
}

interface SelectedFilesDisplayProps {
  files: ProcessedFile[];
  onRemoveFile: (index: number) => void;
}

const FileTypeIcon = memo(function FileTypeIconComponent ({ type }: { type: string }) {
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                        clipRule="evenodd"
                    />
                </svg>
            );
        } else if (mimeType.includes("spreadsheet") || mimeType.includes("csv")) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm6.905 9.97a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72V18a.75.75 0 0 0 1.5 0v-4.19l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
                        clipRule="evenodd"
                    />
                    <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
                </svg>
            );
        } else if (mimeType.includes("markdown") || mimeType.includes("text/")) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
                        clipRule="evenodd"
                    />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
            );
        } else {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                >
                    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                </svg>
            );
        }
    };
    return getFileIcon(type);
});
FileTypeIcon.displayName = 'FileTypeIcon';

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const SelectedFilesDisplay: React.FC<SelectedFilesDisplayProps> = ({
    files,
    onRemoveFile,
}) => {
    // Use ref for render counting instead of state to avoid re-renders
    const renderCountRef = useRef(0);
    
    // Add debugging to see what files are being passed to the component
    useEffect(() => {
        // Increment render count without triggering re-render
        renderCountRef.current += 1;
        
        console.log(`[SelectedFilesDisplay] Render #${renderCountRef.current} with ${files?.length || 0} files`);
        
        if (files && files.length > 0) {
            console.log('[SelectedFilesDisplay] Files:', files);
            files.forEach((file, idx) => {
                console.log(`[SelectedFilesDisplay] File ${idx}: ${file.originalFile?.name}, Processing: ${file.isProcessing}, Error: ${file.error || 'none'}`);
            });
        } else {
            console.log('[SelectedFilesDisplay] No files provided or empty array');
        }
    }, [files]);

    // Safety check for null/undefined files
    if (!files) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                No files array provided
            </div>
        );
    }
    
    // Check for empty files array
    if (files.length === 0) {
        return null;
    }

    return (
        <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
            {/* Debug counter */}
            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Displaying {files.length} file{files.length !== 1 ? 's' : ''} (Render #{renderCountRef.current})
            </div>
            
            <div className="flex flex-wrap gap-2 w-full" role="list" aria-label="Selected files">
                {files.map((file, index) => {
                    // Safety check for malformed file objects
                    if (!file || !file.originalFile) {
                        return (
                            <div key={index} className="bg-red-100 dark:bg-red-900/30 border border-red-400 rounded-lg px-3 py-2">
                                Invalid file at index {index}
                            </div>
                        );
                    }
                    
                    // Handle ProcessedFile objects
                    const actualFile = file.originalFile;
                    const hasError = !!file.error;
                    const isProcessing = file.isProcessing;
                    
                    return (
                        <div
                            key={index}
                            className={`flex items-center space-x-2 bg-white dark:bg-zinc-800 rounded-lg px-3 py-2 shadow-sm border ${
                                hasError 
                                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
                                    : isProcessing 
                                        ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700'
                            }`}
                            role="listitem"
                        >
                            <div className={`text-gray-600 dark:text-gray-300 ${hasError ? 'text-red-500 dark:text-red-400' : ''}`}>
                                <FileTypeIcon type={actualFile.type} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span
                                    className={`truncate max-w-[150px] text-sm font-medium ${
                                        hasError ? 'text-red-600 dark:text-red-400' : ''
                                    }`}
                                    title={actualFile.name}
                                >
                                    {actualFile.name}
                                </span>
                                <span className={`text-xs ${
                                    hasError 
                                        ? 'text-red-500 dark:text-red-400' 
                                        : isProcessing
                                            ? 'text-blue-500 dark:text-blue-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {hasError 
                                        ? file.error 
                                        : isProcessing 
                                            ? 'Processing...' 
                                            : formatFileSize(actualFile.size)}
                                </span>
                            </div>
                            <button
                                onClick={() => onRemoveFile(index)}
                                className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                aria-label={`Remove file ${actualFile.name}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="size-4 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default memo(SelectedFilesDisplay);