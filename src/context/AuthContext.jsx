import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_USER } from '../constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('unimart_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('unimart_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
    setLoading(false);
  }, [token]);

  // Login supports both register number and username
  const login = async (identifier, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (identifier && password) {
          const mockToken = 'jwt_mock_' + Date.now();
          // Check if identifier matches register number or username
          const isRegisterNumber = identifier.toUpperCase() === MOCK_USER.studentId.toUpperCase();
          const isUsername = identifier === MOCK_USER.username;
          if (isRegisterNumber || isUsername) {
            const userData = { ...MOCK_USER };
            localStorage.setItem('unimart_token', mockToken);
            localStorage.setItem('unimart_user', JSON.stringify(userData));
            setToken(mockToken);
            setUser(userData);
            resolve(userData);
          } else {
            reject(new Error('Invalid credentials'));
          }
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  };

  const register = async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockToken = 'jwt_mock_' + Date.now();
        const userData = {
          id: 'stu_' + Date.now(),
          studentId: data.studentId.toUpperCase(),
          name: data.name || '',
          username: data.username,
          email: data.email || '',
          phone: data.phone || '',
          university: data.university,
          college: data.college,
          department: data.department,
          campus: data.college,
          avatar: null,
          verified: true,
          usernameChangeCount: 0,
          createdAt: '2026-02-28',
        };
        localStorage.setItem('unimart_token', mockToken);
        localStorage.setItem('unimart_user', JSON.stringify(userData));
        setToken(mockToken);
        setUser(userData);
        resolve(userData);
      }, 800);
    });
  };

  const logout = () => {
    localStorage.removeItem('unimart_token');
    localStorage.removeItem('unimart_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = (updates) => {
    let changeCount = user.usernameChangeCount || 0;
    if (updates.username && updates.username !== user.username) {
      changeCount += 1;
    }
    const updatedUser = { ...user, ...updates, usernameChangeCount: changeCount };
    localStorage.setItem('unimart_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
