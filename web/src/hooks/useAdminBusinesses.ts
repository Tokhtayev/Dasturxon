import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import { inquiryRepository } from '../repositories/inquiryRepository';
import { MIN_REJECTION_REASON_LENGTH } from '../services/constants';
import type { Business, OwnerInquiry } from '../types/domain';

export function useAdminBusinesses(enabled: boolean) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [inquiries, setInquiries] = useState<OwnerInquiry[]>([]);
  const [loadedBiz, setLoadedBiz] = useState(false);
  const [loadedInq, setLoadedInq] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const unsubBiz = businessRepository.observeAll(
      (list) => {
        setBusinesses(list);
        setLoadedBiz(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoadedBiz(true);
      }
    );
    const unsubInq = inquiryRepository.observeAllForAdmin(
      (list) => {
        setInquiries(list);
        setLoadedInq(true);
      },
      (err) => {
        setError(err.message);
        setLoadedInq(true);
      }
    );
    return () => {
      unsubBiz();
      unsubInq();
    };
  }, [enabled]);

  const visibleBusinesses = useMemo(() => (enabled ? businesses : []), [enabled, businesses]);
  const visibleInquiries = useMemo(() => (enabled ? inquiries : []), [enabled, inquiries]);
  const loading = enabled && (!loadedBiz || !loadedInq);

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
  const waitingInquiries = useMemo(
    () => visibleInquiries.filter((i) => i.status === 'waiting'),
    [visibleInquiries]
  );

  const approveBusiness = async (businessId: string) => {
    await businessRepository.setStatus(businessId, 'approved');
  };

  const rejectBusiness = async (businessId: string, reason: string) => {
    if (reason.trim().length < MIN_REJECTION_REASON_LENGTH) {
      throw new Error('Rad etish sababi kamida 3 belgidan iborat bo‘lishi kerak.');
    }
    await businessRepository.setStatus(businessId, 'rejected', reason.trim());
  };

  return {
    businesses: visibleBusinesses,
    pendingBusinesses,
    approvedBusinesses,
    rejectedBusinesses,
    inquiries: visibleInquiries,
    waitingInquiries,
    loading,
    error,
    approveBusiness,
    rejectBusiness,
    saveBusinessDetails: businessRepository.adminSaveAndVerify,
    createBusinessForOwner: businessRepository.adminCreateForOwner,
    updateInquiry: inquiryRepository.adminUpdateInquiry,
  };
}
