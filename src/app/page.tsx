import Link from 'next/link';
import { Activity, BarChart2, ShieldCheck, CheckCircle, Zap, ArrowRight } from 'lucide-react';
import { TypewriterText } from '@/components/TypewriterText';

export default function Home() {
  return (
    <div className="text-slate-900">

      {/* ───── HERO ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden section-emerald pt-28 pb-24 px-6">
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />
        {/* Soft radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-emerald-200/30 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Label pill */}
          <div className="section-label mx-auto w-fit mb-8 animate-fade-in-up">
            <span className="flex size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            InVolution 1.1 — AI-Powered Investment Platform
          </div>

          <h1 className="text-5xl md:text-[4.5rem] font-extrabold tracking-tight leading-[1.08] mb-6 font-outfit text-slate-900 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Where Visionary <span className="text-gradient">Startups</span><br />
            Meet Strategic <span className="text-gradient">Investors</span>
          </h1>
          <span className="block divider-emerald mx-auto mb-6" />

          <p className="max-w-2xl mx-auto text-lg text-slate-500 mb-10 leading-relaxed font-medium">
            <TypewriterText 
              text="Automated KYC · AI Due Diligence · Verifiable Financial Metrics. The secure deal-flow platform built for serious capital." 
              delay={0.3} 
              highlightWords={["KYC", "AI", "Verifiable", "secure"]}
            />
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/login" className="btn-primary text-sm">Get Started &rarr;</Link>
            <Link href="/about" className="btn-secondary text-sm flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span> Watch Demo
            </Link>
          </div>

          {/* Floating metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Investability Score', value: '88 / 100', icon: <BarChart2 className="size-4 text-emerald-600" />, sub: '↑ Strong' },
              { label: 'Trust Tier', value: 'PLATINUM', icon: <ShieldCheck className="size-4 text-emerald-600" />, sub: '✓ Verified' },
              { label: 'Health Score', value: '98 / 100', icon: <Activity className="size-4 text-emerald-600" />, sub: '↑ Stable' },
              { label: 'Match Accuracy', value: '99.9%', icon: <Zap className="size-4 text-emerald-600" />, sub: 'AI Powered' },
            ].map((c, i) => (
              <div key={i} className="dashboard-card p-4 text-left">
                <div className="flex items-center gap-1.5 mb-2">{c.icon}<span className="text-[11px] text-slate-400 font-medium">{c.label}</span></div>
                <p className="text-lg font-bold text-slate-800 metric-value leading-tight">{c.value}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── BROWSER MOCK + STATS ──────────────────────────── */}
      <section className="section-light border-t border-slate-100 px-6 py-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-center">
          {/* Left: Browser window mockup */}
          <div className="lg:w-3/5 w-full">
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.1)]">
              {/* Chrome bar */}
              <div className="h-9 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-red-300/80"></div>
                  <div className="size-2.5 rounded-full bg-amber-300/80"></div>
                  <div className="size-2.5 rounded-full bg-emerald-400/80"></div>
                </div>
                <div className="mx-auto w-56 h-5 bg-slate-200 rounded-full text-[9px] flex items-center justify-center text-slate-400 font-mono">app.involution.in/dashboard</div>
              </div>
              {/* Dashboard inside */}
              <div className="bg-white p-6">
                {/* Top stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: 'Capital Deployed', value: '₹ 4.50 Cr', delta: '+14.2%' },
                    { label: 'Active Deals', value: '12', delta: '+3 this week' },
                    { label: 'Avg AI Score', value: '94 / 100', delta: '+2.1%' },
                  ].map((s, i) => (
                    <div key={i} className="tint-card p-4">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1 tracking-wide">{s.label}</p>
                      <p className="text-xl font-bold text-slate-800 metric-value">{s.value}</p>
                      <p className="text-[11px] text-emerald-600 font-semibold mt-1">{s.delta}</p>
                    </div>
                  ))}
                </div>
                {/* Chart */}
                <div className="h-32 relative rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                  <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="size-full absolute inset-0">
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,36 L10,34 L20,30 L30,16 L40,24 L50,8 L60,12 L70,4 L80,13 L90,6 L100,2 L100,40 L0,40 Z" fill="url(#g1)" />
                    <path d="M0,36 L10,34 L20,30 L30,16 L40,24 L50,8 L60,12 L70,4 L80,13 L90,6 L100,2" fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="absolute bottom-2 left-3 text-[9px] text-slate-300 font-mono">Revenue trend — 12 months</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Key differentiators */}
          <div className="lg:w-2/5 space-y-5">
            <div className="section-label">Why InVolution</div>
            <h2 className="text-3xl font-bold text-slate-900 font-outfit leading-tight mt-3">
              A platform built around <span className="text-gradient">trust & data</span>
            </h2>
            <span className="block divider-emerald" />
            <div className="space-y-4 mt-2">
              {[
                { title: 'Verified Deal Flow', body: 'Every startup and investor is KYC-verified through Aadhaar & PAN validation before entering the platform.' },
                { title: 'AI Risk Intelligence', body: 'Gemini AI analyzes 42+ signals to generate an Investability Score, Trust Tier, and Compliance Flag.' },
                { title: 'Encrypted Deal Room', body: '5-phase investment lifecycle with PII masking, meeting scheduler, and legally binding smart agreements.' },
              ].map((f, i) => (
                <div key={i} className="accent-card py-4 pr-4">
                  <p className="text-sm font-bold text-slate-800 mb-1">{f.title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── HEALTH MONITOR ────────────────────────────────── */}
      <section className="section-muted border-t border-slate-100 px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="section-label mx-auto w-fit mb-5">
              <Activity className="size-3.5" /> Startup Health Monitor
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-outfit">
              <TypewriterText text="Real-time startup vitals at a glance" />
            </h2>
            <span className="block divider-emerald mx-auto mt-3" />
            <p className="text-slate-500 mt-4 max-w-lg mx-auto text-sm">
              <TypewriterText text="AI monitors 6 financial dimensions and flags critical risks before investors find them." delay={0.2} />
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Burn Rate', value: '$42k', sub: '/mo', delta: '↓ 5%', bar: 65, good: true },
              { label: 'Runway', value: '18 Mo', sub: '', delta: '+2mo', bar: 75, good: true },
              { label: 'Revenue', value: '$125k', sub: 'ARR', delta: '+15%', bar: 85, good: true },
              { label: 'Churn', value: '2.4%', sub: '', delta: '↓ 0.1%', bar: 24, good: false },
              { label: 'Gross Margin', value: '68%', sub: '', delta: '+2%', bar: 68, good: true },
              { label: 'Growth', value: '12%', sub: 'MoM', delta: '+3%', bar: 72, good: true },
            ].map((m, i) => (
              <div key={i} className="dashboard-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-600">{m.label}</span>
                  <span className={m.good ? 'badge-emerald' : 'badge-red'}>{m.delta}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-slate-800 metric-value">{m.value}</span>
                  <span className="text-xs text-slate-400">{m.sub}</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.good ? 'bg-emerald-400' : 'bg-rose-400'}`}
                    style={{ width: `${m.bar}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── AI DUE DILIGENCE ──────────────────────────────── */}
      <section className="section-light border-t border-slate-100 px-6 py-20">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-14">
          {/* Left */}
          <div className="lg:w-1/2 space-y-5">
            <div className="section-label">
              <ShieldCheck className="size-3.5" /> AI Due Diligence
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-outfit leading-tight">
              Automated deep-dive<br /><span className="text-gradient">before you commit capital</span>
            </h2>
            <span className="block divider-emerald" />
            <p className="text-slate-500 text-sm leading-relaxed min-h-[60px]">
              <TypewriterText 
                text="Our AI engine analyzes 42+ data points — market opportunity, competitive moat, business model, team credibility — and delivers a full Investability Report with flag summaries." 
                highlightWords={["AI", "Investability", "Report"]}
              />
            </p>
            <div className="space-y-2.5 pt-1">
              {['Market Opportunity · Strong Fit', 'Competitive Moat · Proprietary IP', 'Business Model · Scalable SaaS'].map((l, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle className="size-4 text-emerald-500 shrink-0" /> {l}
                </div>
              ))}
            </div>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-sm mt-2">
              View Demo Report <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Right: Score + Trust stack */}
          <div className="lg:w-1/2 space-y-4">
            {/* Score card */}
            <div className="tint-card p-7 flex items-center gap-7">
              <div className="relative size-28 shrink-0">
                <svg className="size-full -rotate-90">
                  <circle cx="56" cy="56" r="46" strokeWidth="7" fill="transparent" stroke="#e2e8f0" />
                  <circle cx="56" cy="56" r="46" strokeWidth="7" fill="transparent"
                    strokeDasharray="289" strokeDashoffset="52"
                    stroke="#10b981" strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-800">88</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Score</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Investability Score</p>
                <p className="text-xl font-bold text-emerald-600">Strong Fit</p>
                <p className="text-xs text-slate-400 mt-1">Top 4% of its vertical this quarter</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <span className="badge-emerald">Strong Growth</span>
                  <span className="badge-emerald">Capital Efficient</span>
                </div>
              </div>
            </div>

            {/* Trust card */}
            <div className="dashboard-card p-5 flex items-center gap-5">
              <div className="size-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Trust Score</p>
                <p className="text-xl font-black text-slate-800 tracking-widest">PLATINUM</p>
                <p className="text-xs text-slate-400 mt-1">Verified status · assets confirmed for current fiscal year.</p>
              </div>
            </div>

            {/* Financial row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'MRR Growth', value: '+24.5%' },
                { label: 'LTV/CAC', value: '4.2x' },
                { label: 'Efficiency', value: '92/100' },
              ].map((m, i) => (
                <div key={i} className="dashboard-card p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-medium mb-1">{m.label}</p>
                  <p className="text-base font-bold text-emerald-600 metric-value">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── CTA ───────────────────────────────────────────── */}
      <section className="section-emerald border-t border-slate-100 py-24 px-6 text-center">
        <div className="relative max-w-2xl mx-auto">
          <div className="section-label mx-auto w-fit mb-6">Join the Platform</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 font-outfit mb-4">
            Ready to  <span className="text-gradient">your deal flow?</span>
          </h2>
          <span className="block divider-emerald mx-auto mb-6" />
          <p className="text-slate-500 text-sm mb-10 h-6">
            <TypewriterText text="Join 100+ startups and investors already using InVolution to close better deals, faster." delay={0.1} />
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-primary inline-block">Invest Now</Link>
            <Link href="/startups/publish" className="btn-secondary inline-block">Publish Startup</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
