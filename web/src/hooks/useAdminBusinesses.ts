import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import type { Business } from '../types/domain';

export function useAdminBusinesses(enabled: boolean) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const unsub = businessRepository.observeAll(
      (list) => {
        setBusinesses(list);
        setLoaded(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoaded(true);
      }
    );
    return unsub;
  }, [enabled]);

  const visibleBusinesses = useMemo(() => (enabled ? businesses : []), [enabled, businesses]);
  const loading = enabled && !loaded;

  const pendingBusinesses = useMemo(
    () => visibleBusinesses.filter((b) => b.status === 'pending'),
    [visibleBusinesses]
  );
  const approvedBusinesses = useMemo(
    () => visibleBusinesses.filter((b) => b.status === 'approved'),
    [visibleBusinesses]
  );
  const rejectedBusinesses = useMemo(
    () => visibleBusinesses.filter((b) => b.status === 'rejected'),
    [visibleBusinesses]
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
    businesses: visibleBusinesses,
    pendingBusinesses,
    approvedBusinesses,
    rejectedBusinesses,
    loading,
    error,
    approveBusiness,
    rejectBusiness,
  };
}
