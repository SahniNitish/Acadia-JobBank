import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Acadia University Job Bank
          </h1>
          <p className="text-gray-600">
            Reset your password to regain access
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Reset Password - Acadia University Job Bank',
  description: 'Reset your password for Acadia University Job Bank',
}