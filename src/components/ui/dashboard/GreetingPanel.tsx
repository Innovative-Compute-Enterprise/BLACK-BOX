'use client'; 

import React, { useState, useEffect } from 'react';
import { MonaSans } from "@/src/styles/fonts/font";
import ThemeSwitcher from '../ThemeSwitcher';

interface GreetingPanelProps {
  userName: string;
  subscriptionStatus: string;
}

const GreetingPanel: React.FC<GreetingPanelProps> = ({
  userName,
  subscriptionStatus
}) => {
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState(''); 
  const [currentDay, setCurrentDay] = useState(''); 
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateClockAndGreeting = () => {
      const now = new Date();
      
      // --- Time Formatting (pt-BR) ---
      const timeString = now.toLocaleTimeString('pt-BR', { // Changed locale to pt-BR
        hour: '2-digit',
        minute: '2-digit',
        // Removed hour12: true for standard pt-BR 24h format if preferred, 
        // or keep/set true if AM/PM is desired (less common in pt-BR)
        // hour12: false // Explicitly 24-hour format
      });
      setCurrentTime(timeString);

      // --- Date Formatting (pt-BR) ---
      const dayString = now.toLocaleDateString('pt-BR', { weekday: 'long' });
      // Capitalize the first letter of the day manually if needed (locale might handle it)
      setCurrentDay(dayString.charAt(0).toUpperCase() + dayString.slice(1)); 
      
      const dateString = now.toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' });
      setCurrentDate(dateString);

      // --- Greeting Logic ---
      const currentHour = now.getHours(); // Get hour (0-23)
      let dynamicGreeting = '';
      if (currentHour >= 5 && currentHour < 12) {
        dynamicGreeting = 'Bom dia'; // Good morning
      } else if (currentHour >= 12 && currentHour < 18) {
        dynamicGreeting = 'Boa tarde'; // Good afternoon
      } else {
        dynamicGreeting = 'Boa noite'; // Good evening/night
      }
      setGreeting(dynamicGreeting);
    };

    updateClockAndGreeting(); // Initial call
    // Update every minute to keep time and potentially greeting accurate if crossing thresholds
    const intervalId = setInterval(updateClockAndGreeting, 60000); 

    return () => clearInterval(intervalId); // Cleanup interval
  }, []); // Empty dependency array ensures this runs only once on mount + cleanup

  const isPro = subscriptionStatus === 'active';

  return (
    <div className="row-span-3 flex flex-col justify-center items-start border-r dark:border-[#ffffff]/10 border-black/10 p-8 relative dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 backdrop-blur-sm transition-all duration-300">
      
      <ThemeSwitcher />

      {/* Date/Time display using state and pt-BR format */}
      <div className="mb-2 text-gray-500 text-lg font-medium dark:text-gray-400"> 
        {currentDay}, {currentDate} - {currentTime}
      </div>

      {/* Dynamic Greeting (pt-BR) */}
      <h1 style={{ fontStretch: "125%" }} className={`${MonaSans.className} text-gray-900 text-5xl leading-tight font-[900] uppercase mb-9 text-left dark:text-white`}>
        {greeting} <br /> {userName} 
      </h1>
      
      {/* Subscription Status */}
      <div className={`flex items-center px-4 py-1.5 rounded-full mb-3 ${
        isPro 
          ? 'bg-green-500/10 dark:bg-green-900/20 border border-green-500/30 dark:border-green-600/30' 
          : 'bg-blue-500/10 dark:bg-blue-900/20 border border-blue-500/30 dark:border-blue-600/30'
      }`}>
        <div className={`h-2 w-2 rounded-full mr-2 ${
          isPro 
            ? 'bg-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)] dark:shadow-[0_0_8px_2px_rgba(34,197,94,0.4)]' 
            : 'bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.6)] dark:shadow-[0_0_8px_2px_rgba(59,130,246,0.4)]'
        } animate-pulse`}></div>
        <span className={`font-medium ${
          isPro 
            ? 'text-green-700 dark:text-green-400' 
            : 'text-blue-700 dark:text-blue-400'
        }`}>
          {isPro ? 'Pro Plan' : 'Free Tier'}
        </span>
      </div>
      
      {/* Footer Text */}
      <div className="absolute bottom-6 left-8 text-gray-500 text-xs dark:text-gray-500">Powered by ICE</div>
    </div>
  );
};

export default GreetingPanel;