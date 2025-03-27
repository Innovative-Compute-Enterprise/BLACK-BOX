"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/shadcn/select";
import { useTheme } from "@/src/context/ThemeContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Textarea } from "@/src/components/shadcn/textarea";
import { Button } from "@/src/components/shadcn/button";
import { getCustomInstructions, updateCustomInstructions } from "@/src/lib/ai/prompts";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const [customInstructions, setCustomInstructions] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const MAX_WORDS = 1000;
  
  useEffect(() => {
    // Load custom instructions when dialog opens
    if (isOpen) {
      try {
        const savedInstructions = getCustomInstructions();
        console.log('[Settings] Loading saved instructions:', 
          savedInstructions ? savedInstructions.substring(0, 30) + '...' : '(none)');
        setCustomInstructions(savedInstructions);
      } catch (error) {
        console.error("Failed to load custom instructions:", error);
      }
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Count words in the custom instructions
    const words = customInstructions.trim() ? customInstructions.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [customInstructions]);
  
  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    
    if (words <= MAX_WORDS) {
      setCustomInstructions(value);
      setIsSaved(false);
    }
  };
  
  const saveCustomInstructions = () => {
    if (wordCount > MAX_WORDS) return;
    
    setIsSaving(true);
    try {
      console.log('[DEBUG] Saving custom instructions:', {
        rawValue: customInstructions,
        preview: customInstructions.substring(0, 30) + '...',
        length: customInstructions.length,
        wordCount
      });
      
      // First attempt to save
      updateCustomInstructions(customInstructions);
      
      // Force direct localStorage save as a backup mechanism
      if (typeof window !== 'undefined') {
        localStorage.setItem('custom-instructions', customInstructions);
        
        // Verify immediately after setting
        const verifyInstructions = localStorage.getItem('custom-instructions');
        if (verifyInstructions !== customInstructions) {
          console.error('[DEBUG] localStorage verification failed, retrying...');
          
          // Try one more time with a small delay
          setTimeout(() => {
            localStorage.setItem('custom-instructions', customInstructions);
            console.log('[DEBUG] Second attempt localStorage:', 
              localStorage.getItem('custom-instructions')?.substring(0, 30) + '...');
          }, 100);
        }
      }
      
      // Verify the instructions were saved to localStorage
      const savedInstructions = localStorage.getItem('custom-instructions');
      console.log('[DEBUG] Verified saved instructions:', {
        saved: savedInstructions === customInstructions,
        savedPreview: savedInstructions ? savedInstructions.substring(0, 30) + '...' : '(none)',
        originalPreview: customInstructions.substring(0, 30) + '...'
      });
      
      setTimeout(() => {
        setIsSaving(false);
        setIsSaved(true);
        
        // Final verification after the timeout
        if (typeof window !== 'undefined') {
          const finalCheck = localStorage.getItem('custom-instructions');
          console.log('[DEBUG] Final localStorage check:', 
            finalCheck ? finalCheck.substring(0, 30) + '...' : '(none)');
        }
        
        // Reset the saved indicator after a delay
        setTimeout(() => {
          setIsSaved(false);
        }, 3000);
      }, 500);
    } catch (error) {
      console.error("Failed to save custom instructions:", error);
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your preferences and account settings below.
          </DialogDescription>
        </DialogHeader>

        {/* General Settings Section */}
        <div className="mt-4">
          <div className="space-y-9">
            {/* Theme Selector */}
            <div>
              <label htmlFor="theme" className="block text-sm font-medium mb-1.5">
                Theme
              </label>
              <Select
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
              >
                <SelectTrigger id="theme" className="w-full">
                  <SelectValue placeholder="Select Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom Instructions */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="customInstructions" className="block text-sm font-medium">
                  Custom Instructions
                </label>
                <span className={`text-xs ${wordCount > MAX_WORDS ? "text-red-500" : wordCount > MAX_WORDS * 0.9 ? "text-orange-500" : "text-gray-500"}`}>
                  {wordCount}/{MAX_WORDS} words
                </span>
              </div>
              <Textarea
                id="customInstructions"
                placeholder="Add custom instructions for the AI assistant..."
                className="w-full min-h-[120px] resize-vertical dark:bg-black bg-white text-black dark:text-white"
                value={customInstructions}
                onChange={handleInstructionsChange}
              />
              <div className="mt-1 flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  Custom instructions help tailor the AI&apos;s responses to your preferences.
                </p>
                <div className="flex items-center gap-2">
                  {isSaved && (
                    <span className="text-xs text-green-500">Saved!</span>
                  )}
                  <Button 
                    size="sm" 
                    onClick={saveCustomInstructions} 
                    disabled={isSaving || wordCount > MAX_WORDS}
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Language Selector
            <div>
              <label htmlFor="language" className="block text-sm font-medium mb-1.5">
                Language
              </label>
              <Select>
                <SelectTrigger id="language" className="w-full">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
        </div>

        {/* Account Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Account</h2>
          <div className="mt-2">
            <Link href="/account" className="text-blue-500 hover:underline">
              Manage Account
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}