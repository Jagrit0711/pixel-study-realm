import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Gamepad2, ScrollText } from 'lucide-react';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelPanel } from '@/components/game/PixelPanel';
import { GameBackground } from '@/components/game/GameBackground';
import { Helmet } from 'react-helmet-async';

export const TermsPage = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - GrindQuest</title>
        <meta name="description" content="Terms of Service for GrindQuest - Read our terms and conditions for using the service." />
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
                  <ScrollText className="w-10 h-10 text-primary" />
                  <h1 className="font-pixel text-lg text-foreground">Terms of Service</h1>
                </div>
                <p className="font-game text-xl text-muted-foreground">
                  Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </PixelPanel>

              <PixelPanel className="space-y-8">
                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">1. Agreement to Terms</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    By accessing or using GrindQuest ("the Service"), operated by Zylon Labs ("we," "our," or "us"), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Service.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">2. Description of Service</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    GrindQuest is a gamified study accountability platform that allows users to track study tasks, earn points, form squads for accountability, and submit proof of completed work. The Service includes web and progressive web application interfaces.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">3. User Accounts</h2>
                  <div className="space-y-4">
                    <p className="font-game text-xl text-muted-foreground leading-relaxed">
                      To use certain features, you must create an account. You agree to:
                    </p>
                    <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                      <li>Provide accurate and complete information</li>
                      <li>Maintain the security of your account credentials</li>
                      <li>Accept responsibility for all activities under your account</li>
                      <li>Notify us immediately of any unauthorized access</li>
                      <li>Be at least 13 years of age</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">4. Acceptable Use</h2>
                  <div className="space-y-4">
                    <p className="font-game text-xl text-muted-foreground leading-relaxed">
                      You agree NOT to:
                    </p>
                    <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                      <li>Use the Service for any illegal purpose</li>
                      <li>Submit false or misleading proof of task completion</li>
                      <li>Harass, abuse, or harm other users</li>
                      <li>Attempt to manipulate points, streaks, or leaderboards</li>
                      <li>Upload malicious content or malware</li>
                      <li>Impersonate others or misrepresent your identity</li>
                      <li>Interfere with the proper functioning of the Service</li>
                      <li>Scrape or collect user data without permission</li>
                      <li>Create multiple accounts to circumvent rules</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">5. User Content</h2>
                  <div className="space-y-4">
                    <p className="font-game text-xl text-muted-foreground leading-relaxed">
                      You retain ownership of content you upload (proof images, task descriptions, etc.). By uploading, you grant us a license to store, display, and process this content for Service operation.
                    </p>
                    <p className="font-game text-xl text-muted-foreground leading-relaxed">
                      You are responsible for ensuring your content does not violate any laws or third-party rights. We may remove content that violates these terms.
                    </p>
                  </div>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">6. Squad Features</h2>
                  <div className="space-y-4">
                    <p className="font-game text-xl text-muted-foreground leading-relaxed">
                      Squad features allow users to form groups for accountability. By joining a squad:
                    </p>
                    <ul className="font-game text-xl text-muted-foreground list-disc list-inside space-y-2">
                      <li>Your task activity and proof submissions become visible to squad members</li>
                      <li>Squad members may approve or reject your proof submissions</li>
                      <li>You agree to review others' proofs fairly and in good faith</li>
                      <li>Malicious or unfair rejections may result in account action</li>
                    </ul>
                  </div>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">7. Points and Rewards</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    Points earned within GrindQuest have no monetary value and cannot be exchanged for real currency. We reserve the right to adjust, reset, or modify the points system at any time. Any attempt to manipulate or cheat the points system may result in account termination.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">8. Intellectual Property</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    The Service, including its design, graphics, code, and content (excluding user content), is owned by Zylon Labs and protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without explicit permission.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">9. Disclaimer of Warranties</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR MEET YOUR SPECIFIC REQUIREMENTS. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">10. Limitation of Liability</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZYLON LABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, IF ANY.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">11. Termination</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    We may suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion. You may delete your account at any time. Upon termination, your right to use the Service ceases immediately.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">12. Changes to Terms</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    We reserve the right to modify these terms at any time. We will notify users of significant changes through the app or via email. Continued use after changes constitutes acceptance of the new terms.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">13. Governing Law</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    These terms shall be governed by and construed in accordance with the laws of India, without regard to conflict of law principles. Any disputes shall be resolved in the courts of India.
                  </p>
                </section>

                <section>
                  <h2 className="font-pixel text-[10px] text-foreground mb-4">14. Contact Information</h2>
                  <p className="font-game text-xl text-muted-foreground leading-relaxed">
                    For questions about these Terms of Service, please contact us at:
                  </p>
                  <div className="mt-4 p-4 bg-muted rounded">
                    <p className="font-game text-xl text-foreground">Zylon Labs</p>
                    <p className="font-game text-xl text-muted-foreground">Email: legal@zylonlabs.com</p>
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
