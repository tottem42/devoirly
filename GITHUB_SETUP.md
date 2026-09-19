# Publier Devoirly sur GitHub

## 1. Creer le depot

Sur GitHub, creez un depot public nomme `devoirly`.

Ne cochez pas l'ajout automatique d'un README, d'un .gitignore ou d'une licence, car ils sont deja presents/localement prepares.

## 2. Initialiser le depot local

Depuis le dossier `devoirly-github-repo` :

```bash
git init
git add .
git commit -m "Initial release: Devoirly 3.2"
git branch -M main
git remote add origin https://github.com/VOTRE-UTILISATEUR/devoirly.git
git push -u origin main
```

Remplacez `VOTRE-UTILISATEUR` par votre nom GitHub.

## 3. Activer GitHub Pages pour la politique de confidentialite

Dans GitHub :

1. `Settings` -> `Pages`
2. Sous `Build and deployment`, choisissez `Deploy from a branch`
3. Branch : `main`
4. Folder : `/docs`
5. Enregistrez.

La politique de confidentialite sera ensuite disponible a l'adresse :

`https://VOTRE-UTILISATEUR.github.io/devoirly/`

Utilisez cette URL dans le Chrome Web Store.

## 4. Configurer Google OAuth avant publication

Dans `manifest.json`, remplacez :

`REMPLACEZ_PAR_VOTRE_CLIENT_ID.apps.googleusercontent.com`

par le Client ID OAuth Google lie a l'ID definitif de l'extension Chrome Web Store.

Ne publiez jamais de secret client dans ce depot. Une extension Chrome utilise un Client ID public, mais aucun `client_secret` ne doit etre inclus.
