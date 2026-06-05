import React from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Sparkles, Brain, AlertTriangle, Send, RefreshCw, Dumbbell, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HealthProfile } from '../types';

interface AIWorkout {
  title: string;
  description: string;
  exercises: {
    name: string;
    sets: string;
    reps: string;
    instruction: string;
    equipment: string;
  }[];
  safetyNote: string;
  motivation: string;
}

export function VirtualTrainer() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = React.useState<HealthProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [userRequest, setUserRequest] = React.useState('');
  const [workoutFocus, setWorkoutFocus] = React.useState<'força' | 'hipertrofia' | 'resistência' | 'flexibilidade' | 'emagrecimento'>('força');
  const [extraEquipment, setExtraEquipment] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [generationStep, setGenerationStep] = React.useState(0);
  const [confirmingWeight, setConfirmingWeight] = React.useState(false);
  const [tempWeight, setTempWeight] = React.useState('');
  const [workout, setWorkout] = React.useState<AIWorkout | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const loadingSteps = [
    "Analisando seu perfil biomecânico...",
    "Consultando restrições de lesões...",
    "Verificando equipamentos domésticos...",
    "Otimizando volume e intensidade...",
    "Finalizando plano personalizado..."
  ];

  React.useEffect(() => {
    async function checkProfile() {
      if (!user) return;
      try {
        const docSnap = await getDoc(doc(db, 'healthProfiles', user.uid));
        if (docSnap.exists()) {
          const data = docSnap.data() as HealthProfile;
          setProfile(data);
          setTempWeight(data.weight ? data.weight.toString() : '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfile(false);
      }
    }
    checkProfile();
  }, [user]);

  const handleStartGeneration = () => {
    setConfirmingWeight(true);
  };

  const generateWorkout = async () => {
    if (!profile) return;
    setConfirmingWeight(false);
    setGenerating(true);
    setGenerationStep(0);
    setError(null);
    setWorkout(null);

    // Simulate progress steps
    const stepInterval = setInterval(() => {
      setGenerationStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
    }, 1500);

    try {
      const response = await fetch('/api/trainer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile: { ...profile, weight: Number(tempWeight) }, 
          userRequest,
          workoutFocus,
          extraEquipment
        }),
      });

      if (!response.ok) throw new Error('Falha ao conectar com o Trainer Virtual');
      const data = await response.json();
      
      // Ensure at least some time passed for the animation feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setWorkout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao gerar treino.');
    } finally {
      clearInterval(stepInterval);
      setGenerating(false);
    }
  };

  if (loadingProfile) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center card-blur p-12 rounded-3xl border border-gray-800 border-dashed">
        <AlertTriangle className="text-orange-500 mb-4" size={48} />
        <h3 className="text-2xl font-bold mb-2">Perfil de Saúde Necessário</h3>
        <p className="text-gray-400 mb-8 max-w-md">Para sua segurança e melhores resultados, o Trainer Virtual precisa conhecer suas condições físicas e objetivos antes de gerar treinos.</p>
        <p className="text-blue-500 font-bold uppercase tracking-widest text-sm">Preencha a ficha de saúde primeiro.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-600/30">
          <Sparkles className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Virtual Trainer</h2>
          <p className="text-gray-400">Treinos profissionais baseados no seu perfil único.</p>
        </div>
      </div>

      {/* Input Area */}
      <div className="card-blur p-6 rounded-2xl border border-gray-800 space-y-6">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 block">
            Foco do Treinamento
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {(['força', 'hipertrofia', 'resistência', 'flexibilidade', 'emagrecimento'] as const).map((focus) => (
              <button
                key={focus}
                onClick={() => setWorkoutFocus(focus)}
                className={`py-2 px-3 rounded-xl text-[10px] font-bold uppercase transition-all border ${
                  workoutFocus === focus 
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                {focus}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Dumbbell size={14} />
              Equipamento Extra
            </label>
            <input 
              value={extraEquipment}
              onChange={(e) => setExtraEquipment(e.target.value)}
              placeholder="Ex: Faixa elástica, Kettlebell..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Brain size={14} />
              Detalhes Adicionais
            </label>
            <input 
              value={userRequest}
              onChange={(e) => setUserRequest(e.target.value)}
              disabled={generating || confirmingWeight}
              placeholder="Ex: Treino rápido de 20 min..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <button 
          onClick={handleStartGeneration}
          disabled={generating || confirmingWeight}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          {generating ? <RefreshCw className="animate-spin" size={20} /> : <><Sparkles size={18} /> Gerar Treino Personalizado</>}
        </button>
      </div>

      {/* Weight Confirmation Overlay */}
      <AnimatePresence>
        {confirmingWeight && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-900 border border-gray-800 p-8 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-blue-500/10 rounded-full text-blue-500">
                  <Dumbbell size={32} />
                </div>
                <h3 className="text-xl font-bold">Confirme seu Peso</h3>
                <p className="text-gray-500 text-sm">O peso atual é crucial para calcular a carga e intensidade ideal para você.</p>
                
                <div className="flex items-center gap-3 w-full">
                  <input 
                    type="number"
                    value={tempWeight}
                    onChange={(e) => setTempWeight(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <span className="text-xl font-bold text-gray-600 font-mono">KG</span>
                </div>

                <div className="flex gap-3 w-full pt-4">
                  <button 
                    onClick={() => setConfirmingWeight(false)}
                    className="flex-1 py-3 text-gray-500 font-bold hover:text-white transition-colors"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={generateWorkout}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20"
                  >
                    Gerar agora
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Area */}
      <AnimatePresence mode="wait">
        {generating && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-blur p-12 rounded-3xl border border-blue-500/20 flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-110 animate-pulse"></div>
              <div className="w-24 h-24 rounded-3xl bg-gray-900 border border-blue-500/30 flex items-center justify-center animate-float">
                <Sparkles className="text-blue-500" size={48} />
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-blue-400">Processando</span>
                <span className="text-gray-500">{Math.round(((generationStep + 1) / loadingSteps.length) * 100)}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((generationStep + 1) / loadingSteps.length) * 100}%` }}
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={generationStep}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-sm font-medium text-gray-400 text-center italic"
                >
                  {loadingSteps[generationStep]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-3"
          >
            <AlertTriangle size={24} />
            <span className="font-medium">{error}</span>
          </motion.div>
        )}

        {workout && !generating && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card-blur p-8 rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Dumbbell size={120} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 text-blue-500 mb-2">
                  <Zap size={16} fill="currentColor" />
                  <span className="text-xs font-bold uppercase tracking-widest">Treino Gerado pela AI</span>
                </div>
                <h3 className="text-4xl font-bold mb-4 tracking-tighter">{workout.title}</h3>
                <p className="text-gray-400 mb-8 text-lg leading-relaxed">{workout.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {workout.exercises.map((ex, idx) => (
                    <div key={idx} className="p-5 bg-gray-900/50 border border-gray-800 rounded-2xl hover:border-blue-500/30 transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-gray-800 rounded-lg text-gray-400 group-hover:text-blue-500 transition-colors">
                          <Dumbbell size={18} />
                        </div>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-gray-600 border border-gray-700 px-2 py-1 rounded-md uppercase">{ex.sets} Sets</span>
                          <span className="text-[10px] font-bold text-blue-500/80 bg-blue-500/5 px-2 py-1 rounded-md uppercase">{ex.reps} Reps</span>
                        </div>
                      </div>
                      <h4 className="text-xl font-bold mb-2">{ex.name}</h4>
                      {ex.equipment && (
                        <p className="text-xs font-bold text-emerald-500/80 mb-2 uppercase flex items-center gap-1">
                          <ShieldCheck size={12} />
                          Uso: {ex.equipment}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 leading-snug">{ex.instruction}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3">
                    <ShieldCheck className="text-orange-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-orange-500 uppercase mb-1">Nota de Segurança</p>
                      <p className="text-sm text-gray-300 italic">{workout.safetyNote}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-3">
                    <Sparkles className="text-emerald-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Motivação</p>
                      <p className="text-sm font-medium text-gray-200">{workout.motivation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
