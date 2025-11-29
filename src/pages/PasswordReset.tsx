import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { confirmPasswordResetCode } from "@/services/authService";
import { toast } from "sonner";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";

/**
 * PasswordReset Page Component
 * 
 * This page handles password reset when users click the link from their email.
 * It extracts the reset code (oobCode) from the URL and allows users to set a new password.
 * 
 * How it works:
 * 1. User clicks password reset link in email (contains oobCode parameter)
 * 2. Firebase redirects to this page with the code in the URL
 * 3. User enters new password
 * 4. We call confirmPasswordResetCode to complete the reset
 * 5. User is redirected to login page
 */
const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Extract the reset code from URL (Firebase adds it as 'oobCode' parameter)
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode"); // Should be "resetPassword"
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we have a valid reset code
  useEffect(() => {
    if (!oobCode || mode !== "resetPassword") {
      setError("Invalid or missing reset link. Please request a new password reset email.");
    }
  }, [oobCode, mode]);

  /**
   * Handle password reset submission
   * Validates passwords match and calls Firebase to confirm the reset
   */
  const handleResetPassword = async () => {
    setError(null);
    
    // Validate inputs
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }
    
    if (!oobCode) {
      setError("Invalid reset code. Please use the link from your email.");
      return;
    }

    setLoading(true);

    try {
      // Call the service function to confirm password reset
      await confirmPasswordResetCode(oobCode, newPassword);
      
      // Success!
      setSuccess(true);
      toast.success("Password reset successful! You can now sign in with your new password.");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error("❌ Error resetting password:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If no valid code, show error message
  if (!oobCode || mode !== "resetPassword") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <DirectionsRunIcon className="text-primary" style={{ fontSize: 64 }} />
            </div>
            <h1 className="text-3xl font-bold">Invalid Reset Link</h1>
            <p className="text-muted-foreground">
              {error || "This password reset link is invalid or has expired."}
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Back to Login
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-6 text-center"
        >
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
            >
              <LockIcon className="text-success" style={{ fontSize: 40 }} />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold">Password Reset Successful!</h1>
          <p className="text-muted-foreground">
            Your password has been reset. Redirecting to login...
          </p>
        </motion.div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <LockIcon className="text-primary" style={{ fontSize: 40 }} />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold">Reset Your Password</h1>
          <p className="text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Password Reset Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* New Password Input */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground">
              New Password
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 h-12 text-base"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <VisibilityOffIcon style={{ fontSize: 20 }} />
                ) : (
                  <VisibilityIcon style={{ fontSize: 20 }} />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters long
            </p>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground">
              Confirm New Password
            </label>
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" style={{ fontSize: 20 }} />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleResetPassword();
                  }
                }}
                className="pl-10 pr-10 h-12 text-base"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <VisibilityOffIcon style={{ fontSize: 20 }} />
                ) : (
                  <VisibilityIcon style={{ fontSize: 20 }} />
                )}
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <Button
            onClick={handleResetPassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full h-12 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300"
          >
            {loading ? (
              <>
                <div className="mr-3 h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Resetting Password...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          {/* Back to Login Link */}
          <Button
            onClick={() => navigate("/login")}
            variant="ghost"
            className="w-full h-10 text-sm"
          >
            Back to Login
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PasswordReset;

