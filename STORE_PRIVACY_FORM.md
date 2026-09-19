# Chrome Web Store — réponses confidentialité (Devoirly 3.2)

## Objectif unique

Devoirly permet aux parents de sélectionner les devoirs affichés dans le cahier de textes Educartable et de les synchroniser dans Google Calendar à la date et à l’horaire choisis. L’extension permet de sélectionner les devoirs ligne par ligne, de les planifier la veille et de les ajouter à un calendrier familial partagé.

## Autorisation `storage`

Devoirly utilise `storage` pour enregistrer localement les préférences de l’utilisateur, notamment les horaires de planification, le décalage par rapport à la date cible et le calendrier sélectionné. Ces données restent dans le profil Chrome de l’utilisateur.

## Autorisation `identity`

Devoirly utilise `identity` uniquement afin de déclencher l’authentification OAuth Google demandée par l’utilisateur et d’obtenir un jeton permettant d’appeler l’API Google Calendar avec les autorisations approuvées par l’utilisateur.

## Autorisation d’accès à l’hôte

Devoirly nécessite un accès limité aux pages `*.educartable.com` afin de lire, uniquement dans le navigateur de l’utilisateur, les devoirs affichés dans le cahier de textes. L’accès à `www.googleapis.com/calendar/*` est nécessaire pour lire la liste des calendriers et synchroniser les événements dans Google Calendar après autorisation explicite de l’utilisateur.

## Code distant

Sélectionner : **Non, je n’utilise pas de code distant.**

Devoirly n’exécute aucun JavaScript ni WebAssembly téléchargé à distance. Tout le code exécutable est inclus dans le package de l’extension. Les requêtes vers Google Calendar sont uniquement des appels d’API de données.

## Données collectées / utilisées

À déclarer :

- **Contenu du site Web** : Devoirly lit le texte et les dates des devoirs visibles sur Educartable afin de les transformer en événements.

Devoirly 3.2 ne demande plus `identity.email` et n’utilise pas l’adresse e-mail du compte Google.

## Certifications

Si le comportement publié reste celui de cette version, cocher les trois déclarations :

1. Je ne vends ni ne transfère les données des utilisateurs à des tiers en dehors des cas d’utilisation approuvés.
2. Je n’utilise ni ne transfère les données des utilisateurs à des fins sans rapport avec la fonctionnalité de base.
3. Je n’utilise ni ne transfère les données des utilisateurs pour déterminer leur solvabilité ou à des fins de prêt.

## URL de politique de confidentialité

Utiliser l’URL GitHub Pages créée à partir du dossier `privacy-site`, par exemple :

`https://VOTRE-NOM-GITHUB.github.io/devoirly-privacy/`
