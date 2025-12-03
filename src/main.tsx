import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStatusBar } from "./utils/safeArea";
import { initEmailJS } from "./services/emailServiceSimple";

// Initialize StatusBar for edge-to-edge display on mobile
initializeStatusBar().catch(console.error);

// Initialize EmailJS for email OTP (if configured)
initEmailJS();

createRoot(document.getElementById("root")!).render(<App />);
