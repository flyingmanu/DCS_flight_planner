# DCS data export

Outillage pour extraire les données statiques d'un théâtre DCS (aérodromes,
runways, fréquences...) afin de construire le modèle de données de
`packages/core`.

`mission_export.lua` est un script de **découverte** : on ne connaît pas encore
précisément quelles méthodes de l'API scripting DCS sont disponibles/utiles,
donc il sonde une liste de méthodes connues sur chaque `Airbase` et inclut
tout ce qui répond. Les champs non supportés par ta version de DCS
ressortiront simplement à `null` — c'est normal et c'est aussi une info utile
pour la suite.

Le script tourne entièrement dans l'environnement Lua sandboxé standard des
missions (aucune modification de `MissionScripting.lua` n'est nécessaire).

## Étapes

1. **Créer une mission de test** dans le Mission Editor DCS, sur le théâtre
   voulu (commencer par Caucasus, inclus gratuitement dans DCS).

2. **Ajouter un trigger** :
   - Type : `MISSION START` (ONCE)
   - Action : `DO SCRIPT FILE`
   - Fichier : pointer vers `mission_export.lua` (copie-le n'importe où
     accessible depuis ta machine, ex: `Saved Games\DCS\Missions\mission_export.lua`)

3. **Lancer la mission** (pas besoin d'avion jouable, juste que le trigger
   MISSION START se déclenche — quelques secondes en jeu suffisent avant de
   quitter).

4. **Récupérer `dcs.log`**, en général situé dans :
   - `%USERPROFILE%\Saved Games\DCS\Logs\dcs.log` (version stable)
   - `%USERPROFILE%\Saved Games\DCS.openbeta\Logs\dcs.log` (version beta)

5. **Envoie-moi directement `dcs.log`** (le fichier, ou son contenu collé) —
   pas besoin de lancer `extract-log.mjs` toi-même, je m'en charge à partir
   du log brut.

`extract-log.mjs` reste dans le repo pour usage interne (c'est ce que
j'exécute de mon côté une fois que tu m'as donné le log) ; tu n'as pas
besoin d'y toucher.

## En cas d'erreur

- Si aucun marqueur `DCS_EXPORT` n'apparaît dans le log : le trigger ne
  s'est probablement pas déclenché — vérifie qu'il y a bien des lignes
  `SCRIPTING:` dans `dcs.log` autour de l'heure du lancement de la mission.
- Si le script Lua a levé une erreur, elle apparaît dans `dcs.log` préfixée
  par `DCS_EXPORT_ERROR|` — envoie-moi cette ligne, ça m'aidera à corriger
  le script.
