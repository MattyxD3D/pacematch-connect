import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "@mui/icons-material/Google";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PeopleIcon from "@mui/icons-material/People";
import { signInWithGoogle, handleRedirectResult } from "@/services/authService";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/services/firebase";

const LoginScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRedirect = useRef(false);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      // User is already logged in, redirect them away from login page
      const checkUserProfile = async () => {
        try {
          const { getUserData } = await import("@/services/authService");
          const userData = await getUserData(user.uid);
          
          if (userData && userData.activity) {
            navigate("/", { replace: true });
          } else {
            navigate("/profile-setup", { replace: true });
          }
        } catch (err) {
          console.error("Error checking user profile:", err);
        }
      };
      checkUserProfile();
    }
  }, [user, authLoading, navigate]);

  // Check for redirect result on mount (only once, only if not authenticated)
  useEffect(() => {
    // Only check redirect result if:
    // 1. We haven't checked it yet (useRef flag)
    // 2. Auth is not loading
    // 3. User is not authenticated
    if (hasCheckedRedirect.current || authLoading || user) {
      return;
    }

    const checkRedirectResult = async () => {
      hasCheckedRedirect.current = true;
      try {
        console.log("🔄 Checking for redirect result...");
        const redirectUser = await handleRedirectResult();
        if (redirectUser) {
          console.log("✅ Redirect result found! User:", redirectUser.uid);
          
          // Wait for Firebase auth state to update before navigating
          // This prevents race condition where ProtectedRoute doesn't see the user yet
          // After getRedirectResult, auth.currentUser should be set, but we need to wait
          // for onAuthStateChanged to fire and React to re-render with the new state
          const waitForAuthState = (): Promise<void> => {
            return new Promise((resolve) => {
              // Check if auth.currentUser is already set (should be after getRedirectResult)
              if (auth.currentUser && auth.currentUser.uid === redirectUser.uid) {
                console.log("✅ Auth state already updated");
                // Give React time to process the state update from onAuthStateChanged
                setTimeout(resolve, 300);
                return;
              }
              
              // Wait for auth state to update (max 2 seconds)
              const timeout = setTimeout(() => {
                console.warn("⚠️ Auth state update timeout, proceeding anyway");
                unsubscribe();
                resolve();
              }, 2000);
              
              // Listen for auth state change
              const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
                if (firebaseUser && firebaseUser.uid === redirectUser.uid) {
                  console.log("✅ Auth state updated, user:", firebaseUser.uid);
                  clearTimeout(timeout);
                  unsubscribe();
                  // Give React time to process the state update
                  setTimeout(resolve, 300);
                }
              });
            });
          };
          
          // Wait for auth state to update
          await waitForAuthState();
          
          // Check if user has completed profile setup
          const { getUserData } = await import("@/services/authService");
          const userData = await getUserData(redirectUser.uid);
          console.log("📋 User data from Firebase:", userData);
          
          if (userData && userData.activity) {
            console.log("🏠 User has activity, redirecting to home feed");
            navigate("/", { replace: true });
          } else {
            console.log("👤 User needs profile setup, redirecting to /profile-setup");
            navigate("/profile-setup", { replace: true });
          }
        } else {
          console.log("ℹ️ No redirect result found");
        }
      } catch (err: any) {
        console.error("❌ Error handling redirect:", err);
        hasCheckedRedirect.current = false; // Reset on error so user can try again
      }
    };
    checkRedirectResult();
  }, [authLoading, user, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔐 Starting Google Sign-In...");
      const user = await signInWithGoogle();
      
      if (user === null) {
        // Redirect was initiated, will be handled by handleRedirectResult
        console.log("🔄 Redirect initiated, you will be redirected to Google sign-in...");
        // Keep loading state - user will be redirected
        // The page will reload after Google authentication
        return;
      }

      console.log("✅ Sign-in successful! User:", user.uid);
      
      // Wait for auth state to update (for popup sign-in, it should be immediate)
      // But add a small delay to ensure useAuth hook has updated
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if user has completed profile setup
      const { getUserData } = await import("@/services/authService");
      const userData = await getUserData(user.uid);
      console.log("📋 User data from Firebase:", userData);
      
      if (userData && userData.activity) {
        console.log("🏠 User has activity, redirecting to home feed");
        navigate("/", { replace: true });
      } else {
        console.log("👤 User needs profile setup, redirecting to /profile-setup");
        navigate("/profile-setup", { replace: true });
      }
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Login error:", err);
      let errorMessage = "Failed to sign in. Please try again.";
      if (err.message?.includes("STORAGE_PARTITIONED")) {
        errorMessage = "Embedded Browser Detected. Please open this app in Chrome, Safari, or Firefox to sign in securely.";
      } else if (err.message?.includes("disallowed_useragent")) {
        errorMessage = "Your browser doesn't support popup authentication. Please use a modern browser like Chrome, Firefox, or Safari.";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
          className="absolute bottom-0 right-0 w-96 h-96 bg-success/5 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md space-y-10 relative z-10"
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
                    "0 0 20px rgba(25, 118, 210, 0.3)",
                    "0 0 40px rgba(25, 118, 210, 0.5)",
                    "0 0 20px rgba(25, 118, 210, 0.3)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-gradient-to-br from-primary to-primary/80 rounded-full p-8 shadow-elevation-4"
              >
                <DirectionsRunIcon className="text-primary-foreground" style={{ fontSize: 56 }} />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-primary via-success to-primary bg-clip-text text-transparent">
              PaceMatch
            </h1>
            <p className="text-lg text-muted-foreground mt-3 font-medium">
              Connect with active people nearby
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
              {error.includes("STORAGE_PARTITIONED") ? (
                <>
                  <strong>Embedded Browser Detected</strong>
                  <br />
                  Please open this app in Chrome, Safari, or Firefox to sign in securely.
                </>
              ) : (
                error
              )}
            </div>
          </motion.div>
        )}

        {/* Sign-in button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-4"
        >
          <motion.div
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
          >
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-16 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300 bg-white text-foreground border-2 border-border hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="mr-3 h-5 w-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  Redirecting to Google...
                </>
              ) : (
                <>
                  <GoogleIcon className="mr-3" style={{ fontSize: 28 }} />
                  Sign in with Google
                </>
              )}
            </Button>
          </motion.div>

          <p className="text-xs text-center text-muted-foreground px-4 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-primary transition-colors font-medium">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline hover:text-primary transition-colors font-medium">
              Privacy Policy
            </a>
          </p>
        </motion.div>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="grid grid-cols-3 gap-6 pt-4"
        >
          {[
            { icon: DirectionsRunIcon, label: "Track Activities", color: "success", delay: 0 },
            { icon: PeopleIcon, label: "Find Nearby", color: "primary", delay: 0.1 },
            { icon: DirectionsRunIcon, label: "Match & Meet", color: "warning", delay: 0.2 },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 + feature.delay }}
              className="text-center space-y-3"
            >
              <div className={`bg-${feature.color}/10 backdrop-blur-sm rounded-2xl p-4 mx-auto w-fit border border-${feature.color}/20`}>
                <feature.icon className={`text-${feature.color}`} style={{ fontSize: 28 }} />
              </div>
              <p className="text-xs text-muted-foreground font-medium">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;
