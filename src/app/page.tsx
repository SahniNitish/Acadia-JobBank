'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 px-4">
              Acadia University Job Bank
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl px-4">
              Connecting faculty and students for job opportunities within our university community
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12 w-full max-w-4xl px-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <span className="text-2xl mr-2">👨‍🏫</span>
                  For Faculty
                </CardTitle>
                <CardDescription>
                  Post job opportunities and find qualified students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Post research assistant positions</li>
                  <li>• Find teaching assistants</li>
                  <li>• Manage applications efficiently</li>
                  <li>• Connect with talented students</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <span className="text-2xl mr-2">🎓</span>
                  For Students
                </CardTitle>
                <CardDescription>
                  Discover and apply for campus job opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Browse available positions</li>
                  <li>• Apply with your resume</li>
                  <li>• Track application status</li>
                  <li>• Build your academic career</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4 px-4">
            <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4 sm:gap-0">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <Link href="/auth/register">
                  Create Account
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Use your @acadiau.ca email address to get started
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}