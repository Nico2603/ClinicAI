import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfileProps {
  className?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleSignOut = () => {
    signOut();
    setShowDropdown(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Image
          src={user.image || '/default-avatar.svg'}
          alt={user.name || 'Usuario'}
          width={32}
          height={32}
          className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-gray-300 shrink-0"
        />
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white max-w-32 truncate">
            {user.name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 max-w-32 truncate">
            {user.email}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {showDropdown && (
        <>
          {/* Overlay to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 md:w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Image
                  src={user.image || '/default-avatar.svg'}
                  alt={user.name || 'Usuario'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full border-2 border-gray-300 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors flex items-center space-x-2"
              >
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile; 