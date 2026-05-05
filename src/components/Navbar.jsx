import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../services/authService';

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking anywhere outside the menu
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

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
        <button className="flex items-center justify-center text-zinc-500 hover:text-white transition-colors duration-200">
          <span className="material-symbols-outlined text-[22px] leading-none">notifications</span>
        </button>

        {/* User avatar + dropdown */}
        <div className="relative" ref={menuRef}>
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
            <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              {/* User info */}
              <div className="px-4 py-3 border-b border-zinc-800">
                <p className="text-white text-sm font-medium truncate">{displayName}</p>
                {user?.email && (
                  <p className="text-zinc-500 text-xs truncate mt-0.5">{user.email}</p>
                )}
              </div>

              {/* Nav actions */}
              <div className="py-1 border-b border-zinc-800">
                {[
                  { icon: 'person', label: 'Profile', path: '/profile' },
                  { icon: 'credit_card', label: 'Payment Methods', path: null },
                  { icon: 'help', label: 'Help', path: null },
                ].map(({ icon, label, path }) => (
                  <button
                    key={label}
                    onClick={() => { setMenuOpen(false); if (path) navigate(path); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors duration-150"
                  >
                    <span className="material-symbols-outlined text-base">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors duration-150"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
