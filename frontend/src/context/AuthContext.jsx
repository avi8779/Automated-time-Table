import { useState } from "react";
import { AuthContext } from "./authContext";

const loadAuth = () => {
  try {
    const user  = localStorage.getItem("tt_user");
    const token = localStorage.getItem("tt_token");
    if (user && token) return { user: JSON.parse(user), token };
  } catch {
    // ignore parse errors
  }
  return { user: null, token: null };
};

export function AuthProvider({ children }) {
  const initial = loadAuth();
  const [user,  setUser]  = useState(initial.user);
  const [token, setToken] = useState(initial.token);

  const login = (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    localStorage.setItem("tt_user",  JSON.stringify(userData));
    localStorage.setItem("tt_token", tokenValue);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("tt_user");
    localStorage.removeItem("tt_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, ready: true }}>
      {children}
    </AuthContext.Provider>
  );
}