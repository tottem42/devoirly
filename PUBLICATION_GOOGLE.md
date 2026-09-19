# Préparer Devoirly pour d'autres parents

## 1. Pourquoi un seul Client ID suffit

Chaque parent peut se connecter avec **son propre compte Google**. Le Client ID OAuth identifie Devoirly, pas le parent. Le bouton "Se connecter avec Google" déclenche le flux Google via l'API Chrome Identity.

## 2. Pour un test privé

Vous pouvez garder l'écran de consentement Google en mode Test et ajouter quelques comptes Google comme utilisateurs de test. C'est adapté aux essais avec un petit groupe.

## 3. Pour une vraie distribution

Le chemin recommandé est :

1. Créer un projet Google Cloud pour Devoirly.
2. Activer **Google Calendar API**.
3. Configurer Google Auth Platform / écran de consentement avec un type d'audience externe.
4. Créer la fiche Devoirly dans le **Chrome Web Store** afin d'obtenir son ID d'extension stable (32 caractères).
5. Dans Google Cloud, créer un Client OAuth de type **Extension Chrome** et renseigner cet ID d'extension dans le champ *Item ID*.
6. Remplacer `REMPLACEZ_PAR_VOTRE_CLIENT_ID.apps.googleusercontent.com` dans `manifest.json` par le Client ID obtenu.
7. Publier une politique de confidentialité et renseigner les informations de marque/support demandées par Google.
8. Si Google le demande pour les scopes Calendar utilisés, soumettre l'application à la procédure de validation OAuth avant de l'ouvrir largement au public.

## 4. Permissions OAuth demandées

Devoirly 3.1 demande volontairement des scopes plus étroits que l'accès complet à Calendar :

- `https://www.googleapis.com/auth/calendar.events` : lire/créer/modifier les événements nécessaires à la synchronisation ;
- `https://www.googleapis.com/auth/calendar.calendarlist.readonly` : afficher les calendriers accessibles afin que le parent choisisse le calendrier familial.

## 5. Important pour l'ID de l'extension

Un Client OAuth "Extension Chrome" est lié à l'ID exact de l'extension. Pour une distribution publique, utilisez l'ID fourni par le Chrome Web Store. Évitez de configurer définitivement OAuth à partir d'un ID temporaire obtenu avec une extension locale non empaquetée.

## 6. Connexion utilisateur

`chrome.identity.getAuthToken({interactive:true})` ouvre, si nécessaire, le parcours de connexion/consentement Google. Chrome utilise le compte Google associé au profil Chrome (ou un compte Web Google disponible selon la configuration du profil).

Pour permettre un sélecteur de comptes totalement indépendant du profil Chrome, il faudrait remplacer ce mécanisme par un flux OAuth Web personnalisé avec `chrome.identity.launchWebAuthFlow`. Ce n'est pas nécessaire pour la première publication de Devoirly et ajoute nettement plus de complexité.
