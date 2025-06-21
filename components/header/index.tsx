import React from 'react';
import Image from 'next/image';

export function Header() {
  return (
    <header className="flex items-center my-8">
      <div className="flex items-center gap-4">
        <Image
          src="/cyrus-logo.png"
          alt="Cyrus News Logo"
          width={1024}
          height={1024}
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Cyrus News</h1>
          <p className="hidden md:block mt-1 text-lg text-muted-foreground">Your source for aggregated and analyzed news on Iran.</p>
        </div>
      </div>
    </header>
  );
}
