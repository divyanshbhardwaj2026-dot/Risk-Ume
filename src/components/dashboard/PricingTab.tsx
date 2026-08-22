import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function PricingTab() {
  const { user, login } = useAuth();

  const handleUpgrade = async (tierKey: string) => {
    if (!user) return;
    try {
      const response = await fetch('/api/auth/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tier: tierKey })
      });
      if (!response.ok) throw new Error('Upgrade failed');
      const data = await response.json();
      login(data.token, data.user);
      alert(`Successfully upgraded to ${tierKey === 'pro' ? 'Pro' : tierKey === 'career_pro' ? 'Career Pro' : 'Free'}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to upgrade plan. Please try again.');
    }
  };

  const tiers = [
    {
      key: 'free',
      name: 'Free',
      price: '$0',
      description: 'Basic tools to get started.',
      features: [
        '1 ATS scan/month',
        'Basic risk score',
        'Limited suggestions'
      ],
      buttonText: user?.subscription_tier === 'free' ? 'Current Plan' : 'Select Free',
      buttonVariant: user?.subscription_tier === 'free' ? 'outline' : 'secondary',
      disabled: user?.subscription_tier === 'free'
    },
    {
      key: 'pro',
      name: 'Pro',
      price: '$12',
      period: '/month',
      description: 'For active job seekers.',
      features: [
        'Unlimited ATS scans',
        'Before/After simulations',
        'Resume health tracking',
        'Interview probability score',
        'Weekly market updates'
      ],
      buttonText: user?.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      buttonVariant: user?.subscription_tier === 'pro' ? 'outline' : 'default',
      disabled: user?.subscription_tier === 'pro',
      popular: true
    },
    {
      key: 'career_pro',
      name: 'Career Pro',
      price: '$29',
      period: '/month',
      description: 'Advanced career intelligence.',
      features: [
        'Skill ROI calculator',
        'Career pivot suggestions',
        'Resume benchmarking',
        'Priority AI analysis',
        'Everything in Pro'
      ],
      buttonText: user?.subscription_tier === 'career_pro' ? 'Current Plan' : 'Upgrade to Career Pro',
      buttonVariant: user?.subscription_tier === 'career_pro' ? 'outline' : 'outline',
      disabled: user?.subscription_tier === 'career_pro'
    }
  ];

  return (
    <div className="py-12 animate-in fade-in duration-500">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Simple, transparent pricing
        </h2>
        <p className="mt-4 text-xl text-gray-500">
          Unlock the full potential of your career with our advanced AI tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`relative border-0 shadow-lg ${tier.popular ? 'ring-2 ring-indigo-600 scale-105 z-10' : 'bg-white'}`}>
            {tier.popular && (
              <div className="absolute top-0 right-0 -mr-2 -mt-2">
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  Most Popular
                </span>
              </div>
            )}
            <CardHeader className="p-8">
              <CardTitle className="text-2xl font-bold text-gray-900">{tier.name}</CardTitle>
              <CardDescription className="mt-2 text-gray-500">{tier.description}</CardDescription>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold">
                {tier.price}
                {tier.period && <span className="ml-1 text-xl font-medium text-gray-500">{tier.period}</span>}
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <ul className="space-y-4 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="ml-3 text-base text-gray-700">{feature}</p>
                  </li>
                ))}
              </ul>
              <Button 
                variant={tier.buttonVariant as any} 
                className={`w-full h-12 text-lg font-bold ${tier.popular && !tier.disabled ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                onClick={() => !tier.disabled && handleUpgrade(tier.key)}
                disabled={tier.disabled}
              >
                {tier.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
