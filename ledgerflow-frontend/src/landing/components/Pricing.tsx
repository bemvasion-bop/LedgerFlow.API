import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'quarterly' | 'yearly'>('yearly');

  const plans = [
    {
      name: 'Starter',
      quarterlyPrice: 1499,
      yearlyPrice: 5499,
      yearlySavings: '20%',
      description: 'Perfect for startups and small teams getting started',
      maxUsers: '10 users',
      maxExpenses: '100 expenses/month',
      features: [
        { name: 'Employee expense submission', included: true },
        { name: 'Expense tracking', included: true },
        { name: 'Receipt uploads', included: true },
        { name: 'Basic dashboard', included: true },
        { name: 'PDF reports', included: true },
        { name: 'Audit logs', included: true },
        { name: 'Export to Excel', included: true },
        { name: 'Email support', included: true },
        { name: 'Expense approval workflow', included: false },
        { name: 'Reimbursement processing', included: false },
        { name: 'Finance & Audit roles', included: false },
        { name: 'Departments', included: false }
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Business',
      quarterlyPrice: 6999,
      yearlyPrice: 24999,
      yearlySavings: '25%',
      description: 'Built for growing companies with advanced workflows',
      maxUsers: 'Unlimited users',
      maxExpenses: 'Unlimited expenses',
      features: [
        { name: 'Everything in Starter', included: true, bold: true },
        { name: 'Expense approval workflow', included: true },
        { name: 'Reimbursement processing', included: true },
        { name: 'Finance & Audit roles', included: true },
        { name: 'Departments', included: true },
        { name: 'Role-based workflows', included: true },
        { name: 'Compliance monitoring', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Advanced reports', included: true },
        { name: 'Priority support', included: true }
      ],
      cta: 'Start Free Trial',
      popular: true
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-cyan-400 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4"
          >
            PRICING
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 px-4"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto px-4"
          >
            Start with a 14-day free trial. No credit card required.
          </motion.p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center items-center gap-3 sm:gap-4 mb-8 sm:mb-12 px-4">
          <span className={`text-base sm:text-lg font-medium transition-colors ${billingCycle === 'quarterly' ? 'text-white' : 'text-gray-500'}`}>
            Quarterly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'quarterly' ? 'yearly' : 'quarterly')}
            className="relative w-14 h-7 sm:w-16 sm:h-8 bg-gray-700 rounded-full transition-colors hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <div
              className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-6 h-6 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-7 sm:translate-x-8' : 'translate-x-0'
              }`}
            ></div>
          </button>
          <span className={`text-base sm:text-lg font-medium transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <span className="ml-2 px-2 sm:px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs sm:text-sm font-semibold">
              Save up to 25%
            </span>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto px-4">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-6 sm:p-8 rounded-2xl backdrop-blur-sm ${
                plan.popular
                  ? 'bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-2 border-cyan-500/50 lg:scale-105'
                  : 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50'
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 sm:px-4 py-1 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 text-xs sm:text-sm font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-xs sm:text-sm mb-3 sm:mb-4">{plan.description}</p>
                <div className="flex items-baseline flex-wrap gap-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                    {formatPrice(billingCycle === 'quarterly' ? plan.quarterlyPrice : plan.yearlyPrice)}
                  </span>
                  <span className="text-slate-400 text-sm sm:text-base">
                    / {billingCycle === 'quarterly' ? 'quarter' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-cyan-400 text-xs sm:text-sm font-semibold mt-2">
                    Save {plan.yearlySavings} with yearly billing
                  </p>
                )}
              </div>

              {/* Limits */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-xs sm:text-sm">Users</span>
                  <span className="text-white font-semibold text-xs sm:text-sm">{plan.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs sm:text-sm">Expenses</span>
                  <span className="text-white font-semibold text-xs sm:text-sm">{plan.maxExpenses}</span>
                </div>
              </div>

              {/* Features list */}
              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 sm:gap-3">
                    {feature.included ? (
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-xs sm:text-sm ${
                      feature.included
                        ? feature.bold
                          ? 'text-white font-semibold'
                          : 'text-slate-300'
                        : 'text-slate-600'
                    }`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA button */}
              <Link
                to={`/register-company?plan=${plan.name.toLowerCase()}&billing=${billingCycle}`}
                className={`block w-full text-center py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 text-sm sm:text-base ${
                  plan.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 hover:shadow-lg hover:shadow-cyan-500/50'
                    : 'bg-slate-800 text-white border border-slate-700 hover:border-cyan-500/50'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-slate-400">
            All plans include a <span className="text-cyan-400 font-semibold">14-day free trial</span>. No credit card required.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
