import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { History as HistoryIcon, Search, Calendar, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Workout } from '../types';
import { WorkoutItem } from './Dashboard';
import { WorkoutDetails } from './WorkoutDetails';

export function WorkoutHistory() {
  const [user] = useAuthState(auth);
  const [workouts, setWorkouts] = React.useState<Workout[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedWorkout, setSelectedWorkout] = React.useState<Workout | null>(null);

  React.useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'workouts'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setWorkouts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredWorkouts = workouts.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gray-900 rounded-xl text-gray-400">
            <HistoryIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Histórico Completo</h2>
            <p className="text-gray-400">Você já completou {workouts.length} sessões.</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do treino..."
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button className="p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
          <Filter size={20} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 w-full bg-gray-800/20 animate-pulse rounded-2xl"></div>
          ))
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-20 card-blur rounded-3xl border border-gray-800 border-dashed">
            <Calendar className="text-gray-600 mx-auto mb-4" size={48} />
            <p className="text-gray-500 italic">Nenhum treino encontrado.</p>
          </div>
        ) : (
          filteredWorkouts.map((workout, index) => (
            <div 
              key={workout.id} 
              onClick={() => setSelectedWorkout(workout)}
              className="cursor-pointer group"
            >
              <WorkoutItem workout={workout} index={index} />
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedWorkout && (
          <WorkoutDetails 
            workout={selectedWorkout} 
            onClose={() => setSelectedWorkout(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
