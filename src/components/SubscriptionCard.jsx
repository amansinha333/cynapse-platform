import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';

const PLANS = [
  {
    id: 'seed',
    name: 'Seed',
    price: 29,
    period: '/mo',
    description: 'Perfect for early-stage startups and solo founders.',
    icon: Zap,
    color: 'from-slate-500 to-slate-700',
    glowColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(148, 163, 184, 0.2)',
    features: [
      '5 Feature Audits / month',
      '1 AI Model (Gemini Flash)',
      'Basic Compliance Reports',
      'Email Support',
      '1 Team Member',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 99,
    period: '/mo',
    description: 'For scaling teams that need real-time compliance intelligence.',
    icon: Sparkles,
    color: 'from-indigo-500 via-violet-500 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
    features: [
      'Unlimited Feature Audits',
      'All AI Models (Flash + Pro)',
      'Advanced Compliance Dashboard',
      'Pinecone RAG Integration',
      'Priority Support',
      'Up to 10 Team Members',
      'Custom Document Upload',
    ],
    cta: 'Upgrade Now',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    period: '/mo',
    description: 'Full-scale compliance infrastructure for global organizations.',
    icon: Crown,
    color: 'from-amber-500 via-orange-500 to-red-500',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    features: [
      'Everything in Growth',
      'Dedicated AI Model Fine-tuning',
      'SOC 2 & ISO 27001 Reports',
      'Custom Integrations (Slack, Jira)',
      'SLA-backed 24/7 Support',
      'Unlimited Team Members',
      'On-premise Deployment Option',
      'Audit Trail & Data Retention',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function SubscriptionCard() {
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('growth');

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-extrabold tracking-tight font-['Manrope',_sans-serif]">
          <span className="gradient-text">Choose Your Plan</span>
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Scale your compliance intelligence with the plan that fits your team. All plans include a 14-day free trial.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan, index) => {
          const Icon = plan.icon;
          const isHovered = hoveredPlan === plan.id;
          const isSelected = selectedPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              whileHover={{ y: -8, scale: 1.02 }}
              onHoverStart={() => setHoveredPlan(plan.id)}
              onHoverEnd={() => setHoveredPlan(null)}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl p-[1px] cursor-pointer transition-all duration-300 card-shine overflow-hidden ${
                plan.popular ? 'md:-mt-4 md:mb-4' : ''
              }`}
              style={{
                background: isHovered || isSelected
                  ? `linear-gradient(135deg, ${plan.borderColor}, transparent 60%)`
                  : 'transparent',
                boxShadow: isHovered
                  ? `0 20px 60px ${plan.glowColor}, 0 0 80px ${plan.glowColor}`
                  : '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                >
                  <span className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-indigo-200">
                    Most Popular
                  </span>
                </motion.div>
              )}

              <div className={`glass-card rounded-2xl p-6 h-full flex flex-col ${plan.popular ? 'pt-8' : ''}`}>
                {/* Icon + Plan Name */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    animate={isHovered ? { rotateY: 15, scale: 1.1 } : { rotateY: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${plan.color} shadow-lg`}
                  >
                    <Icon size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Tier</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white font-['Manrope',_sans-serif]">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-slate-400 font-bold">{plan.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{plan.description}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 + i * 0.05 }}
                      className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br ${plan.color}`}>
                        <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.popular
                      ? 'text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                      : 'text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  style={plan.popular ? {
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)',
                  } : {}}
                >
                  {plan.cta}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-400 mt-8">
        All plans include SSL encryption, GDPR compliance, and 99.9% uptime SLA. Cancel anytime.
      </p>
    </div>
  );
}
