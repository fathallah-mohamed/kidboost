

# Plan : Tests E2E + corrections des anomalies trouvées

## Méthode
Audit du code des parcours critiques (auth, onboarding, dashboard, génération recette, planning, courses) pour identifier les bugs avant test navigateur. Puis test E2E réel pour valider.

## Anomalies détectées (par sévérité)

### 🔴 Critique — Image générée perdue à la sauvegarde
Dans `RecipeGeneratorPage.tsx`, les recettes générées ont un `id` temporaire de l'IA. `useRecipeImageGeneration` upload l'image avec ce nom et fait un `UPDATE recipes SET image_url WHERE id = tempId` qui ne matche **rien** (la recette n'existe pas encore en DB tant qu'elle n'est pas favorite). Quand l'utilisateur sauvegarde la recette, elle reçoit un **nouveau** UUID DB → l'image_url n'est jamais persistée.

**Fix** : 
- Stocker `image_url` dans le state local et le passer à `saveRecipe` au moment de la sauvegarde
- Modifier `useRecipeSaving` pour inclure `image_url` dans l'INSERT
- Ne tenter l'UPDATE en DB que si la recette est déjà sauvegardée (présente dans `savedRecipes`)

### 🔴 Critique — Redirect Google OAuth incorrect
`AuthForm.handleGoogleLogin` fait `window.location.href = '/'` après succès. La home page n'auto-redirige pas vers `/dashboard` (il faut cliquer sur le bouton). De plus, le rechargement complet de la page interrompt la session juste établie.

**Fix** : remplacer par `window.location.href = '/dashboard'` (ou laisser le router gérer via `<Navigate>` car `/login` redirige déjà vers `/dashboard` quand session existe).

### 🟠 Moyen — Race condition `/reset-password`
Quand l'utilisateur arrive depuis l'email, `checkSession` s'exécute avant que Supabase ait fini de poser la session token → faux négatif → redirige vers `/login` à tort.

**Fix** : écouter `onAuthStateChange` (`PASSWORD_RECOVERY` event) au lieu d'appeler `getSession()` immédiatement.

### 🟠 Moyen — Texte trompeur "Sans inscription obligatoire"
`HeroSection.tsx` affiche "Sans inscription obligatoire • Test gratuit" alors que toutes les fonctionnalités exigent un compte.

**Fix** : remplacer par "Inscription en 30 secondes • Sans engagement".

### 🟡 Mineur — Route `/dashboard/overview` morte
Le nested route `<Route path="overview" element={<Dashboard session={...} />} />` n'est jamais rendu (parent Dashboard renvoie WelcomeSection avant l'`<Outlet />`). Pas de bug fonctionnel mais code mort qui pourrait causer des récursions si modifié.

**Fix** : retirer la nested route `overview`.

### 🟡 Mineur — Type `Recipe.instructions`
Type TS déclare `instructions: string[]` mais la DB stocke un `text` (string). Tous les composants traitent comme string avec `.split('\n')`. Le type est mensonger.

**Fix** : changer le type en `string`.

### 🟡 Mineur — Doublon `useShoppingList`
Deux versions du hook : `shopping/useShoppingList.ts` (ancienne, signature simple) et `shopping/hooks/useShoppingList.ts` (nouvelle, avec ingrédients). Risque d'import incorrect.

**Fix** : supprimer le fichier ancien `shopping/useShoppingList.ts` et migrer le seul consommateur (`Dashboard/ShoppingList.tsx`) vers la version moderne.

## Ordre des corrections

1. Fix image_url perdue (le plus impactant après le travail récent)
2. Fix redirect Google OAuth
3. Fix race `/reset-password`
4. Fix texte HeroSection
5. Nettoyer route morte `/dashboard/overview`
6. Corriger type `Recipe.instructions`
7. Supprimer doublon `useShoppingList`

## Test E2E final (après corrections)

Lancer le browser tool et dérouler le scénario complet :

```text
1. Page d'accueil (déconnecté) → vérifier CTA + texte sans "obligatoire"
2. /signup → créer compte → atterrir sur /onboarding
3. Compléter les 6 étapes → arriver sur /dashboard/overview
4. Cliquer "Voir fiche enfant" → naviguer vers /profile-settings
5. Retour dashboard → cliquer "Recettes" → /recipes
6. /dashboard/generate → sélectionner enfant → générer 3 recettes
   → vérifier que skeleton image apparaît, puis image réelle
7. Sauvegarder une recette favorite → recharger → image toujours présente ✅
8. /planning → ajouter une recette à un slot
9. /shopping-list → vérifier les ingrédients
10. Déconnexion → retour /
```

## Fichiers touchés

**Modifiés :**
- `src/components/dashboard/recipe/RecipeGeneratorPage.tsx`
- `src/components/dashboard/recipe/hooks/useRecipeImageGeneration.ts`
- `src/components/dashboard/recipe/hooks/useRecipeSaving.ts` (ou `useRecipeSavingLogic.ts`)
- `src/components/auth/AuthForm.tsx`
- `src/pages/ResetPassword.tsx`
- `src/components/home/HeroSection.tsx`
- `src/App.tsx` (retrait route `overview`)
- `src/components/dashboard/types/recipe.ts` (type instructions)
- `src/components/dashboard/ShoppingList.tsx` (changement d'import)

**Supprimé :**
- `src/components/dashboard/shopping/useShoppingList.ts` (doublon)

## Vérification

Après les fixes, lancer le test browser end-to-end pour confirmer que chaque étape passe sans erreur console et que l'image générée persiste après sauvegarde.

