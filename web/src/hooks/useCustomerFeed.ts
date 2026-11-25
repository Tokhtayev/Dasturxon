import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import { productRepository } from '../repositories/productRepository';
import type { Business, BusinessTypeKey, Product } from '../types/domain';

export function useCustomerFeed(enabled: boolean) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedBiz, setLoadedBiz] = useState(false);
  const [loadedFeedKey, setLoadedFeedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BusinessTypeKey>('all');

  useEffect(() => {
    if (!enabled) return;
    const unsub = businessRepository.observeApproved(
      (data) => {
        setBusinesses(data);
        setLoadedBiz(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoadedBiz(true);
      }
    );
    return unsub;
  }, [enabled]);

  const approvedIdsKey = useMemo(
    () =>
      businesses
        .map((b) => b.id)
        .sort()
        .join(','),
    [businesses]
  );

  useEffect(() => {
    if (!enabled || !loadedBiz) return;
    const ids = approvedIdsKey ? approvedIdsKey.split(',') : [];
    const unsub = productRepository.observeFeedForApprovedBusinesses(
      ids,
      (data) => {
        setProducts(data);
        setLoadedFeedKey(approvedIdsKey);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoadedFeedKey(approvedIdsKey);
      }
    );
    return unsub;
  }, [enabled, loadedBiz, approvedIdsKey]);

  const visibleBusinesses = useMemo(() => (enabled ? businesses : []), [enabled, businesses]);
  const visibleProducts = useMemo(() => (enabled ? products : []), [enabled, products]);
  const loading = enabled && (!loadedBiz || loadedFeedKey !== approvedIdsKey);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      const catOk = categoryFilter === 'all' || p.businessType === categoryFilter;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [visibleProducts, searchQuery, categoryFilter]);

  const businessById = useMemo(() => {
    const map = new Map<string, Business>();
    visibleBusinesses.forEach((b) => map.set(b.id, b));
    return map;
  }, [visibleBusinesses]);

  return {
    businesses: visibleBusinesses,
    businessById,
    products: visibleProducts,
    filteredProducts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  };
}
