import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/authService';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    navigate('/login', { replace: true });
  }

  // Safe display values with fallbacks
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarUrl = user?.photoURL || null;

  return (
    <nav className="flex justify-between items-center px-8 h-20 w-full bg-black/90 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-800/50 font-body-md antialiased">
      <div className="flex items-center gap-container-margin">
        <span className="text-2xl font-bold tracking-tighter text-white">Flizen</span>
        <div className="hidden md:flex gap-gutter items-center ml-8">
          <a className="text-zinc-500 font-medium hover:text-white transition-colors duration-200" href="#">
            My Trips
          </a>
          <a className="text-zinc-500 font-medium hover:text-white transition-colors duration-200" href="#">
            Flight Status
          </a>
          <a className="text-zinc-500 font-medium hover:text-white transition-colors duration-200" href="#">
            Help
          </a>
        </div>
      </div>

      <div className="flex items-center gap-gutter">
        <button className="text-white hover:text-white transition-colors duration-200 active:opacity-80">
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            aria-label="User menu"
            className="flex items-center gap-2 focus:outline-none"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            {avatarUrl ? (
              <img
                alt={displayName}
                className="w-8 h-8 rounded-full border border-zinc-800 object-cover hover:opacity-80 transition-opacity"
                src={avatarUrl}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full border border-zinc-800 bg-zinc-700 flex items-center justify-center text-white font-medium text-sm select-none">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {menuOpen && (
            <>
              {/* Overlay to close menu on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-[#1a1a1a] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800">
                  <p className="text-white text-sm font-medium truncate">{displayName}</p>
                  {user?.email && (
                    <p className="text-zinc-500 text-xs truncate mt-0.5">{user.email}</p>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors duration-150"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
