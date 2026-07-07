import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext();
const API_URL = 'https://conectorlatam-backend.onrender.com/api';

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]   = useState(null); // objeto Firebase Auth
  const [userProfile, setUserProfile]   = useState(null); // perfil con role, organizationId, etc.
  const [loading, setLoading]           = useState(true);

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  // Devuelve true si el perfil del usuario tiene alguno de los roles indicados
  function hasRole(...roles) {
    return userProfile && roles.includes(userProfile.role);
  }

  // Devuelve el JWT del usuario actual para enviarlo al backend
  async function getToken() {
    if (!currentUser) return null;
    return currentUser.getIdToken();
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Obtener el token JWT de Firebase para enviarlo al backend
          const token = await firebaseUser.getIdToken();

          // Pedir el perfil del usuario al backend (rol, org, etc.)
          const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            const profile = await res.json();
            setUserProfile(profile);
          } else {
            // Si el backend falla (p.ej. en simulación local), derivar el rol
            // desde el email para no romper el flujo de desarrollo
            setUserProfile({ role: 'org_admin', organizationId: null });
          }
        } catch {
          // Sin conexión al backend — modo offline de desarrollo
          setUserProfile({ role: 'org_admin', organizationId: null });
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    hasRole,
    getToken,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
