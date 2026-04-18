# Architektur & Setup – KI-Plattform Frontend

## Inhaltsverzeichnis

1. [Admin-Login: Implementierung & Berechtigungen](#1-admin-login-implementierung--berechtigungen)
2. [Admin-Dashboard: Nutzerdaten & Ansichten](#2-admin-dashboard-nutzerdaten--ansichten)
3. [Docker: Aufbau & lokaler Schnellstart](#3-docker-aufbau--lokaler-schnellstart)
4. [API-Endpunkte: Verbindung mit dem Backend](#4-api-endpunkte-verbindung-mit-dem-backend)

---

## 1. Admin-Login: Implementierung & Berechtigungen

### Separate Login-Route

Der Admin-Login ist vollständig vom normalen Kunden-Login getrennt und erreichbar unter:

```
http://localhost:3000/admin-login
```

Technisch ist dies eine eigenständige Next.js-Seite (`app/admin-login/page.tsx`) mit eigenem Design (amber/gold Farbgebung) und eigenem API-Endpunkt.

### Authentifizierungsfluss

```
Browser                  Next.js API-Route              Auth-Backend
   │                          │                              │
   │  POST /api/auth/admin-login  │                          │
   │  { email, password }    │                              │
   │─────────────────────────>│                              │
   │                          │  POST /user/login            │
   │                          │─────────────────────────────>│
   │                          │  { accessToken, refreshToken }│
   │                          │<─────────────────────────────│
   │                          │                              │
   │                          │  JWT dekodieren              │
   │                          │  Rolle prüfen (admin/superadmin?)
   │                          │                              │
   │                          │  ✗ Rolle nicht admin         │
   │                          │  → 403 Kein Zugang           │
   │<─────────────────────────│                              │
   │                          │                              │
   │                          │  ✓ Rolle ist admin/superadmin│
   │  Set-Cookie: auth_access_token (httpOnly)              │
   │  Set-Cookie: auth_refresh_token (httpOnly)             │
   │<─────────────────────────│                              │
   │  → Redirect /admin/dashboard                           │
```

**Entscheidend:** Das Backend selbst kennt keinen Unterschied zwischen Admin- und Nutzer-Login – es gibt nur einen Login-Endpunkt. Die Rollentrennung passiert in der Next.js API-Route `app/api/auth/admin-login/route.ts`: Nach erfolgreichem Login wird der JWT dekodiert und die Rolle geprüft. Nur wenn die Rolle `admin` oder `superadmin` ist, werden die Cookies gesetzt.

### Berechtigungsebenen

| Rolle | Beschreibung | Zugang |
|---|---|---|
| `user` | Normaler Kunde | `/de/dashboard`, `/de/profile`, etc. |
| `admin` | Plattform-Administrator | Alles unter `/admin/*` |
| `superadmin` | Voller Plattformzugang | `/admin/*` + zukünftig `/superadmin/*` |

### Zugriffsschutz auf drei Ebenen

**Ebene 1 – Middleware (`middleware.ts`):**
Jede Anfrage an `/admin/*` prüft serverseitig, ob der JWT im Cookie eine Admin-Rolle enthält. Nicht-Admins werden sofort zu `/de/dashboard` weitergeleitet – noch bevor die Seite geladen wird.

```ts
// authorization.ts
export function canAccessPath(pathname, roles): boolean {
  if (pathname.startsWith("/admin")) {
    return hasAnyRole(roles, ["superadmin", "admin"]);
  }
  return true;
}
```

**Ebene 2 – Layout (`app/admin/layout.tsx`):**
Das Admin-Layout prüft clientseitig erneut den Auth-State über `useAuth()`. Ist der Nutzer nicht authentifiziert oder hat keine Admin-Rolle, erfolgt eine sofortige Weiterleitung zu `/admin-login`.

**Ebene 3 – API-Route (`app/api/auth/admin-login/route.ts`):**
Beim Login selbst wird die Rolle geprüft – kein Cookie wird gesetzt, wenn die Rolle nicht passt.

### Middleware-Routing für `/admin-login`

Die URL `/admin-login` ist bewusst **außerhalb** des i18n-Locale-Routings (`/de/`, `/en/`) gehalten:

- `/de/admin-login` → 302 Redirect → `/admin-login` (Canonical-Redirect)
- Bereits eingeloggte Admins, die `/admin-login` besuchen → automatischer Redirect zu `/admin/dashboard`
- Nicht eingeloggte Nutzer → Login-Formular wird angezeigt

---

## 2. Admin-Dashboard: Nutzerdaten & Ansichten

### Datenquelle

Aktuell werden die Nutzerdaten aus einer Mock-Datenbank (`lib/mock/admin-data.ts`) geladen. Diese enthält 8 Testnutzer mit vollständigen Profilen. Im Produktivbetrieb wird diese durch echte API-Aufrufe an das Backend ersetzt.

Die Datenstruktur pro Nutzer:

```ts
interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "user" | "admin" | "superadmin"
  status: "active" | "inactive" | "pending"
  registeredAt: string
  lastLogin: string
  apiKeys: {
    total: number
    active: number
    inactive: number
    revoked: number
    keys: ApiKey[]       // Detaillierte Key-Liste
  }
  tokens: {
    usedTotal: number    // Gesamtverbrauch
    usedThisMonth: number
    limit: number        // Kontingent
  }
  applications: Application[]  // Verbundene Apps
  servers: Server[]            // Zugewiesene Server
}
```

### Seiten im Admin-Bereich

#### `/admin/dashboard` – Übersicht
Zeigt aggregierte KPIs über alle Nutzer:
- Gesamtanzahl Nutzer (aufgeteilt nach aktiv/ausstehend/inaktiv)
- Aktive API-Keys (gesamt)
- Token-Verbrauch diesen Monat (gesamt aller Nutzer)
- Laufende Server
- Verbundene Anwendungen
- Liste der 5 neuesten Registrierungen

#### `/admin/users` – Nutzerliste
Tabellarische Übersicht aller Nutzer mit:
- Name & E-Mail
- Status-Badge (Aktiv / Ausstehend / Inaktiv)
- API-Keys: aktiv/gesamt (z.B. `3 / 4`)
- Token-Verbrauch diesen Monat als Fortschrittsbalken (grün/amber/rot je nach Auslastung)
- Anzahl verbundener Anwendungen
- Anzahl Server
- Letzter Login
- Direktlink zum Nutzer-Detail

Filterbar nach Status, durchsuchbar nach Name oder E-Mail.

#### `/admin/users/[userId]` – Nutzer-Detail
Detailansicht eines einzelnen Nutzers mit:

**Header:** Avatar-Initialen, Name, E-Mail, Rolle, Status

**KPI-Karten:**
| Karte | Inhalt |
|---|---|
| API-Keys | Anzahl aktiver Keys, dazu inaktiv/widerrufen |
| Tokens (Monat) | Verbrauch mit Fortschrittsbalken und Prozentangabe |
| Anwendungen | Anzahl verbundener Apps |
| Server | Anzahl Server, davon laufend |

**Meta-Info:** Nutzer-ID, Registrierungsdatum, letzter Login, Gesamttoken-Verbrauch

**Tabs:**
- **API-Keys:** Tabelle mit Name, ID, Status, Erstelldatum, letzter Nutzung
- **Anwendungen:** Name, Kategorie, Verbindungsdatum
- **Server:** Servername, Region, Status (Läuft / Gestoppt / Wartung)

#### `/admin/api-keys` – Alle API-Keys
Listet alle API-Keys aller Nutzer in einer Tabelle. Filterbar nach Status (aktiv/inaktiv/widerrufen). Jeder Key ist mit dem zugehörigen Nutzer verknüpft (Klick öffnet Nutzer-Detail).

#### `/admin/servers` – Server-Übersicht
Alle Server aller Nutzer, gruppiert nach Region. Zeigt Servername, Region, Status und zugehörigen Nutzer.

#### `/admin/logs` – Aktivitäten
Chronologisches Log der letzten Ereignisse (API-Key-Nutzungen, Registrierungen) aller Nutzer.

### Navigation (Admin-Sidebar)

```
┌─────────────────┐
│ 🛡 Admin Panel  │
│   Verwaltung    │
├─────────────────┤
│ ▦  Übersicht    │  → /admin/dashboard
│ 👥 Nutzer       │  → /admin/users
│ 🔑 API-Keys     │  → /admin/api-keys
│ 🖥  Server      │  → /admin/servers
│ 📋 Aktivitäten  │  → /admin/logs
├─────────────────┤
│ ← Abmelden     │
└─────────────────┘
```

Abmelden löscht die Auth-Cookies und leitet zu `/admin-login` weiter.

---

## 3. Docker: Aufbau & lokaler Schnellstart

### Lokaler Schnellstart

```bash
cd "KI Plattform/frontend"

# Einmalig: Lock-File synchronisieren
npm install

# Container bauen und starten
docker compose up --build
```

Die App ist danach erreichbar unter: **http://localhost:3000**

Für folgende Starts (ohne Code-Änderungen):
```bash
docker compose up
```

Container stoppen:
```bash
docker compose down
```

### Dockerfile – Multi-Stage Build

Das Dockerfile verwendet 3 Stages für ein optimales Produktions-Image:

```
┌─────────────────────────────────────────────────────────┐
│  Stage 1: deps                                          │
│  • node:20-alpine                                       │
│  • Nur package.json + package-lock.json kopieren        │
│  • npm install ausführen                                │
│  • Zweck: Dependencies werden gecacht, nur bei          │
│           package.json-Änderungen neu gebaut            │
└─────────────────────┬───────────────────────────────────┘
                      │ node_modules
┌─────────────────────▼───────────────────────────────────┐
│  Stage 2: builder                                       │
│  • node_modules aus Stage 1 kopieren                    │
│  • Quellcode kopieren                                   │
│  • npm run build (Next.js Standalone Build)             │
│  • Erzeugt .next/standalone/ + .next/static/            │
└─────────────────────┬───────────────────────────────────┘
                      │ nur Build-Artefakte
┌─────────────────────▼───────────────────────────────────┐
│  Stage 3: runner (finales Image)                        │
│  • node:20-alpine (minimal)                             │
│  • Kein node_modules, kein Quellcode                    │
│  • Nur .next/standalone/ + .next/static/ + public/      │
│  • Läuft als unprivilegierter User (nextjs:nodejs)      │
│  • Startet mit: node server.js                          │
└─────────────────────────────────────────────────────────┘
```

**Resultat:** Das finale Image enthält nur das Nötigste – kein Quellcode, keine Dev-Dependencies.

### docker-compose.yml – Konfiguration

```yaml
services:
  frontend:
    build: .
    ports:
      - "3000:3000"       # Host-Port:Container-Port
    environment:
      - NODE_ENV=production
      - COOKIE_SECURE=false   # Für lokales HTTP (kein HTTPS nötig)
    restart: unless-stopped   # Automatischer Neustart bei Absturz
```

### Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `NODE_ENV` | `production` | Build-Modus |
| `COOKIE_SECURE` | `false` | `false` = HTTP erlaubt (lokal); `true`/leer = nur HTTPS |
| `AUTH_SERVICE_BASE_URL` | `https://auth.ci-hosting.de` | Auth-Backend Basis-URL |
| `AUTH_SERVICE_LOGIN_PATH` | `/user/login` | Login-Pfad am Backend |
| `AUTH_SERVICE_REGISTER_URL` | `https://api.ci-hosting.de/user/register` | Registrierungs-URL |
| `AUTH_SERVICE_REFRESH_PATH` | `/refresh` | Token-Refresh-Pfad |

### Wichtiger Hinweis: COOKIE_SECURE

| Szenario | Einstellung |
|---|---|
| Lokal via Docker (`http://localhost`) | `COOKIE_SECURE=false` |
| Produktion mit HTTPS/Domain | `COOKIE_SECURE=false` aus compose entfernen |

Mit `NODE_ENV=production` und ohne `COOKIE_SECURE=false` werden Cookies als `Secure` markiert und der Browser akzeptiert sie nur über HTTPS. Login schlägt dann über HTTP still fehl.

### .dockerignore

Verhindert, dass `node_modules` (∼400 MB) und `.next/` in den Build-Context kopiert werden:

```
node_modules
.next
.git
*.md
.env*
.DS_Store
```

**Ohne `.dockerignore`:** Build-Context = ~435 MB, langsamer Upload zum Docker-Daemon  
**Mit `.dockerignore`:** Build-Context = ~5 MB, deutlich schneller

---

## 4. API-Endpunkte: Verbindung mit dem Backend

### Architekturprinzip: BFF (Backend for Frontend)

Das Next.js-Frontend agiert als Proxy zwischen Browser und dem eigentlichen Auth-Backend. Der Browser kommuniziert **nie direkt** mit dem Backend – alle Anfragen laufen durch Next.js API-Routen:

```
Browser  ──►  Next.js API-Route  ──►  Auth-Backend (ci-hosting.de)
               (Proxy / BFF)
```

**Vorteil:** JWT-Tokens werden ausschließlich in `httpOnly`-Cookies gespeichert. JavaScript im Browser hat **keinen Zugriff** auf die Tokens (kein `localStorage`, kein `document.cookie` für Token-Reads).

### Alle Auth-Endpunkte im Überblick

#### `POST /api/auth/login` – Kunden-Login
**Datei:** `app/api/auth/login/route.ts`

```
Browser → POST /api/auth/login { email, password, deviceFingerprint, deviceName }
       → Proxy → https://auth.ci-hosting.de/user/login
       ← JWT (accessToken + refreshToken)
       → Cookies setzen: auth_access_token, auth_refresh_token
       ← 200 { authenticated: true, user, roles }
```

Fehlerbehandlung:
- `401` → "Falsche Zugangsdaten oder Account nicht freigeschaltet"
- `403` → "Account noch nicht aktiviert" (pending-Erkennung via Keyword-Matching)
- `429` → "Zu viele Versuche"
- `503` → "Backend nicht erreichbar"

---

#### `POST /api/auth/admin-login` – Admin-Login
**Datei:** `app/api/auth/admin-login/route.ts`

```
Browser → POST /api/auth/admin-login { email, password }
       → Proxy → https://auth.ci-hosting.de/user/login (gleicher Endpunkt!)
       ← JWT
       → JWT dekodieren, Rolle extrahieren
       → Rolle NICHT admin/superadmin?
         ← 403 "Kein Admin-Zugang"  (Cookies werden NICHT gesetzt)
       → Rolle ist admin/superadmin?
         → Cookies setzen
         ← 200 { authenticated: true, user, roles }
```

**Wichtig:** Das Backend kennt nur einen Login-Endpunkt. Die Unterscheidung zwischen Admin und User findet **in Next.js** statt, nicht im Backend.

---

#### `POST /api/auth/register` – Registrierung
**Datei:** `app/api/auth/register/route.ts`

```
Browser → POST /api/auth/register { salutation, firstName, lastName, email, password }
       → Validierung (alle Felder pflicht, Anrede: Herr/Frau/Divers)
       → Feldnamen-Transformation:
           firstName → firstname
           lastName  → lastname
           salutation → anrede
       → Proxy → https://api.ci-hosting.de/user/register
       ← Antwort des Backends (direkt weitergeleitet)
```

Nach erfolgreicher Registrierung landet der Nutzer auf der Erfolgsseite `/register/success`. Es werden **keine Cookies** gesetzt – der Account muss erst freigeschaltet werden.

---

#### `POST /api/auth/refresh` – Token-Erneuerung
**Datei:** `app/api/auth/refresh/route.ts`

```
Browser → POST /api/auth/refresh
       → Refresh-Token aus httpOnly-Cookie lesen
       → Proxy → https://auth.ci-hosting.de/refresh
       ← Neues accessToken
       → Cookie aktualisieren
       ← 200 { success: true }
```

Wird automatisch von der Middleware aufgerufen, wenn der Access-Token abgelaufen ist – transparent für den Nutzer.

---

#### `GET /api/auth/me` – Session abrufen
**Datei:** `app/api/auth/me/route.ts`

```
Browser → GET /api/auth/me
       → Access-Token aus httpOnly-Cookie lesen
       → JWT lokal dekodieren (kein Backend-Call!)
       ← 200 { authenticated: true/false, user, roles }
```

**Kein Backend-Aufruf** – der JWT wird lokal validiert und dekodiert. Schnell und ohne Netzwerk-Overhead.

---

#### `POST /api/auth/logout` – Abmelden
**Datei:** `app/api/auth/logout/route.ts`

```
Browser → POST /api/auth/logout
       → Cookies löschen: auth_access_token, auth_refresh_token, auth_expires_at
       ← 200 { success: true }
```

**Hinweis:** Das Backend wird aktuell beim Logout nicht benachrichtigt. Der Refresh-Token bleibt serverseitig gültig bis zu seinem natürlichen Ablauf. Für erhöhte Sicherheitsanforderungen kann ein Backend-Endpunkt zur Token-Invalidierung nachgerüstet werden.

---

### Cookie-Details

Alle Auth-Cookies werden mit folgenden Attributen gesetzt:

| Attribut | Wert | Bedeutung |
|---|---|---|
| `httpOnly` | `true` | Kein JavaScript-Zugriff |
| `sameSite` | `lax` | CSRF-Schutz |
| `secure` | `true` in Prod (HTTPS), `false` wenn `COOKIE_SECURE=false` | Nur über HTTPS übertragen |
| `path` | `/` | Für alle Pfade gültig |
| `maxAge` | Access: JWT-Ablaufzeit, Refresh: 30 Tage | Lebensdauer |

### Middleware: Automatische Token-Verwaltung

Die Next.js Middleware (`middleware.ts`) schützt alle gesicherten Routen und übernimmt automatisch die Token-Verwaltung:

```
Anfrage an geschützte Route
        │
        ▼
Access-Token vorhanden und gültig?
        │
   Ja ──┴── Nein: Refresh-Token vorhanden?
        │              │
        │         Ja ──┴── Nein: → /login
        │         │
        │    Token-Refresh durchführen
        │    Neue Cookies setzen
        │
        ▼
Rolle für diesen Pfad ausreichend?
        │
   Ja ──┴── Nein: → /de/dashboard
        │
   Anfrage durchlassen
```

**Cookie-Namen:**
- `auth_access_token` – JWT Access Token
- `auth_refresh_token` – JWT Refresh Token  
- `auth_expires_at` – Ablaufzeit (deprecated, wird nicht mehr aktiv genutzt)

---

## Schnellreferenz

| Was | Wo |
|---|---|
| Admin-Login Seite | `app/admin-login/page.tsx` |
| Admin-Login Formular | `components/auth/admin-login-panel.tsx` |
| Admin-Login API | `app/api/auth/admin-login/route.ts` |
| Admin-Layout + Guard | `app/admin/layout.tsx` |
| Admin-Sidebar | `components/admin/admin-sidebar.tsx` |
| Admin Dashboard | `app/admin/dashboard/page.tsx` |
| Nutzer-Übersicht | `app/admin/users/page.tsx` |
| Nutzer-Detail | `app/admin/users/[userId]/page.tsx` |
| Mock-Daten | `lib/mock/admin-data.ts` |
| Berechtigungslogik | `lib/auth/authorization.ts` |
| Backend-URLs | `lib/auth/auth.server.ts` |
| Middleware | `middleware.ts` |
| Dockerfile | `Dockerfile` |
| Docker Compose | `docker-compose.yml` |
