import React from 'react';
import { Badge } from '@/components/ui/badge';

export function SampleBadge() {
  return (
    <Badge 
      variant="secondary" 
      className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
    >
      Sample
    </Badge>
  );
}
