

# Plan : Améliorer le logo Kidboost dans tout le site

## Problème
Le logo PNG actuel (`src/assets/kidboost-logo.png`) :
- A un fond semi-transparent qui rend mal sur le fond cream `#FFF5E4` (effet damier visible)
- Aucun favicon dédié (utilise l'ancien `favicon.ico` générique)
- Pas de version optimisée pour petites tailles (header, mobile)

## Solution

### 1. Conteneur "badge" blanc autour du logo
Créer un composant réutilisable `src/components/ui/Logo.tsx` qui affiche le logo dans un conteneur blanc arrondi avec ombre douce — garantit un rendu propre quel que soit le fond.

```tsx
<Logo size="sm|md|lg" withText={true} />
// → <div class="bg-white rounded-2xl p-2 shadow-sm">
//     <img src={kidboostLogo} ... />
//   </div>
```

Variantes :
- `sm` (h-8) → headers compacts
- `md` (h-12) → header principal, auth
- `lg` (h-20) → hero, splash

### 2. Remplacer toutes les occurrences
Mettre à jour les 4 fichiers utilisant le logo pour utiliser `<Logo />` :
- `src/pages/Index.tsx` (hero + header)
- `src/pages/Auth.tsx`
- `src/components/auth/AuthForm.tsx`
- `src/components/dashboard/layout/DashboardHeader.tsx`

### 3. Favicon + icônes
- Copier le logo source vers `public/` puis générer plusieurs tailles via un script Node (sharp) :
  - `public/favicon-32.png` (32×32)
  - `public/favicon-16.png` (16×16)
  - `public/apple-touch-icon.png` (180×180, fond blanc carré)
  - `public/favicon.svg` (version vectorielle simplifiée si possible, sinon PNG)
- Supprimer l'ancien `public/favicon.ico`
- Mettre à jour `index.html` :
  ```html
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  ```
- `theme-color` : passer de `#FF6B35` à `#FFF5E4` (cohérent avec le fond app) ou garder l'orange (à confirmer — je garde orange car ça matche la mascotte).

### 4. Manifest PWA léger
Créer `public/site.webmanifest` minimal pour que l'icône s'affiche bien quand on ajoute Kidboost à l'écran d'accueil mobile (cas du screenshot fourni où l'utilisateur est sur Android).

### 5. Harmonisation visuelle
- Tous les logos passent par le composant `<Logo />` → uniformité (taille, espacement, ombre, badge blanc)
- Animation `hover-scale` discrète sur les logos cliquables (header)
- Alt text cohérent : `"Kidboost - Planificateur de repas pour enfants"`

## Fichiers touchés

**Créés :**
- `src/components/ui/Logo.tsx`
- `public/favicon-16.png`, `public/favicon-32.png`, `public/apple-touch-icon.png`
- `public/site.webmanifest`

**Modifiés :**
- `index.html` (liens favicon + manifest)
- `src/pages/Index.tsx`
- `src/pages/Auth.tsx`
- `src/components/auth/AuthForm.tsx`
- `src/components/dashboard/layout/DashboardHeader.tsx`

**Supprimé :**
- `public/favicon.ico`

## Vérification
1. Page d'accueil → logo dans badge blanc, net, sans damier
2. Onglet navigateur → favicon Kidboost visible (pas le générique)
3. Mobile Android → ajout à l'écran d'accueil utilise l'icône carrée blanche avec mascotte
4. Dashboard, Auth, Index → logo cohérent partout

