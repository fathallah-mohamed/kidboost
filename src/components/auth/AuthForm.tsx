import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { AuthError } from '@supabase/supabase-js';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting authentication:', { isSignUp, email }); // Debug log

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        console.log('SignUp response:', { data, error }); // Debug log
        
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
        console.log('SignIn response:', { data, error }); // Debug log
        
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
      
      // Handle specific error cases
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
          // Handle refresh token error by redirecting to login
          window.location.href = '/login';
          errorMessage = "Votre session a expiré. Veuillez vous reconnecter.";
          break;
        default:
          if (authError.message.includes('weak-password')) {
            errorMessage = "Le mot de passe est trop faible.";
          }
          console.error('Detailed error:', authError); // Debug log
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
      <form onSubmit={handleAuth} className="space-y-4">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </h2>
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