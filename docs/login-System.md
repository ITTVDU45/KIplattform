

# Dokumentation – Login-System der KI-Plattform

## 1. Ziel der Login-Architektur

Das Login-System der KI-Plattform soll so aufgebaut werden, dass Nutzer sich sicher authentifizieren können und das Frontend danach mit einem gültigen Login-Zustand arbeitet.

Dabei sollen mehrere Sicherheitsmechanismen berücksichtigt werden:

* **JWT Access Token**
* **Refresh Token**
* **Cookie-basierte Speicherung**
* **optionale Device-Autorisierung**
* **Rollenprüfung im Frontend und Backend**

Das Ziel ist, dass ein Nutzer nach erfolgreichem Login sicher identifiziert wird und nur auf die für ihn freigegebenen Inhalte zugreifen kann.

---

# 2. Grundprinzip des Auth-Systems

Jeder Nutzer, der den Auth-Service verwenden soll, benötigt einen Account auf dem Auth-Server. Admins können User-Accounts an den Auth-Server übertragen, damit sich diese später mit denselben Zugangsdaten anmelden können. 

Der Login läuft über den Auth-Service und liefert bei Erfolg unter anderem:

* einen **Access Token**
* einen **Refresh Token**
* Basisinformationen zum User
* die Rollen des Nutzers 

---

# 3. Login-Endpoint

## Route

```http
POST https://auth.ci-hosting.de/user/login
```

Diese Route verarbeitet den Nutzerlogin. 

---

# 4. Login Request

## Erwartete Daten

Laut Dokumentation erwartet der Auth-Service grundsätzlich:

* `email`
* `password`
* `deviceFingerprint`
* `deviceName` 

Zusätzlich ist dokumentiert, dass der Login auch nur mit `email` und `password` funktioniert. In diesem Fall entfällt jedoch die Device-Autorisierung. 

---

## Empfohlener Request Body

### Minimale Variante

```json
{
  "email": "max.mustermann@example.com",
  "password": "GeheimesPasswort123!"
}
```

### Erweiterte sichere Variante

```json
{
  "email": "max.mustermann@example.com",
  "password": "GeheimesPasswort123!",
  "deviceFingerprint": "abc123xyz-device-fingerprint",
  "deviceName": "Windows Chrome"
}
```

---

# 5. Bedeutung der Request-Felder

## email

Die E-Mail-Adresse des Nutzers.
Sie dient zur Identifikation des Benutzerkontos.

## password

Das Passwort des Nutzers.
Dieses wird an den Auth-Service übermittelt und dort geprüft.

## deviceFingerprint

Ein clientseitig erzeugter Geräte-Fingerprint.
Dieser dient als zusätzliche Sicherheitskomponente, um ein Gerät wiederzuerkennen. Laut Doku muss dieser im Frontend clientseitig ausgelesen werden. 

## deviceName

Ein lesbarer Gerätename oder Hinweis auf Plattform bzw. Hersteller, zum Beispiel:

* Windows
* Apple
* Android
* iPhone
* MacBook Safari
  Auch dieses Feld soll im Frontend ermittelt werden. 

---

# 6. Beispiel Request mit fetch

```javascript
const response = await fetch("https://auth.ci-hosting.de/user/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    email: "max.mustermann@example.com",
    password: "GeheimesPasswort123!",
    deviceFingerprint: "abc123xyz-device-fingerprint",
    deviceName: "Windows Chrome"
  })
});

const data = await response.json();
console.log(data);
```

---

# 7. Beispiel Request mit cURL

In der Dokumentation ist beispielhaft ein Login per cURL mit `email` und `password` gezeigt. 

```bash
curl -X POST https://auth.ci-hosting.de/user/login \
-H "Content-Type: application/json" \
-d '{
  "email": "max.mustermann@example.com",
  "password": "GeheimesPasswort123!"
}'
```

---

# 8. Erfolgreiche Login Response

Laut Dokumentation liefert der Server bei erfolgreichem Login eine Response mit:

* `accessToken`
* `refreshToken`
* `user`
* `roles` innerhalb des Users 

## Beispielstruktur

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "refresh_token_string",
  "user": {
    "id": "69c396958f7c0c20c9cc1fbc",
    "email": "max.mustermann@example.com",
    "roles": ["user"]
  }
}
```

---

# 9. Bedeutung der Response-Daten

## accessToken

Der Access Token ist ein JWT und stellt den eigentlichen Login-Nachweis für geschützte Requests dar.
Mit diesem Token arbeitet das Frontend nach erfolgreichem Login weiter. Die Dokumentation beschreibt ausdrücklich, dass das Frontend mit dem `accessToken` arbeiten muss. 

## refreshToken

Der Refresh Token dient dazu, neue Access Tokens anzufordern, wenn der aktuelle Access Token abläuft.
Er sollte sicher behandelt und nicht offen im Frontend verfügbar gemacht werden.

## user

Enthält die wichtigsten Informationen des eingeloggten Users, zum Beispiel:

* ID
* E-Mail
* Rollen

## roles

Über die Rollen kann gesteuert werden, welche Bereiche der Plattform sichtbar oder erlaubt sind.
Die Dokumentation nennt, dass Rollen aus dem Access Token beziehungsweise dem Header ausgelesen werden können. 

---

# 10. JWT im Login-System

## Zweck des JWT

Der JWT Access Token dient dazu, dass Backend und Frontend bei jedem geschützten Request erkennen können:

* wer der Nutzer ist
* ob er authentifiziert ist
* welche Rolle er besitzt
* ob der Token noch gültig ist

---

## Typische JWT-Inhalte

Ein JWT kann zum Beispiel Claims enthalten wie:

```json
{
  "sub": "69c396958f7c0c20c9cc1fbc",
  "email": "max.mustermann@example.com",
  "roles": ["user"],
  "iat": 1774541013,
  "exp": 1774541913
}
```

### Erklärung

* `sub`: Nutzer-ID
* `email`: E-Mail des Nutzers
* `roles`: Rolle oder Rollen des Nutzers
* `iat`: Ausgabezeitpunkt
* `exp`: Ablaufzeitpunkt

---

# 11. Cookie-Autorisierung

Die Dokumentation sagt ausdrücklich, dass der `accessToken` als Cookie beim User gespeichert werden soll und das Frontend dann per Middleware prüfen muss, ob der Token gültig ist. 

## Empfohlenes Vorgehen

Nach erfolgreichem Login:

1. `accessToken` aus der Response lesen
2. als Cookie speichern
3. bei nachfolgenden Requests im Cookie mitsenden
4. in Middleware oder Serverlogik prüfen
5. bei ungültigem Token den Nutzer ausloggen oder auf Login umleiten

---

## Empfohlene Cookie-Strategie

### Für produktive Anwendungen

Der Token sollte idealerweise als sicher gesetzter Cookie abgelegt werden, zum Beispiel mit:

* `HttpOnly`
* `Secure`
* `SameSite=Lax` oder `SameSite=Strict`

### Ziel

* Schutz vor JavaScript-Zugriff
* Schutz vor einfachem Token-Diebstahl
* saubere Session-Verwaltung

---

# 12. Middleware im Frontend

Laut Dokumentation soll das Frontend mit einer Middleware immer den Request Header auslesen und prüfen, ob der hinterlegte Token gültig ist. 

## Aufgabe der Middleware

Die Middleware soll:

* prüfen, ob ein Access Token vorhanden ist
* prüfen, ob der Token gültig ist
* prüfen, ob der Token abgelaufen ist
* Rollen auswerten
* unberechtigte Nutzer umleiten

---

## Beispiele für geschützte Bereiche

* Dashboard
* Adminbereich
* Benutzerverwaltung
* KI-Tools
* geschützte API-Routen

---

# 13. Rollenprüfung

Da dein System mit Rollen arbeitet, muss nach dem Login geprüft werden, welche Rolle der eingeloggte Nutzer besitzt.

Aus deiner Roadmap ergeben sich diese Rollen:

* `superadmin`
* `admin`
* `user`

Die vorhandene Login-Dokumentation zeigt im Beispiel bereits Rollen im Feld `roles`. 

## Beispiel der Rollenlogik

### Superadmin

* darf alle Nutzer sehen
* darf globale Einstellungen verwalten
* darf Rollen und Zuweisungen ändern

### Admin

* darf nur die ihm zugewiesenen Nutzer sehen
* darf im eigenen Bereich verwalten

### User

* darf nur die ihm zugewiesenen Nutzer sehen
* keine globalen Adminrechte

---

# 14. Device-Autorisierung

Ein wichtiger zusätzlicher Sicherheitsmechanismus in deinem Login-System ist die Geräte-Autorisierung.

Die Dokumentation beschreibt:

* `deviceFingerprint` wird clientseitig ausgelesen
* `deviceName` wird ebenfalls im Frontend ermittelt
* wenn Login nur mit `email` und `password` erfolgt, entfällt die Device-Autorisierung 

## Zweck

Die Device-Autorisierung hilft dabei:

* unbekannte Geräte zu erkennen
* Logins zu protokollieren
* zusätzliche Sicherheitsregeln einzubauen
* verdächtige Logins besser zu kontrollieren

---

## Empfohlene Nutzung in deiner Plattform

### Variante 1 – optional

* Login funktioniert mit E-Mail und Passwort
* Device-Daten werden mitgesendet, wenn vorhanden

### Variante 2 – empfohlen

* Device-Daten immer mitsenden
* unbekannte Geräte besonders markieren
* optional zweite Freigabe oder Admin-Prüfung einführen

---

# 15. Kompletter Login-Flow für deine KI-Plattform

## Schritt 1 – Loginformular im Frontend

Der Nutzer gibt ein:

* E-Mail
* Passwort

Zusätzlich ermittelt das Frontend:

* Device Fingerprint
* Device Name

---

## Schritt 2 – POST an Auth-Service

Das Frontend sendet die Daten an:

```http
POST https://auth.ci-hosting.de/user/login
```

---

## Schritt 3 – Server prüft Zugangsdaten

Der Auth-Service prüft:

* existiert der Nutzer?
* stimmt das Passwort?
* ist die Device-Information zulässig?
* darf der Nutzer sich anmelden?

---

## Schritt 4 – Response bei Erfolg

Der Server liefert:

* Access Token
* Refresh Token
* Userdaten
* Rollen 

---

## Schritt 5 – Tokens im Frontend verarbeiten

Das Frontend:

* speichert den Access Token als Cookie
* hält Userdaten im State
* schützt Bereiche per Middleware

---

## Schritt 6 – Geschützte Requests

Bei jedem geschützten Request:

* Cookie oder Authorization Header mitsenden
* Token prüfen
* Rolle prüfen
* Datenzugriff anhand der Rolle einschränken

---

# 16. Empfohlene technische Architektur

## Frontend

Zum Beispiel:

* Next.js
* React
* Middleware für geschützte Routen
* State Management für User-Session

## Auth-Service

Externer Auth-Server:

* Login
* Token-Ausgabe
* Rollenbereitstellung
* Device-Prüfung

## API / Backend

Eigene Plattformlogik:

* JWT validieren
* Rollen auswerten
* Scope / Zuweisung prüfen
* geschützte Daten ausliefern

---

# 17. Beispiel für Frontend-Verarbeitung nach Login

```javascript
const login = async (email, password, deviceFingerprint, deviceName) => {
  const response = await fetch("https://auth.ci-hosting.de/user/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({
      email,
      password,
      deviceFingerprint,
      deviceName
    })
  });

  if (!response.ok) {
    throw new Error("Login fehlgeschlagen");
  }

  const data = await response.json();

  document.cookie = `accessToken=${data.accessToken}; path=/; secure; samesite=lax`;

  return data.user;
};
```

Hinweis: In einer produktiven Anwendung sollte das sichere Setzen des Cookies möglichst serverseitig erfolgen.

---

# 18. Middleware-Logik im Frontend

## Ziel

Beim Aufruf geschützter Seiten soll automatisch geprüft werden:

* gibt es einen Token?
* ist er gültig?
* hat der Nutzer die richtige Rolle?

## Beispielhafte Regeln

### `/admin`

nur `admin` und `superadmin`

### `/dashboard`

alle eingeloggten Nutzer

### `/superadmin`

nur `superadmin`

---

# 19. Backend-Autorisierung

Ganz wichtig:
Die echte Sicherheit darf nicht nur im Frontend liegen.

Das Backend muss bei jedem geschützten Request zusätzlich prüfen:

* Token gültig?
* Rolle erlaubt?
* Zugriff auf Datensatz erlaubt?
* gehört Zielnutzer zum Scope dieses Nutzers?

Gerade weil du Superadmin, Admin und User mit Zuweisungslogik nutzt, ist diese Scope-Prüfung zwingend.

---

# 20. Empfohlene zusätzliche Endpoints

Für ein vollständiges Login-System solltest du neben `/user/login` noch weitere Auth-Routen vorsehen:

## Refresh Token

```http
POST /auth/refresh
```

## Logout

```http
POST /auth/logout
```

## Aktuellen Nutzer abrufen

```http
GET /auth/me
```

## Passwort vergessen

```http
POST /auth/forgot-password
```

## Passwort zurücksetzen

```http
POST /auth/reset-password
```

Diese Routen sind in deiner PDF nicht beschrieben, wären aber für ein vollständiges Produktivsystem sehr sinnvoll.

---

# 21. Fehlerfälle beim Login

Deine Dokumentation sollte auch Fehlerfälle definieren.

## Typische Fehler

### 400 Bad Request

Pflichtfelder fehlen oder Format ist ungültig

### 401 Unauthorized

E-Mail oder Passwort falsch

### 403 Forbidden

Gerät nicht autorisiert oder Konto gesperrt

### 429 Too Many Requests

Zu viele Login-Versuche

### 500 Internal Server Error

Technischer Fehler im Auth-Service

---

## Beispiel-Fehlerantwort

```json
{
  "error": true,
  "message": "Ungültige Login-Daten"
}
```

---

# 22. Sicherheits-Empfehlungen

## JWT

* kurze Laufzeit für Access Token
* Rollen im Token enthalten
* Token-Signatur serverseitig prüfen

## Refresh Token

* sicher speichern
* möglichst nicht im normalen Frontend-State halten
* bei Logout invalidieren

## Cookies

* `HttpOnly`
* `Secure`
* `SameSite`

## Login

* Rate Limiting
* Schutz vor Brute Force
* Logging aller Login-Versuche

## Device-Sicherheit

* Fingerprint nutzen
* unbekannte Geräte markieren
* optional Freigabeworkflow

---

# 23. Öffentliche Datenstrukturen laut Dokumentation

Die Dokumentation nennt zwei öffentlich erreichbare Bereiche:

## User

Alle User können grafisch ohne Auth abgerufen werden über:

```http
https://auth.ci-hosting.de/api/users
```

## Logs

Es gibt eine Logging-Middleware, deren Logs aktuell ebenfalls grafisch abrufbar sind:

```http
https://auth.ci-hosting.de/api/logs
```

Beides ist so in der bereitgestellten Datei beschrieben. 

## Wichtiger Hinweis

Für eine produktive KI-Plattform sollte geprüft werden, ob diese öffentlichen Routen wirklich offen bleiben dürfen. Gerade Logs und Userlisten sind aus Sicherheits- und Datenschutzsicht sehr sensibel.

---

# 24. Empfohlene finale Login-Architektur für deine Plattform

## Authentifizierung

* Login über `POST /user/login`
* Login mit E-Mail und Passwort
* optional mit Device-Fingerprint und Device-Name

## Session

* Access Token als JWT
* Refresh Token für Session-Erneuerung
* Access Token per Cookie verfügbar machen

## Autorisierung

* Rollen aus Token lesen
* Backend prüft Rollen und Zuweisungen

## Sicherheit

* Middleware im Frontend
* Auth Guard im Backend
* Device Recognition
* Logging und Monitoring

---

# 25. Zusammenfassung

Dein Login-System sollte so umgesetzt werden:

1. Nutzer meldet sich über `https://auth.ci-hosting.de/user/login` an. 
2. Frontend sendet `email`, `password` und idealerweise auch `deviceFingerprint` und `deviceName`. 
3. Auth-Service liefert `accessToken`, `refreshToken` und Userdaten mit Rollen zurück. 
4. Der `accessToken` wird als Cookie gespeichert und für geschützte Requests verwendet. 
5. Middleware prüft bei jedem Seitenaufruf, ob der Token gültig ist. 
6. Rollen und Zuweisungen werden im Backend geprüft.
7. Superadmin, Admin und User sehen nur die Daten, die sie laut Rollen- und Zuweisungslogik sehen dürfen.

