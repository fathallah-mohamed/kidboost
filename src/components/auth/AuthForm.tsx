import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { Separator } from "@/components/ui/separator";

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      console.error('Google auth error:', error);
      const authError = error as AuthError;
      toast({
        variant: "destructive",
        title: "Erreur de connexion Google",
        description: authError.message || "Impossible de se connecter avec Google.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting authentication:', { isSignUp, email });

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        console.log('SignUp response:', { data, error });
        
        if (error) throw error;
        toast({
          title: "Vérifiez votre email",
          description: "Un lien de confirmation vous a été envoyé.",
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log('SignIn response:', { data, error });
        
        if (error) throw error;
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur Kiboost !",
        });
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const authError = error as AuthError;
      let errorMessage = "Une erreur est survenue.";
      
      switch (authError.message) {
        case 'Invalid login credentials':
          errorMessage = "Email ou mot de passe incorrect.";
          break;
        case 'Email not confirmed':
          errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
          break;
        case 'User not found':
          errorMessage = "Aucun compte trouvé avec cet email.";
          break;
        case 'Invalid email':
          errorMessage = "Format d'email invalide.";
          break;
        case 'Password should be at least 6 characters':
          errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
          break;
        case 'Invalid Refresh Token: Refresh Token Not Found':
          window.location.href = '/login';
          errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
          break;
        default:
          if (authError.message.includes('weak-password')) {
            errorMessage = "Le mot de passe est trop faible.";
          }
          console.error('Detailed error:', authError);
          break;
      }

      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isSignUp ? 'Créer un compte' : 'Se connecter'}
      </h2>

      {/* Google Login Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full mb-4 flex items-center justify-center gap-3 h-12 border-2 hover:bg-muted/50 transition-colors"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <span>Connexion en cours...</span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continuer avec Google</span>
          </>
        )}
      </Button>

      <div className="relative my-6">
        <Separator />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
          ou
        </span>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full"
          />
        </div>
        
        {!isSignUp && (
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-right"
          >
            Mot de passe oublié ?
          </button>
        )}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
        </Button>
        <p className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-primary hover:underline"
          >
            {isSignUp ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
          </button>
        </p>
      </form>
    </Card>
  );
};
