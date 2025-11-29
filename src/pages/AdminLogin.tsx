// Admin login page
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { signInWithEmail, signInWithGoogle, signUpWithEmail, checkEmailExists } from "@/services/authService";
import { checkAdminStatus } from "@/services/adminService";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/services/firebase";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  // Redirect if user is already authenticated and is admin
  useEffect(() => {
    if (location.pathname !== "/admin/login") {
      return;
    }

    if (hasRedirected.current || authLoading || !user) {
      return;
    }

    const checkAdminAndRedirect = async () => {
      try {
        const isAdmin = await checkAdminStatus(user.email);
        if (isAdmin) {
          hasRedirected.current = true;
          navigate("/admin/dashboard", { replace: true });
        } else {
          // User is logged in but not admin
          setError("Access denied. Admin privileges required.");
          // Sign them out so they can try with admin account
          const { signOut } = await import("@/services/authService");
          await signOut();
        }
      } catch (err) {
        console.error("Error checking admin status:", err);
      }
    };

    checkAdminAndRedirect();
  }, [user, authLoading, navigate, location.pathname]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userData = await signInWithEmail(email, password);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const isAdmin = await checkAdminStatus(userData.email);

      if (!isAdmin) {
        const { signOut } = await import("@/services/authService");
        await signOut();
        setError("Access denied. This account does not have admin privileges.");
        setLoading(false);
        return;
      }

      hasRedirected.current = true;
      navigate("/admin/dashboard", { replace: true });
      setLoading(false);
    } catch (err: any) {
      console.error("Error signing in:", err);
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if email is already registered before attempting to create account
      console.log("🔍 Checking if email is already registered:", email);
      const emailExists = await checkEmailExists(email);
      
      if (emailExists) {
        setError("This email is already registered. Please sign in instead.");
        setLoading(false);
        return;
      }

      const newUser = await signUpWithEmail(email, password, displayName.trim());

      await new Promise(resolve => setTimeout(resolve, 500));

      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      const isAdmin = await checkAdminStatus(newUser.email);

      if (!isAdmin) {
        toast.info("Account created! Ask an existing admin to grant access to the admin dashboard.");
        navigate("/login", { replace: true });
        return;
      }

      hasRedirected.current = true;
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Error creating account:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const userData = await signInWithGoogle();
      
      // If redirect was used, handleRedirectResult will be called in App.tsx
      if (!userData) {
        // Redirect was initiated, wait for it to complete
        return;
      }

      // Wait for auth state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      // Check if user is admin
      const isAdmin = await checkAdminStatus(userData.email);
      
      if (!isAdmin) {
        const { signOut } = await import("@/services/authService");
        await signOut();
        setError("Access denied. This account does not have admin privileges.");
        setLoading(false);
        return;
      }

      // Admin login successful
      hasRedirected.current = true;
      navigate("/admin/dashboard", { replace: true });
      setLoading(false);
    } catch (err: any) {
      console.error("Error signing in with Google:", err);
      setError(err.message || "Failed to sign in with Google. Please try again.");
      setLoading(false);
    }
  };

  // Handle redirect result from Google sign-in
  useEffect(() => {
    const handleRedirect = async () => {
      if (auth.currentUser && user) {
        try {
          const isAdmin = await checkAdminStatus(user.email);
          if (isAdmin) {
            navigate("/admin/dashboard", { replace: true });
          } else {
            const { signOut } = await import("@/services/authService");
            await signOut();
            setError("Access denied. This account does not have admin privileges.");
          }
        } catch (err) {
          console.error("Error checking admin after redirect:", err);
        }
      }
    };

    if (user && location.pathname === "/admin/login") {
      handleRedirect();
    }
  }, [user, navigate, location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-destructive/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        {/* Logo and branding */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.2,
              type: "spring",
              stiffness: 200
            }}
            className="flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(220, 38, 38, 0.3)",
                    "0 0 40px rgba(220, 38, 38, 0.5)",
                    "0 0 20px rgba(220, 38, 38, 0.3)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-br from-destructive to-destructive/80 rounded-full p-8 shadow-elevation-4"
              >
                <AdminPanelSettingsIcon className="text-destructive-foreground" style={{ fontSize: 56 }} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-destructive via-primary to-destructive bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-lg text-muted-foreground mt-3 font-medium">
              PaceMatch Administration
            </p>
          </motion.div>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          </motion.div>
        )}

        {/* Login/Sign-up toggle */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={!isSignUp ? "default" : "ghost"}
            className="flex-1"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
          >
            I already have an account
          </Button>
          <Button
            variant={isSignUp ? "default" : "ghost"}
            className="flex-1"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
          >
            Create new admin account
          </Button>
        </div>

        {/* Login / Signup Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-4"
        >
          <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="admin-name" className="text-sm font-medium text-muted-foreground">
                  Full Name
                </label>
                <div className="relative">
                  <PersonIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                  <Input
                    id="admin-name"
                    type="text"
                    placeholder="Jane Admin"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="admin-email" className="text-sm font-medium text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <EmailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-muted-foreground">
                Password
              </label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="admin-password-confirm" className="text-sm font-medium text-muted-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                  <Input
                    id="admin-password-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isSignUp ? "Creating account..." : "Signing in..."}
                </div>
              ) : (
                isSignUp ? "Create Account" : "Sign In"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
            size="lg"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </Button>
        </motion.div>

        {/* Back to app link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-center"
        >
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            className="text-sm text-muted-foreground"
          >
            Back to regular login
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;

