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
  ArrowRight, 
  Clock, 
  Briefcase, 
  Activity, 
  LineChart, 
  Settings, 
  User, 
  ExternalLink,
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
  businessName: z.string().min(2, 'Business Name & Trade is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  headache: z.string().min(10, 'Please provide a bit more detail about your current workflow issues.'),
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
      headache: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    form.reset();
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
          <div className="flex flex-col cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="text-xl md:text-2xl tracking-tight flex items-center gap-1.5">
              <span className="font-heading font-bold text-foreground">Albrecht</span>
              <span className="font-heading font-bold italic text-primary">Works</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5 hidden sm:block">
              Operations • Automation • Technology
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('where-we-help')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Where We Help
            </button>
            <button onClick={() => scrollTo('diagnostic')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              The Diagnostic
            </button>
            <button onClick={() => scrollTo('about')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              About
            </button>
            <Button onClick={() => scrollTo('diagnostic')} className="ml-2 font-medium shadow-sm">
              Book Diagnostic
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
              Where We Help
            </button>
            <button onClick={() => scrollTo('diagnostic')} className="text-left px-4 py-3 text-sm font-medium border-b border-border/50">
              The Diagnostic
            </button>
            <button onClick={() => scrollTo('about')} className="text-left px-4 py-3 text-sm font-medium border-b border-border/50">
              About
            </button>
            <Button onClick={() => scrollTo('diagnostic')} className="w-full mt-2">
              Book Diagnostic
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
                  <span>Based in Libertyville • Serving Lake County, the North Shore & Beyond</span>
                </motion.div>
                
                <motion.h1 variants={fadeInUp} className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold leading-[1.1] tracking-tight mb-4 text-foreground">
                  Make Your Business <br className="hidden md:block" />
                  Work Smarter.
                </motion.h1>
                
                <motion.div variants={fadeInUp} className="text-lg md:text-xl font-medium text-primary mb-6">
                  AI • Automation • Technology
                </motion.div>
                
                <motion.p variants={fadeInUp} className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  I help service companies, contractors, and growing businesses reduce repetitive administrative work, improve customer follow-up, connect disconnected systems, and get more value from the technology they already use.
                </motion.p>
                
                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10">
                  <Button size="lg" className="w-full sm:w-auto text-base shadow-sm" onClick={() => scrollTo('diagnostic')}>
                    Book a 90-Minute Diagnostic
                  </Button>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base bg-white" onClick={() => scrollTo('contact')}>
                    Talk to Chris
                  </Button>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-y-3 gap-x-6 text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <Check size={12} className="text-primary" />
                    </div>
                    20+ Years Technology Leadership
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <Check size={12} className="text-primary" />
                    </div>
                    No AI Hype or Vendor Agenda
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center border border-border">
                      <Check size={12} className="text-primary" />
                    </div>
                    Clear, Fixed-Scope Engagements
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero Visual */}
              <motion.div 
                className="lg:col-span-5 lg:pl-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="relative aspect-[4/5] rounded-2xl border border-border bg-secondary overflow-hidden shadow-2xl shadow-slate-200/50 flex flex-col items-center justify-center group">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 z-0"></div>
                  
                  {/* Subtle placeholder styling ready for real photo */}
                  <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white shadow-sm bg-muted flex items-center justify-center mb-6 overflow-hidden">
                    <User size={48} className="text-muted-foreground/30" />
                  </div>
                  
                  <div className="relative z-10 text-center px-6">
                    <h3 className="font-heading font-bold text-xl text-foreground mb-1">Chris Albrecht</h3>
                    <p className="text-sm font-medium text-muted-foreground mb-2">M.S. Computer Science • MBA</p>
                    <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border/50">
                      <MapPin size={12} />
                      Libertyville, IL
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center backdrop-blur-md">
                    <Settings size={20} className="text-primary" />
                  </div>
                  <div className="absolute bottom-6 left-6 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm border border-border/50">
                    <LineChart size={20} className="text-foreground" />
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
                Where Your Business May Be Losing Time & Money
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground">
                Most growing businesses don't have a technology shortage. They have repetitive work, disconnected systems, and manual bottlenecks.
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
                  title: "Reduce Administrative Work",
                  desc: "Automate repetitive data entry, paperwork, scheduling, and follow-up so your team spends less time on busywork."
                },
                {
                  icon: <Activity size={24} />,
                  title: "Capture More Opportunities",
                  desc: "Reduce missed calls, slow response times, and forgotten estimates so fewer good opportunities fall through the cracks."
                },
                {
                  icon: <Settings size={24} />,
                  title: "Make Your Technology Work Together",
                  desc: "Get more value from the software you already use by reducing unnecessary manual handoffs between systems."
                }
              ].map((card, i) => (
                <motion.div key={i} variants={fadeInUp} className="bg-white rounded-xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-primary mb-6 border border-border">
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-heading font-bold text-foreground mb-3">{card.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
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
              <motion.h2 variants={fadeInUp} className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-10">
                Built for Businesses Like Yours
              </motion.h2>
              
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  "HVAC & Plumbing", 
                  "Electrical & Contracting", 
                  "Landscaping & Home Services",
                  "Auto Repair & Specialty Shops",
                  "Professional Services"
                ].map((pill, i) => (
                  <div key={i} className="px-5 py-2.5 rounded-full bg-secondary border border-border text-sm font-medium text-foreground">
                    {pill}
                  </div>
                ))}
              </motion.div>
              
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                If your business runs on phone calls, schedules, estimates, invoices, and a handful of software tools, there is almost certainly room to make the process work better.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* The Diagnostic */}
        <section id="diagnostic" className="py-24 bg-secondary px-4 md:px-6 border-y border-border">
          <div className="container mx-auto max-w-5xl">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="bg-white rounded-2xl border-2 border-primary/20 shadow-xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                  <div>
                    <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-md mb-4 border border-primary/20">
                      Fixed-Scope Entry Offer
                    </div>
                    <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-foreground mb-3">
                      The 90-Minute Operations Diagnostic
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                      A focused operational walkthrough designed to understand how your business actually runs—from initial customer contact through scheduling, fulfillment, invoicing, and payment—and identify the highest-value opportunities to improve it.
                    </p>
                  </div>
                  <div className="shrink-0 bg-secondary px-6 py-4 rounded-xl border border-border text-center">
                    <div className="text-3xl font-heading font-extrabold text-foreground">$495</div>
                    <div className="text-xs font-medium text-muted-foreground mt-1 max-w-[140px] mx-auto">
                      Introductory Rate for Local Businesses
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-12">
                  {[
                    {
                      step: "01",
                      title: "Map the Workflow",
                      desc: "Follow the real customer journey and identify manual bottlenecks, duplicate data entry, and communication drop-offs."
                    },
                    {
                      step: "02",
                      title: "Find the Friction",
                      desc: "Review workflows, software usage, handoffs, and repetitive tasks to identify where time, money, or opportunities are being lost."
                    },
                    {
                      step: "03",
                      title: "Prioritize the Fixes",
                      desc: "Receive a concise action plan highlighting highest-impact opportunities, potential time/cost savings, and recommended next steps."
                    }
                  ].map((s, i) => (
                    <div key={i} className="relative">
                      <div className="text-4xl font-heading font-black text-secondary mb-2 -ml-2">{s.step}</div>
                      <h4 className="text-lg font-bold text-foreground mb-2 relative z-10">{s.title}</h4>
                      <p className="text-sm text-muted-foreground relative z-10">{s.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-secondary p-6 rounded-xl border border-border mb-8 flex flex-col md:flex-row gap-6">
                  <div className="flex items-start gap-3 flex-1">
                    <Check className="text-primary shrink-0 mt-0.5" size={20} />
                    <div>
                      <span className="font-bold text-foreground block mb-1">Delivered within 3 business days:</span>
                      <span className="text-sm text-muted-foreground">You receive a concise prioritized implementation roadmap.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 flex-1">
                    <Check className="text-primary shrink-0 mt-0.5" size={20} />
                    <div>
                      <span className="font-bold text-foreground block mb-1">No-pressure diagnostic:</span>
                      <span className="text-sm text-muted-foreground">If I don't uncover practical opportunities worth pursuing, I'll tell you so.</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button size="lg" className="w-full md:w-auto text-lg px-8 shadow-md" onClick={() => scrollTo('contact')}>
                    Schedule an Operations Diagnostic
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
                     {/* Placeholder for real headshot */}
                     <div className="absolute inset-0 flex items-center justify-center">
                        <User size={64} className="text-muted-foreground/20" />
                     </div>
                  </div>
                  <div className="text-center space-y-2 pb-2">
                    <h3 className="font-heading font-bold text-xl text-foreground">Chris Albrecht</h3>
                    <div className="w-8 h-1 bg-primary mx-auto rounded-full"></div>
                    <div className="text-sm text-muted-foreground font-medium pt-2">
                      M.S. Computer Science — IIT Chicago<br/>
                      MBA — Dominican University
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
                  Technology Experience.<br/>
                  <span className="text-muted-foreground">Practical Business Judgment.</span>
                </motion.h2>
                
                <motion.div variants={fadeInUp} className="space-y-4 text-muted-foreground text-lg leading-relaxed mb-8">
                  <p>
                    With over 20 years of technology and systems leadership, I founded Albrecht Works to help local businesses modernize their practical operations without the complexity of enterprise software.
                  </p>
                  <p>
                    I live in Libertyville with my wife and four kids. When I'm not untangling business workflows, I'm a marathon runner, a BBQ enthusiast, and a volunteer chess coach.
                  </p>
                </motion.div>
                
                <motion.a 
                  variants={fadeInUp}
                  href="https://chrisalbrecht.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary/80 transition-colors group"
                >
                  View Chris's Professional Background & Portfolio 
                  <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </motion.a>
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
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                Direct. Honest. Practical.
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
                  desc: "I don't work for software vendors or resell software. Recommendations are based solely on what fits your business."
                },
                {
                  title: "No AI Hype",
                  desc: "We only recommend automation when it solves a real operational problem and saves actual time or money."
                },
                {
                  title: "Direct Access",
                  desc: "You work directly with me—not an account manager or junior subcontractor learning on your dime."
                }
              ].map((card, i) => (
                <motion.div key={i} variants={fadeInUp} className="bg-white p-8 rounded-xl border border-border text-center shadow-sm">
                  <div className="w-10 h-10 mx-auto bg-secondary rounded-full flex items-center justify-center mb-4 border border-border">
                    <Check size={16} className="text-foreground" />
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
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
                Let's Make Your Office Run Better.
              </h2>
              <p className="text-lg text-muted-foreground">
                Reach out directly to schedule an Operations Diagnostic or discuss your current workflow.
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
                  <h3 className="text-2xl font-bold text-foreground mb-3">Message Received</h3>
                  <p className="text-muted-foreground">
                    Thanks for reaching out. I'll review your details and get back to you shortly to discuss next steps.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-8 bg-white"
                    onClick={() => setSubmitSuccess(false)}
                  >
                    Send another message
                  </Button>
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
                              <Input placeholder="Jane Doe" {...field} className="bg-white" />
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
                            <FormLabel className="text-foreground font-semibold">Business Name & Trade <span className="text-destructive">*</span></FormLabel>
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
                              <Input type="email" placeholder="jane@example.com" {...field} className="bg-white" />
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
                            <FormLabel className="text-foreground font-semibold">Phone Number</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(555) 123-4567" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="headache"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground font-semibold">Biggest Daily Administrative or Software Headache <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g. We spend hours copying data from our scheduling tool into QuickBooks, and still miss invoices..."
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
              Prefer direct email? Reach out anytime at <a href="mailto:chris@albrechtworks.com" className="font-medium text-primary hover:underline">chris@albrechtworks.com</a>
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
                Albrecht Works LLC • Libertyville, Illinois • Practical Technology & Automation
              </p>
            </div>
            
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <button onClick={() => scrollTo('contact')} className="hover:text-white transition-colors">Contact</button>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-500">
            © 2026 Albrecht Works LLC. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}