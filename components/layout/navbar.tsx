import { User } from '@supabase/supabase-js'
import SignOutButton from '@/components/auth/signout-button'

export default function Navbar({ user }: { user: User }) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-lg font-medium">🧘 Drishti</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user.email}</span>
        <SignOutButton />
      </div>
    </header>
  )
}