import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PixelPanel } from '@/components/game/PixelPanel';
import { PixelButton } from '@/components/game/PixelButton';
import { PixelInput } from '@/components/game/PixelInput';
import { GameBackground } from '@/components/game/GameBackground';
import { motion } from 'framer-motion';
import { Swords, Mail, Lock, User } from 'lucide-react';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Please enter your name').optional(),
});

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    try {
      const validatedData = authSchema.parse({
        email: form.email,
        password: form.password,
        name: isSignUp ? form.name : undefined,
      });

      setLoading(true);
      
      if (isSignUp) {
        const { error } = await signUp(validatedData.email, validatedData.password, validatedData.name);
        if (!error) {
          navigate('/');
        }
      } else {
        const { error } = await signIn(validatedData.email, validatedData.password);
        if (!error) {
          navigate('/');
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <GameBackground />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <PixelPanel variant="dialog" className="p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Swords className="w-10 h-10 text-primary" />
                <h1 className="font-pixel text-xl text-primary text-shadow-pixel">
                  GrindQuest
                </h1>
              </div>
              <p className="font-game text-xl text-muted-foreground">
                {isSignUp ? 'Begin your study adventure!' : 'Welcome back, adventurer!'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                    ADVENTURER NAME
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <PixelInput
                      value={form.name}
                      onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Your name..."
                      className="pl-10"
                    />
                  </div>
                  {errors.name && (
                    <p className="font-game text-sm text-destructive mt-1">{errors.name}</p>
                  )}
                </div>
              )}

              <div>
                <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                  EMAIL
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <PixelInput
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="pl-10"
                  />
                </div>
                {errors.email && (
                  <p className="font-game text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="font-pixel text-[8px] text-muted-foreground block mb-2">
                  PASSWORD
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <PixelInput
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
                {errors.password && (
                  <p className="font-game text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>

              <PixelButton 
                type="submit" 
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? 'Loading...' : isSignUp ? 'Start Adventure' : 'Enter Game'}
              </PixelButton>
            </form>

            {/* Toggle */}
            <div className="text-center mt-6">
              <p className="font-game text-lg text-muted-foreground">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </p>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrors({});
                }}
                className="font-pixel text-[10px] text-primary hover:underline mt-2"
              >
                {isSignUp ? 'SIGN IN' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </PixelPanel>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
