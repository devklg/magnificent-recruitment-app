import React, { useState, useEffect } from 'react';
import { ArrowRight, Users, TrendingUp, Shield, Star, CheckCircle, Zap, Target, Sparkles } from 'lucide-react';

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const floatingStyle = {
    transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
    transition: 'transform 0.3s ease-out'
  };

  const parallaxStyle = {
    transform: `translateY(${scrollY * 0.5}px)`
  };

  return (
    <div className="min-h-screen" style={{ 
      background: 'linear-gradient(180deg, #1e1f22 0%, #2b2d31 50%, #1e1f22 100%)',
      color: '#ffffff'
    }}>
      {/* Floating Interactive Orbs - Framer Style */}
      <div className="fixed top-[10%] left-[5%] w-[400px] h-[400px] rounded-full z-[1] animate-pulse"
           style={{
             background: 'radial-gradient(circle, rgba(88, 101, 242, 0.4) 0%, rgba(88, 101, 242, 0.1) 40%, transparent 70%)',
             filter: 'blur(40px)',
             ...floatingStyle
           }}></div>
      
      <div className="fixed bottom-[10%] right-[5%] w-[300px] h-[300px] rounded-full z-[1] animate-pulse"
           style={{
             background: 'radial-gradient(circle, rgba(114, 137, 218, 0.3) 0%, rgba(114, 137, 218, 0.1) 40%, transparent 70%)',
             filter: 'blur(30px)',
             ...parallaxStyle
           }}></div>

      {/* Discord-Style Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] py-4"
           style={{
             background: 'rgba(30, 31, 34, 0.95)',
             backdropFilter: 'blur(20px)',
             borderBottom: '1px solid rgba(88, 101, 242, 0.2)'
           }}>
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold"
               style={{
                 background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 backgroundClip: 'text'
               }}>
            Magnificent Recruitment
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-[#b9bbbe] hover:text-[#5865F2] transition-colors">
              Features
            </a>
            <a href="#community" className="text-[#b9bbbe] hover:text-[#5865F2] transition-colors">
              Community
            </a>
            <button className="bg-[#5865F2] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#4752C4] transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-[#5865F2]/30">
              Join Now
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Framer Experimental Layout */}
      <section className="pt-32 pb-20 px-6 min-h-screen flex items-center relative z-10">
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-20 items-center min-h-[600px]">
            {/* Text Content */}
            <div className="relative">
              {/* Framer-style scattered elements */}
              <div className="absolute -top-5 right-5 text-6xl opacity-10 animate-spin" 
                   style={{ animationDuration: '20s' }}>⚡</div>
              
              <div className="mb-6">
                <h1 className="text-5xl lg:text-7xl font-black leading-tight mb-6"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #5865F2 50%, #7289DA 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                  Build Your
                  <br />
                  <span className="inline-block hover:scale-105 transition-transform cursor-default">
                    Recruitment
                  </span>
                  <br />
                  Empire
                </h1>
              </div>
              
              <p className="text-xl lg:text-2xl text-[#b9bbbe] leading-relaxed mb-10 max-w-[500px]">
                Join thousands of recruiters building teams with our 
                <span className="text-[#5865F2] font-semibold"> Discord-powered </span>
                community platform and 
                <span className="text-[#7289DA] font-semibold"> motion-first </span>
                recruiting tools.
              </p>

              <div className="flex gap-4 flex-wrap">
                <button className="flex items-center gap-3 px-8 py-5 rounded-xl text-lg font-bold text-white transition-all hover:-translate-y-1 hover:scale-105 shadow-lg hover:shadow-xl"
                        style={{
                          background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                          boxShadow: '0 8px 24px rgba(88, 101, 242, 0.4)'
                        }}>
                  Start Building <ArrowRight className="h-5 w-5" />
                </button>

                <button className="px-8 py-5 rounded-xl text-lg font-bold text-[#5865F2] transition-all hover:-translate-y-0.5 hover:bg-[rgba(88,101,242,0.2)]"
                        style={{
                          background: 'rgba(88, 101, 242, 0.1)',
                          border: '2px solid #5865F2'
                        }}>
                  Join Community
                </button>
              </div>
            </div>

            {/* Visual Element - Framer Style Floating Cards */}
            <div className="relative h-[600px]">
              {/* Animated Cards */}
              <div className="absolute top-0 right-0 w-[280px] h-[180px] p-6 rounded-2xl transition-all hover:-translate-y-2 hover:scale-105 animate-bounce"
                   style={{
                     background: 'rgba(43, 45, 49, 0.8)',
                     border: '1px solid rgba(88, 101, 242, 0.3)',
                     backdropFilter: 'blur(20px)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                     animationDelay: '0s',
                     animationDuration: '3s'
                   }}>
                <Users className="h-8 w-8 text-[#5865F2] mb-3" />
                <h3 className="text-lg font-bold mb-2 text-white">
                  Team Building
                </h3>
                <p className="text-[#b9bbbe] text-sm">
                  Build massive recruitment teams with viral growth systems
                </p>
              </div>

              <div className="absolute bottom-32 left-5 w-[260px] h-[160px] p-6 rounded-2xl transition-all hover:-translate-y-2 hover:scale-105 animate-bounce"
                   style={{
                     background: 'rgba(43, 45, 49, 0.8)',
                     border: '1px solid rgba(114, 137, 218, 0.3)',
                     backdropFilter: 'blur(20px)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                     animationDelay: '1s',
                     animationDuration: '4s'
                   }}>
                <TrendingUp className="h-8 w-8 text-[#7289DA] mb-3" />
                <h3 className="text-lg font-bold mb-2 text-white">
                  Growth Analytics
                </h3>
                <p className="text-[#b9bbbe] text-sm">
                  Real-time insights and performance tracking
                </p>
              </div>

              <div className="absolute top-52 right-16 w-[200px] h-[140px] p-5 rounded-2xl transition-all hover:-translate-y-2 hover:scale-105 animate-bounce"
                   style={{
                     background: 'rgba(43, 45, 49, 0.8)',
                     border: '1px solid rgba(255, 255, 255, 0.1)',
                     backdropFilter: 'blur(20px)',
                     boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                     animationDelay: '2s',
                     animationDuration: '5s'
                   }}>
                <Sparkles className="h-6 w-6 text-[#fbbf24] mb-3" />
                <h3 className="text-base font-bold mb-2 text-white">
                  AI-Powered
                </h3>
                <p className="text-[#b9bbbe] text-xs">
                  Smart recruiting automation
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Discord Card Style */}
      <section id="features" className="py-24 px-6 relative z-10"
               style={{ background: 'rgba(43, 45, 49, 0.5)' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-black mb-6"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #5865F2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
              Recruitment Superpowers
            </h2>
            <p className="text-xl text-[#b9bbbe] max-w-[600px] mx-auto">
              Everything you need to build and manage massive recruitment teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Community Building",
                description: "Discord-style team management with channels, roles, and real-time communication",
                color: "#5865F2"
              },
              {
                icon: TrendingUp,
                title: "Viral Growth Engine",
                description: "Automated referral systems and exponential team building tools",
                color: "#7289DA"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                description: "Bank-level security with role-based permissions and data protection",
                color: "#57F287"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Real-time updates, instant notifications, and blazing performance",
                color: "#FEE75C"
              },
              {
                icon: Target,
                title: "Smart Targeting",
                description: "AI-powered prospect identification and automated outreach campaigns",
                color: "#EB459E"
              },
              {
                icon: Sparkles,
                title: "Magic Automation",
                description: "Set it and forget it recruitment workflows that work 24/7",
                color: "#FF6B6B"
              }
            ].map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="p-8 rounded-2xl transition-all cursor-pointer hover:-translate-y-2 hover:scale-105"
                     style={{
                       background: 'rgba(43, 45, 49, 0.8)',
                       border: `1px solid ${feature.color}30`,
                       backdropFilter: 'blur(20px)',
                       boxShadow: `0 8px 32px ${feature.color}20`
                     }}>
                  <IconComponent className="h-12 w-12 mb-5" style={{ color: feature.color }} />
                  <h3 className="text-xl font-bold mb-4 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-[#b9bbbe] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section - Framer Experimental */}
      <section className="py-32 px-6 relative z-10 text-center"
               style={{
                 background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.1) 0%, rgba(114, 137, 218, 0.1) 100%)'
               }}>
        <div className="max-w-[800px] mx-auto">
          <div className="mb-8">
            <h2 className="text-5xl lg:text-6xl font-black leading-tight mb-8"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #5865F2 50%, #7289DA 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
              Ready to Build Your<br />
              Recruitment Empire?
            </h2>
          </div>
          
          <p className="text-xl lg:text-2xl text-[#b9bbbe] mb-12 leading-relaxed">
            Join thousands of successful recruiters already building with our platform
          </p>

          <button className="flex items-center gap-4 px-12 py-6 rounded-2xl text-xl font-bold text-white transition-all hover:-translate-y-1.5 hover:scale-105 mx-auto"
                  style={{
                    background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                    boxShadow: '0 12px 32px rgba(88, 101, 242, 0.4)'
                  }}>
            Start Building Empire <ArrowRight className="h-6 w-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 relative z-10"
              style={{
                background: 'rgba(30, 31, 34, 0.95)',
                borderTop: '1px solid rgba(88, 101, 242, 0.2)'
              }}>
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="text-3xl font-bold mb-4"
               style={{
                 background: 'linear-gradient(135deg, #5865F2, #7289DA)',
                 WebkitBackgroundClip: 'text',
                 WebkitTextFillColor: 'transparent',
                 backgroundClip: 'text'
               }}>
            Magnificent Recruitment
          </div>
          <p className="text-[#b9bbbe] mb-8">
            Building the future of recruitment with Discord-powered communities and Framer-inspired experiences
          </p>
          <div className="flex justify-center gap-10 flex-wrap text-sm">
            <a href="#" className="text-[#b9bbbe] hover:text-[#5865F2] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-[#b9bbbe] hover:text-[#5865F2] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-[#b9bbbe] hover:text-[#5865F2] transition-colors">
              Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;