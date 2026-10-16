'use client';

import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { GraduationCap, ShieldCheck } from 'lucide-react';

export interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface FooterSection {
  label: string;
  links: FooterLink[];
}

export interface FooterSectionProps {
  sections?: FooterSection[];
  brandName?: string;
  tagline?: string;
  className?: string;
}

// Clean Social SVG components
const LinkedInIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.53 1.53 0 1 0 0 3.06 1.53 1.53 0 0 0 0-3.06Z" />
  </svg>
);

const YouTubeIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="m10 15 5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73Z" />
  </svg>
);

const InstagramIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
);

const FacebookIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const defaultFooterLinks: FooterSection[] = [
  {
    label: 'Platform',
    links: [
      { title: 'Assessments', href: '/assessments' },
      { title: 'Coding Problems', href: '/problems' },
      { title: 'Campus Leaderboard', href: '/leaderboard' },
      { title: 'Student Dashboard', href: '/dashboard' },
    ],
  },
  {
    label: 'Preparation & Tracks',
    links: [
      { title: 'Data Structures & Algorithms', href: '/problems' },
      { title: 'Dynamic Programming', href: '/problems' },
      { title: 'Interview Evaluation', href: '/assessments' },
      { title: 'Campus Contests', href: '/contests' },
    ],
  },
  {
    label: 'Institutional & Legal',
    links: [
      { title: 'Help & Contact', href: '/contact' },
      { title: 'Privacy Policy', href: '/privacy' },
      { title: 'Terms of Examination', href: '/terms' },
      { title: 'Faculty / Controller Login', href: '/admin/login' },
    ],
  },
  {
    label: 'Connect & Community',
    links: [
      { title: 'LinkedIn', href: 'https://linkedin.com', icon: LinkedInIcon },
      { title: 'YouTube', href: 'https://youtube.com', icon: YouTubeIcon },
      { title: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
      { title: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
    ],
  },
];

export function FooterSectionView({
  sections = defaultFooterLinks,
  brandName = 'CodeSkill',
  tagline = 'Standardized examination portal and algorithmic skill-building platform engineered for developers, students, and technical evaluations.',
  className = '',
}: FooterSectionProps) {
  return (
    <footer
      className={`relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center rounded-t-3xl border-t border-border/70 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(200,16,46,0.12),transparent)] px-6 py-12 lg:py-16 ${className}`}
    >
      <div className="bg-primary/30 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-8 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-primary/30 shadow-xs flex items-center justify-center p-1.5 shrink-0 mt-0.5">
              <svg viewBox="0 0 160 160" className="w-full h-full" fill="none">
                <polygon
                  points="80,10 145,45 145,115 80,150 15,115 15,45"
                  fill="#0F172A"
                  stroke="#C8102E"
                  strokeWidth="8"
                  strokeLinejoin="round"
                />
                <path
                  d="M60 62 L40 80 L60 98"
                  stroke="#FFFFFF"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M85 55 L75 105"
                  stroke="#C8102E"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                <path
                  d="M100 62 L120 80 L100 98"
                  stroke="#38BDF8"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xl text-foreground tracking-tight">
                  {brandName}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  by Chandigarh University
                </span>
              </div>
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Department of Skill Development &amp; Lab</span>
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
            {tagline}
          </p>

          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 text-muted-foreground border border-border text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Proctored &amp; Verified Examination Infrastructure</span>
          </div>
        </AnimatedContainer>

        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {sections.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-8 md:mb-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {section.label}
                </h3>
                <ul className="text-muted-foreground mt-4 space-y-2.5 text-xs">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      {link.href.startsWith('http') ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground inline-flex items-center transition-all duration-300"
                        >
                          {link.icon && <link.icon className="me-1.5 size-3.5" />}
                          {link.title}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="hover:text-foreground inline-flex items-center transition-all duration-300"
                        >
                          {link.icon && <link.icon className="me-1.5 size-3.5" />}
                          {link.title}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>

      {/* Centered Full-Width Bottom Bar */}
      <div className="w-full pt-8 mt-12 border-t border-border/50 text-center flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} <span className="font-semibold text-foreground">{brandName}</span> • Department of Skill Development &amp; Lab, Chandigarh University. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>['className'];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
      whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default FooterSectionView;
