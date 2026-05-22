import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Is data isolated per company?',
      answer: 'Yes! SpendSync uses strict multi-tenant architecture. Every company\'s data is completely isolated using CompanyId filtering. No company can access another company\'s data, expenses, or users. All queries are automatically scoped to your company.'
    },
    {
      question: 'Can companies upgrade plans?',
      answer: 'Yes. Companies can upgrade from Starter to Business at any time. The system administrator can change your plan, and the new limits and features take effect immediately. Downgrades are also supported with proper data migration.'
    },
    {
      question: 'Is JWT authentication secure?',
      answer: 'Absolutely. We use industry-standard JWT (JSON Web Tokens) with secure signing keys. All passwords are hashed using BCrypt. Tokens expire after a set period, and refresh tokens are used for extended sessions. All API endpoints are protected with role-based access control (RBAC).'
    },
    {
      question: 'Can admins manage users?',
      answer: 'Yes. Company admins have full control over user management within their company. They can create users, assign roles (Employee, Finance, Auditor), activate/deactivate accounts, and manage permissions. Admins cannot access users from other companies.'
    },
    {
      question: 'Is there a free trial?',
      answer: 'Yes! All new companies get a 14-day free trial with full access to their chosen plan\'s features. No credit card required to start. After the trial, you can continue with a paid subscription or contact us for custom arrangements.'
    },
    {
      question: 'Are audit logs included?',
      answer: 'Yes. Every action in the system is logged with timestamps, user information, and details. Audit logs include logins, expense submissions, approvals, rejections, and administrative actions. Auditors have read-only access to all logs for compliance and security reviews.'
    },
    {
      question: 'What happens when I reach my expense limit?',
      answer: 'If you\'re on the Starter plan (100 expenses/month), you\'ll receive a notification when approaching the limit. Once reached, you won\'t be able to submit new expenses until the next month or until you upgrade to Business (unlimited expenses).'
    },
    {
      question: 'Can I upload receipts?',
      answer: 'Yes! Receipt uploads are available on ALL plans, including Starter. You can attach receipt images or PDFs to your expense claims. All receipts are securely stored and linked to their respective expenses for easy tracking and audit compliance.'
    },
    {
      question: 'How does the approval workflow work?',
      answer: 'Employees submit expenses for approval. In the Starter plan, Admins handle approvals and reimbursements. In the Business plan, you get Finance and Audit roles for more advanced role-based workflows. The entire process is tracked with timestamps and audit logs.'
    },
    {
      question: 'What are advanced reports?',
      answer: 'Advanced reports (Business plan) include detailed analytics, spending trends, category breakdowns, user-wise summaries, time-series analysis, and exportable data. Starter plan includes simple expense lists and basic summaries.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4"
          >
            FAQ
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Frequently asked questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg"
          >
            Everything you need to know about SpendSync
          </motion.p>
        </div>

        {/* FAQ items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
              >
                <span className="text-white font-semibold pr-8">{faq.question}</span>
                <ChevronDownIcon
                  className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 p-8 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 rounded-2xl backdrop-blur-sm"
        >
          <h3 className="text-xl font-semibold text-white mb-2">
            Still have questions?
          </h3>
          <p className="text-slate-400 mb-4">
            Our support team is here to help you get started
          </p>
          <a
            href="mailto:support@spendsync.com"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
          >
            Contact Support
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;
