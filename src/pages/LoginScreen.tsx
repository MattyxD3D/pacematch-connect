import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import PersonIcon from "@mui/icons-material/Person";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PeopleIcon from "@mui/icons-material/People";
import { sendPhoneVerificationCode, verifyPhoneCode, ConfirmationResult, signUpWithEmail, signInWithEmail, resetPassword } from "@/services/authService";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/services/firebase";

const LoginScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  // Login method: 'phone' or 'email'
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  // Email login state
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState("+63");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  // Common state
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasCheckedRedirect = useRef(false);
  const hasRedirected = useRef(false);

  // Check if mobile device (including Chrome mobile view)
  const isMobile = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;
    const isMobileView = isSmallScreen || (isTouchDevice && window.innerWidth < 1024);
    
    // Chrome mobile view often has mobile-like behavior even on desktop
    const isChromeMobileView = window.innerWidth < 768 && /chrome/i.test(userAgent);
    
    return isMobileUA || isMobileView || isChromeMobileView;
  };

  // Redirect if user is already authenticated
  useEffect(() => {
    // Only redirect if we're actually on the login page
    if (location.pathname !== "/login") {
      return;
    }

    // Prevent multiple redirects
    if (hasRedirected.current || authLoading || !user) {
      return;
    }

    // User is already logged in, redirect them away from login page
    const checkUserProfile = async () => {
      try {
        // Add delay on mobile to ensure authentication state is fully updated
        const mobileDelay = isMobile() ? 2000 : 0; // 2 seconds on mobile, no delay on desktop
        if (mobileDelay > 0) {
          console.log("📱 Mobile detected, waiting", mobileDelay, "ms before redirect...");
          await new Promise(resolve => setTimeout(resolve, mobileDelay));
        }
        
        // Double-check user is still authenticated after delay
        if (!user && !auth.currentUser) {
          console.log("⚠️ User no longer authenticated after delay, aborting redirect");
          hasRedirected.current = false;
          return;
        }
        
        hasRedirected.current = true;
        const { getUserData } = await import("@/services/authService");
        const userData = await getUserData(user.uid);
        
        if (userData && userData.activity) {
          navigate("/", { replace: true });
        } else {
          navigate("/profile-setup", { replace: true });
        }
      } catch (err) {
        console.error("Error checking user profile:", err);
        hasRedirected.current = false; // Reset on error
      }
    };
    checkUserProfile();
  }, [user, authLoading, navigate, location.pathname]);


  const handleSendCode = async () => {
    setSendingCode(true);
    setError(null);

    try {
      // Get the phone number value (remove +63 prefix if user typed it)
      let phoneValue = phoneNumber.startsWith('+63') ? phoneNumber.slice(3) : phoneNumber;
      
      // Remove all non-digits
      phoneValue = phoneValue.replace(/\D/g, '');
      
      // Validate phone number format
      if (!phoneValue || phoneValue.length === 0) {
        throw new Error("Please enter your phone number");
      }

      // Accept formats: 09123456789 or 9123456789 (with or without leading 0)
      // Remove leading 0 if present, then ensure it's 10 digits
      let digits = phoneValue;
      if (digits.startsWith('0')) {
        digits = digits.slice(1); // Remove leading 0
      }
      
      // Validate: should be 10 digits after removing leading 0
      if (digits.length !== 10 || !/^\d{10}$/.test(digits)) {
        throw new Error("Please enter a valid 10-digit Philippine mobile number (e.g., 09123456789 or 9123456789)");
      }
      
      // Format as +63XXXXXXXXXX (10 digits)
      const formattedPhone = `+63${digits}`;
      
      console.log("📱 Sending SMS code to:", formattedPhone);
      const confirmation = await sendPhoneVerificationCode(formattedPhone);
      
      setConfirmationResult(confirmation);
      toast.success("Verification code sent! Check your SMS.");
      console.log("✅ SMS code sent successfully");
    } catch (err: any) {
      console.error("❌ Error sending SMS code:", err);
      setError(err.message || "Failed to send verification code. Please try again.");
      setSendingCode(false);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!confirmationResult) {
      setError("Please send a verification code first.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Validate OTP code
      if (!otpCode.trim() || otpCode.length !== 6) {
        throw new Error("Please enter the 6-digit verification code");
      }

      console.log("🔐 Verifying SMS code...");
      const user = await verifyPhoneCode(confirmationResult, otpCode);
      
      console.log("✅ Phone verification successful! User:", user.uid);
      
      // Prevent multiple redirects
      if (hasRedirected.current) {
        setLoading(false);
        return;
      }
      
      // Wait for auth state to update
      const delay = isMobile() ? 2000 : 500; // 2 seconds on mobile, 500ms on desktop
      console.log("📱 Mobile:", isMobile(), "Adding delay:", delay, "ms");
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Double-check user is still authenticated after delay
      if (!auth.currentUser) {
        console.log("⚠️ User no longer authenticated after delay, aborting redirect");
        setLoading(false);
        return;
      }
      
      // Check if user has completed profile setup
      const { getUserData } = await import("@/services/authService");
      const userData = await getUserData(user.uid);
      console.log("📋 User data from Firebase:", userData);
      
      hasRedirected.current = true;
      if (userData && userData.activity) {
        console.log("🏠 User has activity, redirecting to home feed");
        navigate("/", { replace: true });
      } else {
        console.log("👤 User needs profile setup, redirecting to /profile-setup");
        navigate("/profile-setup", { replace: true });
      }
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error verifying code:", err);
      setError(err.message || "Invalid verification code. Please try again.");
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setConfirmationResult(null);
    setOtpCode("");
    await handleSendCode();
  };

  const handleEmailSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📧 Signing up with email:", email);
      const user = await signUpWithEmail(email, password, displayName);
      
      console.log("✅ Sign-up successful! User:", user.uid);
      
      // Wait for auth state to update
      const delay = isMobile() ? 2000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      
      // Check if user has completed profile setup
      const { getUserData } = await import("@/services/authService");
      const userData = await getUserData(user.uid);
      
      hasRedirected.current = true;
      if (userData && userData.activity) {
        navigate("/", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error signing up:", err);
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("📧 Signing in with email:", email);
      const user = await signInWithEmail(email, password);
      
      console.log("✅ Sign-in successful! User:", user.uid);
      
      // Wait for auth state to update
      const delay = isMobile() ? 2000 : 500;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      
      // Check if user has completed profile setup
      const { getUserData } = await import("@/services/authService");
      const userData = await getUserData(user.uid);
      
      hasRedirected.current = true;
      if (userData && userData.activity) {
        navigate("/", { replace: true });
      } else {
        navigate("/profile-setup", { replace: true });
      }
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Error signing in:", err);
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setError(null);

    try {
      await resetPassword(resetEmail);
      toast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
    } catch (err: any) {
      console.error("❌ Error sending password reset:", err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  // Create reCAPTCHA container on mount
  useEffect(() => {
    // Ensure reCAPTCHA container exists and is properly set up
    const setupRecaptchaContainer = () => {
      if (typeof document === 'undefined' || !document.body) {
        return;
      }
      
      let container = document.getElementById('recaptcha-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'recaptcha-container';
        // Make it visible but tiny (required for reCAPTCHA to work)
        container.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 1px; height: 1px; overflow: hidden; z-index: -1;';
        document.body.appendChild(container);
      }
      
      // Ensure it's in the DOM
      if (!container.parentElement && document.body) {
        document.body.appendChild(container);
      }
    };
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupRecaptchaContainer);
    } else {
      setupRecaptchaContainer();
    }
    
    // Also try after a short delay to ensure everything is ready
    const timeout = setTimeout(setupRecaptchaContainer, 500);
    
    return () => {
      clearTimeout(timeout);
    };
  }, []);

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
              {error}
            </div>
          </motion.div>
        )}

        {/* Login Method Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="space-y-4"
        >
          {/* Toggle Buttons */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              onClick={() => {
                setLoginMethod('phone');
                setError(null);
                setConfirmationResult(null);
                setOtpCode("");
              }}
              variant={loginMethod === 'phone' ? 'default' : 'ghost'}
              className="flex-1"
            >
              <PhoneIcon className="mr-2" style={{ fontSize: 18 }} />
              Phone
            </Button>
            <Button
              onClick={() => {
                setLoginMethod('email');
                setError(null);
                setShowForgotPassword(false);
              }}
              variant={loginMethod === 'email' ? 'default' : 'ghost'}
              className="flex-1"
            >
              <EmailIcon className="mr-2" style={{ fontSize: 18 }} />
              Email
            </Button>
          </div>

          {/* Phone Login Form */}
          {loginMethod === 'phone' && (
            <>
              {!confirmationResult ? (
            /* Phone Number Input */
            <>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-muted-foreground">
                  Phone Number (Philippines)
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0912 345 6789 or 912 345 6789"
                    value={(() => {
                      let displayValue = phoneNumber.startsWith('+63') ? phoneNumber.slice(3) : phoneNumber;
                      // Format with spaces: 0912 345 6789 or 912 345 6789
                      const digits = displayValue.replace(/\D/g, '');
                      if (digits.length <= 3) return digits;
                      if (digits.length <= 7) {
                        return digits.startsWith('0') 
                          ? `${digits.slice(0, 4)} ${digits.slice(4)}`
                          : `${digits.slice(0, 3)} ${digits.slice(3)}`;
                      }
                      if (digits.startsWith('0')) {
                        return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
                      }
                      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
                    })()}
                    onChange={(e) => {
                      // Only allow digits
                      let digits = e.target.value.replace(/\D/g, '');
                      
                      // Allow up to 11 digits (can start with 0, then 10 digits)
                      // Or 10 digits without leading 0
                      if (digits.startsWith('0')) {
                        // If starts with 0, allow up to 11 digits (0 + 10 digits)
                        digits = digits.slice(0, 11);
                      } else {
                        // If doesn't start with 0, allow up to 10 digits
                        digits = digits.slice(0, 10);
                      }
                      
                      setPhoneNumber('+63' + digits);
                    }}
                    className="pl-10 h-12 text-base"
                    disabled={sendingCode || loading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter your mobile number (e.g., 0912 345 6789 or 912 345 6789)
                </p>
              </div>

              <Button
                onClick={handleSendCode}
                disabled={sendingCode || loading || !phoneNumber.trim()}
                className="w-full h-12 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300"
              >
                {sendingCode ? (
                  <>
                    <div className="mr-3 h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <PhoneIcon className="mr-3" style={{ fontSize: 20 }} />
                    Send Verification Code
                  </>
                )}
              </Button>
            </>
          ) : (
            /* OTP Verification */
            <>
              <div className="space-y-2">
                <label htmlFor="otp" className="text-sm font-medium text-muted-foreground">
                  Enter 6-Digit Code
                </label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    // Only allow digits, max 6
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(value);
                  }}
                  className="h-12 text-base text-center text-2xl tracking-widest font-mono"
                  disabled={loading}
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground text-center">
                  Check your SMS for the verification code
                </p>
              </div>

              <Button
                onClick={handleVerifyCode}
                disabled={loading || otpCode.length !== 6}
                className="w-full h-12 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <div className="mr-3 h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>

              <Button
                onClick={handleResendCode}
                variant="outline"
                disabled={sendingCode || loading}
                className="w-full h-10 text-sm"
              >
                {sendingCode ? "Sending..." : "Resend Code"}
              </Button>

              <Button
                onClick={() => {
                  setConfirmationResult(null);
                  setOtpCode("");
                  setError(null);
                }}
                variant="ghost"
                className="w-full h-10 text-sm"
              >
                Change Phone Number
              </Button>
            </>
              )}
            </>
          )}

          {/* Email Login/Sign Up Form */}
          {loginMethod === 'email' && (
            <>
              {showForgotPassword ? (
                /* Forgot Password Form */
                <>
                  <div className="space-y-2">
                    <label htmlFor="resetEmail" className="text-sm font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <EmailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Input
                        id="resetEmail"
                        type="email"
                        placeholder="your@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleForgotPassword}
                    disabled={loading || !resetEmail.trim()}
                    className="w-full h-12 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="mr-3 h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail("");
                      setError(null);
                    }}
                    variant="ghost"
                    className="w-full h-10 text-sm"
                  >
                    Back to Sign In
                  </Button>
                </>
              ) : isSignUp ? (
                /* Sign Up Form */
                <>
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </label>
                    <div className="relative">
                      <PersonIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <EmailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters
                    </p>
                  </div>

                  <Button
                    onClick={handleEmailSignUp}
                    disabled={loading || !email.trim() || !password.trim() || !displayName.trim()}
                    className="w-full h-12 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="mr-3 h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setIsSignUp(false);
                        setError(null);
                      }}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </>
              ) : (
                /* Sign In Form */
                <>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <EmailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                      Password
                    </label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 h-12 text-base"
                        disabled={loading}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !loading && email.trim() && password.trim()) {
                            handleEmailSignIn();
                          }
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleEmailSignIn}
                    disabled={loading || !email.trim() || !password.trim()}
                    className="w-full h-12 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="mr-3 h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="flex justify-between items-center text-sm">
                    <button
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot Password?
                    </button>
                    <button
                      onClick={() => {
                        setIsSignUp(true);
                        setError(null);
                      }}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Create Account
                    </button>
                  </div>
                </>
              )}
            </>
          )}

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
