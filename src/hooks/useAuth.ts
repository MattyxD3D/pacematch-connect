// Custom hook for authentication state
import { useState, useEffect } from "react";
import { onAuthStateChange } from "../services/authService";
import { User } from "firebase/auth";

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

/**
 * Custom hook to manage authentication state
 * @returns {Object} { user, loading, error }
 */
export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
};

