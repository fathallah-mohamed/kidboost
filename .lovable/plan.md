

# Plan : Corriger Google OAuth + bouton déconnexion sur l'onboarding

## Problème 1 — Google ramène à l'écran login

La page revient au formulaire login parce que :
- `redirect_uri` est fixé à `${window.location.origin}/dashboard` au lieu de `window.location.origin` (recommandé par Lovable Cloud Managed OAuth).
- Le code après `result.redirected` essaie quand même de naviguer, ce qui peut créer un état incohérent.

Les logs auth confirment que Google fonctionne **sur l'URL publiée** (`kidboost.lovable.app`) — le souci est en preview/dev, où le `redirect_uri` doit pointer vers la racine pour que le proxy OAuth fasse correctement l'échange de tokens.

### Correctifs `src/components/auth/AuthForm.tsx`
- Changer `redirect_uri: \`${window.location.origin}/dashboard\`` → `redirect_uri: window.location.origin`
- Après `result.redirected === true` → faire `return` simple (pas de navigation manuelle)
- Après tokens reçus → `window.location.href = '/'` (le router redirigera vers `/dashboard` si session active)

## Problème 2 — Pas de moyen de quitter l'onboarding

Quand un utilisateur se connecte sans avoir configuré d'enfant, il est piégé sur l'écran d'onboarding sans bouton de déconnexion ni de retour.

### Correctifs `src/components/onboarding/OnboardingFlow.tsx`
- Ajouter un header en haut avec :
  - Bouton **"Annuler et se déconnecter"** (icône `LogOut`) en haut à droite
  - Action : `await supabase.auth.signOut()` puis `navigate('/login')`
- Toast de confirmation "Déconnexion réussie"
- Style discret (variant ghost) pour ne pas concurrencer les CTA principaux

## Vérification post-changement

```text
1. Preview → "Continuer avec Google" → choix compte → arrive sur /dashboard ✓
2. Login email/pass nouveau compte → onboarding → bouton "Annuler" → /login ✓
3. Login → onboarding → compléter → /dashboard ✓
4. Mot de passe oublié → email → /reset-password → nouveau mdp → login ✓
```

## Notes techniques

- Le proxy OAuth Lovable nécessite `redirect_uri = origin` pour que `/~oauth/callback` intercepte correctement.
- Si Google échoue toujours en preview après le fix, c'est un problème d'allowlist du domaine preview côté Cloud — auquel cas tester sur `kidboost.lovable.app` (publié) confirmera que le code est bon (les logs montrent déjà des logins Google réussis sur l'URL publiée).

