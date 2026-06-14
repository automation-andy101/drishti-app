import SignupForm from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="text-2xl font-medium mb-2">Create an account</h1>
        <p className="text-muted-foreground mb-8">
          Start building your yoga sequences
        </p>
        <SignupForm />
      </div>
    </div>
  )
}