import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  DocumentDuplicateIcon, 
  ArrowPathIcon,
  BanknotesIcon,
  DocumentChartBarIcon,
  LockClosedIcon 
} from '@heroicons/react/24/outline';

const modules = [
  {
    number: '01',
    icon: UsersIcon,
    title: 'User Management',
    features: [
      'Account registration',
      'Login & authentication',
      'Role assignments',
      'Profile management',
      'Password changes',
    ],
  },
  {
    number: '02',
    icon: DocumentDuplicateIcon,
    title: 'Expense Management',
    features: [
      'Submit expense claims',
      'Upload receipts',
      'Edit pending entries',
      'Categorize expenses',
      'View full history',
    ],
  },
  {
    number: '03',
    icon: ArrowPathIcon,
    title: 'Approval Workflow',
    features: [
      'Route for approval',
      'Approve or reject',
      'Add remarks',
      'Track status',
      'Multi-level chains',
    ],
  },
  {
    number: '04',
    icon: BanknotesIcon,
    title: 'Reimbursement',
    features: [
      'Process payouts',
      'Update payment status',
      'Track history',
    ],
  },
  {
    number: '05',
    icon: DocumentChartBarIcon,
    title: 'Reports',
    features: [
      'Financial summaries',
      'PDF / Excel exports',
      'Spending trends',
    ],
  },
  {
    number: '06',
    icon: LockClosedIcon,
    title: 'Security',
    features: [
      'Input validation',
      'Audit logs',
      'Secure API endpoints',
    ],
  },
];

const Modules = () => {
  return (
    <section id="modules" className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">
            MODULES
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Six modules.{' '}
            <span className="text-lime-400">One unified system.</span>
          </h2>
        </motion.div>

        {/* Modules grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:border-lime-500/50 transition-all duration-300">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-lime-500/0 to-cyan-500/0 group-hover:from-lime-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />
                
                <div className="relative z-10">
                  {/* Number badge and icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500/20 to-cyan-500/20 border border-lime-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <module.icon className="w-6 h-6 text-lime-400" />
                    </div>
                    <span className="text-3xl font-bold text-slate-700 group-hover:text-slate-600 transition-colors">
                      {module.number}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {module.title}
                  </h3>

                  {/* Features list */}
                  <ul className="space-y-2">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-slate-400 text-sm">
                        <span className="text-lime-400 mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modules;
