/**
 * INFINITE SCROLL HOOK
 * 2️⃣ Infinite scroll
 * 3️⃣ Prefetch - oldindan yuklab qo'yish
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const {
    initialPage = 1,
    limit = 20,
    threshold = 0.8, // 80% scroll qilganda yangi ma'lumot yuklash
    prefetchThreshold = 0.9 // 90% da prefetch
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  const observerRef = useRef(null);
  const prefetchRef = useRef(false);

  // Ma'lumot yuklash
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchFunction({ page, limit });
      
      if (result.success) {
        setData(prev => [...prev, ...result.data]);
        setHasMore(result.pagination?.hasNext || false);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError(err.message);
      console.error('Infinite scroll error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, loading, hasMore, fetchFunction]);

  // Prefetch - oldindan yuklash
  const prefetch = useCallback(async () => {
    if (prefetchRef.current || loading || !hasMore) return;
    
    prefetchRef.current = true;
    
    try {
      const result = await fetchFunction({ page: page + 1, limit });
      // Ma'lumotni cache ga saqlash (agar kerak bo'lsa)
    } catch (err) {
      console.error('Prefetch error:', err);
    } finally {
      prefetchRef.current = false;
    }
  }, [page, limit, loading, hasMore, fetchFunction]);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Prefetch
    if (scrollPercentage >= prefetchThreshold && !prefetchRef.current) {
      prefetch();
    }
    
    // Load more
    if (scrollPercentage >= threshold && !loading && hasMore) {
      loadMore();
    }
  }, [threshold, prefetchThreshold, loading, hasMore, loadMore, prefetch]);

  // Scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Dastlabki yuklash
  useEffect(() => {
    if (data.length === 0) {
      loadMore();
    }
  }, []);

  // Reset function
  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    prefetchRef.current = false;
  }, [initialPage]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
};

/**
 * INTERSECTION OBSERVER HOOK
 * Yanada optimallashtirilgan variant
 */
export const useIntersectionObserver = (fetchFunction, options = {}) => {
  const {
    initialPage = 1,
    limit = 20,
    rootMargin = '100px' // 100px oldin yuklashni boshlash
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const loaderRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const result = await fetchFunction({ page, limit });
      
      if (result.success) {
        setData(prev => [...prev, ...result.data]);
        setHasMore(result.pagination?.hasNext || false);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, loading, hasMore, fetchFunction]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [loadMore, hasMore, loading, rootMargin]);

  return {
    data,
    loading,
    hasMore,
    loaderRef
  };
};
