import { useState } from 'react';
import { CheckIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('yearly'); // 'quarterly' or 'yearly'

  const plans = [
    {
      name: 'Starter',
      description: 'Perfect for startups and small businesses getting started',
      quarterlyPrice: 1499,
      yearlyPrice: 5499,
      yearlySavings: '20%',
      maxUsers: '10 users',
      maxExpenses: '100 expenses/month',
      popular: false,
      features: [
        { name: 'Expense tracking', included: true },
        { name: 'Reimbursement workflow', included: true },
        { name: 'Basic dashboard', included: true },
        { name: 'Expense categories', included: true },
        { name: 'PDF export reports', included: true },
        { name: 'Audit logs', included: true },
        { name: 'Email notifications', included: true },
        { name: 'Basic approval workflow', included: true },
        { name: 'Department support', included: true },
        { name: 'Secure authentication', included: true },
        { name: 'Receipt uploads', included: false },
        { name: 'Advanced analytics', included: false },
        { name: 'Advanced financial reports', included: false },
        { name: 'Multi-level approvals', included: false },
        { name: 'Department analytics', included: false },
        { name: 'Priority support', included: false },
      ],
    },
    {
      name: 'Business',
      description: 'Built for growing companies with advanced workflows',
      quarterlyPrice: 6999,
      yearlyPrice: 24999,
      yearlySavings: '25%',
      maxUsers: 'Unlimited users',
      maxExpenses: 'Unlimited expenses',
      popular: true,
      features: [
        { name: 'Everything in Starter', included: true, bold: true },
        { name: 'Receipt uploads', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Financial dashboards', included: true },
        { name: 'Department analytics', included: true },
        { name: 'Multi-level approvals', included: true },
        { name: 'Advanced reports', included: true },
        { name: 'Excel exports', included: true },
        { name: 'Advanced KPI insights', included: true },
        { name: 'Reimbursement analytics', included: true },
        { name: 'Priority support', included: true },
        { name: 'Advanced filtering', included: true },
        { name: 'Advanced finance workflows', included: true },
      ],
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your business. Start with a 14-day free trial.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={`text-lg font-medium transition-colors ${billingCycle === 'quarterly' ? 'text-white' : 'text-gray-500'}`}>
            Quarterly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'quarterly' ? 'yearly' : 'quarterly')}
            className="relative w-16 h-8 bg-gray-700 rounded-full transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'
              }`}
            ></div>
          </button>
          <span className={`text-lg font-medium transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="ml-2 px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold">
              Save up to 25%
            </span>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/80 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 scale-105'
                  : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 hover:border-gray-600/50'
              } backdrop-blur-sm`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full shadow-lg">
                    <SparklesIcon className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-bold">Most Popular</span>
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    {formatPrice(billingCycle === 'quarterly' ? plan.quarterlyPrice : plan.yearlyPrice)}
                  </span>
                  <span className="text-gray-400">
                    / {billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-cyan-400 text-sm font-semibold mt-2">
                    Save {plan.yearlySavings} with yearly billing
                  </p>
                )}
              </div>

              {/* Limits */}
              <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Users</span>
                  <span className="text-white font-semibold">{plan.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Expenses</span>
                  <span className="text-white font-semibold">{plan.maxExpenses}</span>
                </div>
              </div>

              {/* CTA Button */}
              <a
                href="http://localhost:3000/register"
                className={`block w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-300 mb-6 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {plan.popular ? 'Upgrade to Business' : 'Start Starter Plan'}
              </a>

              {/* Features List */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  What's included
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <CheckIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XMarkIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`text-sm ${
                        feature.included
                          ? feature.bold
                            ? 'text-white font-semibold'
                            : 'text-gray-300'
                          : 'text-gray-600'
                      }`}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Free Trial Notice */}
        <div className="mt-12 text-center">
          <p className="text-gray-400">
            All plans include a <span className="text-cyan-400 font-semibold">14-day free trial</span>. No credit card required.
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Detailed Feature Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="px-6 py-4 text-left text-white font-semibold">Feature</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Starter</th>
                  <th className="px-6 py-4 text-center text-white font-semibold">Business</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                <tr>
                  <td className="px-6 py-4 text-gray-300">Maximum Users</td>
                  <td className="px-6 py-4 text-center text-white font-semibold">10</td>
                  <td className="px-6 py-4 text-center text-cyan-400 font-semibold">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Expenses per Month</td>
                  <td className="px-6 py-4 text-center text-white font-semibold">100</td>
                  <td className="px-6 py-4 text-center text-cyan-400 font-semibold">Unlimited</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Receipt Uploads</td>
                  <td className="px-6 py-4 text-center">
                    <XMarkIcon className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Advanced Analytics</td>
                  <td className="px-6 py-4 text-center">
                    <XMarkIcon className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Department Analytics</td>
                  <td className="px-6 py-4 text-center">
                    <XMarkIcon className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Advanced Reports</td>
                  <td className="px-6 py-4 text-center">
                    <XMarkIcon className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Multi-Level Approvals</td>
                  <td className="px-6 py-4 text-center">
                    <XMarkIcon className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-gray-300">Priority Support</td>
                  <td className="px-6 py-4 text-center">
                    <XMarkIcon className="w-5 h-5 text-gray-600 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <CheckIcon className="w-5 h-5 text-cyan-400 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
