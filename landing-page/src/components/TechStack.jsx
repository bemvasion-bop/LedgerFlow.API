import { motion } from 'framer-motion';

const technologies = [
  {
    name: 'ASP.NET Core',
    description: 'Web API backend',
  },
  {
    name: 'React',
    description: 'Frontend interface',
  },
  {
    name: 'SQL Server',
    description: 'Database engine',
  },
  {
    name: 'JWT',
    description: 'Token authentication',
  },
  {
    name: 'LLM',
    description: 'AI-assisted insights',
  },
  {
    name: 'REST APIs',
    description: 'Scalable architecture',
  },
];

const TechStack = () => {
  return (
    <section id="tech" className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl" />

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
            TECHNOLOGY
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Engineered on a stack{' '}
            <span className="text-lime-400">businesses trust.</span>
          </h2>
        </motion.div>

        {/* Tech grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-sm hover:border-lime-500/50 transition-all duration-300">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-lime-500/0 to-cyan-500/0 group-hover:from-lime-500/10 group-hover:to-cyan-500/10 transition-all duration-300" />
                
                <div className="relative z-10 text-center">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {tech.name}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {tech.description}
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

export default TechStack;
