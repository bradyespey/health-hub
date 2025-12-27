import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface PageInfoProps {
  title: string;
  description: string;
  tips: string[];
  inline?: boolean;
}

export function PageInfo({ title, description, tips, inline = false }: PageInfoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Page Info</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 md:w-96" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4 text-accent" />
              {title}
            </CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">How to use this page:</h4>
              <ul className="space-y-1.5">
                {tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-accent font-medium mt-0.5">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
