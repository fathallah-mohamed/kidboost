

# Plan : Générer une image réaliste pour chaque recette

## Constat
- L'edge function `generate-recipe-image` existe déjà et utilise Lovable AI (Nano Banana / `google/gemini-2.5-flash-image-preview`)
- Mais elle n'est **jamais appelée** dans le flux de génération
- Toutes les recettes héritent d'une image Unsplash générique (`photo-1618160702438-9b02ab6515c9`)

## Solution

### 1. Stockage des images générées
Créer un bucket Storage public `recipe-images` pour héberger les PNG générés (les data:base64 sont trop lourds pour la DB, et un URL stable permet le cache navigateur).

- Bucket public en lecture (les images de recettes ne sont pas sensibles)
- Policies : insert authentifié, select public

### 2. Améliorer `generate-recipe-image`
- Conserver l'appel actuel à Nano Banana
- **Nouveau** : décoder le base64 retourné, uploader dans `recipe-images/{recipeId}.png`, retourner l'URL publique stable au lieu du data URI
- Améliorer le prompt : "photographie culinaire réaliste, vue de dessus 3/4, assiette enfant colorée, lumière naturelle douce, fond bois clair, style food photography pro, appétissant"

### 3. Intégrer dans le flux de génération
Deux options techniquement viables — **je recommande l'option B** (parallèle côté client) :

**Option A** (côté serveur dans `generate-recipe`) : génère les 5 images avant de répondre → bloque l'utilisateur 30-60s, risque de timeout

**Option B** (côté client, parallèle, progressif) ✅ :
- `generate-recipe` retourne les 5 recettes immédiatement avec un placeholder
- Au retour côté client, on lance 5 appels parallèles à `generate-recipe-image` (un par recette)
- Chaque image arrive indépendamment → mise à jour progressive de la carte recette
- Skeleton/spinner sur l'image en attendant
- Sauvegarde de la recette mise à jour quand l'image arrive

### 4. UI : feedback visuel
- `RecipeCard.tsx` et `recipe-card/RecipeHeader.tsx` :
  - État `imageLoading` : skeleton animé (couleur cream) à la place de l'image
  - Fade-in doux quand l'image arrive (`transition-opacity duration-500`)
  - Fallback image générique si la génération échoue (silencieux, pas de toast)

### 5. Hook dédié
Créer `src/components/dashboard/recipe/hooks/useRecipeImageGeneration.ts` :
- `generateImageForRecipe(recipe)` → appelle l'edge function, met à jour la recette dans le state, persiste l'URL dans la table `recipes`
- Géré en arrière-plan, ne bloque jamais l'affichage

## Fichiers touchés

**Modifiés :**
- `supabase/functions/generate-recipe-image/index.ts` — upload Storage + URL publique + meilleur prompt
- `src/components/dashboard/recipe/hooks/useRecipeGeneration.ts` — déclenche les générations d'images en parallèle après le retour
- `src/components/dashboard/recipe/recipe-card/RecipeHeader.tsx` — skeleton + fade-in
- `src/components/dashboard/recipe/RecipeCard.tsx` — état `imageLoading`

**Créés :**
- `src/components/dashboard/recipe/hooks/useRecipeImageGeneration.ts`
- Migration SQL : bucket `recipe-images` + policies RLS storage

## Coût et performance

- Nano Banana ≈ 0.04€ par image, 5 recettes = ~0.20€ par génération de lot
- Génération d'image : 5-10s par recette en parallèle → toutes prêtes en ~10s max
- L'utilisateur voit les recettes immédiatement (texte) puis les images apparaissent une à une

## Vérification

```text
1. Génère 5 recettes → cartes apparaissent immédiatement avec skeleton image
2. ~10s plus tard → 5 images photo-réalistes apparaissent une à une (fade-in)
3. Sauvegarde recette favorite → image persiste sur rechargement
4. Si une image échoue → fallback Unsplash, pas d'erreur bloquante
```

