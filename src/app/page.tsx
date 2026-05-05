"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useRef } from "react";
import {
  Zap,
  Clock,
  RefreshCw,
  Shield,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Timer,
  Brain,
  Database,
  Star,
  Quote,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

function TrustBadge({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 rounded-full glass">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-innovation/20 to-brand-trust/20 flex items-center justify-center">
        <Zap className="w-4 h-4 text-brand-innovation" />
      </div>
      <span className="text-sm font-medium text-base-content/70 whitespace-nowrap">
        {name}
      </span>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const trustBadges = [
    "FERPA Compliant",
    "SOC 2 Certified",
    "COPPA Compliant",
    "256-bit Encryption",
    "99.9% Uptime",
    "GDPR Ready",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Header variant="landing" />

      <main className="flex-1">
        {/* Hero Section */}
        <section ref={heroRef} className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 mesh-bg" />
          
          {/* Floating Orbs */}
          <FloatingOrb className="w-[600px] h-[600px] bg-brand-innovation/20 -top-40 -right-40" delay={0} />
          <FloatingOrb className="w-[500px] h-[500px] bg-brand-trust/15 -bottom-20 -left-20" delay={2} />
          <FloatingOrb className="w-[300px] h-[300px] bg-brand-depth/10 top-1/2 right-1/4" delay={4} />
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />

          <motion.div
            style={{ y: heroY, opacity: heroOpacity }}
            className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28"
          >
            <motion.div
              className="max-w-4xl mx-auto text-center"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              {/* Badge */}
              <motion.div variants={fadeInUp}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass glow-sm mb-8">
                  <Sparkles className="w-4 h-4 text-brand-innovation icon-float" />
                  <span className="text-sm font-medium bg-gradient-to-r from-brand-innovation to-brand-trust bg-clip-text text-transparent">
                    Stop the Sunday Scaries
                  </span>
                  <ChevronRight className="w-4 h-4 text-brand-trust" />
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl sm:text-6xl lg:text-7xl font-display text-base-content leading-[1.1] mb-6"
              >
                Sync MagicSchool AI to GradeLink{" "}
                <span className="gradient-text text-glow">in One Click</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeInUp}
                className="text-xl sm:text-2xl text-base-content/60 mb-10 max-w-2xl mx-auto text-balance leading-relaxed"
              >
                Stop copying and pasting. GradeBridge automatically syncs your
                assignments, rubrics, and grades—so you can{" "}
                <span className="text-base-content font-medium">leave school at 3:30 PM</span>.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              >
                <Link href="/signup">
                  <Button 
                    variant="sync" 
                    size="lg" 
                    rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    className="group text-lg px-8 py-4"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-4 glass border-brand-innovation/20 hover:border-brand-innovation/40">
                    See How It Works
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-base-content/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-success" />
                  </div>
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-success" />
                  </div>
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-success" />
                  </div>
                  Cancel anytime
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

        </section>

        {/* Trust Badges Marquee */}
        <section className="py-8 border-y border-base-300/50 bg-base-200/30 overflow-hidden">
          <div className="marquee">
            <div className="marquee-content gap-6">
              {[...trustBadges, ...trustBadges].map((badge, i) => (
                <TrustBadge key={i} name={badge} />
              ))}
            </div>
          </div>
        </section>

        {/* Pain Point Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-base-100 via-base-200/50 to-base-100" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-brand-innovation uppercase tracking-wider mb-4">
                The Problem
              </span>
              <h2 className="text-4xl sm:text-5xl font-display text-base-content mb-6">
                Sound Familiar?
              </h2>
              <p className="text-xl text-base-content/60">
                You&apos;re drowning in tabs, copying data between systems, and spending
                your Sundays on admin work instead of with your family.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Brain,
                  title: "16 Tabs Open",
                  description:
                    "MagicSchool on the left, GradeLink on the right. Copy. Paste. Repeat. Until midnight.",
                  stat: "16+",
                  statLabel: "Average browser tabs",
                },
                {
                  icon: Timer,
                  title: "5+ Hours Wasted",
                  description:
                    "Every week, you spend hours manually transferring data that should sync automatically.",
                  stat: "5h",
                  statLabel: "Lost per week",
                },
                {
                  icon: Database,
                  title: "Double Data Entry",
                  description:
                    "You create beautiful AI-powered content, then rebuild it all again in your gradebook.",
                  stat: "2x",
                  statLabel: "The work you should do",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <div className="stat-card p-8 h-full">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-error/10 to-error/5 flex items-center justify-center">
                        <item.icon className="w-7 h-7 text-error" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-error">{item.stat}</div>
                        <div className="text-xs text-base-content/50">{item.statLabel}</div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-base-content mb-3">
                      {item.title}
                    </h3>
                    <p className="text-base-content/60 leading-relaxed">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 relative overflow-hidden">
          <FloatingOrb className="w-[400px] h-[400px] bg-brand-trust/10 top-0 right-0" delay={1} />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-brand-innovation uppercase tracking-wider mb-4">
                The Solution
              </span>
              <h2 className="text-4xl sm:text-5xl font-display text-base-content mb-6">
                One Click. Complete Sync.
              </h2>
              <p className="text-xl text-base-content/60">
                GradeBridge bridges the gap so you can focus on what matters—your students.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Instant Sync",
                  description:
                    "One click sends assignments, rubrics, and grades from MagicSchool AI directly to GradeLink.",
                  gradient: "from-brand-innovation to-brand-trust",
                },
                {
                  icon: RefreshCw,
                  title: "Smart Mapping",
                  description:
                    "Intelligent field mapping ensures your data lands exactly where it should in GradeLink.",
                  gradient: "from-brand-trust to-brand-depth",
                },
                {
                  icon: Clock,
                  title: "Time Saved Dashboard",
                  description:
                    "Watch your hours saved tick up. Know exactly how much time GradeBridge gives back.",
                  gradient: "from-success to-emerald-400",
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  description:
                    "Your data stays yours. Bank-level encryption and FERPA-compliant architecture.",
                  gradient: "from-brand-depth to-purple-500",
                },
                {
                  icon: Sparkles,
                  title: "Works with AI Content",
                  description:
                    "Seamlessly handles AI-generated rubrics, feedback, and assignment structures.",
                  gradient: "from-warning to-orange-400",
                },
                {
                  icon: CheckCircle,
                  title: "Real-Time Status",
                  description:
                    "Know exactly what synced, when, and catch any issues before they become problems.",
                  gradient: "from-info to-cyan-400",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="bento-card h-full group">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} p-[1px] mb-6`}
                    >
                      <div className="w-full h-full rounded-2xl bg-base-100 flex items-center justify-center group-hover:bg-transparent transition-colors duration-300">
                        <feature.icon className={`w-7 h-7 bg-gradient-to-br ${feature.gradient} bg-clip-text text-brand-innovation group-hover:text-white transition-colors duration-300`} />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-base-content mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-base-content/60 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 relative overflow-hidden bg-base-200/30">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-brand-innovation uppercase tracking-wider mb-4">
                How It Works
              </span>
              <h2 className="text-4xl sm:text-5xl font-display text-base-content mb-6">
                Three Simple Steps
              </h2>
              <p className="text-xl text-base-content/60">
                Reclaim your weekends in under 2 minutes.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connection Line */}
              <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-brand-innovation via-brand-trust to-brand-depth opacity-20" />
              
              {[
                {
                  step: "01",
                  title: "Connect Your Accounts",
                  description:
                    "Link your MagicSchool AI and GradeLink accounts securely with OAuth. Takes under 2 minutes.",
                  icon: Zap,
                },
                {
                  step: "02",
                  title: "Create Your Content",
                  description:
                    "Use MagicSchool AI as you normally would—assignments, rubrics, feedback, lesson plans.",
                  icon: Sparkles,
                },
                {
                  step: "03",
                  title: "Click Sync",
                  description:
                    "Hit the sync button. Watch your content appear in GradeLink instantly. Go home early.",
                  icon: RefreshCw,
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative"
                >
                  <div className="text-center">
                    {/* Step Number */}
                    <div className="relative inline-flex mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-innovation to-brand-trust p-[2px] glow">
                        <div className="w-full h-full rounded-2xl bg-base-100 flex items-center justify-center">
                          <item.icon className="w-8 h-8 text-brand-innovation" />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-brand-innovation text-white text-sm font-bold flex items-center justify-center shadow-lg">
                        {item.step}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-base-content mb-3">
                      {item.title}
                    </h3>
                    <p className="text-base-content/60 leading-relaxed max-w-xs mx-auto">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonial */}
        <section className="py-24 relative overflow-hidden">
          <FloatingOrb className="w-[500px] h-[500px] bg-brand-innovation/10 -bottom-40 -left-40" delay={3} />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="card-elevated p-10 sm:p-14 text-center relative overflow-hidden">
                {/* Background Quote */}
                <Quote className="absolute top-6 left-6 w-24 h-24 text-brand-innovation/5" />
                
                <div className="relative">
                  {/* Stars */}
                  <div className="flex items-center justify-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-warning fill-warning" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <blockquote className="text-2xl sm:text-3xl text-base-content mb-8 font-display italic leading-relaxed">
                    &ldquo;I used to spend my Sunday nights copying grades. Now I&apos;m watching
                    my son&apos;s soccer practice. GradeBridge gave me my weekends back.&rdquo;
                  </blockquote>
                  
                  {/* Author */}
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-innovation to-brand-trust p-[2px]">
                      <div className="w-full h-full rounded-full bg-base-200 flex items-center justify-center text-xl font-semibold text-brand-innovation">
                        SJ
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-base-content">Sarah J.</div>
                      <div className="text-sm text-base-content/60">6th Grade Teacher, Virginia</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 relative overflow-hidden bg-base-200/30">
          <div className="absolute inset-0 mesh-bg opacity-50" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="max-w-3xl mx-auto text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-block text-sm font-semibold text-brand-innovation uppercase tracking-wider mb-4">
                Pricing
              </span>
              <h2 className="text-4xl sm:text-5xl font-display text-base-content mb-6">
                Simple, Teacher-Friendly Pricing
              </h2>
              <p className="text-xl text-base-content/60">
                Less than a coffee a week. More time than you can imagine.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Personal Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
              >
                <div className="card-elevated p-8 h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-base-content mb-2">
                      Personal
                    </h3>
                    <p className="text-base-content/60">
                      Perfect for individual teachers
                    </p>
                  </div>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-base-content">$9</span>
                    <span className="text-base-content/60">/month</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {[
                      "Unlimited syncs",
                      "MagicSchool AI integration",
                      "GradeLink integration",
                      "Time-saved dashboard",
                      "Email support",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center gap-3 text-base-content/80">
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3 h-3 text-success" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block">
                    <Button variant="outline" className="w-full justify-center py-3">
                      Start Free Trial
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* School Plan */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <div className="relative">
                  {/* Gradient Border */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-innovation via-brand-trust to-brand-depth p-[2px]">
                    <div className="w-full h-full rounded-2xl bg-base-100" />
                  </div>
                  
                  <div className="relative card-elevated p-8 h-full border-0 bg-transparent">
                    {/* Badge */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-brand-innovation to-brand-trust text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                        Most Popular
                      </span>
                    </div>
                    
                    <div className="mb-6 pt-2">
                      <h3 className="text-2xl font-semibold text-base-content mb-2">
                        School
                      </h3>
                      <p className="text-base-content/60">
                        For schools and districts
          </p>
        </div>
                    <div className="mb-6">
                      <span className="text-5xl font-bold text-base-content">$7</span>
                      <span className="text-base-content/60">/teacher/month</span>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {[
                        "Everything in Personal",
                        "Admin dashboard",
                        "Usage analytics",
                        "Priority support",
                        "SSO integration",
                        "Invoice billing",
                      ].map((feature, index) => (
                        <li key={index} className="flex items-center gap-3 text-base-content/80">
                          <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                            <CheckCircle className="w-3 h-3 text-success" />
                          </div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link href="/contact" className="block">
                      <Button variant="sync" className="w-full justify-center py-3">
                        Contact Sales
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 relative overflow-hidden">
          <FloatingOrb className="w-[600px] h-[600px] bg-brand-innovation/15 top-0 left-1/2 -translate-x-1/2" delay={0} />
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-display text-base-content mb-6">
                Ready to Leave School at 3:30?
              </h2>
              <p className="text-xl text-base-content/60 mb-10 max-w-2xl mx-auto">
                Join thousands of teachers who&apos;ve already reclaimed their time.
                Start your free trial today—no credit card required.
              </p>
              <Link href="/signup">
                <Button 
                  variant="sync" 
                  size="lg" 
                  rightIcon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                  className="group text-lg px-10 py-5"
                >
                  Start Free Trial
                </Button>
              </Link>
            </motion.div>
        </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
