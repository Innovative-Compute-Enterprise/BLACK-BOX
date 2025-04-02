import React from 'react';
import GreetingPanel from './GreetingPanel';
import FeatureButton from './FeatureButton';
import ChatIcon from '@/src/components/icons/ChatIcon';
import VoiceIcon from '@/src/components/icons/VoiceIcon';

interface DashboardProps {
  userName: string;
  subscriptionStatus: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  userName,
  subscriptionStatus
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto flex justify-center items-center">
      <div className="w-full aspect-[16/9] rounded-xl overflow-hidden dark:bg-[#0E0E0E]/70 bg-[#F1F1F1]/70 dark:border-[#ffffff]/10 border-black/10 border transition-all duration-300">
        <div className="grid grid-cols-2 h-full">
          {/* Left panel with greeting and plan info */}
          <GreetingPanel 
            userName={userName} 
            subscriptionStatus={subscriptionStatus} 
          />
          
          {/* Updated container for right-side feature buttons: grid with 3 columns */}
          <div className="grid grid-cols-3 p-3 gap-4 overflow-y-auto h-full">
            {/* Chat button */}
            <FeatureButton 
              href="/chat"
              icon={<ChatIcon className="text-gray-800 w-8 h-8 dark:text-white" />}
              title="CHAT"
            />
            
            {/* Voice coming soon */}
            <FeatureButton 
              icon={<VoiceIcon className="text-gray-800 w-9 h-9 dark:text-white" />}
              title="SOON"
              subtitle="Coming soon"
              isDisabled={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 