"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/shadcn/dialog";
import { useTheme } from "@/src/context/ThemeContext";
import { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/src/components/shadcn/textarea";
import { Button } from "@/src/components/shadcn/button";
import {
   Text, Save, Loader2, Check, Sun, Moon, Laptop, User,
  Settings as SettingsIcon, Brush, MousePointerClick, Database, SlidersHorizontal, X,
  PlusCircle, Trash2
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/src/components/shadcn/radio-group";
import { Label } from "@/src/components/shadcn/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/shadcn/select";
import { cn } from "@/src/lib/utils";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PERSONALITIES_STORAGE_KEY = 'custom-personalities';
const ACTIVE_PERSONALITY_NAME_KEY = 'active-personality-name';
const DEFAULT_PERSONALITY_NAME = 'Default';
const MAX_WORDS = 1000;

interface Personality {
  name: string;
  instructions: string;
}

type TabId = 'account' | 'appearance' | 'behavior' | 'customize' | 'dataControls';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'account', label: 'Account', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Brush },
  { id: 'behavior', label: 'Behavior', icon: MousePointerClick },
  { id: 'customize', label: 'Customize', icon: SlidersHorizontal },
  { id: 'dataControls', label: 'Data Controls', icon: Database },
];

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabId>('account');
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [activePersonalityName, setActivePersonalityName] = useState<string | null>(null);
  const [currentEditText, setCurrentEditText] = useState<string>("");
  const [initialLoadInstructions, setInitialLoadInstructions] = useState<string>("");
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const savePersonalities = useCallback((updatedPersonalities: Personality[], newActiveName: string | null) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PERSONALITIES_STORAGE_KEY, JSON.stringify(updatedPersonalities));
        if (newActiveName) {
          localStorage.setItem(ACTIVE_PERSONALITY_NAME_KEY, newActiveName);
        }
        console.log('[Settings] Saved personalities and active name:', { count: updatedPersonalities.length, active: newActiveName });
      } catch (error) {
        console.error("Failed to save personalities:", error);
      }
    }
  }, []);

  const loadPersonalities = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedPersonalitiesStr = localStorage.getItem(PERSONALITIES_STORAGE_KEY);
        let loadedPersonalities: Personality[] = storedPersonalitiesStr ? JSON.parse(storedPersonalitiesStr) : [];
        let loadedActiveName = localStorage.getItem(ACTIVE_PERSONALITY_NAME_KEY);

        if (loadedPersonalities.length === 0) {
          const defaultPersonality: Personality = { name: DEFAULT_PERSONALITY_NAME, instructions: "" };
          loadedPersonalities = [defaultPersonality];
          loadedActiveName = DEFAULT_PERSONALITY_NAME;
          savePersonalities(loadedPersonalities, loadedActiveName);
          console.log('[Settings] Initialized default personality.');
        }

        if (!loadedActiveName || !loadedPersonalities.some(p => p.name === loadedActiveName)) {
           loadedActiveName = loadedPersonalities[0]?.name || null;
           if(loadedActiveName) {
             localStorage.setItem(ACTIVE_PERSONALITY_NAME_KEY, loadedActiveName);
           }
           console.log('[Settings] Active personality name invalid or missing, falling back to:', loadedActiveName);
        }

        setPersonalities(loadedPersonalities);
        setActivePersonalityName(loadedActiveName);
        console.log('[Settings] Loaded personalities:', { count: loadedPersonalities.length, active: loadedActiveName });

      } catch (error) {
        console.error("Failed to load personalities:", error);
        const defaultPersonality: Personality = { name: DEFAULT_PERSONALITY_NAME, instructions: "" };
        setPersonalities([defaultPersonality]);
        setActivePersonalityName(DEFAULT_PERSONALITY_NAME);
      }
    }
  }, [savePersonalities]);

  useEffect(() => {
    if (isOpen) {
      loadPersonalities();
      setIsSaved(false);
    }
  }, [isOpen, loadPersonalities]);

  useEffect(() => {
    if (activePersonalityName) {
      const activePersonality = personalities.find(p => p.name === activePersonalityName);
      const instructions = activePersonality?.instructions || '';
      setCurrentEditText(instructions);
      setInitialLoadInstructions(instructions);
      setIsSaved(false);
    }
  }, [activePersonalityName, personalities]);

  useEffect(() => {
    const words = currentEditText.trim() ? currentEditText.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [currentEditText]);

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    if (words <= MAX_WORDS) {
      setCurrentEditText(value);
      setIsSaved(false);
    }
  };

  const saveCurrentPersonalityInstructions = () => {
    if (!activePersonalityName || wordCount > MAX_WORDS) return;

    setIsSaving(true);
    setIsSaved(false);

    try {
      const updatedPersonalities = personalities.map(p => 
        p.name === activePersonalityName 
          ? { ...p, instructions: currentEditText } 
          : p
      );
      
      setPersonalities(updatedPersonalities);
      savePersonalities(updatedPersonalities, activePersonalityName);
      setInitialLoadInstructions(currentEditText);

      console.log('[Settings] Saved instructions for personality:', activePersonalityName);

      setTimeout(() => {
        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }, 500);
    } catch (error) {
      console.error("Failed to save custom instructions for personality:", error);
      setIsSaving(false);
    }
  };
  
  const handleAddNewPersonality = () => {
    const newName = prompt("Enter a name for the new personality:");
    if (newName && newName.trim() !== "") {
      if (personalities.some(p => p.name === newName)) {
        alert("A personality with this name already exists.");
        return;
      }
      const newPersonality: Personality = { name: newName, instructions: "" };
      const updatedPersonalities = [...personalities, newPersonality];
      setPersonalities(updatedPersonalities);
      setActivePersonalityName(newName);
      savePersonalities(updatedPersonalities, newName);
      setCurrentEditText("");
      setInitialLoadInstructions("");
    } else if (newName !== null) {
        alert("Personality name cannot be empty.");
    }
  };

  const handleDeletePersonality = () => {
    if (!activePersonalityName || personalities.length <= 1) {
      alert("Cannot delete the last personality.");
      return;
    }

    if (confirm(`Are you sure you want to delete the "${activePersonalityName}" personality? This cannot be undone.`)) {
      const updatedPersonalities = personalities.filter(p => p.name !== activePersonalityName);
      const newActiveName = updatedPersonalities[0]?.name || null;
      
      setPersonalities(updatedPersonalities);
      setActivePersonalityName(newActiveName);
      savePersonalities(updatedPersonalities, newActiveName);
      console.log('[Settings] Deleted personality:', activePersonalityName, '. New active:', newActiveName);
    }
  };
  
  const handleActivePersonalityChange = (name: string) => {
    setActivePersonalityName(name);
    savePersonalities(personalities, name);
  };

  const currentPersonality = personalities.find(p => p.name === activePersonalityName);
  const hasUnsavedChanges = currentEditText !== initialLoadInstructions;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0">
        <div className="flex h-[600px]">
          <div className="w-1/4 bg-muted/40 border-r p-4 flex flex-col justify-between">
            <div>
                <h2 className="text-xl font-semibold mb-6 px-2">Settings</h2>
                <nav className="flex flex-col space-y-1">
                {tabs.map((tab) => (
                    <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    >
                    <tab.icon className="w-5 h-5 mr-3" />
                    {tab.label}
                    </button>
                ))}
                </nav>
            </div>
          </div>

          <div className="w-3/4 p-6 overflow-y-auto relative">
            <DialogTitle className="sr-only">Settings</DialogTitle>

            {activeTab === 'account' && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">Account</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                     <div className="flex items-center space-x-4">
                        <div className="bg-primary rounded-full p-2 text-primary-foreground"> 
                            <User className="w-6 h-6" /> 
                        </div>
                        <div>
                            <p className="font-semibold">ICE</p> 
                            <p className="text-sm text-muted-foreground">garimeipod@gmail.com</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <p className="font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">Your current subscription plan.</p>
                    </div>
                    <Button variant="outline" size="sm">Premium</Button> 
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                     <div>
                        <p className="font-medium">Billing Information</p>
                        <p className="text-sm text-muted-foreground">Manage payment methods and view invoices.</p>
                    </div>
                    <Button variant="outline" size="sm">Manage</Button> 
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                     <div>
                        <p className="font-medium">Language</p>
                        <p className="text-sm text-muted-foreground">Select your preferred language.</p>
                    </div>
                    <Button variant="outline" size="sm">Change</Button> 
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">Appearance</h3>
                <div className="space-y-6">
                   <div>
                        <label className="block text-base font-medium mb-2">Theme</label>
                        <RadioGroup
                        value={theme}
                        onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
                        className="grid grid-cols-3 gap-4"
                        >
                        <Label htmlFor="light" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:bg-primary [&:has([data-state=checked])]:text-primary-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors">
                            <RadioGroupItem value="light" id="light" className="sr-only" />
                            <Sun className="mb-2 h-6 w-6" />
                            Light
                        </Label>
                        <Label htmlFor="dark" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:bg-primary [&:has([data-state=checked])]:text-primary-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors">
                            <RadioGroupItem value="dark" id="dark" className="sr-only" />
                            <Moon className="mb-2 h-6 w-6" />
                            Dark
                        </Label>
                        <Label htmlFor="system" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:bg-primary [&:has([data-state=checked])]:text-primary-foreground [&:has([data-state=checked])]:border-primary cursor-pointer transition-colors">
                            <RadioGroupItem value="system" id="system" className="sr-only" />
                            <Laptop className="mb-2 h-6 w-6" />
                            System
                        </Label>
                        </RadioGroup>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'behavior' && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">Behavior</h3>
                <p>Behavior settings content goes here...</p>
              </div>
            )}

            {activeTab === 'customize' && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">Customize</h3>
                <div className="space-y-4">
                   <div>
                     <Label htmlFor="personality-select" className="text-base font-medium mb-1.5 block">Active Personality</Label>
                      <div className="flex items-center gap-2">
                        <Select 
                           value={activePersonalityName || ''} 
                           onValueChange={handleActivePersonalityChange}
                        >
                          <SelectTrigger id="personality-select" className="flex-grow">
                            <SelectValue placeholder="Select a personality..." />
                          </SelectTrigger>
                          <SelectContent>
                            {personalities.map((p) => (
                              <SelectItem key={p.name} value={p.name}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={handleAddNewPersonality} title="New Personality">
                          <PlusCircle className="h-5 w-5" />
                        </Button>
                         <Button 
                           variant="outline" 
                           size="icon" 
                           onClick={handleDeletePersonality} 
                           title="Delete Current Personality"
                           disabled={personalities.length <= 1}
                         >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                   </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label htmlFor="customInstructions" className="flex items-center text-base font-medium">
                        <Text className="w-5 h-5 mr-2" />
                        Instructions for &quot;{activePersonalityName || 'None'}&quot;
                      </label>
                      <span className={`text-xs font-medium ${wordCount > MAX_WORDS ? "text-red-500" : wordCount > MAX_WORDS * 0.9 ? "text-orange-500" : "text-muted-foreground"}`}>
                        {wordCount}/{MAX_WORDS} words
                      </span>
                    </div>
                    <Textarea
                      id="customInstructions"
                      placeholder={`Add instructions for the ${activePersonalityName || 'Default'} personality...`}
                      className="w-full min-h-[250px] resize-none dark:bg-black bg-white text-black dark:text-white text-base border rounded-md p-3"
                      value={currentEditText}
                      onChange={handleInstructionsChange}
                      disabled={!activePersonalityName}
                    />
                    <div className="mt-3 flex justify-between items-center">
                      <p className="text-xs text-muted-foreground max-w-[70%]">
                        These instructions guide the AI when the &quot;{activePersonalityName || 'Default'}&quot; personality is active.
                      </p>
                      <div className="flex items-center gap-2">
                        {isSaved && !isSaving && (
                          <span className="text-xs text-green-500 flex items-center">
                            <Check className="w-4 h-4 mr-1" />
                            Saved!
                          </span>
                        )}
                        <Button
                          size="sm"
                          onClick={saveCurrentPersonalityInstructions}
                          disabled={isSaving || wordCount > MAX_WORDS || !hasUnsavedChanges || !activePersonalityName}
                          className="min-w-[80px]"
                        >
                          {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-1.5" />
                          )}
                          {isSaving ? "Saving" : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dataControls' && (
              <div>
                <h3 className="text-2xl font-semibold mb-6">Data Controls</h3>
                <p>Data Controls settings content goes here...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}