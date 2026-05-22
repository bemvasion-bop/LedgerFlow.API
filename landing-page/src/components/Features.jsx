import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: DocumentTextIcon,
    title: 'Smart expense capture',
    description: 'Submit claims, upload receipts, and categorize spend in seconds — from any device.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Multi-level approvals',
    description: 'Route requests through automated workflows with comments, remarks, and full status tracking.',
  },
  {
    icon: CurrencyDollarIcon,
    title: 'Reimbursement engine',
    description: 'Process payouts, update payment statuses, and keep employees informed every step of the way.',
  },
  {
    icon: ChartBarIcon,
    title: 'Reports & analytics',
    description: 'Live financial summaries, spending trends, and one-click PDF / Excel exports.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Bank-grade security',
    description: 'JWT auth, RBAC, hashed passwords, audit logs, and protection against SQL injection & XSS.',
  },
  {
    icon: UserGroupIcon,
    title: 'Role-based access',
    description: 'Tailored experiences for Admins, Employees, Finance, and Auditors — out of the box.',
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

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
            FEATURES
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything finance teams need,{' '}
            <span className="text-cyan-400">nothing they don't.</span>
          </h2>
        </motion.div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-teal-500/0 group-hover:from-cyan-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-cyan-400" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
