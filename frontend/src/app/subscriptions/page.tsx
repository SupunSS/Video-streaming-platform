'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiCheck,
  FiChevronRight,
  FiDownload,
  FiMonitor,
  FiPlayCircle,
  FiShield,
  FiSmartphone,
  FiStar,
  FiTv,
  FiUsers,
  FiWifi,
  FiZap,
} from 'react-icons/fi';
import { Navbar } from '@/components/layout/Navbar';

type PlanId = 'basic' | 'standard' | 'premium';

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  price: string;
  quality: string;
  resolution: string;
  devices: string;
  downloads: string;
  streams: string;
  cta: string;
  featured?: boolean;
  accent: string;
  glow: string;
  perks: string[];
};

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Simple streaming for everyday watching',
    price: '$7.99',
    quality: 'Good',
    resolution: '720p',
    devices: 'Phone, tablet, laptop, TV',
    downloads: '1 device',
    streams: '1 screen at a time',
    cta: 'Choose Basic',
    accent: 'from-sky-500 to-blue-700',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.18)]',
    perks: [
      'Unlimited movies and series',
      'Stream on any supported device',
      'Cancel whenever you want',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Balanced plan for most viewers',
    price: '$14.99',
    quality: 'Better',
    resolution: '1080p',
    devices: 'Phone, tablet, laptop, TV',
    downloads: '2 devices',
    streams: '2 screens at a time',
    cta: 'Choose Standard',
    featured: true,
    accent: 'from-cyan-400 via-blue-600 to-indigo-700',
    glow: 'shadow-[0_0_50px_rgba(56,189,248,0.2)]',
    perks: [
      'Full HD streaming',
      'Ideal for couples or small households',
      'Downloads on multiple devices',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Best quality for family and cinematic viewing',
    price: '$21.99',
    quality: 'Best',
    resolution: '4K + HDR',
    devices: 'Phone, tablet, laptop, TV',
    downloads: '6 devices',
    streams: '4 screens at a time',
    cta: 'Choose Premium',
    accent: 'from-violet-500 via-fuchsia-600 to-blue-700',
    glow: 'shadow-[0_0_50px_rgba(168,85,247,0.2)]',
    perks: [
      'Ultra HD cinematic experience',
      'Best for families and shared viewing',
      'Maximum flexibility across devices',
    ],
  },
];

const comparisonRows: Array<{
  label: string;
  icon: React.ReactNode;
  values: Record<PlanId, string>;
}> = [
  {
    label: 'Monthly price',
    icon: <FiZap className="size-4" />,
    values: {
      basic: '$7.99',
      standard: '$14.99',
      premium: '$21.99',
    },
  },
  {
    label: 'Video quality',
    icon: <FiStar className="size-4" />,
    values: {
      basic: 'Good',
      standard: 'Better',
      premium: 'Best',
    },
  },
  {
    label: 'Max resolution',
    icon: <FiMonitor className="size-4" />,
    values: {
      basic: '720p',
      standard: '1080p',
      premium: '4K + HDR',
    },
  },
  {
    label: 'Watch on your TV, computer, phone and tablet',
    icon: <FiTv className="size-4" />,
    values: {
      basic: 'Yes',
      standard: 'Yes',
      premium: 'Yes',
    },
  },
  {
    label: 'Simultaneous streams',
    icon: <FiUsers className="size-4" />,
    values: {
      basic: '1',
      standard: '2',
      premium: '4',
    },
  },
  {
    label: 'Downloads',
    icon: <FiDownload className="size-4" />,
    values: {
      basic: '1 device',
      standard: '2 devices',
      premium: '6 devices',
    },
  },
];

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: (id: PlanId) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(plan.id)}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative overflow-hidden rounded-3xl border text-left transition-all duration-300 ${
        selected
          ? 'border-white/25 bg-white/[0.08]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
      } ${plan.glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${plan.accent}`}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_45%)] opacity-60" />

      <div className="relative flex h-full flex-col p-6 md:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div
              className={`mb-3 inline-flex rounded-full border border-white/10 bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${plan.accent}`}
            >
              {plan.name}
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              {plan.name}
            </h3>
            <p className="mt-2 max-w-xs text-sm leading-6 text-white/65">
              {plan.tagline}
            </p>
          </div>

          {plan.featured ? (
            <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              Most Popular
            </span>
          ) : null}
        </div>

        <div className="mb-6">
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight text-white">
              {plan.price}
            </span>
            <span className="pb-1 text-sm text-white/50">/ month</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/60">
            <FiShield className="size-4" />
            Visual only · no payment flow yet
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
          <InfoRow label="Quality" value={plan.quality} />
          <InfoRow label="Resolution" value={plan.resolution} />
          <InfoRow label="Streaming" value={plan.streams} />
          <InfoRow label="Downloads" value={plan.downloads} />
          <InfoRow label="Devices" value={plan.devices} />
        </div>

        <div className="mt-6 space-y-3">
          {plan.perks.map((perk) => (
            <div key={perk} className="flex items-start gap-3 text-sm text-white/75">
              <span className="mt-0.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 p-1 text-emerald-300">
                <FiCheck className="size-3.5" />
              </span>
              <span>{perk}</span>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div
            className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3.5 font-semibold text-white transition-all duration-300 ${plan.accent}`}
          >
            {selected ? 'Selected Plan' : plan.cta}
            <FiChevronRight className="size-4" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-right text-sm font-medium text-white/90">{value}</span>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('standard');

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) ?? plans[1],
    [selectedPlan],
  );

  return (
    <main className="min-h-screen bg-cyber-gradient text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.14),transparent_28%),linear-gradient(to_bottom,rgba(0,0,0,0.25),transparent)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-sm text-white/70 backdrop-blur-xl">
              <FiPlayCircle className="size-4 text-cyan-300" />
              Upgrade your FLUX experience
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Choose the plan that fits your
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                {' '}
                streaming style
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              A visual-only subscription screen inspired by modern streaming plan pages:
              clear pricing, simple comparisons, and a premium cinematic feel that matches
              FLUX.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
              <Pill icon={<FiCheck className="size-4" />} text="Cancel anytime" />
              <Pill icon={<FiWifi className="size-4" />} text="Stream on all devices" />
              <Pill icon={<FiShield className="size-4" />} text="No payment integration yet" />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
            >
              <PlanCard
                plan={plan}
                selected={selectedPlan === plan.id}
                onSelect={setSelectedPlan}
              />
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-white/10 px-6 py-5 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">
                  Plan comparison
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
                  Compare plans at a glance
                </h2>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  Current selection
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {activePlan.name}{' '}
                  <span className="text-sm font-normal text-white/50">
                    · {activePlan.price}/month
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] border-b border-white/10 bg-white/[0.03]">
                <div className="px-6 py-4 text-sm font-medium text-white/45 md:px-8">
                  Features
                </div>

                {plans.map((plan) => {
                  const isSelected = plan.id === selectedPlan;

                  return (
                    <div
                      key={plan.id}
                      className={`px-6 py-4 text-center md:px-8 ${
                        isSelected ? 'bg-white/[0.04]' : ''
                      }`}
                    >
                      <div
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          isSelected
                            ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200'
                            : 'border-white/10 bg-white/[0.04] text-white/70'
                        }`}
                      >
                        {plan.name}
                      </div>
                    </div>
                  );
                })}
              </div>

              {comparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.6fr_repeat(3,minmax(0,1fr))] border-b border-white/8 last:border-b-0"
                >
                  <div className="flex items-center gap-3 px-6 py-5 text-sm text-white/70 md:px-8">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/60">
                      {row.icon}
                    </span>
                    <span>{row.label}</span>
                  </div>

                  {plans.map((plan) => {
                    const selected = plan.id === selectedPlan;
                    return (
                      <div
                        key={`${row.label}-${plan.id}`}
                        className={`px-6 py-5 text-center text-sm ${
                          selected ? 'bg-white/[0.03] text-white' : 'text-white/70'
                        }`}
                      >
                        {row.values[plan.id]}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="glass-card p-6 md:p-8"
          >
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">
              What you get
            </p>
            <h3 className="mt-3 text-2xl font-bold text-white">
              Premium visuals without backend logic yet
            </h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              This page is currently presentation-only. It is meant to establish the
              subscription UX, hierarchy, and theme before wiring payment providers,
              entitlements, plan persistence, or account billing flows.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<FiSmartphone className="size-5" />}
                title="Responsive layout"
                text="Designed to feel premium on desktop and still read clearly on smaller screens."
              />
              <FeatureCard
                icon={<FiMonitor className="size-5" />}
                title="Streaming-first layout"
                text="Large hero, strong plan cards, and a feature matrix like modern OTT products."
              />
              <FeatureCard
                icon={<FiTv className="size-5" />}
                title="Brand aligned"
                text="Uses FLUX’s dark glass aesthetic, gradients, rounded surfaces, and cinematic spacing."
              />
              <FeatureCard
                icon={<FiShield className="size-5" />}
                title="Safe to ship visually"
                text="No checkout, no API calls, and no subscriptions are created yet."
              />
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.45 }}
            className="glass-card p-6 md:p-8"
          >
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">Preview CTA</p>
            <h3 className="mt-3 text-2xl font-bold text-white">
              Continue with {activePlan.name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-white/65">
              This is a visual-only button. Later, you can connect it to Stripe, a billing
              modal, or an account upgrade flow.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/55">Selected plan</span>
                <span className="text-sm font-semibold text-white">{activePlan.name}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-white/55">Monthly price</span>
                <span className="text-2xl font-black text-white">{activePlan.price}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-white/55">Streaming</span>
                <span className="text-sm text-white/85">{activePlan.streams}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-white/55">Max quality</span>
                <span className="text-sm text-white/85">{activePlan.resolution}</span>
              </div>
            </div>

            <button
              type="button"
              className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r px-4 py-3.5 font-semibold text-white ${activePlan.accent}`}
            >
              Continue
              <FiChevronRight className="size-4" />
            </button>

            <p className="mt-4 text-center text-xs leading-6 text-white/45">
              By continuing, this page would normally lead to checkout or account upgrade.
              For now, it is static UI only.
            </p>
          </motion.aside>
        </div>
      </section>
    </main>
  );
}

function Pill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 backdrop-blur-xl">
      <span className="text-cyan-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 p-2.5 text-cyan-200">
        {icon}
      </div>
      <h4 className="text-base font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-white/60">{text}</p>
    </div>
  );
}