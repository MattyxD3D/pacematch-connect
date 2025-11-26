import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// CSP policy for Firebase Realtime Database
const cspPolicy = [
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googleapis.com https://www.gstatic.com https://www.google.com https://firebase.googleapis.com https://www.googletagmanager.com https://accounts.google.com https://*.gstatic.com https://*.googleapis.com https://*.google.com https://*.firebasedatabase.app https://*.asia-southeast1.firebasedatabase.app",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.firebasedatabase.app https://*.asia-southeast1.firebasedatabase.app wss://*.firebaseio.com wss://*.firebasedatabase.app wss://*.asia-southeast1.firebasedatabase.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://www.google.com https://*.google.com",
  "frame-src 'self' https://accounts.google.com https://www.google.com https://*.google.com https://*.firebaseapp.com https://*.firebasedatabase.app https://*.asia-southeast1.firebasedatabase.app",
  "img-src 'self' https: data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:"
].join("; ");

// Vite plugin to set CSP header
const cspPlugin = () => ({
  name: "csp-headers",
  configureServer(server) {
    server.middlewares.use((_req, res, next) => {
      res.setHeader("Content-Security-Policy", cspPolicy);
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    cspPlugin(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
