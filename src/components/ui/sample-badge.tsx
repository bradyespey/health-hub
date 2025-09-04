import React from 'react';
import { Badge } from '@/components/ui/badge';

export function SampleBadge() {
  return (
    <Badge 
      variant="secondary" 
      className="absolute top-2 left-2 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    >
      Sample Data
    </Badge>
  );
}
