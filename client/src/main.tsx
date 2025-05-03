import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import * as localStorageService from "./lib/localStorageService";

// Initialize local storage with demo data when the app first loads
localStorageService.initLocalStorage();

createRoot(document.getElementById("root")!).render(<App />);
