import React, { useState } from 'react';

const LandingPage = ({ onGetStarted, onAdminClick, onNavigate, user }) => {
  const [activeFaq, setActiveFaq] = useState(null);

  // Live campus impact statistics
  const impactStats = [
    { label: 'Trees Planted & Nurtured', value: '1,450+', icon: '🌳', detail: 'Native species across campus grounds', color: '#2E7D32' },
    { label: 'Clean Energy Saved', value: '18,240 kWh', icon: '⚡', detail: 'Smart dorm & lab conservation', color: '#F57F17' },
    { label: 'Water Conserved', value: '94,500 L', icon: '💧', detail: 'Aerators & rainwater harvesting', color: '#0288D1' },
    { label: 'Plastic Waste Diverted', value: '3,820 kg', icon: '♻️', detail: 'Zero single-use plastic campus', color: '#7B1FA2' }
  ];

  // Core Pillars
  const pillars = [
    {
      icon: '🎯',
      title: 'Actionable Eco-Challenges',
      desc: 'Participate in structured, faculty-vetted challenges like Plastic-Free Week, Campus Clean-up Drives, and DIY Solar Workshops. Upload verifiable photo proof.',
      badge: 'Proof Verified'
    },
    {
      icon: '🌱',
      title: 'GreenHUB Social Community',
      desc: 'Sri Eshwar’s exclusive sustainability network. Share your achievements, celebrate green habits, post photo proofs, and cheer on peers with likes and comments.',
      badge: 'Student Powered'
    },
    {
      icon: '🏆',
      title: 'Gamified Eco-Points & Badges',
      desc: 'Level up from Eco Seedling to Planet Guardian. Earn Eco-Points for verified submissions, maintain green streaks, and compete on the Department Leaderboard.',
      badge: 'Live Rankings'
    },
    {
      icon: '🎁',
      title: 'Eco-Store Campus Rewards',
      desc: 'Redeem your hard-earned points for campus cafeteria eco-vouchers, sustainable stationery, reusable water bottles, and Certificates of Environmental Merit.',
      badge: 'Real Perks'
    },
    {
      icon: '📊',
      title: 'Evidence-Backed Analytics',
      desc: 'Live calculation of your authentic carbon footprint reduction, liters of water saved, and trees conserved backed by verified environmental science equations.',
      badge: 'Verified Data'
    },
    {
      icon: '🛡️',
      title: 'Faculty & Admin Review',
      desc: 'Comprehensive moderation dashboard with AI photo verification assistant, pending queue analytics, and department-wide sustainability tracking.',
      badge: 'Faculty Monitored'
    }
  ];

  // Sneak-peek challenges
  const previewChallenges = [
    {
      title: 'Plastic-Free Week Challenge',
      category: 'Waste Reduction',
      points: '+50 Pts',
      duration: '7 Days',
      difficulty: 'Medium',
      participants: '342 joined',
      desc: 'Replace all single-use plastic bags, cups, and cutlery with reusable alternatives.'
    },
    {
      title: 'Campus Tree Planting Drive',
      category: 'Ecology',
      points: '+75 Pts',
      duration: '1 Day',
      difficulty: 'Easy',
      participants: '512 joined',
      desc: 'Plant native saplings at designated campus green zones and document root placement.'
    },
    {
      title: 'Dorm Energy Saver Sprint',
      category: 'Energy',
      points: '+100 Pts',
      duration: '5 Days',
      difficulty: 'Hard',
      participants: '215 joined',
      desc: 'Cut non-essential phantom power, maximize natural ventilation, and log wattage drops.'
    }
  ];

  // GreenHUB preview posts
  const previewPosts = [
    {
      author: 'Priya Sharma',
      dept: 'Environmental Science',
      challenge: 'Plastic-Free Week Challenge',
      points: '+50',
      content: 'Just completed 7 days with zero single-use plastics! Swapped disposable coffee cups for my bamboo flask and bought groceries in cloth bags. Small habits create massive collective impact! 🌿✨',
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      likes: 48,
      comments: 6
    },
    {
      author: 'Rahul Kumar',
      dept: 'Computer Science',
      challenge: 'Campus Tree Planting',
      points: '+75',
      content: 'Planted 3 neem saplings behind Block 2 with our hostel wing. Can’t wait to see them grow into shade trees over our 4 college years! 🌳💚',
      image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
      likes: 62,
      comments: 11
    }
  ];

  const faqs = [
    {
      q: 'Who can participate in EcoGenius?',
      a: 'All students, research scholars, faculty, and administrative staff of Sri Eshwar College of Engineering can participate using their college email.'
    },
    {
      q: 'How do I earn Eco-Points and Badges?',
      a: 'Join active challenges in the Challenges tab, complete the prescribed green task, and upload clear photo proof. Once verified by faculty administrators, points and badges are instantly credited!'
    },
    {
      q: 'Can I share my own posts on GreenHUB?',
      a: 'Yes! Students can post updates, photos of their environmental activities, challenge victories, or sustainability tips directly in the GreenHUB feed, as well as like and comment on friends’ posts.'
    },
    {
      q: 'What can I redeem with my points in the Eco-Store?',
      a: 'Points can be redeemed for campus cafeteria food vouchers, eco-friendly bamboo stationery, stainless steel bottles, tree planting certificates, and end-of-semester honors.'
    }
  ];

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#1F2937',
      backgroundColor: '#F9FBFA',
      minHeight: '100vh',
      overflowX: 'hidden'
    }}>
      {/* Top Navigation Bar */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(46, 125, 50, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
        padding: '14px 28px'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Brand Logo */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1B5E20, #4CAF50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '22px',
              boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
            }}>
              🌱
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#1B5E20', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                EcoGenius
              </div>
              <div style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600' }}>
                Sri Eshwar College of Engineering
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
            <a href="#impact" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Impact</a>
            <a href="#features" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Pillars</a>
            <a href="#challenges" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px', fontWeight: '600' }}>Challenges</a>
            <a href="#greenhub" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px', fontWeight: '600' }}>GreenHUB</a>
            <a href="#faq" style={{ textDecoration: 'none', color: '#374151', fontSize: '14px', fontWeight: '600' }}>FAQ</a>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <button
                onClick={() => onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'dashboard')}
                style={{
                  background: 'linear-gradient(135deg, #2E7D32, #1B5E20)',
                  color: 'white',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(46, 125, 50, 0.25)'
                }}
              >
                Go to Dashboard 🚀
              </button>
            ) : (
              <>
                <button
                  onClick={onAdminClick}
                  style={{
                    backgroundColor: '#FFF3E0',
                    color: '#E65100',
                    border: '1px solid #FFE0B2',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Admin Portal 🛡️
                </button>
                <button
                  onClick={onGetStarted}
                  style={{
                    background: 'linear-gradient(135deg, #2E7D32, #43A047)',
                    color: 'white',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                  }}
                >
                  Sign In / Register 🌿
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #092612 0%, #134E24 50%, #1B5E20 100%)',
        color: 'white',
        padding: '90px 24px 110px',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative glow overlays */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129, 199, 132, 0.25) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.2) 0%, rgba(0,0,0,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '1.15fr 0.85fr',
          gap: '50px',
          alignItems: 'center'
        }}>
          {/* Left Column: Headlines & CTAs */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '6px 14px',
              borderRadius: '24px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#A5D6A7',
              marginBottom: '22px',
              backdropFilter: 'blur(8px)'
            }}>
              <span>🏛️ Sri Eshwar Sustainability Cell</span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span>Autonomous Green Campus</span>
            </div>

            <h1 style={{
              fontSize: window.innerWidth < 768 ? '34px' : '48px',
              fontWeight: '900',
              lineHeight: 1.15,
              margin: '0 0 20px 0',
              letterSpacing: '-1px'
            }}>
              Where Everyday Green Habits Become <span style={{
                background: 'linear-gradient(90deg, #A5D6A7, #81C784)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Verified Campus Impact</span>.
            </h1>

            <p style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.88)',
              marginBottom: '35px',
              maxWidth: '560px'
            }}>
              Join Sri Eshwar College of Engineering’s student-powered movement. Participate in daily sustainability challenges, share live achievements on GreenHUB, earn Eco-Points, and lead your department to the top of the leaderboard.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '40px' }}>
              <button
                onClick={user ? () => onNavigate('dashboard') : onGetStarted}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '12px',
                  fontWeight: '800',
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>Launch Student Portal</span>
                <span>→</span>
              </button>

              <button
                onClick={onAdminClick}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '14px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🛡️ Faculty & Admin</span>
              </button>
            </div>

            {/* Quick Micro Stats */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.15)',
              paddingTop: '20px'
            }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#A5D6A7' }}>1,850+</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Active Warriors</div>
              </div>
              <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#FFD54F' }}>12+ Depts</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>SECE Campus</div>
              </div>
              <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#81D4FA' }}>98.4%</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Verification Rate</div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card (Interactive Preview) */}
          <div style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            padding: '28px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            {/* Top Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🌱</span>
                <span style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '0.5px' }}>GREENHUB LIVE FEED</span>
              </div>
              <span style={{
                backgroundColor: '#2E7D32',
                color: '#C8E6C9',
                fontSize: '11px',
                fontWeight: '700',
                padding: '3px 8px',
                borderRadius: '12px'
              }}>
                ● REAL-TIME
              </span>
            </div>

            {/* Sample Post Card */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: '#1F2937',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px'
                }}>
                  P
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '14px', color: '#1B5E20' }}>Priya Sharma</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>B.Tech Env Science • Sri Eshwar</div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: '800'
                }}>
                  +50 Eco-Pts
                </div>
              </div>

              <div style={{ fontSize: '13px', lineHeight: 1.5, color: '#374151', marginBottom: '12px' }}>
                Completed 7 days of <strong>Plastic-Free Week Challenge</strong>! Carried my copper flask and zero disposable food wrapping across college labs. 🌿
              </div>

              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80"
                alt="Proof"
                style={{
                  width: '100%',
                  height: '140px',
                  objectFit: 'cover',
                  borderRadius: '10px',
                  marginBottom: '12px'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B7280', paddingTop: '8px', borderTop: '1px solid #F3F4F6' }}>
                <span>❤️ 48 Likes</span>
                <span>💬 6 Comments</span>
                <span style={{ color: '#2E7D32', fontWeight: '700' }}>✓ Faculty Verified</span>
              </div>
            </div>

            {/* Floating Banner */}
            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <span>🏆 <strong>CSE Dept</strong> currently leads with 4,820 points</span>
              <span style={{ color: '#FFD54F', fontWeight: '700' }}>Rank #1</span>
            </div>
          </div>
        </div>
      </header>

      {/* Impact Numbers Section */}
      <section id="impact" style={{
        maxWidth: '1200px',
        margin: '-50px auto 70px',
        padding: '0 20px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.08)',
          padding: '36px 28px',
          border: '1px solid #E5E7EB',
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(4, 1fr)',
          gap: '24px'
        }}>
          {impactStats.map((stat, idx) => (
            <div key={idx} style={{
              textAlign: 'center',
              padding: '12px',
              borderRight: (idx < 3 && window.innerWidth >= 768) ? '1px solid #F3F4F6' : 'none'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '26px', fontWeight: '900', color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937', marginBottom: '4px' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                {stat.detail}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Pillars / Features */}
      <section id="features" style={{
        maxWidth: '1200px',
        margin: '0 auto 90px',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '55px' }}>
          <div style={{
            color: '#2E7D32',
            fontWeight: '800',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            THE ECOGENIUS ECOSYSTEM
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: '900', color: '#111827', margin: '0 0 14px 0' }}>
            Built for Authentic, Measurable Sustainability
          </h2>
          <p style={{ fontSize: '16px', color: '#4B5563', maxWidth: '640px', margin: '0 auto' }}>
            Transforming environmental consciousness into daily competitive campus culture with state-of-the-art verification and community recognition.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
          gap: '28px'
        }}>
          {pillars.map((pillar, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '18px'
              }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#E8F5E9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {pillar.icon}
                </div>
                <span style={{
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}>
                  {pillar.badge}
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1F2937', margin: '0 0 10px 0' }}>
                {pillar.title}
              </h3>

              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#4B5563', margin: 0, flex: 1 }}>
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Challenges Grid */}
      <section id="challenges" style={{
        backgroundColor: '#EBF4EC',
        padding: '80px 24px',
        marginBottom: '90px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
            <div>
              <div style={{ color: '#2E7D32', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                CAMPUS MISSIONS
              </div>
              <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', margin: 0 }}>
                Popular Active Challenges
              </h2>
            </div>
            <button
              onClick={user ? () => onNavigate('challenges') : onGetStarted}
              style={{
                backgroundColor: '#2E7D32',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              View All 15+ Challenges →
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
            gap: '24px'
          }}>
            {previewChallenges.map((challenge, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #D1E7D3',
                boxShadow: '0 6px 18px rgba(46, 125, 50, 0.06)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    backgroundColor: '#E8F5E9',
                    color: '#2E7D32',
                    fontSize: '11px',
                    fontWeight: '800',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    {challenge.category}
                  </span>
                  <span style={{ fontWeight: '800', color: '#FF6B35', fontSize: '14px' }}>
                    {challenge.points}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#1F2937', margin: '0 0 10px 0' }}>
                  {challenge.title}
                </h3>

                <p style={{ fontSize: '13px', color: '#4B5563', lineHeight: 1.5, margin: '0 0 20px 0', flex: 1 }}>
                  {challenge.desc}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: '#6B7280',
                  paddingTop: '14px',
                  borderTop: '1px solid #F3F4F6',
                  marginBottom: '16px'
                }}>
                  <span>⏱️ {challenge.duration}</span>
                  <span>👥 {challenge.participants}</span>
                  <span style={{ color: '#2E7D32', fontWeight: '700' }}>● {challenge.difficulty}</span>
                </div>

                <button
                  onClick={user ? () => onNavigate('challenges') : onGetStarted}
                  style={{
                    width: '100%',
                    backgroundColor: '#F0FDF4',
                    color: '#166534',
                    border: '1.5px solid #BBF7D0',
                    padding: '10px',
                    borderRadius: '8px',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Join Challenge 🚀
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GreenHUB Showcase Preview */}
      <section id="greenhub" style={{
        maxWidth: '1200px',
        margin: '0 auto 90px',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ color: '#2E7D32', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            STUDENT COLLABORATION
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: '900', color: '#111827', margin: '0 0 14px 0' }}>
            🌱 GreenHUB Social Network
          </h2>
          <p style={{ fontSize: '16px', color: '#4B5563', maxWidth: '640px', margin: '0 auto' }}>
            A dedicated social stream where students post their proof photos, write sustainability updates, celebrate eco milestones, and exchange practical tips.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '30px'
        }}>
          {previewPosts.map((post, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #E5E7EB',
              padding: '24px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#1B5E20',
                  color: 'white',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px'
                }}>
                  {post.author.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '15px', color: '#111827' }}>{post.author}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{post.dept} • Sri Eshwar</div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  backgroundColor: '#E8F5E9',
                  color: '#2E7D32',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '800'
                }}>
                  {post.points} Pts
                </div>
              </div>

              <div style={{
                fontSize: '11px',
                fontWeight: '700',
                color: '#2E7D32',
                backgroundColor: '#F0FDF4',
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'inline-block',
                marginBottom: '10px'
              }}>
                ✓ {post.challenge}
              </div>

              <p style={{ fontSize: '14px', lineHeight: 1.5, color: '#374151', margin: '0 0 14px 0' }}>
                {post.content}
              </p>

              <img
                src={post.image}
                alt="Post proof"
                style={{
                  width: '100%',
                  height: '220px',
                  objectFit: 'cover',
                  borderRadius: '12px',
                  marginBottom: '14px'
                }}
              />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                fontSize: '13px',
                color: '#6B7280',
                paddingTop: '12px',
                borderTop: '1px solid #F3F4F6'
              }}>
                <span>❤️ {post.likes} Likes</span>
                <span>💬 {post.comments} Comments</span>
                <span style={{ marginLeft: 'auto', color: '#2E7D32', fontWeight: '700' }}>Active in GreenHUB</span>
              </div>
            </div>
          ))}
        </div>

        {/* Callout box to post in GreenHUB */}
        <div style={{
          marginTop: '35px',
          backgroundColor: '#F0FDF4',
          border: '2px dashed #86EFAC',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#166534', margin: '0 0 6px 0' }}>
            Want to share your own sustainability journey?
          </h4>
          <p style={{ fontSize: '14px', color: '#15803D', margin: '0 0 16px 0' }}>
            Log in to post photos, report challenge milestones, and inspire thousands of peers across campus!
          </p>
          <button
            onClick={user ? () => onNavigate('dashboard') : onGetStarted}
            style={{
              backgroundColor: '#16A34A',
              color: 'white',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Create Your First Post in GreenHUB 🌿
          </button>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" style={{
        maxWidth: '900px',
        margin: '0 auto 100px',
        padding: '0 24px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: '#2E7D32', fontWeight: '800', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            GOT QUESTIONS?
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#111827', margin: 0 }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                padding: '18px 22px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#1F2937' }}>
                  {faq.q}
                </span>
                <span style={{ fontSize: '18px', color: '#2E7D32', fontWeight: '800' }}>
                  {activeFaq === idx ? '−' : '+'}
                </span>
              </div>
              {activeFaq === idx && (
                <div style={{ fontSize: '14px', color: '#4B5563', lineHeight: 1.6, marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F3F4F6' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final Call to Action */}
      <section style={{
        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
        color: 'white',
        padding: '70px 24px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '750px', margin: '0 auto' }}>
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🌍</div>
          <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '0 0 16px 0', letterSpacing: '-0.5px' }}>
            Ready to Lead the Green Revolution at Sri Eshwar?
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.88)', margin: '0 0 30px 0', lineHeight: 1.6 }}>
            Sign in with your student credentials or faculty portal to start tracking verified carbon savings, earning Eco-Points, and sharing your impact on GreenHUB today.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={user ? () => onNavigate('dashboard') : onGetStarted}
              style={{
                backgroundColor: 'white',
                color: '#1B5E20',
                border: 'none',
                padding: '14px 30px',
                borderRadius: '10px',
                fontWeight: '900',
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
              }}
            >
              Get Started as Student 🚀
            </button>
            <button
              onClick={onAdminClick}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                padding: '14px 24px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Faculty Review Portal 🛡️
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#111827',
        color: '#9CA3AF',
        padding: '50px 24px 30px',
        fontSize: '13px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 1fr 1fr 1.5fr',
          gap: '35px',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>🌱</span>
              <span style={{ color: 'white', fontSize: '18px', fontWeight: '800' }}>EcoGenius</span>
            </div>
            <p style={{ lineHeight: 1.6, color: '#9CA3AF', margin: 0 }}>
              The official autonomous sustainability monitoring and gamified action platform for Sri Eshwar College of Engineering, Coimbatore, Tamil Nadu.
            </p>
          </div>

          <div>
            <div style={{ color: 'white', fontWeight: '700', marginBottom: '12px' }}>Navigation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a href="#impact" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Live Impact</a>
              <a href="#features" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Core Pillars</a>
              <a href="#challenges" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Challenges</a>
              <a href="#greenhub" style={{ color: '#9CA3AF', textDecoration: 'none' }}>GreenHUB Feed</a>
            </div>
          </div>

          <div>
            <div style={{ color: 'white', fontWeight: '700', marginBottom: '12px' }}>Portals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span onClick={onGetStarted} style={{ cursor: 'pointer', color: '#9CA3AF' }}>Student Login</span>
              <span onClick={onGetStarted} style={{ cursor: 'pointer', color: '#9CA3AF' }}>New Registration</span>
              <span onClick={onAdminClick} style={{ cursor: 'pointer', color: '#9CA3AF' }}>Admin & Faculty</span>
              <span onClick={onGetStarted} style={{ cursor: 'pointer', color: '#9CA3AF' }}>Eco-Store Rewards</span>
            </div>
          </div>

          <div>
            <div style={{ color: 'white', fontWeight: '700', marginBottom: '12px' }}>Sri Eshwar Campus</div>
            <p style={{ lineHeight: 1.6, margin: 0 }}>
              Kondampatti Post, Vadasithur (via), Kinathukadavu,<br />
              Coimbatore - 641 202, Tamil Nadu, India.<br />
              <strong>Environmental & Energy Conservation Cell</strong>
            </p>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '25px',
          borderTop: '1px solid #1F2937',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            © 2026 Sri Eshwar College of Engineering • EcoGenius Platform. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Verified Green Campus Initiative</span>
            <span>•</span>
            <span>NAAC 'A+' Accredited</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
