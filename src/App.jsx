import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";

function AppInner() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Dashboard /> : <AuthPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ThemeProvider>
  );
}