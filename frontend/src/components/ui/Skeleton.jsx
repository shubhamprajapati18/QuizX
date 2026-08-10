import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-zinc-200/70 rounded-lg ${className}`} />
);
