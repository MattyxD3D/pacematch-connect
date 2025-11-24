import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import GoogleIcon from "@mui/icons-material/Google";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import PeopleIcon from "@mui/icons-material/People";

const LoginScreen = () => {
  const navigate = useNavigate();

  const handleGoogleSignIn = () => {
    // TODO: Implement Google Sign-In
    // For now, navigate to profile setup
    navigate("/profile-setup");
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
              className="w-full h-16 text-base font-semibold shadow-elevation-3 hover:shadow-elevation-4 transition-all duration-300 bg-white text-foreground border-2 border-border hover:border-primary/50"
            >
              <GoogleIcon className="mr-3" style={{ fontSize: 28 }} />
              Sign in with Google
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
