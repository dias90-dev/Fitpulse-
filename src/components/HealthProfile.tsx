import React from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Save, UserPlus, AlertCircle, CheckCircle2, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HealthProfile, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-utils';

export function HealthProfileForm() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = React.useState<Partial<HealthProfile>>({
    age: 25,
    weight: 70,
    height: 170,
    gender: 'Masculino',
    injuries: '',
    goals: '',
    equipment: 'Objetos domésticos (garrafas, cadeiras, etc)',
    trainingReminder: false,
    reminderTime: '18:00',
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null);

  React.useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const docRef = doc(db, 'healthProfiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as HealthProfile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const profileData = {
        ...profile,
        userId: user.uid,
        updatedAt: serverTimestamp(),
      };

      if (!profile.createdAt) {
        (profileData as any).createdAt = serverTimestamp();
      }

      await setDoc(doc(db, 'healthProfiles', user.uid), profileData);
      setMessage({ type: 'success', text: 'Perfil de saúde atualizado com sucesso!' });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `healthProfiles/${user.uid}`);
      setMessage({ type: 'error', text: 'Erro ao salvar perfil.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 pb-12"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <UserPlus className="text-emerald-500" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Resumo de Saúde</h2>
          <p className="text-gray-400">Estas informações ajudam o Trainer Virtual a personalizar seus treinos.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card-blur p-8 rounded-2xl border border-gray-800 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Idade</label>
            <input 
              type="number"
              value={profile.age || ''}
              onChange={(e) => setProfile({...profile, age: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Gênero</label>
            <select 
              value={profile.gender || 'Masculino'}
              onChange={(e) => setProfile({...profile, gender: e.target.value})}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
            >
              <option>Masculino</option>
              <option>Feminino</option>
              <option>Outro</option>
              <option>Prefiro não dizer</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Peso (kg)</label>
            <input 
              type="number"
              value={profile.weight || ''}
              onChange={(e) => setProfile({...profile, weight: parseFloat(e.target.value) || 0})}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Altura (cm)</label>
            <input 
              type="number"
              value={profile.height || ''}
              onChange={(e) => setProfile({...profile, height: parseInt(e.target.value) || 0})}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Equipamento disponível</label>
          <input 
            value={profile.equipment}
            onChange={(e) => setProfile({...profile, equipment: e.target.value})}
            placeholder="Ex: Nada, só objetos domésticos, halteres, academia completa"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Lesões ou condições médicas de atenção</label>
          <textarea 
            value={profile.injuries}
            onChange={(e) => setProfile({...profile, injuries: e.target.value})}
            placeholder="Ex: Hérnia de disco, dor no joelho esquerdo, asma..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Objetivos Fitness</label>
          <textarea 
            required
            value={profile.goals}
            onChange={(e) => setProfile({...profile, goals: e.target.value})}
            placeholder="Ex: Emagrecer 5kg em 3 meses, ganhar massa muscular, melhorar flexibilidade..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
          />
        </div>

        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <AlertCircle size={20} />
              </div>
              <div>
                <h4 className="font-bold">Notificações de Treino</h4>
                <p className="text-xs text-gray-500">Lembretes diários para não perder o foco.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setProfile({...profile, trainingReminder: !profile.trainingReminder})}
              className={`w-12 h-6 rounded-full transition-colors relative ${profile.trainingReminder ? 'bg-blue-600' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${profile.trainingReminder ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          <AnimatePresence>
            {profile.trainingReminder && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pt-4 border-t border-blue-500/10 overflow-hidden"
              >
                <label className="text-xs font-bold text-blue-400 uppercase mb-2 block">Horário Preferido</label>
                <input 
                  type="time"
                  value={profile.reminderTime}
                  onChange={(e) => setProfile({...profile, reminderTime: e.target.value})}
                  className="bg-gray-950 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            {saving ? <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Save size={20} />}
            Salvar Ficha de Saúde
          </button>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}
        </div>
      </form>
    </motion.div>
  );
}
