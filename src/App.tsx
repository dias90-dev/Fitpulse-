import React from 'react';
import { auth } from './firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { AuthStatus } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { HealthProfileForm } from './components/HealthProfile';
import { VirtualTrainer } from './components/VirtualTrainer';
import { WorkoutHistory } from './components/History';
import { Settings } from './components/Settings';
import { LandingPage } from './components/Landing';
import { Activity, LayoutDashboard, Sparkles, UserPlus, History, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut } from 'firebase/auth';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = React.useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'trainer': return <VirtualTrainer />;
      case 'history': return <WorkoutHistory />;
      case 'health': return <HealthProfileForm />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="p-4 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-600/20"
        >
          <Activity className="text-white" size={32} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-gray-800 bg-[#0A0A0B]/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">FitPulse</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-gray-900/50 p-1 rounded-xl border border-gray-800">
            <TabButton icon={<LayoutDashboard size={18} />} label="Início" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <TabButton icon={<Sparkles size={18} />} label="Trainer" active={activeTab === 'trainer'} onClick={() => setActiveTab('trainer')} />
            <TabButton icon={<History size={18} />} label="História" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
            <TabButton icon={<UserPlus size={18} />} label="Saúde" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <AuthStatus />
            </div>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500 hover:text-white'}`}
              title="Configurações"
            >
              <SettingsIcon size={20} />
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-gray-800 bg-[#0A0A0B]/80 backdrop-blur-md z-40 md:hidden">
        <div className="flex items-center justify-around h-full">
          <NavIcon icon={<LayoutDashboard />} label="Início" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavIcon icon={<Sparkles />} label="Trainer" active={activeTab === 'trainer'} onClick={() => setActiveTab('trainer')} />
          <NavIcon icon={<History />} label="História" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavIcon icon={<SettingsIcon />} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <NavIcon icon={<UserPlus />} label="Saúde" active={activeTab === 'health'} onClick={() => setActiveTab('health')} />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function NavIcon({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-blue-500' : 'text-gray-500'}`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
