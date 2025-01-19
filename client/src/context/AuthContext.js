import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

/**
 * Provides an API key (and setter) to the rest of the app
 */
export function AuthProvider({ children }) {
  const [apiKey, setApiKey] = useState(null);

  // Optional: persist key in localStorage if you want to retain it on reload
  useEffect(() => {
    const storedKey = localStorage.getItem("oxenApiKey");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem("oxenApiKey", apiKey);
    } else {
      localStorage.removeItem("oxenApiKey");
    }
  }, [apiKey]);

  return (
    <AuthContext.Provider value={{ apiKey, setApiKey }}>
      {children}
    </AuthContext.Provider>
  );
}
