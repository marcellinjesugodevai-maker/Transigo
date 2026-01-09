# 🚀 Guide de Déploiement Vercel - TransiGo Admin

Suivez ces étapes pour mettre en ligne votre Admin Dashboard et la Landing Page.

## 1. Préparation (Déjà fait ✅)
- Le code est propre et "pushé" sur GitHub.
- Le fichier `vercel.json` a été créé pour la configuration automatique.
- Les APKs sont prêts dans le dossier public.

## 2. Importer sur Vercel
1. Allez sur [vercel.com/new](https://vercel.com/new).
2. Connectez votre compte GitHub.
3. Importez le repository **"TransiGo V01"** (ou le nom de votre repo).

## 3. Configuration du Projet
Sur l'écran "Configure Project" :

1. **Framework Preset** : `Next.js` (devrait être détecté automatiquement).
2. **Root Directory** : Cliquez sur `Edit` et sélectionnez le dossier **`apps/admin`**.
   - C'est TRÈS IMPORTANT car nous sommes dans un monorepo.
3. **Build & Output Settings** : Laissez par défaut (grâce au fichier `vercel.json`).

## 4. Variables d'Environnement
Dépliez la section **"Environment Variables"** et ajoutez ces deux variables (copiez les valeurs depuis votre fichier `.env` ou Supabase) :

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://zndgvloyaitopczhjddq.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Votre clé ANON publique)* |

*(Si vous ne connaissez pas votre clé ANON, regardez dans `apps/admin/src/lib/supabase.ts` ou sur votre dashboard Supabase)*

## 5. Déployer
1. Cliquez sur **Deploy**.
2. Attendez la fin du build (environ 2-3 minutes).
3. 🎉 Félicitations ! Votre site est en ligne.

## 6. Vérification
- Allez sur l'URL fournie par Vercel (ex: `transigo-admin.vercel.app`).
- Vérifiez que la page de téléchargement fonctionne : `/download`.
- Vérifiez que le téléchargement des APK fonctionne.
