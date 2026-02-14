import Image from "next/image";
import Link from "next/link";
import { SeamlessBackground } from "@/components/seamless-background";
import Head from "next/head";

export default function Home() {
  return (
    <div className="bg-background-dark text-white selection:bg-primary/30 min-h-screen">
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border-dark bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="#" className="flex items-center gap-2 group">
              <div className="w-auto h-8 flex items-center justify-center transition-colors">
                <Image
                  src="/logo.svg"
                  alt="Reflow Logo"
                  width={52}
                  height={32}
                  className="object-contain"
                />
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Showcase
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Docs
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/sign-in"
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 cursor-pointer"
            >
              Log in
            </Link>
            <Link
              href="/auth/sign-up"
              className="size-8 rounded flex items-center justify-center group-hover:bg-white transition-colors bg-white text-black font-medium px-4 w-auto h-9 text-sm cursor-pointer"
            >
              Start Building Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h1 className="font-display text-6xl md:text-9xl font-bold tracking-tighter mb-8 glow-text leading-[0.9]">
            From Napkin
            <br />
            to <span className="opacity-40">Navbar</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Design at the speed of thought. Reflow transforms your rough
            sketches and natural language into production-ready UI components
            instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto font-bold px-8 py-4 rounded-lg text-lg transition-all flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 btn-hover-arrow cursor-pointer"
            >
              Start Designing{" "}
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
            <button className="w-full sm:w-auto bg-transparent border border-border-dark text-white font-bold px-8 py-4 rounded-lg text-lg hover:bg-white/5 transition-all btn-hover-play flex items-center justify-center gap-2 cursor-pointer">
              <div className="flex items-center justify-center">
                <span className="material-symbols-outlined play-icon">
                  play_arrow
                </span>
              </div>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Wireframe Transformation Section */}
      <section className="py-24 border-y border-border-dark bg-black relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Sketch to Component
            </h2>
            <p className="text-gray-400 max-w-xl">
              Upload a photo of your whiteboard or a rough paper sketch. Our AI
              interprets the hierarchy and generates high-fidelity Tailwind
              components.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Input Side */}
            <div className="gradient-border rounded-xl p-6 bg-neutral-dark/50 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    draw
                  </span>{" "}
                  Input Sketch
                </span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  RAW IMAGE
                </span>
              </div>
              <div className="flex-grow min-h-[400px] rounded-lg bg-black/50 border border-dashed border-gray-800 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="w-full h-full object-cover grayscale opacity-50 contrast-125 sketch-animate-draw"
                  alt="A hand-drawn wireframe sketch on paper"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzT_HWoQLSA4oQNGKe4nB90rMM79GVuFoL2-kf6Jj0rxkgSA-mh6v-7cQsGcBSwLadxx9lCB3DjBg4_SrtcUCvp739EXlq-wuMvb0Zm3ti8996p8IkxHBfxF_dyE2ki6EZ0So2rg0YRSdEbtr6U0PDYxEo29t6im8BPprKGw9vXHfjht2p4H_esqz2A6mJovzjsv4iZEQjE2AR3Z-_B0yXsGWYKw_5DfzAZRsVIGNtjxkdu9cijNZrUY6yL5uhowEHUjtOH1lSCN0"
                />
              </div>
            </div>
            {/* Output Side */}
            <div className="gradient-border rounded-xl p-6 bg-neutral-dark/50 flex flex-col gap-4 relative">
              <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-gray-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <span className="material-symbols-outlined text-white">
                  auto_awesome
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">
                    code
                  </span>{" "}
                  AI Output
                </span>
                <div className="flex gap-2">
                  <span className="text-[10px] text-gray-400 border border-border-dark px-2 py-0.5 rounded">
                    REACT
                  </span>
                  <span className="text-[10px] text-gray-400 border border-border-dark px-2 py-0.5 rounded">
                    TAILWIND
                  </span>
                </div>
              </div>
              <div className="flex-grow min-h-[400px] rounded-lg bg-[#0a0a0a] border border-border-dark flex items-center justify-center p-8 ai-ui-reveal-animate">
                <div className="w-full max-w-md space-y-6">
                  <div className="h-12 w-full bg-white/5 rounded-lg border border-white/10 flex items-center px-4 justify-between">
                    <div className="h-2 w-24 bg-white/20 rounded"></div>
                    <div className="flex gap-2">
                      <div className="size-6 bg-white/10 rounded-full"></div>
                      <div className="size-6 bg-white/10 rounded-full"></div>
                    </div>
                  </div>
                  <div className="aspect-video w-full bg-gray-800 rounded-xl border border-gray-700 flex flex-col items-center justify-center gap-3">
                    <div className="h-3 w-1/2 bg-gray-600 rounded"></div>
                    <div className="h-2 w-1/3 bg-gray-700 rounded"></div>
                    <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-gray-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-20 bg-white/5 rounded-lg border border-white/10"></div>
                    <div className="h-20 bg-white/5 rounded-lg border border-white/10"></div>
                    <div className="h-20 bg-white/5 rounded-lg border border-white/10"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat Assistant Section */}
      <section className="py-24 bg-background-dark relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Design with AI Intelligence
            </h2>
            <p className="text-gray-400 text-lg mb-8">
              Talk to your design like you talk to a developer. Refine layouts,
              swap styles, and generate entire sections with simple natural
              language prompts.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined">chat_bubble</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Context-Aware Editing</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    AI understands your existing design system and constraints.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined">terminal</span>
                </div>
                <div>
                  <h4 className="font-bold mb-1">Code-First Generation</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Generates clean, modular JSX and CSS utility classes.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="rounded-xl overflow-hidden border border-border-dark shadow-2xl bg-[#0a0a0a] transition-transform duration-500 hover:scale-[1.02]">
              {/* Window Header */}
              <div className="bg-neutral-dark px-4 py-3 border-b border-border-dark flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-red-500/20"></div>
                  <div className="size-3 rounded-full bg-yellow-500/20"></div>
                  <div className="size-3 rounded-full bg-green-500/20"></div>
                </div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                  Reflow Interface
                </div>
                <div className="size-4"></div>
              </div>
              {/* Chat & Canvas */}
              <div className="flex h-[500px]">
                {/* Sidebar Chat */}
                <div className="w-1/3 border-r border-border-dark bg-[#0d0d0d] flex flex-col">
                  <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      How can I help you design today?
                    </div>
                    <div className="bg-neutral-dark border border-border-dark rounded-lg p-3 text-xs text-gray-400 leading-relaxed ml-4">
                      &quot;Change the hero section to have a dark aesthetic and
                      use Space Grotesk for headings.&quot;
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      Updating theme configuration... Applying typography
                      changes... Done!
                    </div>
                  </div>
                  <div className="p-3 border-t border-border-dark">
                    <div className="relative">
                      <input
                        className="w-full bg-black border border-border-dark rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:border-primary"
                        placeholder="Type a prompt..."
                        type="text"
                      />
                      <span className="material-symbols-outlined absolute right-2 top-1.5 text-sm text-gray-600">
                        send
                      </span>
                    </div>
                  </div>
                </div>
                {/* Canvas View */}
                <div className="flex-grow bg-black p-6 flex items-center justify-center relative">
                  <div className="absolute inset-0 grid-pattern opacity-10"></div>
                  <div className="w-full max-w-sm border border-white/10 rounded-lg shadow-2xl bg-black relative overflow-hidden group">
                    <div className="p-4 border-b border-white/5 flex justify-between items-center">
                      <div className="size-4 bg-white/20 rounded"></div>
                      <div className="flex gap-2">
                        <div className="h-1.5 w-6 bg-white/20 rounded"></div>
                        <div className="h-1.5 w-6 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="p-6 text-center space-y-3">
                      <div className="h-6 w-3/4 bg-white mx-auto rounded"></div>
                      <div className="h-2 w-1/2 bg-white/20 mx-auto rounded"></div>
                      <div className="h-8 w-24 bg-white mx-auto rounded-md mt-4"></div>
                    </div>
                    <div className="h-2 w-1/3 bg-gray-700 rounded">
                      <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-20 size-10 rounded-full bg-gray-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        UPDATING...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Identity Section */}
      <section className="py-24 bg-neutral-dark/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold mb-4">
              One-Click Brand Identity
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Generate cohesive color palettes, font pairings, and design tokens
              that work across your entire application instantly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Color Discovery */}
            <div className="gradient-border p-8 rounded-2xl bg-black feature-card">
              <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  palette
                </span>{" "}
                Colors
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-mono">
                    PRIMARY
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    #444444
                  </span>
                </div>
                <div className="h-12 w-full bg-gray-600 rounded-lg"></div>
                <div className="grid grid-cols-5 gap-2">
                  <div className="h-10 bg-gray-500 rounded"></div>
                  <div className="h-10 bg-gray-600 rounded"></div>
                  <div className="h-10 bg-gray-700 rounded"></div>
                  <div className="h-10 bg-gray-800 rounded"></div>
                  <div className="h-10 bg-gray-900 rounded"></div>
                </div>
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Surface</span>
                    <div className="h-4 w-12 bg-neutral-dark border border-border-dark rounded"></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Accent</span>
                    <div className="h-4 w-12 bg-gray-400 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Typography Discovery */}
            <div className="gradient-border p-8 rounded-2xl bg-black feature-card">
              <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  text_format
                </span>{" "}
                Typography
              </h3>
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">
                    Display Font
                  </span>
                  <div className="font-display text-3xl font-bold leading-none">
                    Geist Mono
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Medium, 700, 3.5rem
                  </p>
                </div>
                <div className="pt-6 border-t border-border-dark">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest block mb-2">
                    Body Font
                  </span>
                  <div className="font-sans text-xl leading-relaxed">
                    Geist Sans
                  </div>
                  <p className="text-xs text-gray-500 mt-1 italic">
                    Regular, 400, 1rem
                  </p>
                </div>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <div className="text-sm font-bold border border-border-dark p-2 rounded text-center">
                    Aa
                  </div>
                  <div className="text-sm font-light border border-border-dark p-2 rounded text-center italic">
                    Aa
                  </div>
                </div>
              </div>
            </div>
            {/* Bento Elements */}
            <div className="grid grid-rows-2 gap-6">
              <div className="gradient-border p-6 rounded-2xl bg-black flex flex-col justify-between feature-card">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  grid_view
                </span>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                    Grid System
                  </div>
                  <div className="text-2xl font-display font-bold">
                    12 Column
                  </div>
                </div>
              </div>
              <div className="gradient-border p-6 rounded-2xl bg-black flex flex-col justify-between feature-card">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  rounded_corner
                </span>
                <div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">
                    Radius
                  </div>
                  <div className="text-2xl font-display font-bold">
                    8px (lg)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <SeamlessBackground />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent pointer-events-none"></div>
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="font-display text-5xl md:text-6xl font-bold mb-8 tracking-tighter">
            Ready to build your next big thing?
          </h2>
          <p className="text-gray-400 text-lg mb-12 max-w-2xl mx-auto">
            Join 20,000+ developers and designers who are building the web
            faster with Reflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="w-full sm:w-auto font-bold px-10 py-4 rounded-lg text-xl transition-all bg-white text-black hover:bg-gray-200 animate-pulse cursor-pointer hover:animate-none transform hover:scale-105 active:scale-95 duration-200"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border-dark relative z-10 bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="#" className="flex items-center gap-2 group">
            <div className="w-auto h-6 flex items-center justify-center transition-colors">
              <Image
                src="/logo.svg"
                alt="Reflow Logo"
                width={40}
                height={24}
                className="object-contain"
              />
            </div>
          </Link>
          <div className="flex gap-8 text-sm text-gray-500">
            <Link
              href="http://x.com/imsidkg"
              target="_blank"
              className="hover:text-white transition-colors cursor-pointer"
            >
              Twitter
            </Link>
            <Link
              href="https://github.com/imsidkg"
              target="_blank"
              className="hover:text-white transition-colors cursor-pointer"
            >
              GitHub
            </Link>
            <Link
              href="https://www.linkedin.com/in/imsidkg"
              target="_blank"
              className="hover:text-white transition-colors cursor-pointer"
            >
              LinkedIn
            </Link>
          </div>
          <Link
            href="https://imsidkg.me"
            target="_blank"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
          >
            imsidkg
          </Link>
        </div>
      </footer>
    </div>
  );
}
