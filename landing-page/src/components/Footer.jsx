import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="py-12 px-6 border-t border-slate-800/50 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl transform -translate-x-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo and tagline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center md:items-start"
          >
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
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-right"
          >
            <p className="text-slate-500 text-sm">
              © 2026 SpendSync — Expense & Reimbursement Management with Workflow Automation.
            </p>
            <p className="text-slate-600 text-xs mt-1">
              A project by Jane Crethel C. Porgs.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
