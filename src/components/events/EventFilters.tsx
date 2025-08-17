'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export function EventFilters() {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search events by title or tag..." className="pl-10" />
      </div>
      <Select>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Filter by tag" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ambedkarite">Ambedkarite</SelectItem>
          <SelectItem value="buddhist">Buddhist</SelectItem>
          <SelectItem value="social-reform">Social Reform</SelectItem>
          <SelectItem value="constitutional">Constitutional</SelectItem>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-asc">Date (Upcoming)</SelectItem>
          <SelectItem value="date-desc">Date (Recent)</SelectItem>
          <SelectItem value="featured">Featured</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
