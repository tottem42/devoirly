# Devoirly 3.3

**Les devoirs dans l'agenda, simplement.**

Devoirly est une extension Chrome qui lit les devoirs affiches sur Educartable et permet aux parents de les synchroniser dans Google Calendar.

## Fonctionnalites

- lecture des devoirs affiches sur Educartable ;
- selection ligne par ligne, utile pour les classes a double niveau ;
- planification automatique la veille ;
- horaire configurable, 18 h - 19 h par defaut ;
- connexion Google via OAuth ;
- choix d'un calendrier Google modifiable, y compris un calendrier familial partage ;
- synchronisation idempotente pour eviter les doublons ;
- mise a jour et suppression des evenements Devoirly si la selection change ;
- export `.ics` en solution de secours.

## Installation locale

1. Clonez ou telechargez ce depot.
2. Ouvrez `chrome://extensions`.
3. Activez **Mode developpeur**.
4. Cliquez sur **Charger l'extension non empaquetee**.
5. Selectionnez la racine de ce depot.

La lecture Educartable fonctionne immediatement. L'integration Google Calendar necessite un Client ID OAuth valide : voir `PUBLICATION_GOOGLE.md`.

## Utilisation

1. Ouvrez Educartable et affichez la page **Devoirs**.
2. Ouvrez Devoirly.
3. Cochez ou decochez les lignes utiles.
4. Connectez votre compte Google.
5. Choisissez le calendrier cible.
6. Cliquez sur **Synchroniser Google**.

Un devoir prevu pour le mardi est place par defaut le lundi de 18:00 a 19:00. Ces reglages sont modifiables.

## Confidentialite

Devoirly ne possede pas de serveur intermediaire. Les devoirs lus sur Educartable restent dans le navigateur et ne sont envoyes a Google Calendar que lorsque l'utilisateur declenche la synchronisation.

La politique de confidentialite publique se trouve dans `docs/index.html` et peut etre publiee avec GitHub Pages.

## Permissions Chrome

La version 3.2 utilise uniquement les permissions necessaires a sa fonction principale :

- `storage` pour conserver les preferences locales ;
- `identity` pour l'authentification OAuth Google ;
- acces aux pages Educartable necessaires au content script ;
- acces a l'API Google Calendar.

Devoirly n'execute aucun code JavaScript ou WebAssembly distant.

## Publication

- `GITHUB_SETUP.md` : mise en ligne du projet et GitHub Pages ;
- `PUBLICATION_GOOGLE.md` : configuration OAuth Google ;
- `STORE_PRIVACY_FORM.md` : aide pour le formulaire de confidentialite du Chrome Web Store ;
- `PRIVACY.md` : version Markdown de la politique de confidentialite.

## Statut du projet

Devoirly est un projet independant et n'est ni edite, ni sponsorise, ni affilie a Educartable ou Google.


## Correction 3.3 — synchronisation sans doublons

La synchronisation Google utilise désormais un identifiant d'événement déterministe par journée de devoirs. Une modification de la sélection des lignes met donc à jour l'événement existant au lieu d'en créer un nouveau. La version 3.3 sait également reconnaître et reprendre les événements Devoirly créés par les versions précédentes à partir de leur titre, puis supprimer les doublons éventuels lors de la synchronisation.
