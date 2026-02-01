'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Download, FilePen, AudioLines, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HealthStatus } from './health-status';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/', label: 'Strona główna', icon: Home },
  { href: '/youtube-downloader', label: 'Pobieranie utworów', icon: Download },
  { href: '/metadata', label: 'Edytor metadanych (Placeholder)', icon: FilePen },
  { href: '/file-editor', label: 'Edytor plików', icon: AudioLines },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Only visible on mobile */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMobileMenu}
          className="bg-surface border-border hover:bg-accent/20"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-[#121212] border-r border-[#1f1f1f] flex-col p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            <Image src="/navidrome.svg" alt="Logo" width={40} height={40} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Navidrome</h1>
            <span className="text-accent text-sm font-medium">Toolbox</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden',
                  isActive 
                    ? 'text-accent' 
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )}
              >
                {/* Animated background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavDesktop"
                    className="absolute inset-0 bg-accent/20 rounded-lg border-l-2 border-accent"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 35
                    }}
                  />
                )}
                
                <Icon className="w-5 h-5 relative z-10" />
                <span className="font-medium relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Health Status */}
        <HealthStatus />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeMobileMenu}
            />

            {/* Mobile Sidebar Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-full w-72 bg-[#121212] border-r border-[#1f1f1f] flex flex-col p-6 z-50"
            >
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                  <Image src="/navidrome.svg" alt="Logo" width={40} height={40} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Navidrome</h1>
                  <span className="text-accent text-sm font-medium">Toolbox</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden',
                        isActive 
                          ? 'text-accent' 
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      )}
                    >
                      {/* Animated background */}
                      {isActive && (
                        <motion.div
                          layoutId="activeNavMobile"
                          className="absolute inset-0 bg-accent/20 rounded-lg border-l-2 border-accent"
                          initial={false}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35
                          }}
                        />
                      )}
                      
                      <Icon className="w-5 h-5 relative z-10" />
                      <span className="font-medium relative z-10">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Health Status */}
              <HealthStatus />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
