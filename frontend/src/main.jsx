import "./index.css";
import App from "./App.jsx";
import { StrictMode } from "react";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router";
import { createRoot } from "react-dom/client";



createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ClerkProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>,
);