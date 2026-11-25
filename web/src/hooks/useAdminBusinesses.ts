import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import type { Business } from '../types/domain';

export function useAdminBusinesses(enabled: boolean) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = businessRepository.observeAll(
      (list) => {
        setBusinesses(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [enabled]);

  const pendingBusinesses = useMemo(
    () => businesses.filter((b) => b.status === 'pending'),
    [businesses]
  );
  const approvedBusinesses = useMemo(
    () => businesses.filter((b) => b.status === 'approved'),
    [businesses]
  );
  const rejectedBusinesses = useMemo(
    () => businesses.filter((b) => b.status === 'rejected'),
    [businesses]
  );

  const approveBusiness = async (businessId: string) => {
    await businessRepository.setStatus(businessId, 'approved');
  };

  const rejectBusiness = async (businessId: string, reason: string) => {
    if (reason.trim().length < 3) {
      throw new Error('Rad etish sababi kamida 3 belgidan iborat bo‘lishi kerak.');
    }
    await businessRepository.setStatus(businessId, 'rejected', reason.trim());
  };

  return {
    businesses,
    pendingBusinesses,
    approvedBusinesses,
    rejectedBusinesses,
    loading,
    error,
    approveBusiness,
    rejectBusiness,
  };
}
