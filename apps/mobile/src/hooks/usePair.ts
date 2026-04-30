import { useAuthStore } from '@/lib/store';

export function usePair(): string | null {
  return useAuthStore((state) => state.activePairId);
}
