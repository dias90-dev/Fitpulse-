import React from 'react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Activity, Zap, Shield, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingPage() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full -translate-y-1/2"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 pb-32">
        {/* Header */}
        <header className="flex justify-between items-center mb-24">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
              <Activity className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter">FitPulse</h1>
          </div>
          <button 
            onClick={handleLogin}
            className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all text-sm"
          >
            Entrar
          </button>
        </header>

        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles size={14} />
              Powered by Google Gemini 
            </span>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9]">
              Sua evolução física <br/>
              <span className="text-blue-500">sob controle.</span>
            </h2>
            <p className="text-gray-400 text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
              O FitPulse combina rastreamento profissional com inteligência artificial para criar o plano perfeito para o seu corpo e seus objetivos.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={handleLogin}
                className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center gap-2 text-lg"
              >
                Começar agora
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <img 
                    key={i} 
                    src={`https://i.pravatar.cc/100?u=fitpulse${i}`} 
                    className="w-10 h-10 rounded-full border-2 border-[#0A0A0B]" 
                    alt="User" 
                    referrerPolicy="no-referrer"
                  />
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-[#0A0A0B] bg-gray-900 flex items-center justify-center text-[10px] font-bold">
                  +1k
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap className="text-blue-500" />}
            title="Treinador Virtual"
            description="Algoritmos de IA que geram treinos adaptados às suas lesões e equipamentos."
          />
          <FeatureCard 
            icon={<TrendingUp className="text-emerald-500" />}
            title="Análise de Dados"
            description="Gráficos de barramentos e linhas para visualizar cada repetição e cada quilo ganho."
          />
          <FeatureCard 
            icon={<Shield className="text-pink-500" />}
            title="Sincronização Nuvem"
            description="Seus dados seguros no Firebase, acessíveis em qualquer dispositivo instantaneamente."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl border border-gray-800 bg-gray-900/40 backdrop-blur-sm space-y-4 hover:border-gray-700 transition-colors">
      <div className="w-12 h-12 bg-gray-800 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
    </div>
  );
}
