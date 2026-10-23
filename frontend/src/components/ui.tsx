import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/** The strip of sticky tape that holds a letter or keepsake to the page. Purely decorative. */
export const Tape: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`absolute -top-3 h-6 w-28 bg-tape/70 shadow-sm ${className}`}
    style={{ transform: 'rotate(-3deg)' }}
  />
);

/** Every page starts the same way: a small caps line, a big serif title, a quiet subtitle. */
export const PageHeader: React.FC<{ eyebrow: string; title: React.ReactNode; subtitle?: React.ReactNode }> = ({
  eyebrow,
  title,
  subtitle,
}) => (
  <header className="flex flex-col gap-2 animate-fade-in">
    <span className="eyebrow">{eyebrow}</span>
    <h1 className="font-display text-5xl font-normal leading-[1.05] text-ink sm:text-6xl">{title}</h1>
    {subtitle && <p className="max-w-2xl text-base text-ink-soft">{subtitle}</p>}
  </header>
);

/** Three ink dots that rise and fall: "someone is thinking / remembering". */
export const InkDots: React.FC = () => (
  <span aria-hidden="true" className="inline-flex gap-1.5">
    {[0, 1, 2].map((i) => (
      <span key={i} className="h-1.5 w-1.5 rounded-full bg-oxblood animate-ink-dot" style={{ animationDelay: `${i * 0.18}s` }} />
    ))}
  </span>
);

/** A clear, inline error note in the house style. */
export const Notice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p role="alert" className="px-4 py-3 text-sm border rounded-lg border-oxblood/30 bg-oxblood/5 text-oxblood-deep">
    {children}
  </p>
);


/** Shown on a page that needs a person when nobody has been added to the archive yet. */
export const NeedsPerson: React.FC<{ what: string }> = ({ what }) => (
  <div className="relative max-w-2xl pt-10 bg-card px-7 pb-7 shadow-letter animate-settle sm:px-10">
    <Tape className="left-12" />
    <span className="eyebrow">First, a person</span>
    <p className="mt-2 text-3xl leading-snug font-display text-ink">Who are we remembering?</p>
    <p className="mt-3 text-ink-soft">Add someone to the family archive before {what}.</p>
    <Link to="/family" className="mt-6 btn-ink">
      Add someone <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
);