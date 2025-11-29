import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStatusBar } from "./utils/safeArea";

// Initialize StatusBar for edge-to-edge display on mobile
initializeStatusBar().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
