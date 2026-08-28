import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, type Variants } from 'framer-motion';
import { 
  MapPin, 
  Menu, 
  X, 
  Check, 
  Clock, 
  Briefcase, 
  Activity, 
  LineChart, 
  SearchCheck,
  Merge,
  ListChecks,
  Settings, 
  User, 
  Workflow,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  businessName: z.string().min(2, 'Business Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  message: z.string().optional(),
});

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      businessName: '',
      email: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Contact form delivery failed');
      }

      setSubmitSuccess(true);
      form.reset();
    } catch {
      setSubmitError('Something went wrong while sending your request. Please try again or email chris@albrechtworks.com directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary selection:text-white">
      {/* Sticky Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled ? 'bg-white/95 backdrop-blur-md border-border shadow-sm py-3' : 'bg-white border-transparent py-5'
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="text-xl md:text-2xl tracking-tight flex items-center gap-1.5">
              <span className="font-heading font-bold text-foreground">Albrecht</span>
              <span className="font-heading font-bold italic text-primary">Works</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('where-we-help')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How I Help
            </button>
            <button onClick={() => scrollTo('diagnostic')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              The Diagnostic
            </button>
            <button onClick={() => scrollTo('about')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </button>
            <Button onClick={() => scrollTo('contact')} className="ml-2 font-medium shadow-sm">
              Contact
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-border shadow-lg p-4 flex flex-col gap-4">
            <button onClick={() => scrollTo('where-we-help')} className="text-left px-4 py-3 text-sm font-medium border-b border-border/50">
              How I Help
            </button>
            <button onClick={() => scrollTo('diagnostic')} className="text-left px-4 py-3 text-sm font-medium border-b border-border/50">
              The Diagnostic
            </button>
            <button onClick={() => scrollTo('about')} className="text-left px-4 py-3 text-sm font-medium border-b border-border/50">
              About
            </button>
            <Button onClick={() => scrollTo('contact')} className="w-full mt-2">
              Contact
            </Button>
          </div>
        )}
      </header>

      <main className="pt-24 md:pt-32">
        {/* Hero Section */}
        <section className="relative px-4 md:px-6 pt-12 md:pt-20 pb-20 md:pb-32 overflow-hidden bg-white">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
          
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Hero Content */}
              <motion.div 
                className="lg:col-span-7 flex flex-col items-start"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border mb-6 md:mb-8 text-xs font-medium text-muted-foreground">
                  <MapPin size={14} className="text-primary" />
                  <span>Based in Libertyville • Serving Lake County, the North Shore and greater Chicagoland.</span>
                </motion.div>
                
                <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold leading-[1.1] tracking-tight mb-4 text-foreground">
                  Make Your Business <br className="hidden md:block" />
                  Work <span className="text-blue-600">Smarter</span>
                </motion.h1>

                <motion.p variants={fadeInUp} className="text-lg md:text-xl font-semibold text-foreground mb-6">
                  Fewer Missed Calls. Less Paperwork. More Jobs Closed.
                </motion.p>
                
                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  I help local businesses save time, reduce busywork, and stop letting good customers and jobs fall through the cracks.
                  <br /><br />
                  That might mean eliminating duplicate data entry, following up with estimates automatically, capturing missed calls, simplifying scheduling, or getting the software you already pay for working together.
                </motion.p>
                
                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10">
                  <Button size="lg" className="w-full sm:w-auto text-base shadow-sm" onClick={() => scrollTo('diagnostic')}>
                    See How It Works
                  </Button>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-y-3 gap-x-6 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <Check size={12} className="text-primary" />
                    </div>
                    20+ Years Business & Technology Leadership
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <Check size={12} className="text-primary" />
                    </div>
                    No Vendor Agenda
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <Check size={12} className="text-primary" />
                    </div>
                    Clear, Fixed-Scope Engagements
                  </div>
                </motion.div>
              </motion.div>

              {/* Operational Blueprint Preview */}
              <motion.div 
                className="lg:col-span-5 lg:pl-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative rounded-2xl border border-border bg-secondary overflow-hidden shadow-2xl shadow-slate-200/50 p-6 md:p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-primary/5 pointer-events-none"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 mb-8">
                      <div>
                        <h3 className="font-heading text-slate-900 font-bold text-base md:text-lg">
                          Find the Bottlenecks<br />Fix the System
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          I look across your workflows, software, and day-to-day processes to find where time, money, and opportunities are slipping away, and identify practical ways to improve them.
                        </p>
                      </div>
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-xl flex items-center justify-center shrink-0">
                        <Workflow size={20} />
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { step: "01", title: "Review", desc: "Walk through how your business runs to pinpoint friction and key pain points.", icon: SearchCheck },
                        { step: "02", title: "Simplify", desc: "Map out practical ways to remove duplicate tasks and connect your tools.", icon: Merge, iconClassName: "rotate-90" },
                        { step: "03", title: "Deliver", desc: "Provide a clear, prioritized action plan you or your team can execute.", icon: ListChecks },
                      ].map(({ step, title, desc, icon: Icon, iconClassName }, index) => (
                        <React.Fragment key={step}>
                          <div className="flex items-center gap-4 rounded-xl bg-white/80 border border-border/80 px-4 py-4 shadow-sm">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary shrink-0">
                              <Icon size={17} className={iconClassName} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold tracking-widest text-primary">{step}</span>
                                <h4 className="font-heading font-bold text-sm text-foreground">{title}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
              
            </div>
          </div>
        </section>

        {/* Where Friction Hides */}
        <section id="where-we-help" className="py-24 bg-secondary px-4 md:px-6 border-y border-border">
          <div className="container mx-auto max-w-6xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Where You're Losing <span className="text-blue-600">Time & Money</span>
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground">
                Most friction comes from the manual steps connecting your systems rather than the tools themselves.
              </motion.p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: <Clock size={24} />,
                  title: "Manual Busywork",
                  desc: "Re-entering job details, juggling paper notes, and manually updating schedules take hours away from actual revenue-generating work.",
                  example: "Ex: Re-typing customer notes into your scheduling app, copying job details into QuickBooks, or tracking jobs in spreadsheets."
                },
                {
                  icon: <Activity size={24} />,
                  title: "Dropped Leads",
                  desc: "Missed calls, delayed quotes, and forgotten estimates mean good jobs slip away to competitors who respond first.",
                  example: "Ex: A customer calls after hours, gets voicemail, and books with the next shop on Google."
                },
                {
                  icon: <Settings size={24} />,
                  title: "Disconnected Software",
                  desc: "Apps that don't talk to each other force your team into slow, manual handoffs and duplicate steps.",
                  example: "Ex: Your scheduling app, job tracker, and accounting software each hold disconnected pieces of the same customer."
                }
              ].map((card, i) => (
                <motion.div key={i} variants={fadeInUp} className="bg-white rounded-xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-primary mb-6 border border-border">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-3">{card.title}</h3>
                  <p className="text-muted-foreground leading-relaxed min-h-[108px] md:min-h-[130px]">{card.desc}</p>
                  <p className="text-sm text-muted-foreground/80 italic leading-relaxed pt-6 border-t border-border">{card.example}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-24 bg-white px-4 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6">
                Built for Businesses Like <span className="text-blue-600">Yours</span>
              </motion.h2>

              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-10">
                I work well with businesses that run on phone calls, schedules, estimates, invoices and a handful of software tools.
              </motion.p>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  "HVAC & Plumbing", 
                  "Electrical & Contracting", 
                  "Landscaping & Home Services",
                  "Roofing & Exterior Contractors",
                  "Auto Repair & Specialty Shops",
                  "Professional Services"
                ].map((pill, i) => (
                  <div key={i} className="px-5 py-2.5 rounded-full bg-secondary border border-border text-sm font-medium text-foreground">
                    {pill}
                  </div>
                ))}
              </motion.div>
              
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                You don't need a massive technology upgrade. You need to know what is wasting time, what is costing you money, and what is worth fixing first.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Diagnostic */}
        <section id="diagnostic" className="py-16 bg-secondary px-4 md:px-6 border-y border-border">
          <div className="container mx-auto max-w-5xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl overflow-hidden"
            >
              <div className="p-8 md:p-10">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                  <div>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md mb-3 border border-primary/20">
                      Fixed-Scope Entry Offer
                    </div>
                    <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-3">
                      The 90-Minute Operations <span className="text-blue-600">Diagnostic</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      I'll spend 90 minutes with you walking through how your business actually runs, from the first phone call, through scheduling and the job itself, to invoicing and getting paid. No prep required on your end.
                    </p>
                  </div>
                  <div className="shrink-0 bg-secondary px-6 py-4 rounded-xl border border-border text-center">
                    <div className="text-3xl font-heading font-extrabold text-foreground">$495</div>
                    <div className="text-xs font-medium text-muted-foreground mt-1 max-w-[140px] mx-auto">
                      Introductory Rate for Local Businesses
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {[
                    {
                      step: "01",
                      title: "Walk Me Through the Business",
                      desc: "Show me how a real customer moves from first contact to getting the job done and getting paid."
                    },
                    {
                      step: "02",
                      title: "Find the Waste",
                      desc: "I'll look for duplicate work, manual steps, missed handoffs, and pain points that slow your business down."
                    },
                    {
                      step: "03",
                      title: "Build Your Action Plan",
                      desc: "Within 3 business days, you'll get a prioritized list of your top fixes, bottom-line impact, and next steps."
                    }
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-5">
                      <div className="text-blue-600 font-extrabold text-sm tracking-wider uppercase mb-2">{s.step}</div>
                      <h4 className="text-slate-900 font-bold text-base mb-2">{s.title}</h4>
                      <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 py-5 px-5 rounded-r-lg rounded-l-none border-l-4 border-primary border-t-0 border-r-0 border-b-0 my-4 w-full self-stretch mx-0">
                  <p className="text-base text-muted-foreground leading-relaxed">
                    <span className="font-bold text-foreground">Why it pays for itself:</span>{" "}
                    A single fix can cut wasteful expenses, book more jobs, or save hours on routine tasks. Finding just one typically covers the one-time diagnostic and keeps paying off month after month.
                  </p>
                </div>

                <div className="text-center">
                  <Button size="lg" className="w-full md:w-auto text-lg px-8 shadow-md" onClick={() => scrollTo('contact')}>
                    Request the Diagnostic
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* About Chris Albrecht */}
        <section id="about" className="py-24 bg-white px-4 md:px-6">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              
              <motion.div 
                className="md:col-span-5"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
              >
                <div className="bg-secondary rounded-2xl p-6 border border-border shadow-sm">
                  <div className="aspect-square rounded-xl bg-white border border-border mb-6 flex items-center justify-center overflow-hidden relative">
                     <img
                       src="/headshot.jpg"
                       alt="Chris Albrecht"
                       className="w-full h-full object-cover rounded-lg"
                     />
                  </div>
                  <div className="text-center space-y-2 pb-2">
                    <h3 className="font-heading font-bold text-xl text-foreground">Chris Albrecht</h3>
                    <div className="w-8 h-1 bg-primary mx-auto rounded-full"></div>
                    <div className="text-sm pt-2 space-y-2">
                      <div>
                        <div className="font-semibold text-slate-800">M.S. in Computer Science</div>
                        <div className="text-slate-500 text-sm">Illinois Institute of Technology</div>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">MBA</div>
                        <div className="text-slate-500 text-sm">Dominican University</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="md:col-span-7"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
              >
                <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-6 leading-tight">
                  Technical Expertise<br/>
                   <span className="text-blue-600 font-bold">Practical Business Judgment</span>
                </motion.h2>
                
                <motion.div variants={fadeInUp} className="space-y-4 text-muted-foreground text-lg leading-relaxed mb-8">
                  <p>
                    With over 20 years of systems and technology leadership, I founded Albrecht Works to help local businesses modernize their workflow without the complexity of enterprise software.
                  </p>
                  <p>
                    I live in Libertyville with my wife and four kids. In my free time, you'll find me training for marathons, working the smoker, or coaching the local chess club.
                  </p>
                </motion.div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* The Anti-Agency Trust Anchor */}
        <section className="py-24 bg-secondary px-4 md:px-6 border-y border-border">
          <div className="container mx-auto max-w-5xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-heading font-bold text-slate-900">
                Direct. Honest. <span className="text-blue-600 font-bold">Practical.</span>
              </motion.h2>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid md:grid-cols-3 gap-6"
            >
              {[
                {
                  title: "No Vendor Agenda",
                  desc: "I don't work for software vendors or resell software. If a tool you're using works, I leave it alone."
                },
                {
                  title: "No AI Hype",
                  desc: "I only recommend automation when it solves a real problem and saves actual time or money."
                },
                {
                  title: "Direct Access",
                  desc: "You work directly with me from start to finish on every stage of your project."
                }
              ].map((card, i) => (
                <motion.div key={i} variants={fadeInUp} className="bg-white p-8 rounded-xl border border-border text-center shadow-sm">
                  <div className="w-10 h-10 mx-auto bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Check size={16} className="text-blue-600" />
                  </div>
                  <h4 className="font-bold text-foreground text-lg mb-3">{card.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Contact & Intake Form */}
        <section id="contact" className="py-24 bg-white px-4 md:px-6">
          <div className="container mx-auto max-w-3xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">
                Let's Make Your Business Run <span className="text-blue-600 font-bold">Better</span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Reach out to schedule an Operations Diagnostic or discuss your current workflow.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={fadeInUp}
              className="bg-secondary rounded-2xl p-6 md:p-10 border border-border shadow-sm relative overflow-hidden"
            >
              {submitSuccess ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Message Sent!</h3>
                  <p className="text-muted-foreground">
                    Thanks for reaching out. I'll review your details and get back to you shortly to discuss next steps.
                  </p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Full Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="businessName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Business Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Apex Plumbing" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Email Address <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground font-semibold">Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(847) 123-4567" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">How can I help? (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Briefly describe what you're trying to solve or improve..."
                              className="resize-none h-32 bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" size="lg" className="w-full text-lg shadow-sm" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        "Request Operations Diagnostic"
                      )}
                    </Button>
                    {submitError && (
                      <p className="text-sm text-destructive text-center" role="alert">
                        {submitError}
                      </p>
                    )}
                  </form>
                </Form>
              )}
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mt-8 text-sm text-muted-foreground flex items-center justify-center gap-2"
            >
              <Mail size={16} />
               Prefer direct email? Reach out anytime at <span className="font-medium text-primary">chris@albrechtworks.com</span>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-foreground text-secondary py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="text-xl tracking-tight flex items-center gap-1.5 mb-2">
                <span className="font-heading font-bold text-white">Albrecht</span>
                <span className="font-heading font-bold italic text-primary">Works</span>
              </div>
              <p className="text-sm text-slate-400">
                Albrecht Works • Libertyville, Illinois
              </p>
            </div>
            
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            © 2026 Albrecht Works. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}