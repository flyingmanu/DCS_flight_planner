# DCS data export

Outillage pour extraire les données statiques d'un théâtre DCS (aérodromes,
runways, fréquences...) afin de construire le modèle de données de
`packages/core`.

`Export.lua` est un script de **découverte** : on ne connaît pas encore
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
   - Fichier : pointer vers `Export.lua` (copie-le n'importe où accessible
     depuis ta machine, ex: `Saved Games\DCS\Missions\Export.lua`)

3. **Lancer la mission** (pas besoin d'avion jouable, juste que le trigger
   MISSION START se déclenche — quelques secondes en jeu suffisent avant de
   quitter).

4. **Récupérer `dcs.log`**, en général situé dans :
   - `%USERPROFILE%\Saved Games\DCS\Logs\dcs.log` (version stable)
   - `%USERPROFILE%\Saved Games\DCS.openbeta\Logs\dcs.log` (version beta)

5. **Reconstituer le JSON** (nécessite Node.js installé) :

   ```
   node tools/dcs-export/extract-log.mjs "C:\chemin\vers\dcs.log" tools/dcs-export/output/caucasus-raw.json
   ```

6. **Envoie-moi le fichier généré** (`tools/dcs-export/output/caucasus-raw.json`,
   ou colle son contenu) pour qu'on construise le modèle de données de
   `packages/core` à partir de vraies données.

## En cas d'erreur

- Si `extract-log.mjs` dit qu'aucun marqueur `DCS_EXPORT` n'a été trouvé :
  vérifie que le trigger s'est bien déclenché (regarde dans `dcs.log` s'il y
  a des lignes `SCRIPTING:` autour de l'heure du lancement de la mission).
- Si le script Lua a levé une erreur, elle apparaît dans `dcs.log` préfixée
  par `DCS_EXPORT_ERROR|` — envoie-la moi, ça m'aidera à corriger le script.
