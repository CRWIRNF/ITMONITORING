import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { User } from '../types';
import VersionBell from './VersionBell';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (adminDropdownOpen) {
        setAdminDropdownOpen(false);
      }
    };

    if (adminDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [adminDropdownOpen]);

  const loadUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Fehler beim Laden des Users:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-primary-dark' : '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-frisia-gradient text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link to="/" className="flex items-center space-x-3">
                <img src="/logo-frisia.svg" alt="Frisia" className="h-10" />
                <span className="text-xl font-bold hidden sm:inline">Monitoring</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md hover:bg-primary-dark transition ${isActive('/')}`}>
                Dashboard
              </Link>
              <Link to="/starlink" className={`px-3 py-2 rounded-md hover:bg-primary-dark transition ${isActive('/starlink')}`}>
                Starlink
              </Link>
              <Link to="/ticketsystem" className={`px-3 py-2 rounded-md hover:bg-primary-dark transition ${isActive('/ticketsystem')}`}>
                Ticketsystem
              </Link>
              <Link to="/firewalls" className={`px-3 py-2 rounded-md hover:bg-primary-dark transition ${isActive('/firewalls')}`}>
                Firewalls
              </Link>
              <Link to="/websites" className={`px-3 py-2 rounded-md hover:bg-primary-dark transition ${isActive('/websites')}`}>
                Websites
              </Link>
              {/* Asana Integration deaktiviert
              <Link to="/asana" className={`px-3 py-2 rounded-md hover:bg-primary-dark transition ${isActive('/asana')}`}>
                Asana
              </Link>
              */}

              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-primary-dark/50">
                <VersionBell />

                {user && (
                  <div className="flex items-center space-x-4">
                    {user.role === 'admin' ? (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdminDropdownOpen(!adminDropdownOpen);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-primary-dark transition"
                        >
                          <span className="text-sm">{user.email} (Admin)</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {adminDropdownOpen && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
                            <Link
                              to="/system-management"
                              onClick={() => setAdminDropdownOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Systemverwaltung
                            </Link>
                            <Link
                              to="/user-management"
                              onClick={() => setAdminDropdownOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Benutzerverwaltung
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm">{user.email}</span>
                    )}
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 bg-red-600 rounded-md hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation */}
          {menuOpen && (
            <div className="md:hidden pb-4">
              <Link to="/" className={`block px-3 py-2 rounded-md hover:bg-primary-dark ${isActive('/')}`}>
                Dashboard
              </Link>
              <Link to="/starlink" className={`block px-3 py-2 rounded-md hover:bg-primary-dark ${isActive('/starlink')}`}>
                Starlink
              </Link>
              <Link to="/ticketsystem" className={`block px-3 py-2 rounded-md hover:bg-primary-dark ${isActive('/ticketsystem')}`}>
                Ticketsystem
              </Link>
              <Link to="/firewalls" className={`block px-3 py-2 rounded-md hover:bg-primary-dark ${isActive('/firewalls')}`}>
                Firewalls
              </Link>
              <Link to="/websites" className={`block px-3 py-2 rounded-md hover:bg-primary-dark ${isActive('/websites')}`}>
                Websites
              </Link>
              {/* Asana Integration deaktiviert
              <Link to="/asana" className={`block px-3 py-2 rounded-md hover:bg-primary-dark ${isActive('/asana')}`}>
                Asana
              </Link>
              */}

              {/* Version Information für Mobile */}
              <div className="px-3 py-2 border-t border-primary-dark/50 mt-2 pt-2">
                <VersionBell />
              </div>

              {user && (
                <>
                  <div className="px-3 py-2 text-sm border-t border-primary-dark/50 mt-2 pt-2">
                    {user.email} {user.role === 'admin' && '(Admin)'}
                  </div>
                  {user.role === 'admin' && (
                    <>
                      <Link
                        to="/system-management"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-md hover:bg-primary-dark"
                      >
                        Systemverwaltung
                      </Link>
                      <Link
                        to="/user-management"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 rounded-md hover:bg-primary-dark"
                      >
                        Benutzerverwaltung
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 bg-red-600 rounded-md hover:bg-red-700 mt-2"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-frisia-gradient-dark text-white py-4">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">Monitoring System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
