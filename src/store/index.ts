import { create } from 'zustand';

export interface User {
  id: string;
  name: string | null;
  email: string;
  photo: string | null;
  familyName: string | null;
  givenName: string | null;
}

interface AuthState {
  user: User | null;
  idToken: string | null;
  setUser: (user: User | null) => void;
  setIdToken: (idToken: string | null) => void;
  logout: () => void;
}

export const useStore = create<AuthState>((set) => ({
  user: null,
  idToken: null,
  setUser: (user) => set({ user }),
  setIdToken: (idToken) => set({ idToken }),
  logout: () => set({ user: null, idToken: null }),
}));
