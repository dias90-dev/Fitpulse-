import React from 'react';
import { auth, signInWithGoogle, logOut } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, User } from 'lucide-react';

export function AuthStatus() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div className="animate-pulse h-8 w-24 bg-gray-800 rounded"></div>;

  if (user) {
    return (
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full border border-gray-700" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <User size={16} />
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium text-gray-300">{user.displayName}</span>
        <button 
          onClick={logOut}
          className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors text-gray-400"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={signInWithGoogle}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm"
    >
      <LogIn size={18} />
      <span>Entrar com Google</span>
    </button>
  );
}
