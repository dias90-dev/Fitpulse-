import React from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Settings as SettingsIcon, Bell, Ruler, Save, CheckCircle2, Shield, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserSettings, OperationType } from '../types';
import { handleFirestoreError } from '../lib/firestore-utils';

export function Settings() {
  const [user] = useAuthState(auth);
  const [settings, setSettings] = React.useState<UserSettings>({
    userId: '',
    unitSystem: 'metric',
    notificationsEnabled: true,
    updatedAt: null,
  });
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data() as UserSettings);
        } else {
          // Initialize if not exists
          const initial = {
            userId: user.uid,
            unitSystem: 'metric',
            notificationsEnabled: true,
            updatedAt: serverTimestamp(),
          };
          await setDoc(docRef, initial);
          setSettings(initial as UserSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      await setDoc(doc(db, 'settings', user.uid), {
        ...settings,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
      setMessage('Preferências salvas com sucesso!');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `settings/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <SettingsIcon size={24} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-900 rounded-xl text-gray-400">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Configurações</h2>
          <p className="text-gray-400">Personalize sua experiência no aplicativo.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Units */}
        <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 text-blue-400">
            <Ruler size={20} />
            <h3 className="font-bold">Unidades de Medida</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, unitSystem: 'metric' })}
              className={`p-4 rounded-xl border transition-all text-left ${settings.unitSystem === 'metric' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}
            >
              <div className="font-bold mb-1">Métrico</div>
              <div className="text-xs opacity-60">Quilos (kg), Centímetros (cm)</div>
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, unitSystem: 'imperial' })}
              className={`p-4 rounded-xl border transition-all text-left ${settings.unitSystem === 'imperial' ? 'bg-blue-600/10 border-blue-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-700'}`}
            >
              <div className="font-bold mb-1">Imperial</div>
              <div className="text-xs opacity-60">Libras (lbs), Polegadas (in)</div>
            </button>
          </div>
        </div>

        {/* Notificações */}
        <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-400">
              <Bell size={20} />
              <h3 className="font-bold">Notificações Push</h3>
            </div>
            <button 
              type="button"
              onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
              className={`w-12 h-6 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-emerald-600' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.notificationsEnabled ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Receba lembretes diários de treino e avisos sobre sua performance diretamente no seu dispositivo.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 text-red-500">
            <Shield size={20} />
            <h3 className="font-bold">Privacidade e Dados</h3>
          </div>
          <p className="text-sm text-gray-500">
            Seus dados são armazenados de forma segura e nunca são compartilhados. Você pode exportar seus treinos a qualquer momento.
          </p>
          <button
            type="button"
            className="flex items-center gap-2 text-red-500/60 hover:text-red-500 text-sm font-medium transition-colors"
          >
            <Trash2 size={16} />
            Excluir todos os dados (Permanente)
          </button>
        </div>

        <div className="fixed bottom-24 left-4 right-4 md:static flex flex-col items-center">
          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-sm font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={16} />
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit"
            disabled={saving}
            className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            {saving ? 'Salvando...' : <><Save size={18} /> Salvar Preferências</>}
          </button>
        </div>
      </form>
    </div>
  );
}
