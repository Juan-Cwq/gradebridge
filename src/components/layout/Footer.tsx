"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Heart, ArrowUpRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: "#features", label: "Features" },
      { href: "#pricing", label: "Pricing" },
      { href: "#how-it-works", label: "How It Works" },
      { href: "/changelog", label: "Changelog" },
    ],
    support: [
      { href: "/help", label: "Help Center" },
      { href: "/contact", label: "Contact Us" },
      { href: "/status", label: "System Status" },
      { href: "/docs", label: "Documentation" },
    ],
    company: [
      { href: "/about", label: "About Us" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press Kit" },
    ],
    legal: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/security", label: "Security" },
      { href: "/compliance", label: "Compliance" },
    ],
  };

  return (
    <footer className="relative bg-base-200/50 border-t border-base-300/50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-6 group w-fit">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-innovation to-brand-trust flex items-center justify-center shadow-lg shadow-brand-innovation/20"
              >
                <Zap className="w-5 h-5 text-white" />
              </motion.div>
              <span className="font-display text-xl text-base-content group-hover:text-brand-innovation transition-colors">
                GradeBridge
              </span>
            </Link>
            <p className="text-sm text-base-content/60 max-w-xs mb-6 leading-relaxed">
              The seamless bridge between MagicSchool AI and GradeLink.
              Helping teachers reclaim their time, one sync at a time.
            </p>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2">
              {["FERPA", "SOC 2", "COPPA"].map((badge) => (
                <span
                  key={badge}
                  className="text-xs font-medium px-2.5 py-1 rounded-full bg-base-300/50 text-base-content/60"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="font-semibold text-base-content mb-4 text-sm uppercase tracking-wider">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-base-content/60 hover:text-brand-innovation transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base-content mb-4 text-sm uppercase tracking-wider">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-base-content/60 hover:text-brand-innovation transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base-content mb-4 text-sm uppercase tracking-wider">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-base-content/60 hover:text-brand-innovation transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base-content mb-4 text-sm uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-base-content/60 hover:text-brand-innovation transition-colors inline-flex items-center gap-1 group"
                  >
                    {link.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-base-300/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-base-content/50">
            &copy; {currentYear} GradeBridge. All rights reserved.
          </p>
          <p className="text-sm text-base-content/50 flex items-center gap-1.5">
            Made with <Heart className="w-4 h-4 text-error fill-error" /> for educators everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
