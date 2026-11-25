import { useEffect, useMemo, useState } from 'react';
import { businessRepository } from '../repositories/businessRepository';
import { productRepository } from '../repositories/productRepository';
import type { Business, BusinessTypeKey, Product } from '../types/domain';

export function useCustomerFeed(enabled: boolean) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | BusinessTypeKey>('all');

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = businessRepository.observeApproved(
      (data) => {
        setBusinesses(data);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
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
    if (!enabled) return;
    const ids = approvedIdsKey ? approvedIdsKey.split(',') : [];
    const unsub = productRepository.observeFeedForApprovedBusinesses(
      ids,
      (data) => {
        setProducts(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [enabled, approvedIdsKey]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const catOk = categoryFilter === 'all' || p.businessType === categoryFilter;
      const qOk =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.businessName.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [products, searchQuery, categoryFilter]);

  const businessById = useMemo(() => {
    const map = new Map<string, Business>();
    businesses.forEach((b) => map.set(b.id, b));
    return map;
  }, [businesses]);

  return {
    businesses,
    businessById,
    products,
    filteredProducts,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
  };
}
