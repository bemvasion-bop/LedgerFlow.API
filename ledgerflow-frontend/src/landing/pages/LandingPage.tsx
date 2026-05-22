import React from 'react';
import Navbar from '../components/Navbar';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-20">
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-20">
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }} 
          />
        </div>

        {/* Radial gradient glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20 backdrop-blur-sm mb-8">
            <span className="text-2xl">🚀</span>
            <span className="text-cyan-400 text-sm font-medium">
              Workflow automation for modern finance teams
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Expenses,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">
              reimbursed
            </span>
            <br />
            at the speed of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
              light.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
            SpendSync streamlines how organizations submit, approve, and reimburse expenses — 
            with role-based workflows, audit-ready logs, and real-time financial insight.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                const element = document.querySelector('#pricing');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 flex items-center gap-2"
            >
              Start free trial
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#features"
              className="px-8 py-4 bg-slate-800/50 text-white font-semibold rounded-xl border border-slate-700 hover:border-cyan-500/50 backdrop-blur-sm transition-all duration-300"
            >
              See how it works
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span className="text-slate-400">70% faster reimbursements</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span className="text-slate-400">JWT + RBAC secured</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤖</span>
              <span className="text-slate-400">AI-assisted insights</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">
              FEATURES
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything finance teams need,{' '}
              <span className="text-cyan-400">nothing they don't.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Smart expense capture', desc: 'Submit claims, upload receipts, and categorize spend in seconds.' },
              { title: 'Role-based workflows', desc: 'Route requests through Admin, Finance, and Audit roles with full tracking.' },
              { title: 'Reimbursement engine', desc: 'Process payouts and keep employees informed every step of the way.' },
              { title: 'Reports & analytics', desc: 'Live financial summaries, spending trends, and one-click exports.' },
              { title: 'Bank-grade security', desc: 'JWT auth, RBAC, hashed passwords, and audit logs.' },
              { title: 'Receipt management', desc: 'Upload and attach receipts to expenses for complete documentation.' },
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300"
              >
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold text-white">
                  Spend<span className="text-cyan-400">Sync</span>
                </span>
              </div>
              <p className="text-slate-400 text-sm max-w-md text-center md:text-left">
                Expense & Reimbursement Management with Workflow Automation.
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-slate-500 text-sm">
                © 2026 SpendSync — Expense & Reimbursement Management
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
