// hooks/useChatContext.ts
'use client'

import { useContext } from 'react';
import { ChatContext } from '@/context/ChatContext';

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};