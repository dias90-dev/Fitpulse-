import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Droplet, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';

export function HydrationTracker() {
  const [user] = useAuthState(auth);
  const [glasses, setGlasses] = useState(0);
  const [goal, setGoal] = useState(8); // Default goal 8 glasses (~2L)
  const [loading, setLoading] = useState(true);
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const fetchHydration = async () => {
      try {
        const logId = `${user.uid}_${todayStr}`;
        const docRef = doc(db, 'hydrationLogs', logId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          if (isMounted) {
            setGlasses(data.glasses || 0);
            if (data.goal) setGoal(data.goal);
          }
        }
      } catch (error: any) {
        if (error?.message?.includes('client is offline')) {
          console.log("HydrationTracker: Client is offline, using defaults.");
        } else {
          console.error("Error fetching hydration data:", error);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHydration();
    
    return () => {
      isMounted = false;
    };
  }, [user, todayStr]);

  const updateHydration = async (newGlasses: number) => {
    if (!user) return;
    if (newGlasses < 0) return;
    
    setGlasses(newGlasses);
    
    try {
      const logId = `${user.uid}_${todayStr}`;
      const docRef = doc(db, 'hydrationLogs', logId);
      await setDoc(docRef, {
        userId: user.uid,
        date: todayStr,
        glasses: newGlasses,
        goal: goal,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating hydration:", error);
    }
  };

  if (loading) {
    return (
      <div className="card-blur p-6 rounded-2xl animate-pulse h-[160px] flex items-center justify-center border-l-4 border-l-blue-400">
        <Droplet className="text-blue-500/20" size={32} />
      </div>
    );
  }

  const progress = goal > 0 ? Math.min((glasses / goal) * 100, 100) : 0;

  return (
    <div className="card-blur p-6 rounded-2xl flex flex-col justify-between border-l-4 border-l-blue-400 relative overflow-hidden">
      {/* Background decoration */}
      <Droplet className="absolute -right-4 -bottom-4 text-blue-500 opacity-5" size={120} />
      
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-2">
            <Droplet size={14} className="text-blue-400" />
            Hidratação
          </h3>
          <p className="text-xs text-gray-500">Meta diária: {goal} copos (~{(goal * 0.25).toFixed(1)}L)</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/50 rounded-xl p-1">
          <button 
            onClick={() => updateHydration(glasses - 1)}
            disabled={glasses === 0}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="font-bold w-6 text-center text-lg">{glasses}</span>
          <button 
            onClick={() => updateHydration(glasses + 1)}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className={glasses >= goal ? "text-emerald-400" : "text-blue-400"}>
            {glasses} / {goal} copos
          </span>
          <span className="text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out rounded-full ${glasses >= goal ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
