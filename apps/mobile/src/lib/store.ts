import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  xp: number;
  tier: string;
  appMode: 'Common' | 'DeeplyUs';
  achievements: string[];
}

interface AuthStore {
  session: Session | null;
  profile: UserProfile | null;
  activePairId: string | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setActivePairId: (pairId: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  profile: null,
  activePairId: null,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setActivePairId: (activePairId) => set({ activePairId }),
  reset: () => set({ session: null, profile: null, activePairId: null }),
}));
