

# Plan : Remplacer le logo par la version propre fournie

## Diagnostic
La capture d'écran montre que le PNG actuel (`src/assets/kidboost-logo.png`) **contient le motif damier comme vrais pixels** — ce n'est pas de la vraie transparence. Même posé sur un badge blanc, le damier reste visible parce qu'il fait partie de l'image.

L'image fournie en upload (`1776689229501.png`) est le vrai logo Kidboost avec une **véritable transparence alpha** (le damier qu'on voit est l'indicateur de transparence du visualiseur, pas des pixels).

## Solution

### 1. Remplacer l'asset source
- Copier `user-uploads://1776689229501.png` → `src/assets/kidboost-logo.png` (écrase l'ancien fichier corrompu)
- Tous les composants qui importent `@/assets/kidboost-logo.png` bénéficient automatiquement du nouveau visuel sans changement de code

### 2. Régénérer les favicons et icônes PWA depuis le bon source
À partir du nouveau PNG transparent, regénérer (script Node + sharp, fond blanc carré aplati) :
- `public/favicon-16.png` (16×16)
- `public/favicon-32.png` (32×32)
- `public/apple-touch-icon.png` (180×180, fond blanc, padding 10%)
- `public/icon-192.png` (192×192, fond blanc, padding 10%)
- `public/icon-512.png` (512×512, fond blanc, padding 10%)

### 3. Ajuster le composant `Logo.tsx`
Le badge blanc reste utile sur les fonds cream/colorés, mais maintenant que le logo a une vraie transparence il doit aussi pouvoir s'afficher **sans badge** proprement (ex: directement sur un fond blanc). Pas de changement de code nécessaire — `badge={false}` existe déjà.

Vérifier que le padding du badge est suffisant pour que le mot "Kidboost" du logo respire bien.

### 4. Nettoyer
- Supprimer `src/assets/kidboost-logo-clean.png` (créé lors de la tentative précédente, plus utilisé)

## Fichiers touchés

**Remplacés (binaires) :**
- `src/assets/kidboost-logo.png` ← nouveau logo transparent propre
- `public/favicon-16.png`, `public/favicon-32.png`
- `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`

**Supprimés :**
- `src/assets/kidboost-logo-clean.png` (orphelin)

**Inchangés :**
- `src/components/ui/Logo.tsx` (le composant fonctionne déjà bien, c'était l'asset le problème)
- Tous les fichiers utilisant `<Logo />` (Index, Auth, AuthForm, DashboardHeader)
- `index.html`, `public/site.webmanifest`

## Vérification
1. Page d'accueil mobile → logo net dans le badge blanc, **sans damier visible**
2. Favicon onglet navigateur → mascotte Kidboost orange visible
3. Ajout à l'écran d'accueil Android → icône carrée blanche avec mascotte centrée

