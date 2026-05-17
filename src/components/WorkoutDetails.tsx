import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { X, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Workout, Exercise } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutDetailsProps {
  workout: Workout;
  onClose: () => void;
}

export function WorkoutDetails({ workout, onClose }: WorkoutDetailsProps) {
  const [user] = useAuthState(auth);
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user || !workout.id) return;

    const q = query(
      collection(db, 'exercises'),
      where('workoutId', '==', workout.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, workout.id]);

  const date = workout.date.toDate ? workout.date.toDate() : new Date(workout.date);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#151619] border border-gray-800 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{workout.title}</h2>
            <p className="text-sm text-gray-500">{format(date, "eeee, d 'de' MMMM", { locale: ptBR })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-4">
            <StatSmall icon={<Clock size={14} />} label="Duração" value={`${workout.duration} min`} />
          </div>

          {workout.notes && (
            <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
              <p className="text-sm text-blue-100/70 italic">"{workout.notes}"</p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Exercícios Realizados</h3>
            {loading ? (
              <div className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-16 w-full bg-gray-800/50 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : exercises.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Nenhum exercício registrado para este treino.</p>
            ) : (
              <div className="space-y-3">
                {exercises.map((ex) => (
                  <div key={ex.id} className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Dumbbell size={16} className="text-blue-500" />
                      <h4 className="font-bold">{ex.name}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {ex.sets.map((set, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm px-3 py-1.5 bg-gray-800/30 rounded-lg font-mono">
                          <span className="text-gray-500">SET {idx + 1}</span>
                          <span className="text-white">{set.weight}kg × {set.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatSmall({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
      <span className="text-blue-500">{icon}</span>
      <span className="text-xs font-bold text-white whitespace-nowrap">{value}</span>
    </div>
  );
}
