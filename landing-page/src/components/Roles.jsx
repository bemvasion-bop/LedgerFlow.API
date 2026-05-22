import { motion } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  UserIcon, 
  BanknotesIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

const roles = [
  {
    icon: ShieldCheckIcon,
    title: 'Admin',
    features: [
      'Manage user accounts & roles',
      'Configure system settings',
      'Monitor all transactions',
      'Access audit logs',
    ],
  },
  {
    icon: UserIcon,
    title: 'Employee',
    features: [
      'Submit expense claims',
      'Upload supporting receipts',
      'Track reimbursement progress',
      'View personal history',
    ],
  },
  {
    icon: BanknotesIcon,
    title: 'Finance',
    features: [
      'Review approved requests',
      'Process reimbursements',
      'Update payment status',
      'Generate financial reports',
    ],
  },
  {
    icon: MagnifyingGlassIcon,
    title: 'Auditor',
    features: [
      'Read-only expense access',
      'Review approval history',
      'Access audit logs',
      'Generate audit reports',
    ],
  },
];

const Roles = () => {
  return (
    <section id="roles" className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

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
            ROLE BASED ACCESS
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Built for every{' '}
            <span className="text-cyan-400">stakeholder.</span>
          </h2>
        </motion.div>

        {/* Roles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {roles.map((role, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="group relative"
            >
              <div className="relative h-full p-8 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-teal-500/0 group-hover:from-cyan-500/10 group-hover:to-teal-500/10 transition-all duration-300" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <role.icon className="w-7 h-7 text-cyan-400" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-semibold text-white mb-6">
                    {role.title}
                  </h3>

                  {/* Features list */}
                  <ul className="space-y-3">
                    {role.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start text-slate-400 text-sm">
                        <span className="text-cyan-400 mr-2 mt-0.5">•</span>
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

export default Roles;
