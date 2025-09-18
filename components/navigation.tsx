"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Home, MapPin, FileText, User } from "lucide-react";
// import { User as AuthUser } from "@supabase/supabase-js";

const navigationLinks = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/report",
    label: "Report",
    icon: FileText,
  },
  {
    href: "/issues",
    label: "Issues",
    icon: MapPin,
  },
  {
    href: "/my-issues",
    label: "My Issues",
    icon: User,
    authRequired: true,
  },
];

interface NavigationProps {
  user?: any | null;
}

export function Navigation({ user }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 bg-background/95 backdrop-blur-sm z-50">
      <div className="w-full max-w-6xl flex justify-between items-center p-3 px-5">
        <div className="flex gap-6 items-center">
          <Link
            href="/"
            className="font-bold text-lg text-primary hover:text-primary/90 transition-colors"
          >
            Civic Reporter
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navigationLinks
              .filter((link) => !link.authRequired || user)
              .map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                    {/* {link.authRequired && (
                      <Badge variant="outline" className="text-xs ml-1">
                        Auth
                      </Badge>
                    )} */}
                  </Link>
                );
              })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-1">
            {navigationLinks
              .filter((link) => !link.authRequired || user)
              .map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                );
              })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeSwitcher />
          </div>
          {!hasEnvVars ? <EnvVarWarning /> : <AuthButton user={user} />}
        </div>
      </div>
    </nav>
  );
}