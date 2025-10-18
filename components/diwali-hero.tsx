"use client"
import { useEffect, useState } from 'react';
import { useDevicePricing } from '@/hooks/use-device-detection';
import { appConstants } from "@/lib/appConstants";

export function DiwaliHero() {
  const [fireworks, setFireworks] = useState([]);
  const [diyas, setDiyas] = useState([]);
  const [sparkles, setSparkles] = useState([]);
  const [mounted, setMounted] = useState(false);
  
  // Mock data - replace with your actual values
    const { js, complete, isLoading } = useDevicePricing();
    const { js_kit_price, js_kit_original_price, discount_percentage } = appConstants();

  useEffect(() => {
    setMounted(true);
    
    // Generate sparkles only on client side to avoid hydration mismatch
    const initialSparkles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 1 + Math.random() * 2,
    }));
    setSparkles(initialSparkles);

    // Generate random fireworks
    const createFirework = () => {
      const id = Date.now() + Math.random();
      const newFirework = {
        id,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
      };
      
      setFireworks(prev => [...prev, newFirework]);
      
      // Remove after animation
      setTimeout(() => {
        setFireworks(prev => prev.filter(fw => fw.id !== id));
      }, (newFirework.duration + newFirework.delay) * 1000);
    };

    // Create fireworks periodically
    const interval = setInterval(createFirework, 800);
    
    // Initial fireworks
    for (let i = 0; i < 3; i++) {
      setTimeout(createFirework, i * 300);
    }

    // Generate diyas (static decorative lamps)
    const initialDiyas = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      left: (i * 18) + 5,
      delay: i * 0.3,
    }));
    setDiyas(initialDiyas);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative mx-auto max-w-7xl px-4 mt-8 pt-16 pb-8 sm:pt-24 sm:pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Diwali Decorative Elements Container - Only render after mount */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating Sparkles */}
          {sparkles.map((sparkle) => (
            <div
              key={sparkle.id}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full animate-pulse"
              style={{
                left: `${sparkle.left}%`,
                top: `${sparkle.top}%`,
                animationDelay: `${sparkle.delay}s`,
                animationDuration: `${sparkle.duration}s`,
                boxShadow: '0 0 8px 2px rgba(253, 224, 71, 0.8)',
              }}
            />
          ))}

          {/* Fireworks */}
          {fireworks.map((fw) => (
            <div
              key={fw.id}
              className="absolute"
              style={{
                left: `${fw.left}%`,
                bottom: '-10%',
              }}
            >
              {/* Rocket Trail */}
              <div
                className="w-1 h-12 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full"
                style={{
                  animation: `rocketFly ${fw.duration}s ease-out ${fw.delay}s`,
                  boxShadow: '0 0 10px rgba(251, 146, 60, 0.8)',
                }}
              />
              
              {/* Explosion Particles */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  animation: `explode ${fw.duration}s ease-out ${fw.delay}s`,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-8 rounded-full"
                    style={{
                      background: `linear-gradient(to top, 
                        ${['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][i % 5]}, 
                        transparent)`,
                      transform: `rotate(${i * 30}deg)`,
                      transformOrigin: 'bottom',
                      opacity: 0,
                      animation: `particle ${fw.duration * 0.6}s ease-out ${fw.delay + fw.duration * 0.95}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Decorative Diyas (Oil Lamps) at bottom - hidden on mobile */}
          <div className="hidden md:flex absolute bottom-0 left-0 right-0 justify-around items-end px-8 pb-8">
            {diyas.map((diya) => (
              <div
                key={diya.id}
                className="relative"
                style={{
                  animation: `flicker 2s ease-in-out infinite`,
                  animationDelay: `${diya.delay}s`,
                }}
              >
                {/* Diya flame */}
                <div className="w-6 h-8 bg-gradient-to-t from-orange-500 via-yellow-400 to-yellow-200 rounded-full relative">
                  <div className="absolute inset-0 bg-yellow-300 rounded-full blur-sm opacity-70" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-4 bg-gradient-to-t from-yellow-400 to-transparent rounded-full" />
                </div>
                {/* Diya base */}
                <div className="w-10 h-3 bg-gradient-to-b from-amber-700 to-amber-900 rounded-full -mt-1" />
                {/* Glow effect */}
                <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-30 scale-150" />
              </div>
            ))}
          </div>

          {/* Rangoli Pattern (corner decoration) - hidden on mobile */}
          <div className="hidden md:block absolute top-8 right-8 w-24 h-24 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute inset-2 bg-gradient-to-tl from-yellow-400 via-orange-400 to-red-400 rounded-full animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
            <div className="absolute inset-4 bg-gradient-to-br from-green-400 via-teal-400 to-cyan-400 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
          </div>
        </div>
      )}

      {/* Animated gradient background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -left-20 w-40 h-40 md:w-72 md:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60" style={{ animation: 'blob 7s infinite' }}></div>
        <div className="absolute top-10 -right-20 w-40 h-40 md:w-72 md:h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-60" style={{ animation: 'blob 7s infinite 2s' }}></div>
        <div className="absolute -bottom-10 left-10 w-40 h-40 md:w-72 md:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60" style={{ animation: 'blob 7s infinite 4s' }}></div>
      </div>

      <div className="grid gap-6 md:gap-12 md:grid-cols-2 md:items-center relative z-10">
        <div className="relative">
          {/* Diwali Special Banner */}
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-yellow-400/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold mb-3 sm:mb-4 backdrop-blur-sm">
            <span className="text-base sm:text-lg animate-bounce">🪔</span>
            <span className="bg-gradient-to-r from-orange-600 to-yellow-600 bg-clip-text text-transparent text-xs sm:text-sm">
              Happy Diwali! Special Festive Offer 90% OFF on All Interview Kits
            </span>
            <span className="text-base sm:text-lg animate-bounce" style={{ animationDelay: '0.3s' }}>✨</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            <span className="text-gray-900 dark:text-white">Crack Frontend Interviews With</span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Real Interview Questions
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">in 30 days</span>
          </h1>

          {/* Clear Value Proposition */}
          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Ace frontend interview rounds using our curated Interview Kits containing latest and real interview questions from top tech companies like
            <span className="font-semibold text-gray-900 dark:text-white"> Google, Amazon, Microsoft</span> and more.
          </p>

          <div className="mt-4 sm:mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Get Javascript Interview Kit At Just</p>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">₹{js_kit_price}</span>
                  <span className="text-sm text-gray-500 line-through">₹{js_kit_original_price}</span>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    SAVE {discount_percentage}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">✓ Instant Access</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">✓ Lifetime Updates</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <a href="#pricing" className="group inline-flex relative">
              <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200"></span>
              <span className="relative w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105">
                Get Instant Access →
                <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">{discount_percentage}% OFF</span>
              </span>
            </a>
            <a href="#features" className="inline-flex group">
              <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-amber-500 text-amber-600 dark:text-amber-400 px-4 sm:px-6 py-3 font-medium hover:bg-amber-500/10 transition-all">
                Know More 
              </span>
            </a>
          </div>
        </div>

        {/* Right Column - Hero Illustration (Desktop Only) */}
        <div className="hidden md:block relative">
          <div className="relative w-full h-[400px] lg:h-[500px]">
            {/* Main illustration container */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30 rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center p-8">
                  {/* Code editor illustration */}
                  <div className="bg-gray-900 rounded-lg p-4 shadow-2xl max-w-sm mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="space-y-2 font-mono text-xs text-left">
                      <div className="text-purple-400">const <span className="text-blue-400">interview</span> = {'{'}</div>
                      <div className="ml-4 text-green-400">javascript: <span className="text-yellow-300">"500+ Questions"</span>,</div>
                      <div className="ml-4 text-green-400">react: <span className="text-yellow-300">"300+ Questions"</span>,</div>
                      <div className="ml-4 text-green-400">dsa: <span className="text-yellow-300">"200+ Problems"</span>,</div>
                      <div className="ml-4 text-green-400">success: <span className="text-orange-400">true</span></div>
                      <div className="text-purple-400">{'}'}</div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="mt-6 flex justify-center gap-4">
                    <div className="bg-white rounded-full px-3 py-1 shadow-lg text-xs font-semibold text-gray-800 animate-bounce">
                      JS
                    </div>
                    <div className="bg-white rounded-full px-3 py-1 shadow-lg text-xs font-semibold text-gray-800 animate-bounce" style={{ animationDelay: '0.2s' }}>
                      REACT
                    </div>
                    <div className="bg-white rounded-full px-3 py-1 shadow-lg text-xs font-semibold text-gray-800 animate-bounce" style={{ animationDelay: '0.4s' }}>
                      DSA
                    </div>
                  </div>

                  {/* Success stats */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                      <div className="text-2xl font-bold text-blue-600">2.5K+</div>
                      <div className="text-xs text-gray-600">Engineers Placed</div>
                    </div>
                    <div className="bg-white/80 backdrop-blur rounded-lg p-3">
                      <div className="text-2xl font-bold text-green-600">97%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-blue-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rocketFly {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translateY(-120vh) scale(0.5); opacity: 0; }
        }

        @keyframes explode {
          0% { opacity: 0; transform: scale(0); }
          95% { opacity: 0; transform: scale(0); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes particle {
          0% { opacity: 0; transform: translateY(0) scale(1); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-80px) scale(0); }
        }

        @keyframes flicker {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>
    </section>
  )
}