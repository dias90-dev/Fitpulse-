import React from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Plus, Calendar, Clock, ChevronRight, TrendingUp, Bell, BarChart3, ChevronDown, Dumbbell, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Workout, Exercise } from '../types';
import { WorkoutLogModal } from './WorkoutLog';
import { WorkoutDetails } from './WorkoutDetails';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';

export function Dashboard() {
  const [user] = useAuthState(auth);
  const [workouts, setWorkouts] = React.useState<Workout[]>([]);
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [profile, setProfile] = React.useState<any>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedWorkout, setSelectedWorkout] = React.useState<Workout | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedExerciseName, setSelectedExerciseName] = React.useState<string>('');

  React.useEffect(() => {
    if (!user) return;

    const qWorkouts = query(
      collection(db, 'workouts'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribeWorkouts = onSnapshot(qWorkouts, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Workout));
      setWorkouts(docs);
      setLoading(false);
    });

    const qExercises = query(
      collection(db, 'exercises'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeExercises = onSnapshot(qExercises, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise));
      setExercises(docs);
      if (docs.length > 0 && !selectedExerciseName) {
        setSelectedExerciseName(docs[0].name);
      }
    });

    // Load profile for reminders
    getDoc(doc(db, 'healthProfiles', user.uid)).then(snap => {
      if (snap.exists()) setProfile(snap.data());
    });

    return () => {
      unsubscribeWorkouts();
      unsubscribeExercises();
    };
  }, [user]);

  const chartData = workouts.slice(0, 7).reverse().map(w => {
    const userWeight = profile?.weight || 70;
    // Formula: MET * Weight * (Duration / 60)
    // MET 5.0 for moderate strength training
    const calories = Math.round(5.0 * userWeight * ((w.duration || 0) / 60));
    
    return {
      date: format(w.date.toDate(), 'dd/MM'),
      duration: w.duration || 0,
      calories: calories
    };
  });

  // Exercise history data
  const uniqueExerciseNames = Array.from(new Set(exercises.map(e => e.name)));
  const exerciseHistoryData = exercises
    .filter(e => e.name === selectedExerciseName)
    .map(e => {
      const maxWeight = Math.max(...e.sets.map(s => s.weight));
      const totalVolume = e.sets.reduce((acc, s) => acc + (s.weight * s.reps), 0);
      return {
        date: format(e.createdAt.toDate ? e.createdAt.toDate() : new Date(e.createdAt), 'dd/MM'),
        maxWeight,
        totalVolume,
      };
    });

  // Calculate Streak
  const streak = React.useMemo(() => {
    if (workouts.length === 0) return 0;
    const dates = workouts.map(w => format(w.date.toDate(), 'yyyy-MM-dd'));
    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => (b as string).localeCompare(a as string));
    let currentStreak = 0;
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let checkDate = new Date(uniqueDates[0] ?? new Date());
    for (let i = 0; i < uniqueDates.length; i++) {
      const d = format(checkDate, 'yyyy-MM-dd');
      if (uniqueDates.includes(d)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  }, [workouts]);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome & Action */}
      <TrainingReminder profile={profile} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Olá, {user?.displayName?.split(' ')[0]}</h2>
          <p className="text-gray-400">Aqui está o seu resumo de atividades.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-600/20 w-fit"
        >
          <Plus size={20} />
          <span>Novo Treino</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Calendar className="text-blue-500" />} 
          label="Treinos este mês" 
          value={workouts.length.toString()} 
        />
        <StatCard 
          icon={<Clock className="text-emerald-500" />} 
          label="Tempo total" 
          value={`${workouts.reduce((acc, w) => acc + (w.duration || 0), 0)} min`} 
        />
        <StatCard 
          icon={<TrendingUp className="text-orange-500" />} 
          label="Consistência" 
          value="95%" 
        />
        <StatCard 
          icon={<Plus className="text-pink-500 rotate-45" />} 
          label="Sequência Atual" 
          value={`${streak} ${streak === 1 ? 'dia' : 'dias'}`} 
          highlight
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout Duration Chart */}
            {workouts.length > 0 && (
              <div className="card-blur p-6 rounded-2xl shadow-xl overflow-hidden">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" />
                  Performance
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2E33" vertical={false} />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} unit="m" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151619', border: 'none', borderRadius: '12px' }}
                        itemStyle={{ color: '#3B82F6' }}
                      />
                      <Line type="monotone" dataKey="duration" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Calories Burned Chart */}
            {workouts.length > 0 && (
              <div className="card-blur p-6 rounded-2xl shadow-xl overflow-hidden">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <Flame size={18} className="text-orange-500" />
                  Calorias Queimadas
                </h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2E33" vertical={false} />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} unit=" kcal" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#151619', border: 'none', borderRadius: '12px' }}
                        itemStyle={{ color: '#f97316' }}
                      />
                      <Area type="monotone" dataKey="calories" stroke="#f97316" fillOpacity={1} fill="url(#colorCalories)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Exercise Progress Chart */}
            <div className="card-blur p-6 rounded-2xl shadow-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-500" />
                  Evolução
                </h3>
                {uniqueExerciseNames.length > 0 && (
                  <div className="relative group">
                    <select 
                      value={selectedExerciseName}
                      onChange={(e) => setSelectedExerciseName(e.target.value)}
                      className="appearance-none bg-gray-900/50 border border-gray-800 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all cursor-pointer"
                    >
                      {uniqueExerciseNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1.5 text-gray-500 pointer-events-none" size={14} />
                  </div>
                )}
              </div>

              {exerciseHistoryData.length > 0 ? (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exerciseHistoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2D2E33" vertical={false} />
                      <XAxis dataKey="date" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} unit="kg" />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }} 
                        contentStyle={{ backgroundColor: '#151619', border: 'none', borderRadius: '12px' }}
                      />
                      <Bar dataKey="maxWeight" radius={[4, 4, 0, 0]}>
                        {exerciseHistoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === exerciseHistoryData.length - 1 ? '#10B981' : '#10B98188'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-600 italic text-sm">
                  <Dumbbell className="mb-2 opacity-20" size={32} />
                  Sem dados suficientes
                </div>
              )}
            </div>
          </div>

          {/* Consistency Grid */}
          <ConsistencyGrid workouts={workouts} />
        </div>

        {/* Recent Activity Sidebar */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center justify-between">
            <span>Treinos Recentes</span>
          </h3>
          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 w-full bg-gray-800/50 animate-pulse rounded-xl"></div>
              ))
            ) : workouts.length === 0 ? (
              <div className="text-center py-12 card-blur rounded-xl">
                <p className="text-gray-500 italic">Nenhum treino registrado.</p>
              </div>
            ) : (
              workouts.slice(0, 5).map((workout, index) => (
                <div key={workout.id || index} onClick={() => setSelectedWorkout(workout)}>
                  <WorkoutItem workout={workout} index={index} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && <WorkoutLogModal onClose={() => setIsModalOpen(false)} />}
        {selectedWorkout && <WorkoutDetails workout={selectedWorkout} onClose={() => setSelectedWorkout(null)} />}
      </AnimatePresence>
    </div>
  );
}

function TrainingReminder({ profile }: { profile: any }) {
  const [show, setShow] = React.useState(false);
  const [timeToNext, setTimeToNext] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!profile?.trainingReminder || !profile?.reminderTime) return;

    const checkTime = () => {
      const [h, m] = profile.reminderTime.split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(h, m, 0, 0);

      const diff = target.getTime() - now.getTime();
      
      // If time is within the hour (up to 30 mins before or after), show reminder
      if (Math.abs(diff) < 30 * 60 * 1000) {
        setShow(true);
      } else {
        setShow(false);
      }

      if (diff > 0 && diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        setTimeToNext(`${mins} min`);
      } else {
        setTimeToNext(null);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [profile]);

  if (!show && !timeToNext) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${show ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${show ? 'bg-white/20' : 'bg-blue-500/10 text-blue-500'}`}>
          <Bell size={18} className={show ? 'animate-ring' : ''} />
        </div>
        <div>
          <h4 className="font-bold text-sm">
            {show ? 'É hora de treinar!' : `Próximo treino em ${timeToNext}`}
          </h4>
          <p className={`text-xs ${show ? 'text-white/80' : 'text-gray-500'}`}>
            {show ? 'Mantenha sua sequência ativa. Você consegue!' : `Seu lembrete está definido para as ${profile.reminderTime}`}
          </p>
        </div>
      </div>
      {show && (
        <button 
          onClick={() => setShow(false)}
          className="text-xs font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
        >
          Entendido
        </button>
      )}
    </motion.div>
  );
}

function ConsistencyGrid({ workouts }: { workouts: Workout[] }) {
  const dates = workouts.map(w => format(w.date.toDate(), 'yyyy-MM-dd'));
  const today = new Date();
  const days = Array.from({ length: 42 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (41 - i));
    return {
      date: d,
      formatted: format(d, 'yyyy-MM-dd'),
      count: dates.filter(date => date === format(d, 'yyyy-MM-dd')).length
    };
  });

  return (
    <div className="card-blur p-6 rounded-2xl">
      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        Consistência (Últimos 42 dias)
      </h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => (
          <div 
            key={i}
            title={`${format(day.date, 'dd/MM/yyyy')}: ${day.count} treinos`}
            className={`aspect-square rounded-md transition-all ${
              day.count > 0 
                ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                : 'bg-gray-800/40 hover:bg-gray-800'
            }`}
          />
        ))}
      </div>
      <div className="mt-4 flex justify-between text-[10px] uppercase font-bold text-gray-600 tracking-tighter sm:tracking-normal">
        <span>Há 6 semanas</span>
        <span>Hoje</span>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function StatCard({ icon, label, value, highlight }: StatCardProps) {
  return (
    <div className={`card-blur p-6 rounded-2xl flex items-start gap-4 hover:border-gray-700 transition-all ${highlight ? 'border-pink-500/30' : ''}`}>
      <div className={`p-3 rounded-xl ${highlight ? 'bg-pink-500/10' : 'bg-gray-900/50'}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <h4 className={`text-2xl font-bold mono-value ${highlight ? 'text-pink-500' : ''}`}>{value}</h4>
      </div>
    </div>
  );
}

interface WorkoutItemProps {
  workout: Workout;
  index: number;
}

export function WorkoutItem({ workout, index }: WorkoutItemProps) {
  const date = workout.date.toDate ? workout.date.toDate() : new Date(workout.date);
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-blur p-4 rounded-xl flex items-center justify-between hover:border-blue-500/50 group cursor-pointer transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex flex-col items-center justify-center text-blue-500">
          <span className="text-xs font-bold uppercase">{format(date, 'MMM', { locale: ptBR })}</span>
          <span className="text-lg font-bold leading-none">{format(date, 'dd')}</span>
        </div>
        <div>
          <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{workout.title}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {workout.duration} min
            </span>
            <span>•</span>
            <span className="text-gray-400 italic">
              {workout.notes ? (workout.notes.length > 30 ? workout.notes.substring(0, 30) + '...' : workout.notes) : 'Sem notas'}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight className="text-gray-600 group-hover:text-blue-500 transition-colors" size={20} />
    </motion.div>
  );
}
