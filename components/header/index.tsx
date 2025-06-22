'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="flex items-center justify-between my-8">
      <Link href="/" className="flex items-center gap-4">
        <Image
          src="/cyrus-logo.png"
          alt="Cyrus News Logo"
          width={1024}
          height={1024}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Cyrus News</h1>
          <p className="hidden md:block mt-1 text-lg text-muted-foreground">Cut through the noise, monitor the situation from all angles.</p>
        </div>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/why">Why</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/sources">Sources</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
