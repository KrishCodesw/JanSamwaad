import { ThemeSwitcher } from '@/components/theme-switcher'
import Link from 'next/link'
import { Github, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-primary">Civic Reporter</h3>
            <p className="text-sm text-muted-foreground">
              Empowering communities to report and track civic issues for a better tomorrow.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/report" className="hover:text-foreground transition-colors">Report Issue</Link></li>
              <li><Link href="/issues" className="hover:text-foreground transition-colors">View Issues</Link></li>
              <li><Link href="/my-issues" className="hover:text-foreground transition-colors">My Issues</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Settings</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Theme:</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>for better communities</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Civic Reporter
            </span>
            <span className="text-xs text-muted-foreground">
              Powered by Supabase
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
