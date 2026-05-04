import { Menu, X, User } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  userType?: 'guest' | 'user' | 'admin';
}

export function Navigation({ currentPage, onNavigate, userType = 'guest' }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = userType === 'admin' 
    ? [
        { label: 'Panel Admin', page: 'admin' },
      ]
    : userType === 'user'
    ? [
        { label: 'Mi Dashboard', page: 'dashboard' },
        { label: 'Mi Pauta', page: 'nutrition-plan' },
        { label: 'Blog', page: 'blog' },
        { label: 'Chat', page: 'chat' },
      ]
    : [
        { label: 'Inicio', page: 'home' },
        { label: 'Planes', page: 'plans' },
        { label: 'Sobre Amalia', page: 'about' },
        { label: 'Contacto', page: 'contact' },
      ];

  return (
    <nav className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate(userType === 'admin' ? 'admin' : userType === 'user' ? 'dashboard' : 'home')}
            className="flex items-center space-x-2"
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white">AA</span>
            </div>
            <span className="hidden sm:block text-primary">Amalia Abogabir</span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => onNavigate(link.page)}
                className={`transition-colors ${
                  currentPage === link.page
                    ? 'text-primary'
                    : 'text-foreground/60 hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            ))}
            {userType === 'guest' && (
              <Button onClick={() => onNavigate('plans')} className="bg-primary hover:bg-primary/90">
                Comenzar
              </Button>
            )}
            {userType === 'user' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate('dashboard')}
                className="rounded-full"
              >
                <User className="h-5 w-5" />
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-border">
            {navLinks.map((link) => (
              <button
                key={link.page}
                onClick={() => {
                  onNavigate(link.page);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  currentPage === link.page
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-muted'
                }`}
              >
                {link.label}
              </button>
            ))}
            {userType === 'guest' && (
              <Button
                onClick={() => {
                  onNavigate('plans');
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Comenzar
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}