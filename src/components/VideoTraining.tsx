import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Plus, Trash2, Video, Image as ImageIcon, X } from 'lucide-react';
import { MediaExercise } from '../types';

export function VideoTraining() {
  const [user] = useAuthState(auth);
  const [exercises, setExercises] = useState<MediaExercise[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  // New exercise state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');

  const fetchExercises = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'mediaExercises'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MediaExercise));
      setExercises(data);
    } catch (err) {
      console.error('Error fetching media exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [user]);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title || !mediaUrl) return;

    try {
      await addDoc(collection(db, 'mediaExercises'), {
        userId: user.uid,
        title,
        description,
        mediaUrl,
        mediaType,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setTitle('');
      setDescription('');
      setMediaUrl('');
      fetchExercises();
    } catch (err) {
      console.error('Error adding exercise:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este exercício?')) return;
    try {
      await deleteDoc(doc(db, 'mediaExercises', id));
      setExercises(exercises.filter(ex => ex.id !== id));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  // Convert basic youtube urls to embed ones
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">Biblioteca de Exercícios</h2>
          <p className="text-gray-400">Gerencie sua lista de treinos guiados por vídeos e imagens</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors font-bold shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center py-16 card-blur rounded-3xl border border-gray-800 border-dashed">
          <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="text-gray-500" size={32} />
          </div>
          <h3 className="text-lg font-bold mb-2">Sem exercícios ainda</h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">Adicione vídeos instructivos do YouTube ou imagens para criar a sua biblioteca.</p>
          <button 
            onClick={() => setIsAdding(true)}
            className="text-blue-500 font-medium hover:text-blue-400 transition-colors"
          >
            Começar a adicionar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {exercises.map((ex) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={ex.id} 
              className="card-blur rounded-2xl overflow-hidden border border-gray-800 flex flex-col"
            >
              <div className="aspect-video bg-gray-900 relative group">
                {ex.mediaType === 'video' ? (
                  <iframe 
                    title={ex.title}
                    src={getEmbedUrl(ex.mediaUrl)} 
                    className="w-full h-full object-cover"
                    allowFullScreen
                  />
                ) : (
                  <img src={ex.mediaUrl} alt={ex.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-2 pointer-events-none">
                  <button 
                    onClick={() => handleDelete(ex.id!)}
                    className="p-2 bg-red-500/80 text-white rounded-lg hover:bg-red-600 transition-colors pointer-events-auto"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {ex.mediaType === 'video' ? <Video size={16} className="text-blue-500" /> : <ImageIcon size={16} className="text-green-500" />}
                  <h3 className="font-bold text-lg leading-tight truncate">{ex.title}</h3>
                </div>
                {ex.description && (
                  <p className="text-gray-400 text-sm line-clamp-2">{ex.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
           >
             <motion.div 
               initial={{ scale: 0.95 }}
               animate={{ scale: 1 }}
               exit={{ scale: 0.95 }}
               className="bg-[#0A0A0B] border border-gray-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
             >
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                  <h3 className="text-xl font-bold">Adicionar Exercício</h3>
                  <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white p-2">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleAddExercise} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Título do Exercício</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Ex: Flexão de braço"
                      required
                      className="w-full bg-[#151619] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Tipo de Mídia</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input type="radio" checked={mediaType === 'video'} onChange={() => setMediaType('video')} className="text-blue-500" />
                        <Video size={16} /> Vídeo
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input type="radio" checked={mediaType === 'image'} onChange={() => setMediaType('image')} className="text-blue-500" />
                        <ImageIcon size={16} /> Imagem
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">URL ({mediaType === 'video' ? 'YouTube ou direto' : 'Imagem direta'})</label>
                    <input 
                      type="url" 
                      value={mediaUrl}
                      onChange={e => setMediaUrl(e.target.value)}
                      placeholder="https://..."
                      required
                      className="w-full bg-[#151619] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Instruções / Notas (Opcional)</label>
                    <textarea 
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Detalhes sobre a execução..."
                      rows={3}
                      className="w-full bg-[#151619] border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsAdding(false)}
                      className="px-6 py-2.5 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition-actions"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={!title || !mediaUrl}
                      className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
             </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
