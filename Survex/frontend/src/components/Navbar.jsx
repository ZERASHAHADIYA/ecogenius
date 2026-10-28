import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Trophy, 
  Target, 
  Gift, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Shield
} from 'lucide-react';

const Navbar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Green Hub', roles: ['student', 'faculty', 'admin'] },
    { path: '/challenges', icon: Target, label: 'EcoQuest', roles: ['student', 'faculty', 'admin'] },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard', roles: ['student', 'faculty', 'admin'] },
    { path: '/rewards', icon: Gift, label: 'Rewards', roles: ['student', 'faculty', 'admin'] },
    { path: '/admin', icon: Shield, label: 'Admin Panel', roles: ['admin', 'faculty'] }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🌿</span>
              </div>
              <span className="text-xl font-bold text-primary">Windsurf</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.eco_points || 0} points</p>
              </div>
              <Link to="/profile" className="relative">
                <img
                  src={user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.name}&background=2E7D32&color=fff`}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
              </Link>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-primary"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-primary hover:bg-gray-100'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            <div className="border-t pt-4 mt-4">
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:text-primary"
              >
                <User size={20} />
                <span>Profile</span>
              </Link>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 w-full text-left rounded-lg"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
