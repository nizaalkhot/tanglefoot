import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Leaderboard from './components/Leaderboard';
import StressArena from './components/StressArena';
import StressorEncyclopedia from './components/StressorEncyclopedia';
import CLIIntegration from './components/CLIIntegration';

export default function App() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [isDark, setIsDark] = useState(false);

  // Apply dark/light class modifiers on the HTML body element
  useEffect(() => {
    const body = document.body;
    if (isDark) {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="app-container">
      {/* Dynamic Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDark={isDark} 
        toggleTheme={toggleTheme} 
      />

      {/* Main Focus Area */}
      <main className="main-content">
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'arena' && <StressArena />}
        {activeTab === 'encyclopedia' && <StressorEncyclopedia />}
        {activeTab === 'cli' && <CLIIntegration />}
      </main>
    </div>
  );
}
