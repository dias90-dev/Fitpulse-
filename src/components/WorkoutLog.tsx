import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { X, Plus, Trash2, Save, Dumbbell, ClipboardList } from 'lucide-react';
import { motion } from 'motion/react';
import { Exercise, OperationType, Routine } from '../types';
import { handleFirestoreError } from '../lib/firestore-utils';

interface WorkoutLogModalProps {
  onClose: () => void;
}

export function WorkoutLogModal({ onClose }: WorkoutLogModalProps) {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  // Routines / Templates
  const [routines, setRoutines] = useState<Routine[]>([]);
  
  useEffect(() => {
    if (!user) return;
    const fetchRoutines = async () => {
      try {
        const q = query(collection(db, 'routines'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const fetchedRoutines = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Routine));
        setRoutines(fetchedRoutines);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRoutines();
  }, [user]);

  const handleApplyRoutine = (routineId: string) => {
    if (!routineId) return;
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    
    setTitle(routine.name);
    setNotes(routine.description || '');
    if (routine.exercises && routine.exercises.length > 0) {
      setExercises(routine.exercises.map(ex => ({
        name: ex.name,
        sets: ex.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      })));
    }
  };

  // Exercise handling
  const [exercises, setExercises] = useState<Partial<Exercise>[]>([
    { name: '', sets: [{ reps: 0, weight: 0 }] }
  ]);

  const addExercise = () => {
    setExercises([...exercises, { name: '', sets: [{ reps: 0, weight: 0 }] }]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets = [...(newExercises[exerciseIndex].sets || []), { reps: 0, weight: 0 }];
    setExercises(newExercises);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: string, value: number) => {
    const newExercises = [...exercises];
    const sets = [...(newExercises[exerciseIndex].sets || [])];
    sets[setIndex] = { ...sets[setIndex], [field]: value };
    newExercises[exerciseIndex].sets = sets;
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const workoutPath = 'workouts';
      const workoutDoc = await addDoc(collection(db, workoutPath), {
        userId: user.uid,
        title,
        date: Timestamp.fromDate(new Date(date)),
        duration: parseInt(duration) || 0,
        notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add exercises
      const exercisePath = 'exercises';
      const addedExercises = [];
      for (const ex of exercises) {
        if (ex.name) {
          await addDoc(collection(db, exercisePath), {
            userId: user.uid,
            workoutId: workoutDoc.id,
            name: ex.name,
            sets: ex.sets,
            createdAt: serverTimestamp(),
          });
          addedExercises.push(ex);
        }
      }

      if (saveAsTemplate && addedExercises.length > 0) {
        await addDoc(collection(db, 'routines'), {
          userId: user.uid,
          name: title,
          description: notes,
          exercises: addedExercises,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'workouts');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        className="bg-[#151619] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">Registrar Novo Treino</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {routines.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-4">
              <ClipboardList size={24} className="text-blue-500" />
              <div className="flex-1">
                <label className="text-sm font-bold text-blue-400 mb-1 block">Carregar de um Template</label>
                <select 
                  onChange={(e) => handleApplyRoutine(e.target.value)}
                  className="w-full bg-[#151619] border border-blue-500/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none text-gray-300"
                >
                  <option value="">Selecione um template salvo...</option>
                  {routines.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Título do Treino</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Peito e Tríceps"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Data</label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium h-[50px] [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Duração (minutos)</label>
              <input 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 60"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Notas Adicionais</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Como foi o treino?"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none h-[50px]"
              />
            </div>
          </div>

          {/* Exercises Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Dumbbell size={20} className="text-blue-500" />
                Exercícios
              </h3>
              <button 
                type="button"
                onClick={addExercise}
                className="flex items-center gap-1 text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>

            <div className="space-y-6">
              {exercises.map((exercise, exIdx) => (
                <div key={exIdx} className="p-4 bg-gray-900/50 border border-gray-800 rounded-2xl relative group">
                  <button 
                    type="button"
                    onClick={() => removeExercise(exIdx)}
                    className="absolute -top-3 -right-3 p-2 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>

                  <div className="space-y-4">
                    <input 
                      placeholder="Nome do Exercício (Ex: Supino Reto)"
                      value={exercise.name}
                      onChange={(e) => updateExercise(exIdx, 'name', e.target.value)}
                      className="bg-transparent border-b border-gray-800 focus:border-blue-500 w-full py-2 text-lg font-bold focus:outline-none transition-all"
                    />

                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2 text-[10px] uppercase tracking-wider font-bold text-gray-500 px-2">
                        <span>Set</span>
                        <span>KG</span>
                        <span>Reps</span>
                        <span></span>
                      </div>
                      
                      {exercise.sets?.map((set, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-4 gap-2 items-center">
                          <div className="flex items-center justify-center font-mono text-gray-600 bg-gray-800/50 rounded-lg py-2">
                            {setIdx + 1}
                          </div>
                          <input 
                            type="number"
                            value={set.weight || ''}
                            onChange={(e) => updateSet(exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                            className="bg-gray-800 border border-gray-700/50 rounded-lg py-2 px-2 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          />
                          <input 
                            type="number"
                            value={set.reps || ''}
                            onChange={(e) => updateSet(exIdx, setIdx, 'reps', parseInt(e.target.value) || 0)}
                            className="bg-gray-800 border border-gray-700/50 rounded-lg py-2 px-2 text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const newSets = exercise.sets?.filter((_, i) => i !== setIdx);
                              updateExercise(exIdx, 'sets', newSets);
                            }}
                            className="text-gray-500 hover:text-red-500 transition-colors p-2"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}

                      <button 
                        type="button"
                        onClick={() => addSet(exIdx)}
                        className="w-full py-2 mt-2 border border-dashed border-gray-800 rounded-xl text-sm font-medium text-gray-500 hover:text-blue-500 hover:border-blue-500/50 transition-all"
                      >
                        + Adicionar Set
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-800 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-300">
            <input 
              type="checkbox" 
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
              className="rounded border-gray-700 bg-gray-900 text-blue-500 focus:ring-blue-500 w-4 h-4"
            />
            <span>Salvar como Template</span>
          </label>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!title || isSubmitting}
              className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={18} />
                  <span>Salvar Treino</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
