import { useQuery } from '@tanstack/react-query';
import { config } from '../config';

type BalanceResponse = { status: boolean; data?: { balance: number; currency: string } };

export function useBalanceQuery() {
  return useQuery({
    queryKey: ['balance'],
    queryFn: async (): Promise<{ balance: number; currency: string }> => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;
      const res = await fetch(`${config.api}/balance`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to fetch balance');
      const json = (await res.json()) as BalanceResponse;
      const balance = json?.data?.balance ?? 0;
      const currency = json?.data?.currency ?? 'ETB';
      return { balance, currency };
    },
  });
}

export default useBalanceQuery;


