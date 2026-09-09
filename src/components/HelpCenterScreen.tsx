import React, { useState, useMemo } from 'react';
import { User } from '../types';

interface HelpCenterScreenProps {
  currentUser?: User | null;
  onBack: () => void;
  onNavigateToBookings?: () => void;
  onNavigateToTimetables?: () => void;
}

interface FAQItem {
  id: string;
  category: 'Booking' | 'Cancellation' | 'Boarding' | 'Payment';
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'Booking',
    question: 'How do I book a bus ticket on Route X?',
    answer:
      'Booking is quick and straightforward. From the Home screen, select your departure city, arrival destination, and travel date. Browse available departures, pick your preferred bus class (VIP Seating, Luxury Suite, or Standard AC), select your exact seat numbers on the interactive 24-seat layout, enter passenger details, and complete payment via KBZPay, WavePay, CBPay, AYA Pay, or cash on boarding.',
  },
  {
    id: 'faq-2',
    category: 'Booking',
    question: 'Can I choose specific seats for my journey?',
    answer:
      'Yes! Route X provides a real-time 24-seat interactive bus floor plan. You can clearly view available, selected, and already-reserved seats with driver cabin orientation and single-row vs. double-row aisle layouts.',
  },
  {
    id: 'faq-3',
    category: 'Booking',
    question: 'Do I need to print my digital ticket?',
    answer:
      'No physical printout is required. Your Route X digital ticket includes a scannable QR code and booking reference number. Simply show the digital ticket screen or SMS confirmation on your smartphone to the station gate officer or bus conductor.',
  },
  {
    id: 'faq-4',
    category: 'Cancellation',
    question: 'What is the ticket cancellation and refund policy?',
    answer:
      'You can cancel your booking up to 6 hours before departure for a full refund or free rescheduling. Cancellations made between 2 to 6 hours prior to departure incur a 15% terminal handling fee. Cancellations within 2 hours of departure or no-shows are non-refundable.',
  },
  {
    id: 'faq-5',
    category: 'Cancellation',
    question: 'How long does it take to receive my refund?',
    answer:
      'Refunds made via KBZPay or WavePay are credited directly to your mobile wallet within 2 to 4 business hours. Bank transfers (CB Bank or AYA Bank) take approximately 1 to 2 business days.',
  },
  {
    id: 'faq-6',
    category: 'Boarding',
    question: 'When should I arrive at the bus terminal?',
    answer:
      'We recommend arriving at least 30 to 45 minutes before the scheduled departure time. This allows sufficient time for luggage tag drop-off, gate identification, and temperature/ID verification.',
  },
  {
    id: 'faq-7',
    category: 'Boarding',
    question: 'What is the luggage allowance per passenger?',
    answer:
      'Each passenger is entitled to 1 piece of carry-on baggage (up to 7 kg) to place in the overhead rack, plus 1 piece of checked luggage (up to 20 kg) stowed safely in the bus cargo hold with official baggage tags.',
  },
  {
    id: 'faq-8',
    category: 'Boarding',
    question: 'Where are the main Route X bus terminals located?',
    answer:
      'In Yangon: Aung Mingalar Highway Terminal (Gates 4 & 5). In Mandalay: Chan Mya Shwe Pyi Terminal (73rd Street). In Taunggyi: Ayetharyar Highway Bus Complex. In Bago & Myeik: Central Express stations.',
  },
  {
    id: 'faq-9',
    category: 'Payment',
    question: 'Which payment methods are accepted?',
    answer:
      'Route X supports Myanmar’s most trusted payment systems: KBZPay QR, WavePay, CB Pay, AYA Pay, Credit/Debit cards, and Cash on Boarding at terminal ticket counters.',
  },
  {
    id: 'faq-10',
    category: 'Payment',
    question: 'Is online payment secure on Route X?',
    answer:
      'All transactions utilize 256-bit SSL encryption and direct wallet-to-merchant gateway protocols. We never store your payment PINs or private bank account credentials.',
  },
];

const HELPLINE_NUMBER = '+95 9 789 000 123';

export const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({
  currentUser,
  onBack,
  onNavigateToBookings,
  onNavigateToTimetables,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Contact form state
  const [formCategory, setFormCategory] = useState('Booking Inquiry');
  const [formName, setFormName] = useState(currentUser?.name || '');
  const [formContact, setFormContact] = useState(currentUser?.phone || currentUser?.email || '');
  const [formBookingId, setFormBookingId] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleCopyHelpline = () => {
    navigator.clipboard?.writeText(HELPLINE_NUMBER).catch(() => {});
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMessage.trim() || !formContact.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormMessage('');
      setFormBookingId('');
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 800);
  };

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-8 animate-fade-in font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-outline-variant/40 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-slate-800 text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Go Back"
            aria-label="Back to previous page"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant dark:text-slate-400">
              <span>Home</span>
              <span>•</span>
              <span className="text-secondary dark:text-teal-400 font-semibold">Help Center</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-primary dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Help & Customer Support</span>
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/10 text-secondary dark:bg-teal-950 dark:text-teal-300 border border-secondary/20">
                24/7 Assistance
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Screen Links */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          {onNavigateToBookings && (
            <button
              onClick={onNavigateToBookings}
              className="px-3 py-1.5 rounded-xl border border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 text-on-surface hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined text-sm text-secondary">confirmation_number</span>
              <span>My Bookings</span>
            </button>
          )}
          {onNavigateToTimetables && (
            <button
              onClick={onNavigateToTimetables}
              className="px-3 py-1.5 rounded-xl border border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-800 text-on-surface hover:bg-surface-container transition-colors cursor-pointer flex items-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
              <span>Timetables</span>
            </button>
          )}
        </div>
      </div>

      {/* 24/7 HELPLINE HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-slate-900 to-teal-950 text-white p-6 md:p-8 shadow-md border border-teal-900/50">
        <div className="absolute -right-8 -bottom-8 w-64 h-64 rounded-full bg-teal-500/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-400/20 text-teal-300 text-xs font-bold border border-teal-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Customer Care Desk
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              Need immediate assistance with your bus journey?
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Our 24/7 dedicated transport dispatch and support team is ready to assist with seat
              changes, late arrivals, terminal gate locations, and booking inquiries in both Myanmar
              and English.
            </p>
          </div>

          {/* Direct Call & Copy Card */}
          <div className="bg-white/10 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-start gap-4 shrink-0 shadow-lg">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-teal-200 font-bold block">
                24/7 Toll-Free Helpline
              </span>
              <span className="text-xl md:text-2xl font-black text-white tracking-wide font-mono block mt-0.5">
                {HELPLINE_NUMBER}
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full">
              <a
                href={`tel:${HELPLINE_NUMBER.replace(/\s+/g, '')}`}
                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-[#00504c] text-white rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-base">call</span>
                <span>Call Now</span>
              </a>

              <button
                type="button"
                onClick={handleCopyHelpline}
                className="px-3 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy phone number"
              >
                <span className="material-symbols-outlined text-base">
                  {copiedPhone ? 'check' : 'content_copy'}
                </span>
                <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORT OPTIONS GRID */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">headset_mic</span>
          <span>Support Channels & Contact Options</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Option 1: 24/7 Phone */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 space-y-3 shadow-xs hover:border-secondary transition-all">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-secondary dark:text-teal-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">phone_in_talk</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary dark:text-white">Phone Support</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 leading-relaxed">
                Direct hotline for urgent boarding, delays, and schedule changes.
              </p>
            </div>
            <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800 text-xs">
              <span className="font-bold text-secondary dark:text-teal-300 block">{HELPLINE_NUMBER}</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">24 Hours / 7 Days</span>
            </div>
          </div>

          {/* Option 2: Email */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 space-y-3 shadow-xs hover:border-secondary transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">mail</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary dark:text-white">Email Desk</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 leading-relaxed">
                For refund disputes, corporate invoicing, and travel feedback.
              </p>
            </div>
            <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800 text-xs">
              <a
                href="mailto:support@routex-bus.com"
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline block truncate"
              >
                support@routex-bus.com
              </a>
              <span className="text-[11px] text-on-surface-variant dark:text-slate-400">Response in 2–4 hours</span>
            </div>
          </div>

          {/* Option 3: Messaging Apps */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 space-y-3 shadow-xs hover:border-secondary transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">chat</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary dark:text-white">Viber & Telegram</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 leading-relaxed">
                Chat directly with our ticketing reps via instant messaging.
              </p>
            </div>
            <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800 text-xs">
              <span className="font-bold text-purple-600 dark:text-purple-300 block">@RouteXSupport</span>
              <span className="text-[11px] text-on-surface-variant dark:text-slate-400">Daily 6:00 AM – 11:00 PM</span>
            </div>
          </div>

          {/* Option 4: Terminal Counters */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 p-5 rounded-2xl border border-surface-container-high dark:border-slate-800 space-y-3 shadow-xs hover:border-secondary transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">storefront</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary dark:text-white">Terminal Helpdesks</h3>
              <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-1 leading-relaxed">
                In-person ticketing, luggage tagging, and boarding staff.
              </p>
            </div>
            <div className="pt-2 border-t border-outline-variant/30 dark:border-slate-800 text-xs">
              <span className="font-bold text-amber-600 dark:text-amber-300 block">Gates 4 & 5 (Yangon)</span>
              <span className="text-[11px] text-on-surface-variant dark:text-slate-400">73rd St (Mandalay)</span>
            </div>
          </div>
        </div>
      </section>

      {/* TWO-COLUMN SECTION: FAQ ACCORDION + IN-APP SUPPORT TICKET FORM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT 7 COLS: FREQUENTLY ASKED QUESTIONS */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-primary dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">quiz</span>
                <span>Frequently Asked Questions</span>
              </h2>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Quick answers regarding tickets, luggage, refunds, and bus gates
              </p>
            </div>
          </div>

          {/* FAQ Search Bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              placeholder="Search FAQs (e.g. refund, baggage, QR ticket, cancel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-outline-variant dark:border-slate-700 bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-white placeholder:text-on-surface-variant/60 focus:outline-hidden focus:border-secondary transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary cursor-pointer text-xs"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {['All', 'Booking', 'Cancellation', 'Boarding', 'Payment'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-secondary text-white font-bold shadow-xs'
                    : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-secondary/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion List */}
          <div className="space-y-2.5">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-lowest dark:bg-slate-900 rounded-2xl border border-dashed border-outline-variant dark:border-slate-800 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/50">search_off</span>
                <p className="font-semibold text-primary dark:text-white">No FAQ answers match your search</p>
                <p className="mt-1">Try another keyword or contact our 24/7 hotline directly.</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl border transition-all ${
                      isExpanded
                        ? 'border-secondary/40 bg-surface-container-lowest dark:bg-slate-900 shadow-xs'
                        : 'border-outline-variant/50 dark:border-slate-800 bg-surface-container-lowest/60 dark:bg-slate-900/60 hover:bg-surface-container-lowest'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 flex items-start justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary/10 text-secondary dark:bg-teal-950 dark:text-teal-300 shrink-0">
                          {faq.category}
                        </span>
                        <span className="text-xs md:text-sm font-bold text-primary dark:text-white">
                          {faq.question}
                        </span>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400 text-lg shrink-0 mt-0.5 transition-transform duration-200">
                        {isExpanded ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed border-t border-outline-variant/30 dark:border-slate-800/80">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RIGHT 5 COLS: IN-APP SUPPORT TICKET FORM */}
        <section className="lg:col-span-5 bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-surface-container-high dark:border-slate-800 shadow-xs space-y-4">
          <div className="border-b border-outline-variant/30 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-primary dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">send</span>
              <span>Send a Support Request</span>
            </h2>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 mt-0.5">
              Have a question about a reservation? Send our team a note.
            </p>
          </div>

          {submitSuccess ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                <span>Message Received!</span>
              </div>
              <p>
                Thank you! Ticket reference <strong>#RX-{Math.floor(100000 + Math.random() * 900000)}</strong> has been
                created. Our dispatch officer will contact you within 2 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitSuccess(false)}
                className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 underline cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  Inquiry Topic
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none cursor-pointer focus:border-secondary"
                >
                  <option value="Booking Inquiry">Booking Inquiry</option>
                  <option value="Seat Change Request">Seat Change Request</option>
                  <option value="Refund & Cancellation">Refund & Cancellation</option>
                  <option value="Terminal & Gate Info">Terminal & Gate Info</option>
                  <option value="Lost & Found">Lost & Found Baggage</option>
                  <option value="Other">Other Question</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aung Aung"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  Phone Number or Email
                </label>
                <input
                  type="text"
                  required
                  placeholder="+95 9 1234 5678 or email"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  Booking ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. RX-2026-0801"
                  value={formBookingId}
                  onChange={(e) => setFormBookingId(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none focus:border-secondary font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary dark:text-slate-300 mb-1">
                  Your Message
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please describe what you need help with..."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full p-2.5 bg-surface dark:bg-slate-800 border border-outline-variant dark:border-slate-700 rounded-xl text-primary dark:text-white outline-none focus:border-secondary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-secondary hover:bg-[#00504c] text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Submit Support Request</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick FAQ note */}
          <div className="p-3 bg-surface-container dark:bg-slate-800/60 rounded-xl text-[11px] text-on-surface-variant dark:text-slate-400 flex items-start gap-2">
            <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">info</span>
            <span>
              For immediate departures within the next 2 hours, please call the 24/7 Helpline directly at{' '}
              <strong className="text-primary dark:text-white">{HELPLINE_NUMBER}</strong> for rapid dispatch intervention.
            </span>
          </div>
        </section>
      </div>

      {/* TERMINAL ADDRESSES & GROUND DISPATCH DIRECTORY */}
      <section className="bg-surface-container-low dark:bg-slate-900/60 rounded-3xl p-6 border border-outline-variant/40 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-xl">hub</span>
          <h2 className="text-sm md:text-base font-bold text-primary dark:text-white">
            Express Terminal Directory & Helpdesk Gates
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl space-y-1.5 border border-outline-variant/20 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary dark:text-white">Yangon Station</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                Main Terminal
              </span>
            </div>
            <p className="text-on-surface-variant dark:text-slate-400">
              Aung Mingalar Highway Complex, Gate 4 & 5, Mingaladon Township.
            </p>
            <p className="text-[11px] font-semibold text-secondary dark:text-teal-300">
              Station Duty: +95 1 654 3210
            </p>
          </div>

          <div className="p-3.5 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl space-y-1.5 border border-outline-variant/20 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary dark:text-white">Mandalay Station</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                Upper Hub
              </span>
            </div>
            <p className="text-on-surface-variant dark:text-slate-400">
              Chan Mya Shwe Pyi Highway Bus Station, 73rd Street, Chanmyathazi.
            </p>
            <p className="text-[11px] font-semibold text-secondary dark:text-teal-300">
              Station Duty: +95 2 765 4321
            </p>
          </div>

          <div className="p-3.5 bg-surface-container-lowest dark:bg-slate-800 rounded-2xl space-y-1.5 border border-outline-variant/20 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className="font-bold text-primary dark:text-white">Taunggyi Station</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                Shan Hub
              </span>
            </div>
            <p className="text-on-surface-variant dark:text-slate-400">
              Ayetharyar Express Highway Terminal, Main Complex Gate 2.
            </p>
            <p className="text-[11px] font-semibold text-secondary dark:text-teal-300">
              Station Duty: +95 81 234 567
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
