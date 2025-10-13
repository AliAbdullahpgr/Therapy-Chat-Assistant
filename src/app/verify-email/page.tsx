"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { logOut, resendVerificationEmail } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Loader2, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleResendEmail = async () => {
    if (!user) {
      setError('No user found. Please sign up again.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resendVerificationEmail(user);
      setMessage('Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      router.push('/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const handleCheckVerification = () => {
    // Reload the page to check if email is verified
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification email to <strong>{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Next Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Come back here and click "I've Verified My Email"</li>
                </ol>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground text-center">
            <p>Didn't receive the email?</p>
            <p>Check your spam folder or request a new one below.</p>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <Button
            onClick={handleCheckVerification}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            I've Verified My Email
          </Button>
          
          <Button
            onClick={handleResendEmail}
            className="w-full"
            variant="outline"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSignOut}
            className="w-full"
            variant="ghost"
          >
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
