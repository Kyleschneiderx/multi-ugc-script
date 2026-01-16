'use client';

import { useUser } from '@/hooks/useUser';
import { useUsage } from '@/hooks/useUsage';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, loading: userLoading } = useUser();
  const usage = useUsage();
  const router = useRouter();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setIsLoadingPortal(true);
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error opening portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (userLoading || usage.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account and subscription</p>
        </div>

        {/* Account Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1 text-gray-900">{user?.email}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">User ID</label>
                <div className="mt-1 text-gray-900 font-mono text-sm">
                  {user?.id}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Account Created
                </label>
                <div className="mt-1 text-gray-900">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Information */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Subscription</CardTitle>
              {usage.hasSubscription && usage.planType && (
                <Badge variant="success">
                  {usage.planType.charAt(0).toUpperCase() + usage.planType.slice(1)} Plan
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {usage.hasSubscription ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Plan</label>
                  <div className="mt-1 text-gray-900">
                    {usage.planType
                      ? usage.planType.charAt(0).toUpperCase() + usage.planType.slice(1)
                      : 'Unknown'}{' '}
                    Plan
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Monthly Video Limit
                  </label>
                  <div className="mt-1 text-gray-900">{usage.limit || 0} videos</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Videos Used This Month
                  </label>
                  <div className="mt-1 text-gray-900">
                    {usage.usage || 0} / {usage.limit || 0}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Remaining Videos
                  </label>
                  <div className="mt-1 text-gray-900 font-semibold">
                    {usage.remaining || 0}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    onClick={handleManageSubscription}
                    variant="secondary"
                    disabled={isLoadingPortal}
                  >
                    {isLoadingPortal ? 'Loading...' : 'Manage Subscription'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  You don't have an active subscription.
                </p>
                <Button onClick={() => router.push('/pricing')}>
                  View Pricing Plans
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>HeyGen API:</strong> Connected and active
                </p>
              </div>
              <p className="text-sm text-gray-600">
                This application uses your HeyGen API key configured in the environment
                variables.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Once you sign out, you'll need to log in again to access your account.
              </p>
              <Button
                variant="danger"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
