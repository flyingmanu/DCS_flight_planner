# Étape 0 — Tester la chaîne voix (SkyEye) et le comportement des avions IA

Objectif : vérifier **sur ton PC, en solo, sur le Caucase**, avant d'écrire la moindre ligne de code, que :

1. la chaîne voix fonctionne (tu parles dans SRS → un contrôleur te comprend → il te répond à la voix) ;
2. ça ne fait pas trop chuter tes images par seconde dans DCS ;
3. les avions IA de DCS se laissent « retenir » et « relâcher » comme un contrôleur en aurait besoin.

Aucune modification de DCS n'est nécessaire pour cette étape. Durée estimée : 1 h à 1 h 30.

---

## ⚠️ Deux choses à savoir avant de commencer

**1. SkyEye doit utiliser ta carte graphique, pas ton processeur.**
Son auteur est très clair : faire tourner la reconnaissance vocale **sur le processeur** du même PC que DCS « ne marchera probablement pas ». Il faut prendre la version **« Vulkan »** de SkyEye, qui utilise la carte graphique (environ **2 Go de mémoire vidéo**). C'est précisément ce qu'on veut mesurer : est-ce que ta RTX 3080 supporte DCS + ces 2 Go.

**2. L'auteur de SkyEye pense qu'un ATC est impossible à cause des avions IA de DCS.**
Il écrit (en résumé) : les IA de DCS ne se séquencent pas à l'atterrissage, ne commencent leur approche que si toute l'approche et la piste sont libres, ne savent pas faire d'attente ni de remise des gaz, et ne cherchent pas à se séparer des autres avions.
Ce n'est pas une raison d'abandonner, mais c'est **le risque n°1 du projet**. La partie B de ce test sert exactement à mesurer jusqu'où on peut contourner ces limites (en les faisant tourner en rond, puis en les relâchant une par une). Je préfère qu'on le sache maintenant plutôt qu'après des semaines de travail.

---

## Partie A — La chaîne voix avec SkyEye

### A1. Relever la mémoire de ta carte graphique (répond à une de mes questions)

1. Ouvre le **Gestionnaire des tâches** (Ctrl + Maj + Échap) → onglet **Performance** → **GPU**.
2. Note la valeur **« Mémoire GPU dédiée »** (total : 10 Go ou 12 Go).
3. Garde cette fenêtre de côté : pendant le test, tu y verras combien DCS en consomme.

### A2. Préparer Tacview (tu l'as déjà)

1. Dans DCS : **OPTIONS → SPECIAL → Tacview**.
2. Active **Real-Time Telemetry** (télémétrie temps réel). Laisse le port par défaut (**42674**).
3. Si tu mets un mot de passe, note-le (on le recopiera dans la configuration de SkyEye).

### A3. Préparer le serveur SRS (tu l'as déjà)

SkyEye se connecte à SRS comme un « AWACS externe ». Il faut l'autoriser :

1. Lance **SR-Server.exe** (dans le dossier d'installation de SRS).
2. Active **External AWACS Mode (EAM)**. La fenêtre du serveur doit afficher **ON** à côté de « External AWACS Mode ».
3. Définis un **mot de passe EAM** pour la coalition bleue. Selon ta version de SRS, c'est soit dans la fenêtre du serveur, soit dans le fichier `server.cfg` à côté de `SR-Server.exe` (ligne du type `EXTERNAL_AWACS_MODE_BLUE_PASSWORD=...`). Note ce mot de passe.
4. Ton client SRS habituel devra se connecter à ce serveur local : adresse **`127.0.0.1`** (ou `localhost`), port **5002**.

### A4. Installer SkyEye (version carte graphique)

1. Mets à jour ton pilote NVIDIA : <https://www.nvidia.com/fr-fr/drivers/>.
2. Va sur <https://github.com/dharmab/skyeye/releases> et télécharge le fichier **`skyeye-windows-amd64-vulkan.zip`**.
   ⚠️ **Pas** `skyeye-windows-amd64.zip` (c'est la version processeur).
3. Décompresse-le dans un dossier simple, par exemple `C:\SkyEye`.
4. Télécharge le modèle de reconnaissance vocale **`ggml-small.en.bin`** :
   <https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin>
   et place-le dans `C:\SkyEye`.
5. Installe un éditeur de texte correct si tu n'en as pas (l'auteur recommande **Visual Studio Code** : <https://code.visualstudio.com>). Le Bloc-notes marche mais c'est facile d'y casser les décalages de lignes, qui comptent dans ces fichiers.

### A5. Configurer SkyEye

Ouvre `C:\SkyEye\config.yaml`. Les lignes qui commencent par `#` sont des commentaires : pour activer un réglage, **enlève le `#` au début de la ligne** (sans laisser d'espace avant le mot). Les réglages à activer/modifier :

```yaml
recognizer: openai-whisper-local
telemetry-address: localhost:42674
srs-server-address: localhost:5002
srs-eam-password: TON_MOT_DE_PASSE_EAM
srs-frequencies: 251.0AM
callsign: Focus
coalition: blue
```

- Si tu as mis un mot de passe Tacview à l'étape A2, active aussi `telemetry-password: ...`.
- La fréquence `251.0AM` est un choix pour le test ; prends-en une que ton avion peut régler (ex. F-16 : 225–399,975 MHz sur COM1).

Ouvre ensuite `C:\SkyEye\skyeye-service.yml` et indique où est le modèle :

```yaml
whisper-model: C:\SkyEye\ggml-small.en.bin
```

### A6. La mission de test (éditeur de mission, Caucase)

Mission simple, sans script :

- **Toi** : un avion de ton choix (F-16C ou F/A-18C conseillé), **en vol**, côté bleu, à environ 30 NM à l'ouest de Kutaisi, 20 000 ft.
  - Dans les propriétés de ton avion, nomme le pilote **`Viper 11`** (un mot anglais + 2 chiffres : c'est ce que SkyEye sait reconnaître).
  - Mets aussi ton **pseudo DCS** sous la forme `Viper 11 | TonPseudo` si possible (écran Multijoueur → pseudo). SkyEye reconnaît ton avion par ce nom dans Tacview.
- **Des ennemis** : 2 MiG-29 rouges IA, en vol, à ~60 NM au nord-est de toi, qui volent vers le sud.
- (Optionnel) un bullseye bleu près de Kutaisi.

Évite les indicatifs qui ressemblent à des mots de brevity ou à des chiffres (« Spade », « Knight », « Fort »…).

### A7. Lancer et tester

1. Lance **SR-Server.exe** (EAM sur ON).
2. Lance DCS, charge la mission, **ne la mets pas en pause**.
3. Lance ton **client SRS** et connecte-le à `127.0.0.1`.
4. Ouvre **PowerShell**, va dans le dossier de SkyEye et démarre-le :
   ```powershell
   cd C:\SkyEye
   ./skyeye-service.exe install
   ./skyeye-service.exe start
   ./skyeye-service.exe status
   ```
5. Ouvre le fichier `C:\SkyEye\skyeye-service.err.log` : s'il se remplit de lignes **WARN** ou **ERROR** qui se répètent, copie-les-moi.
6. Dans l'avion, règle ta radio sur **251.0 AM** et appuie sur ton alternat SRS. Dis, **en anglais, calmement** :
   - « **Focus, Viper one one, radio check** »
   - « **Focus, Viper one one, alpha check** »
   - « **Focus, Viper one one, picture** »
   - « **Focus, Viper one one, bogey dope** »

   Règles de prononciation de SkyEye : caps en 3 chiffres séparés (« zero six five »), autres nombres normalement (« seventeen »), **pas** de prononciation OACI (« three », pas « tree » ; « nine », pas « niner »).
7. Pour arrêter SkyEye :
   ```powershell
   ./skyeye-service.exe stopwait
   ```

### A8. Mesurer l'impact sur les images par seconde

1. Dans DCS, affiche le compteur d'images par seconde avec **Ctrl droit + Pause**.
2. Relève les FPS dans trois situations, au même endroit, même vue :
   - **SkyEye arrêté** ;
   - **SkyEye démarré**, sans parler ;
   - **pendant que tu parles et qu'il répond** (c'est là que la carte graphique travaille).
3. Dans le Gestionnaire des tâches, relève la **mémoire GPU dédiée utilisée** dans ces mêmes situations.

---

## Partie B — Comment se comportent les avions IA (le risque n°1)

Toujours dans l'éditeur de mission, sans script. Ajoute ces éléments à la mission de test ou fais-en une deuxième.

### B1. Plusieurs IA qui arrivent en même temps

- Crée **3 groupes IA** bleus (un avion chacun, par ex. F-16 ou C-130), **en vol**, à 20–30 NM de **Kutaisi**, dans des directions différentes.
- Pour chacun : un dernier point de route de type **Landing** (atterrissage) à Kutaisi, avec des vitesses qui les font arriver **à peu près en même temps**.
- Lance la mission (tu peux rester en vue F10 / caméra) et observe :
  - est-ce qu'ils se mettent en file ? est-ce qu'il y en a qui tournent en rond pour attendre ?
  - est-ce qu'ils se gênent, se remettent des gaz, se posent n'importe comment ?
  - combien de temps entre deux atterrissages ?

### B2. Retenir un IA en attente puis le relâcher sur ordre

C'est le test le plus important : il dit si l'ATC pourra « tenir » un IA en attente et décider quand il vient se poser.

1. Crée un groupe IA bleu en vol, avec **deux** points de route :
   - **Point 1** : à ~15 NM de Kutaisi. Dans ses **actions avancées**, ajoute une tâche **Orbit** (motif **Race-Track**, hippodrome), avec une **condition d'arrêt** : **« Drapeau utilisateur 1 est vrai »** (*user flag 1 is true*).
   - **Point 2** : **Landing** à Kutaisi.
2. Dans les **déclencheurs** (triggers) de la mission :
   - Déclencheur *une fois* (ONCE), condition *temps écoulé > 5 s*, action **« Ajouter un élément au menu radio »** (*Radio item add*) nommé « Autoriser atterrissage » qui **met le drapeau 1 à vrai**.
3. En jeu : laisse l'IA tourner quelques minutes, puis utilise le menu **F10 → Autoriser atterrissage**.
4. Observe : est-ce que l'hippodrome est propre ? Est-ce qu'il part bien vers la piste au moment où tu l'autorises ? Combien de temps met-il à réagir ?

Si un nom de menu ne correspond pas exactement à ce que tu vois dans ta version de DCS, fais au plus proche et dis-le-moi.

### B3. (Optionnel) Retenir un IA au parking

1. Crée un groupe IA au sol à Kutaisi, départ **parking à froid**, et coche **« Non contrôlé »** (*Uncontrolled*).
2. Dans l'onglet **Actions déclenchées** du groupe, ajoute une action **Exécuter commande → Démarrer** (*Perform command → Start*).
3. Déclencheur : un élément de menu radio « Autoriser mise en route » qui exécute **AI TASK PUSH** de cette action sur ce groupe.
4. Observe : est-ce qu'il reste sagement au parking ? Est-ce qu'il démarre, roule et décolle quand tu l'autorises ?

---

## Ce que je te demande de me renvoyer

Recopie ce tableau et remplis-le (même approximativement) :

| Question | Ta réponse |
|---|---|
| Mémoire GPU dédiée totale (10 ou 12 Go) | |
| Mémoire GPU utilisée : DCS seul / DCS + SkyEye | |
| FPS : SkyEye arrêté / démarré / pendant une réponse | |
| SkyEye a-t-il compris RADIO CHECK, ALPHA CHECK, PICTURE, BOGEY DOPE ? | |
| Délai entre la fin de ta phrase et le début de sa réponse (en secondes, à la louche) | |
| Voix : compréhensible ? agréable ? | |
| Erreurs dans `skyeye-service.err.log` (copier-coller) | |
| B1 : les 3 IA se sont-elles séquencées ? gênées ? remises des gaz ? | |
| B2 : l'attente en hippodrome est-elle propre ? la libération par F10 marche-t-elle ? délai ? | |
| B3 (si fait) : l'IA reste-t-elle au parking puis part-elle sur ordre ? | |

Et si tu veux, en plus : ton modèle de processeur, et 2–3 exemples de phrases que tu aimerais dire **en français** au système.

---

## Si ça coince

- **SkyEye ne répond pas du tout** : vérifie que tu commences bien ta phrase par « Focus » (ou « Anyface »), que tu es sur la bonne fréquence, et que EAM est sur ON dans le serveur SRS.
- **SkyEye répond mais dit qu'il ne te voit pas** : le nom de ton pilote dans Tacview ne correspond pas à « Viper 11 ». Vérifie le nom du pilote et ton pseudo ; bouge un peu l'avion ; au besoin relance la mission.
- **Les FPS s'effondrent** : note-le quand même, c'est une information précieuse. On basculera alors la reconnaissance vocale ailleurs (voir la suite du projet).
- Dans tous les cas : envoie-moi le fichier `skyeye-service.err.log`.

---

## Sources

- SkyEye (licence MIT) : <https://github.com/dharmab/skyeye> — guide d'installation Windows GPU : `docs/deployment/windows/gpu.md`, guide joueur : `docs/PLAYER.md`.
- SkyEye est « maintenu mais plus activement développé » depuis fin 2025 (mises à jour de compatibilité seulement) : toute amélioration viendra de nous.
