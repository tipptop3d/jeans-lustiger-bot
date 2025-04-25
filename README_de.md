# Jeans Lustiger Bot

Ein Projekt, was ich rein aus Laune mache. Ich probier hier wieder mal ein paar Programmierkonzepte umzusetzen. Basis ist ein Node.js Discord Bot mit ein paar nicht so nützlichen Funktionen.

## Funktionen

### SSIO

Nach Zustimmung der Datenschutzerklärung soll es Nutzern möglich sein, mit SSIO zu sprechen. Am Anfang soll es simpel sein: Der Bot captured den Sound von Usern, der Sound durchläuft einen Automatic Speech Recognizer und je nachdem was die User sagen soll der Bot paar SSIO Lines spitten. Hierbei möchte ich komplett flexibel bleiben was für ein ASR genutzt wird, also wird dafür ein abstrakter ASRConnector von verschiedenen Adaptern implementiert.

Ein paar Methoden die ausprobieren möchte:

|Service|Pros|Cons|
|---|---|---|
|(speaches)[https://github.com/speaches-ai/speaches] (faster-whisper)|Gleiche API wie OpenAI, schnell genug?|Ressourcenintensiv|
|Vosk / Kaldi|