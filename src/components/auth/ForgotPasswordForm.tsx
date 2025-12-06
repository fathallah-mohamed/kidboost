import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Mail } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export const ForgotPasswordForm = ({ onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: "Email envoyé !",
        description: "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.",
      });
    } catch (error: unknown) {
      console.error('Reset password error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'envoyer l'email de réinitialisation.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="p-6 w-full max-w-md mx-auto">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Email envoyé !</h2>
          <p className="text-muted-foreground">
            Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </p>
          <Button variant="outline" onClick={onBack} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 w-full max-w-md mx-auto">
      <form onSubmit={handleReset} className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </button>
        
        <h2 className="text-2xl font-bold text-center">
          Mot de passe oublié ?
        </h2>
        
        <p className="text-center text-muted-foreground text-sm">
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>
        
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Votre adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
        </Button>
      </form>
    </Card>
  );
};
