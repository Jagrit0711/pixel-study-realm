import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gamepad2, Shield } from 'lucide-react';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelPanel } from '@/components/game/PixelPanel';
import { GameBackground } from '@/components/game/GameBackground';
import { Helmet } from 'react-helmet-async';

export const PrivacyPage = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy - GrindQuest</title>
        <meta name="description" content="Privacy Policy for GrindQuest - Learn how we collect, use, and protect your data." />
      </Helmet>
      
      <div className="min-h-screen relative">
        <GameBackground />
        
        {/* Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-sm"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <Gamepad2 className="w-6 h-6 text-primary" />
              <span className="font-pixel text-sm text-foreground">GrindQuest</span>
            </Link>
            <Link to="/">
              <PixelButton size="sm" variant="secondary" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </PixelButton>
            </Link>
          </div>
        </motion.nav>

        <main className="pt-24 pb-16 px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <PixelPanel className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <Shield className="w-10 h-10 text-primary" />
                  <h1 className="font-pixel text-lg text-foreground">Privacy Policy</h1>
                </div>
                <p className="font-game text-xl text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </PixelPanel>

              <PixelPanel className="space-y-8">
                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">1. Introduction</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    Welcome to GrindQuest, operated by Zylon Labs ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our web application and services.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">2. Information We Collect</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-game text-2xl text-foreground mb-2">Personal Information</h3>
                      <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                        <li>Email address (for account creation and authentication)</li>
                        <li>Display name (chosen by you)</li>
                        <li>Profile avatar preferences</li>
                        <li>Study-related information (subjects, exam schedules, tasks)</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-game text-2xl text-foreground mb-2">Usage Data</h3>
                      <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                        <li>Task completion records and timestamps</li>
                        <li>Points, streaks, and achievement data</li>
                        <li>Squad membership and activity</li>
                        <li>Proof uploads (images, quiz results)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">3. How We Use Your Information</h2>
                  <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                    <li>Provide and maintain the GrindQuest service</li>
                    <li>Track your study progress and award points</li>
                    <li>Enable squad features and accountability</li>
                    <li>Generate personalized reports and insights</li>
                    <li>Improve and optimize our services</li>
                    <li>Communicate important updates</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">4. Data Sharing</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed mb-4">
                    We share information only in the following circumstances:
                  </p>
                  <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                    <li><strong>Squad Members:</strong> Your task activity, proof submissions, and profile are visible to members of squads you join</li>
                    <li><strong>Service Providers:</strong> We use third-party services (cloud hosting, authentication) that process data on our behalf</li>
                    <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">5. Data Security</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    We implement industry-standard security measures including encryption, secure authentication, and regular security audits. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">6. Data Retention</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    We retain your data as long as your account is active. You can request deletion of your account and associated data by contacting us. Some data may be retained for legal compliance or legitimate business purposes.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">7. Your Rights</h2>
                  <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                    <li>Access and download your data</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your account</li>
                    <li>Opt-out of non-essential communications</li>
                    <li>Withdraw consent where applicable</li>
                  </ul>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">8. Cookies and Tracking</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    We use essential cookies for authentication and session management. We do not use third-party tracking or advertising cookies. Local storage may be used to cache application data for better performance.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">9. Children's Privacy</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    GrindQuest is intended for users 13 years and older. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us immediately.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">10. Changes to This Policy</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    We may update this Privacy Policy periodically. We will notify you of significant changes through the app or via email. Continued use after changes constitutes acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">11. Contact Us</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    If you have questions about this Privacy Policy or our practices, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-muted rounded">
                    <p className="font-game text-xl text-foreground">Zylon Labs</p>
                    <p className="font-game text-xl text-muted-foreground">Email: jagrit@zuup.dev</p>
                  </div>
                </section>
              </PixelPanel>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto text-center">
            <span className="font-game text-lg text-muted-foreground">
              © {new Date().getFullYear()} Zylon Labs. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </>
  );
};
