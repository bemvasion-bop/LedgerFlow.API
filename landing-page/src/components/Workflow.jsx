import { motion } from 'framer-motion';
import { 
  ArrowUpTrayIcon, 
  PaperAirplaneIcon, 
  CheckBadgeIcon,
  BanknotesIcon 
} from '@heroicons/react/24/outline';

const steps = [
  {
    number: '1',
    icon: ArrowUpTrayIcon,
    title: 'Submit',
    description: 'Employee uploads receipts and submits claim with category & amount.',
  },
  {
    number: '2',
    icon: PaperAirplaneIcon,
    title: 'Route',
    description: 'Request automatically routes through approval chain with comments.',
  },
  {
    number: '3',
    icon: CheckBadgeIcon,
    title: 'Approve',
    description: 'Finance validates details and approves for reimbursement.',
  },
  {
    number: '4',
    icon: BanknotesIcon,
    title: 'Reimburse',
    description: 'Payment processed, status updated, employee notified instantly.',
  },
];

const Workflow = () => {
  return (
    <section id="workflow" className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <p className="text-cyan-400 text-sm font-semibold tracking-wider uppercase mb-4">
            WORKFLOW
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            From receipt to reimbursement{' '}
            <span className="text-cyan-400">in four steps.</span>
          </h2>
        </motion.div>

        {/* Workflow steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent transform -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Number badge */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative mb-6"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 flex items-center justify-center relative z-10">
                      <step.icon className="w-8 h-8 text-cyan-400" />
                    </div>
                    {/* Number badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 text-slate-900 font-bold text-sm flex items-center justify-center border-2 border-slate-950">
                      {step.number}
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 -right-8 text-cyan-500/30">
                    <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
                      <path
                        d="M0 10 L50 10 M50 10 L45 5 M50 10 L45 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workflow;
