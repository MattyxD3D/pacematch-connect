// Custom hook for admin status
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { checkAdminStatus } from "@/services/adminService";

/**
 * Custom hook to check if current user is admin
 * @returns {Object} { isAdmin, loading, error }
 */
export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) {
        setLoading(true);
        return;
      }

      if (!user || !user.email) {
        setIsAdmin(false);
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        const adminStatus = await checkAdminStatus(user.email);
        setIsAdmin(adminStatus);
        setError(null);
      } catch (err: any) {
        console.error("Error checking admin status:", err);
        setIsAdmin(false);
        setError(err.message || "Failed to check admin status");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, loading: loading || authLoading, error };
};

