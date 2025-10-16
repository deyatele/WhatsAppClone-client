"use client";

import { createContext, useContext, useEffect } from "react";

import { useChatStore } from "../lib/store";

interface UserContextType {
  userId: string | null;
}

const UserContext = createContext<UserContextType>({ userId: null });

export const useUser = () => {
  return useContext(UserContext);
};

interface UserProviderProps {
  children: React.ReactNode;
  userId: string | null;
}

export const UserProvider = ({ children, userId }: UserProviderProps) => {
  const setUserId = useChatStore((state) => state.setUserId);

  useEffect(() => {
    setUserId(userId);
  }, [userId, setUserId]);

  return (
    <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>
  );
};
