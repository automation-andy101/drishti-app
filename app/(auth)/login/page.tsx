import LoginForm from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-medium mb-2">Welcome to Drishti</h1>
        <p className="text-muted-foreground mb-8">Sign in to your account</p>
        <LoginForm />
      </div>
    </div>
  )
}