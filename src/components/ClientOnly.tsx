'use client';

import React, { useEffect, useState } from 'react';

interface ClientOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Agregar un pequeño delay para asegurar que el DOM esté completamente listo
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Durante la hidratación, mostrar el fallback
  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
} 