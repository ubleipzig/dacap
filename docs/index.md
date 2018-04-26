# dacap

*Dynamic And Compressing Api Proxy* ist ein Dienst, der Ausgaben beliebiger API-Endpunkte zwischenspeichert. Der Dienst wurde erstellt, um API-Requests, welche durch den zur Verfügung stellenden Service nicht performant genug ausgeliefert werden können, zwischenzuspeichern und aus dem Cache auszuliefern zu können. Zusätzlich wird das Response gzip-komprimiert ausgeliefert und die Cache-Daten werden in einem eingestellten Interval im Hintergrund erneuert.

## Abhängigkeiten

* node >= v8.2.1
* npm >= v5.3.0

## lokale Ausführung

### Installation

```bash
$# npm install -g @ubleipzig/dacap
```
### Ausführung

``` bash
$# dacap
```

## als Container

```bash
$# docker run -p 3000:3000 -v /my/hosts/data/folder:/data ubleipzig/dacap
```

Die Konfiguration wird über Umgebungsvariablen durchgeführt, siehe [erweiterte Konfiguration](#erweiterte Konfiguration)

## Benutzung

Nach dem Start ist das Admin-Interface unter `http://localhost:3000/admin` verfügbar

Als erstes wird ein *Cache* definiert, in dem die Ergebnisse der Anfragen an einen API-Endpunkt gespeichert werden.

Unter *API-Endpoint* wird die URL eingetragen, die zum Service führt (z.B. `http://foo.example.com/`),Unter *Cache-Name* wird eine Bezeichnung für den Service eingetragen, (z.B. `foo`).

Alle Anfragen, die normalerweise an

`http://foo.example.com/?query=foo&offset=0&limit=10`

gehen würden, können nun unter

`http://localhost:3000/ep/foo/?query=foo&offset=0&limit=10`

abgefragt werden.

* *nach dem Cache-Name ist zwingend ein Slash erforderlich, andernfalls kann der Endpunkt nicht aufgelöst werden.*
* *alles, was nach Cache-Name und Slash folgt, wird an den API-Endpunkt angehängt.*

## Erweiterte Konfiguration

Der Dienst lässt sich über Umgebungsvariablen konfigurieren, die beim Start des Dienstes ausgewertet werden:

* `data_dir`: Spezifiziert den Ordner, wo der Cache in regelmäßigen Abständen gespeichert wird. Cache und Endpunkte werden im Arbeitspeicher gehalten. Nach dem Neustart des Dienstes wird die Datei ausgelesen und vorhandene Endpunkte und Caches in den Arbeitspeicher geladen. Standardmäßig ist dieser Ordner der `data`-Ordner in dem Ordner, aus dem der Prozess gestartet wurde (Im Container der Root-Ordner). Es ist sicherzustellen, dass der erstellt werden kann oder für den Dienst schreibbar ist, wenn er bereits existiert.
* `proxy_path`: Spezifiziert den Pfad an dem der Endpunkt nach der Registrierung mit seinem Cache-Namen erreichbar ist. Standardmäßig `/ep/`.
* `proxy_port`: Spezifiziert den Port, an dem der Dienst hört. Standardmäßig `3000`
* `proxy_url`: Spezifiziert die absolute URL des Dienstes mit Protokoll-Schema, Port und Pfad (z.B. `https://api.example.com:8443/dacap`). Standardmäßig `http://localhost:${proxy_port}`.
* `cache_ttl`: Spezifiziert die time-to-live in Sekunden für ein Cache-Ergebnis. Nach dieser Zeit wird das Ergebnis erneuert. Standardmäßig `600`.
* `default_check_period`: spezifiziert das Intervall in Sekunden, in dem die Ablauf-Frist aller Cache-Ergebnisse geprüft wird. Standardmäßig `60`.
* `array_value_size`: Unbekannte Konfiguration. Defaults to `40`
* `object_value_size`: Unbekannte Konfiguration. Defaults to `80`
* `autosave_interval`: Spezifiziert das Intervall, in dem alle Cache-Ergebnisse und Endpunkt-Konfiguration in eine Datei geschrieben werden. Standardmäßig `60`.
* `register_name`: Spezifiziert den Namen des Registers, in dem alle Cache-Ergebnisse und Endpunkt-Konfigurationen gespeichert werden (ist gleichzeitig der Dateiname). Standardmäßig `api-cache`.
* `strip_path`: Spezifiziert, ob der Pfad der Url entfernt werden soll. Standardmäßig `true`.
* `user`: Spezifiziert den Benutzer für die Basic Authentication. Standardmäßig `undefined`.
* `password`: Spezifiziert das Passwort für die Basic Authentication. Standardmäßig `undefined`.

**Nur wenn `user` und `password` angegeben sind, ist basic-auth aktiviert**