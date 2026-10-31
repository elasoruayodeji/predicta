// ============================================================
// Public Landing Page - Professional Financial Intelligence Platform
// ============================================================
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { 
  TrendingUp, BarChart3, Brain, Shield, Zap, Target, 
  ArrowRight, CheckCircle2, LineChart, PieChart, 
  Activity, AlertTriangle, Calendar, BookOpen, Calculator,
  Lock, LucideIcon
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { isConfigured } = useAuth();

  const handleGetStarted = () => {
    onNavigate('auth?mode=signup');
  };

  const handleSignIn = () => {
    onNavigate('auth?mode=signin');
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent-blue)] to-blue-600 flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--color-text-primary)]">PREDICTA</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Features</a>
              <a href="#analytics" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Analytics</a>
              <a href="#security" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">Security</a>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button variant="primary" size="sm" onClick={handleGetStarted}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-accent-blue)]/5 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/20 mb-8">
              <Zap size={14} className="text-[var(--color-accent-blue)]" />
              <span className="text-xs font-medium text-[var(--color-accent-blue)]">AI-Powered Financial Intelligence</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--color-text-primary)] mb-6 leading-tight">
              Smart Investing Starts with
              <span className="block bg-gradient-to-r from-[var(--color-accent-blue)] to-blue-400 bg-clip-text text-transparent">
                Better Insights
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] mb-10 max-w-3xl mx-auto leading-relaxed">
              PREDICTA combines advanced AI forecasting, real-time market analytics, and professional-grade research tools 
              to help you make smarter investment decisions on the Nigerian Exchange.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="primary" size="lg" onClick={handleGetStarted} className="w-full sm:w-auto">
                Start Free Trial
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => onNavigate('demo')} className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mt-6">
              No credit card required • Free for individual investors
            </p>
          </div>

          {/* Hero Visual - Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-2xl p-6 shadow-2xl">
              {/* Mock Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Market Overview Card */}
                <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-5 border border-[var(--color-border-primary)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Market Overview</h3>
                    <Activity size={16} className="text-[var(--color-accent-blue)]" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">NGX ASI</span>
                      <span className="text-sm font-mono text-[var(--color-positive)]">+2.4%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">Volume</span>
                      <span className="text-sm font-mono text-[var(--color-text-primary)]">₦4.2B</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">Active Stocks</span>
                      <span className="text-sm font-mono text-[var(--color-text-primary)]">146</span>
                    </div>
                  </div>
                </div>

                {/* Forecast Card */}
                <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-5 border border-[var(--color-border-primary)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">AI Forecast</h3>
                    <Brain size={16} className="text-[var(--color-forecast)]" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">DANGCEM</span>
                      <span className="text-sm font-mono text-[var(--color-positive)]">↑ 8.2%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">GTCO</span>
                      <span className="text-sm font-mono text-[var(--color-positive)]">↑ 5.7%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">MTNN</span>
                      <span className="text-sm font-mono text-[var(--color-negative)]">↓ 2.1%</span>
                    </div>
                  </div>
                </div>

                {/* Portfolio Card */}
                <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-5 border border-[var(--color-border-primary)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Portfolio</h3>
                    <PieChart size={16} className="text-[var(--color-positive)]" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">Total Value</span>
                      <span className="text-sm font-mono text-[var(--color-text-primary)]">₦2.4M</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">Today's P&L</span>
                      <span className="text-sm font-mono text-[var(--color-positive)]">+₦45.2K</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-muted)]">Holdings</span>
                      <span className="text-sm font-mono text-[var(--color-text-primary)]">12</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--color-accent-blue)]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--color-forecast)]/10 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Everything You Need to Invest with Confidence
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Professional-grade tools designed specifically for the Nigerian market
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: 'AI-Powered Forecasts',
                description: 'Advanced machine learning models analyze market patterns and generate probabilistic price forecasts with confidence intervals.',
                color: 'var(--color-forecast)',
              },
              {
                icon: BarChart3,
                title: 'Real-Time Analytics',
                description: 'Live market data, technical indicators, and comprehensive analytics for all 146 NGX-listed equities.',
                color: 'var(--color-accent-blue)',
              },
              {
                icon: Target,
                title: 'Smart Screener',
                description: 'Filter stocks by fundamentals, technicals, and liquidity. Save custom screens and get instant results.',
                color: 'var(--color-positive)',
              },
              {
                icon: PieChart,
                title: 'Portfolio Tracking',
                description: 'Track holdings, calculate returns, monitor allocation, and analyze performance with detailed analytics.',
                color: 'var(--color-warning)',
              },
              {
                icon: Calculator,
                title: 'Valuation Workbench',
                description: 'DCF, DDM, and multiples-based valuation models with sensitivity analysis and scenario planning.',
                color: 'var(--color-accent-blue)',
              },
              {
                icon: AlertTriangle,
                title: 'Anomaly Detection',
                description: 'Automated detection of unusual price movements, volume spikes, and market anomalies.',
                color: 'var(--color-negative)',
              },
              {
                icon: Calendar,
                title: 'Investment Calendar',
                description: 'Track dividends, AGMs, earnings releases, and corporate actions. Never miss important dates.',
                color: 'var(--color-forecast)',
              },
              {
                icon: BookOpen,
                title: 'Investment Journal',
                description: 'Document your investment thesis, track decisions, and learn from past performance.',
                color: 'var(--color-positive)',
              },
              {
                icon: LineChart,
                title: 'Technical Analysis',
                description: 'Professional candlestick charts with RSI, MACD, moving averages, and 20+ technical indicators.',
                color: 'var(--color-accent-blue)',
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6 hover:border-[var(--color-accent-blue)]/30 transition-all duration-300"
              >
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `color-mix(in srgb, ${feature.color} 10%, transparent)` }}
                >
                  <feature.icon size={24} style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section id="analytics" className="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--color-bg-secondary)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-6">
                Professional-Grade Analytics for Every Investor
              </h2>
              <p className="text-lg text-[var(--color-text-secondary)] mb-8">
                From individual stock analysis to portfolio optimization, PREDICTA provides the tools 
                and insights you need to make informed investment decisions.
              </p>

              <div className="space-y-4">
                {[
                  'Walk-forward backtesting with chronological validation',
                  'Liquidity analysis and tradability scoring',
                  'Corporate actions processing and dividend tracking',
                  'Risk metrics including VaR and drawdown analysis',
                  'Sector rotation and market breadth indicators',
                  'Custom alerts for price, volume, and fundamental changes',
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[var(--color-positive)] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Stock Analysis</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">DANGCEM</span>
                </div>
                
                {/* Mock Chart */}
                <div className="h-48 bg-[var(--color-bg-secondary)] rounded-lg mb-4 flex items-end justify-around p-4">
                  {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85].map((height, i) => (
                    <div
                      key={i}
                      className="w-8 bg-gradient-to-t from-[var(--color-accent-blue)] to-[var(--color-accent-blue)]/50 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Current Price</p>
                    <p className="text-lg font-mono font-bold text-[var(--color-text-primary)]">₦245.50</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Forecast</p>
                    <p className="text-lg font-mono font-bold text-[var(--color-positive)]">₦268.20</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Confidence</p>
                    <p className="text-lg font-mono font-bold text-[var(--color-accent-blue)]">78%</p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-[var(--color-accent-blue)]/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-[var(--color-forecast)]/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-[var(--color-text-secondary)]">
              Your data and investments are protected by industry-leading security practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center mx-auto mb-4">
                <Shield size={28} className="text-[var(--color-positive)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Bank-Level Encryption
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                All data encrypted in transit and at rest using AES-256 encryption.
              </p>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-[var(--color-positive)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                SOC 2 Compliant
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Infrastructure meets strict security and availability standards.
              </p>
            </div>

            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[var(--color-positive)]/10 flex items-center justify-center mx-auto mb-4">
                <Lock size={28} className="text-[var(--color-positive)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Protect your account with 2FA via SMS or authenticator app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[var(--color-accent-blue)]/10 to-[var(--color-forecast)]/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[var(--color-text-primary)] mb-6">
            Ready to Transform Your Investment Strategy?
          </h2>
          <p className="text-lg text-[var(--color-text-secondary)] mb-8">
            Join thousands of Nigerian investors using PREDICTA to make smarter, data-driven decisions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="primary" size="lg" onClick={handleGetStarted}>
              Get Started Free
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button variant="secondary" size="lg" onClick={handleSignIn}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[var(--color-border-primary)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--color-accent-blue)] to-blue-600 flex items-center justify-center">
                  <TrendingUp size={20} className="text-white" />
                </div>
                <span className="text-xl font-bold text-[var(--color-text-primary)]">PREDICTA</span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                AI-powered financial intelligence for the Nigerian market.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Features</a></li>
                <li><a href="#analytics" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Analytics</a></li>
                <li><a href="#security" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Privacy</a></li>
                <li><a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Terms</a></li>
                <li><a href="#" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[var(--color-border-primary)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--color-text-muted)]">
              © 2024 PREDICTA. All rights reserved.
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Data provided by market data service • Not financial advice
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
