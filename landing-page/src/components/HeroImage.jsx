import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  BanknotesIcon, 
  DocumentTextIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/solid';

const HeroImage = () => {
  return (
    <section className="py-16 px-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/20 via-transparent to-lime-500/20 rounded-3xl blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative h-[500px] rounded-3xl bg-gradient-to-br from-teal-600/30 via-blue-900/40 to-slate-900/50 border border-cyan-500/30 backdrop-blur-xl overflow-hidden"
        >
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: `
                linear-gradient(to right, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Floating cards */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Pending claims card - top left */}
            <motion.div
              initial={{ opacity: 0, x: -100, y: -50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              animate={{ 
                y: [0, -10, 0],
                rotate: [-2, 0, -2]
              }}
              transition={{ 
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-12 left-12 p-4 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-cyan-500/50 backdrop-blur-md shadow-2xl shadow-cyan-500/20"
            >
              <p className="text-slate-400 text-xs mb-1">Pending claims</p>
              <p className="text-cyan-400 text-2xl font-bold">$12,480</p>
            </motion.div>

            {/* Approved today card - top right */}
            <motion.div
              initial={{ opacity: 0, x: 100, y: -50 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              animate={{ 
                y: [0, 10, 0],
                rotate: [2, 0, 2]
              }}
              transition={{ 
                y: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
              }}
              className="absolute top-12 right-12 p-4 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-lime-500/50 backdrop-blur-md shadow-2xl shadow-lime-500/20"
            >
              <p className="text-slate-400 text-xs mb-1">Approved today</p>
              <p className="text-lime-400 text-2xl font-bold">+184</p>
            </motion.div>

            {/* Center dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              animate={{ 
                rotateY: [0, 5, 0, -5, 0],
                scale: [1, 1.02, 1]
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative w-[500px] h-[300px] rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-cyan-500/40 backdrop-blur-lg shadow-2xl shadow-cyan-500/30 p-6"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Chart visualization */}
              <div className="flex items-end justify-between h-full gap-2">
                {[60, 80, 45, 90, 70, 85, 95].map((height, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-lime-400 rounded-t-lg origin-bottom"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Floating icons */}
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/4 left-1/4 w-16 h-16 rounded-xl bg-gradient-to-br from-lime-500/30 to-cyan-500/30 border border-lime-500/50 backdrop-blur-md flex items-center justify-center shadow-lg shadow-lime-500/20"
            >
              <BanknotesIcon className="w-8 h-8 text-lime-400" />
            </motion.div>

            <motion.div
              animate={{ 
                y: [0, 15, 0],
                rotate: [0, -10, 0]
              }}
              transition={{ 
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
              className="absolute bottom-1/4 right-1/4 w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border border-cyan-500/50 backdrop-blur-md flex items-center justify-center shadow-lg shadow-cyan-500/20"
            >
              <DocumentTextIcon className="w-8 h-8 text-cyan-400" />
            </motion.div>

            <motion.div
              animate={{ 
                y: [0, -15, 0],
                x: [0, 10, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-1/2 right-12 w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/30 to-cyan-500/30 border border-teal-500/50 backdrop-blur-md flex items-center justify-center shadow-lg shadow-teal-500/20"
            >
              <CheckCircleIcon className="w-7 h-7 text-teal-400" />
            </motion.div>

            {/* Glow orbs */}
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute bottom-20 left-20 w-24 h-24 bg-lime-500/40 rounded-full blur-2xl"
            />

            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute top-20 right-32 w-32 h-32 bg-cyan-500/40 rounded-full blur-2xl"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroImage;
