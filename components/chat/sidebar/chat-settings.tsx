"use client"; // Mark as client component

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/select";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { theme, setTheme } = useTheme();

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

            {/* Language Selector */}
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
            </div>
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