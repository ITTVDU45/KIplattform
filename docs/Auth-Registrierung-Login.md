# Auth-Dokumentation: Registrierung und Login

## Ziel
Diese Dokumentation beschreibt den aktuellen technischen Aufbau der Registrierung und des Login-Systems in der Applikation. Sie dient als Referenz fuer Frontend, API-Proxy, Session-Handling, Cookies, Middleware und Rollenlogik.

## Uebersicht
Die Authentifizierung ist in zwei getrennte Flows aufgeteilt:

1. Registrierung
   - Das Frontend sendet die Registrierungsdaten an die interne Next-Route `/api/auth/register`.
   - Die interne Route mapped die Felder auf das dokumentierte externe Registrierungsformat und ruft `https://api.ci-hosting.de/public/user/registration` auf.

2. Login
   - Das Frontend sendet die Login-Daten an die interne Next-Route `/api/auth/login`.
   - Die interne Route ruft den Auth-Service unter `https://auth.ci-hosting.de/user/login` auf.
   - Bei Erfolg werden `accessToken` und `refreshToken` serverseitig als `HttpOnly`-Cookies gesetzt.
   - Die Session wird ueber `/api/auth/me` aus dem Access-Token abgeleitet.

## Registrierung

### Frontend
Die Registrierungsseite verwendet die Komponente:

- `src/components/auth/register-form.tsx`

Das Formular erfasst genau diese Felder:

- `salutation`
- `firstName`
- `lastName`
- `email`
- `password`

Erlaubte Werte fuer `salutation`:

- `Herr`
- `Frau`
- `Divers`

Telefonnummer ist nicht mehr Teil des Registrierungsflows.

### Client-Payload
Das Frontend sendet an `authService.register()` folgende Struktur:

```ts
{
  salutation: "Herr" | "Frau" | "Divers",
  firstName: string,
  lastName: string,
  email: string,
  password: string
}
```

Die Typdefinition liegt in:

- `src/lib/auth/auth.types.ts`

### Interne API-Route
Die Registrierung wird ueber folgende interne Route verarbeitet:

- `src/app/api/auth/register/route.ts`

Diese Route:

1. validiert `salutation`, `firstName`, `lastName`, `email`, `password`
2. mappt die Daten auf das externe API-Format
3. leitet den Request an den aktuell verwendeten Upstream-Endpoint weiter

Mapping der Felder:

```json
{
  "salutation": "anrede",
  "firstName": "firstname",
  "lastName": "lastname",
  "email": "email",
  "password": "password"
}
```

### Externer Registrierungs-Endpoint
Die Registrierung geht aktuell an:

- `https://api.ci-hosting.de/user/register`

Die URL ist in `src/lib/auth/auth.server.ts` konfiguriert ueber:

- `AUTH_SERVICE_REGISTER_URL`

Hinweis:

- Die urspruenglich dokumentierte URL `https://api.ci-hosting.de/public/user/registration` lieferte im Live-Test `404`.
- Deshalb verwendet die Implementierung standardmaessig den real antwortenden Endpoint `https://api.ci-hosting.de/user/register`.

### Response-Verhalten
Die interne Route gibt die Antwort des Upstreams an das Frontend zurueck.

Das Frontend:

1. zeigt bei Erfolg einen Success-Toast
2. leitet auf `/register/success` weiter
3. zeigt bei Fehlern die API-Fehlermeldung inline und als Toast

### Wichtige Registrierungsdateien
- `src/components/auth/register-form.tsx`
- `src/app/api/auth/register/route.ts`
- `src/lib/auth/auth.service.ts`
- `src/lib/auth/auth.types.ts`
- `src/lib/auth/auth.server.ts`

## Login

### Frontend
Die Login-Seite verwendet:

- `src/components/auth/login-panel.tsx`

Das Formular erfasst:

- `email`
- `password`

Vor dem Submit versucht das Frontend zusaetzlich best-effort zu ermitteln:

- `deviceFingerprint`
- `deviceName`

Die Device-Ermittlung passiert in:

- `src/lib/auth/device.ts`

### Device-Ermittlung
`deviceName` wird aus Plattform und Browser zusammengesetzt, z. B.:

- `Windows Chrome`
- `Mac Safari`

`deviceFingerprint` wird clientseitig aus einer SHA-256-Hash-Kombination dieser Merkmale gebildet:

- `navigator.userAgent`
- `navigator.language`
- `navigator.platform`
- Bildschirmbreite
- Bildschirmhoehe
- Farbtiefe
- Zeitzone

Wenn diese Werte oder `crypto.subtle` nicht verfuegbar sind, laeuft der Login trotzdem weiter. Die Device-Daten sind also optional.

### Client-Payload
Das Frontend sendet an `authService.login()`:

```ts
{
  email: string,
  password: string,
  deviceFingerprint?: string,
  deviceName?: string
}
```

### Interne Login-Route
Die Login-Route liegt in:

- `src/app/api/auth/login/route.ts`

Diese Route:

1. validiert `email` und `password`
2. uebernimmt optional `deviceFingerprint` und `deviceName`
3. ruft den externen Auth-Service auf
4. extrahiert `accessToken` und `refreshToken`
5. dekodiert den JWT fuer Sessiondaten und Rollen
6. setzt serverseitig Cookies
7. gibt eine reduzierte Sessionantwort an das Frontend zurueck

### Externer Login-Endpoint
Der Login geht an:

- `https://auth.ci-hosting.de/user/login`

Konfiguration in:

- `src/lib/auth/auth.server.ts`

Relevante Variable:

- `AUTH_SERVICE_LOGIN_PATH=/user/login`

### Erwartete Upstream-Response
Der Auth-Service liefert laut Implementierung mindestens:

- `accessToken`
- `refreshToken`
- optional `user`
- optional `roles`

Die interne Route toleriert unterschiedliche Schluessel-Namen wie:

- `accessToken` oder `access_token`
- `refreshToken` oder `refresh_token`

### Cookie-Strategie
Nach erfolgreichem Login werden diese Cookies serverseitig gesetzt:

- `auth_access_token`
- `auth_refresh_token`

Eigenschaften:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` nur in Production
- `Path=/`

Der Access-Token wird nicht mehr im `localStorage` gespeichert.

### Session-Ableitung
Die Session wird ueber den Access-Token aufgebaut. Der Token wird in folgenden Stellen dekodiert:

- `src/lib/auth/jwt.ts`
- `src/app/api/auth/me/route.ts`
- `src/middleware.ts`

Die Sessionantwort von `/api/auth/me` hat dieses Format:

```ts
{
  authenticated: boolean,
  user: User | null,
  roles: string[]
}
```

`/api/auth/me` liest den Cookie `auth_access_token`, prueft die JWT-Gueltigkeit und liefert dann die aktuelle Session fuer den Client.

### AuthProvider
Der zentrale Client-Auth-State liegt in:

- `src/components/auth/auth-provider.tsx`

Der Provider:

1. laedt beim Start `/api/auth/me`
2. versucht bei fehlender Session automatisch einen Refresh ueber `/api/auth/refresh`
3. speichert `authenticated`, `user`, `roles` und `isLoading`
4. stellt `refreshSession()` und `logout()` bereit

Der Provider ist global eingebunden in:

- `src/app/layout.tsx`

### Logout
Logout wird ueber folgende Route abgewickelt:

- `src/app/api/auth/logout/route.ts`

Dabei werden die Auth-Cookies serverseitig geloescht. Der Client raeumt zusaetzlich moegliche Altlasten auf.

### Refresh-Flow
Die Refresh-Route liegt in:

- `src/app/api/auth/refresh/route.ts`

Die Route:

1. nimmt ein `refreshToken` aus Request-Body oder Cookie
2. ruft den konfigurierten Refresh-Endpoint des Auth-Services auf
3. setzt bei Erfolg neue `HttpOnly`-Cookies
4. loescht Cookies bei Fehlern

### Login-Fehlerbehandlung
Im Frontend werden Fehler gezielt uebersetzt:

- `401`: Zugangsdaten falsch oder Konto noch nicht freigeschaltet
- `403`: Geraet nicht autorisiert oder Account nicht freigegeben
- `429`: zu viele Versuche
- `503`: Auth-Service nicht erreichbar

Zusatzlogik:

- Wenn der Upstream bei `401` auf einen noch nicht freigeschalteten Account hinweist, wird dies intern als besser lesbarer `403` fuer das Frontend ausgegeben.

### Redirect nach Login
Nach erfolgreichem Login:

1. wird `refreshSession()` ausgefuehrt
2. ein Success-Toast angezeigt
3. auf `/{defaultLocale}/dashboard` weitergeleitet

## Rollen und Berechtigungen

### Unterstuetzte Rollen
Das System ist auf diese Rollen ausgelegt:

- `superadmin`
- `admin`
- `user`

Die Rollen kommen aus:

- dem JWT
- `user.roles`
- `user.role`
- top-level `roles` aus der Auth-Service-Response

Die Zusammenfuehrung passiert in:

- `src/lib/auth/jwt.ts`

### Frontend-Rollenlogik
Die zentrale Rollenlogik liegt in:

- `src/lib/auth/authorization.ts`

Aktuelle Regeln:

- `/superadmin` nur fuer `superadmin`
- `/admin` fuer `admin` und `superadmin`
- alle anderen geschuetzten Dashboard-Bereiche fuer authentifizierte Nutzer

Wichtig:

- Die finale Daten- und Rechtepruefung muss im Backend passieren.
- Das Frontend nutzt Rollen nur fuer Navigation, Guards und UI-Steuerung.

## Middleware und Route Protection

Die zentrale Route-Protection liegt in:

- `src/middleware.ts`

Die Middleware schuetzt aktuell unter anderem:

- `/app`
- `/admin`
- `/dashboard`
- `/marketplace`
- `/assistant-mode`
- `/api-keys`
- `/usage`
- `/logs`
- `/storage`
- `/integrations`
- `/workflows`
- `/support`
- `/settings`
- `/profile`
- `/docs`

Dies gilt auch fuer lokalisierte Routen wie:

- `/de/dashboard`
- `/en/settings`

### Verhalten der Middleware
Die Middleware:

1. liest `auth_access_token` und `auth_refresh_token` aus Cookies
2. prueft, ob der Access-Token vorhanden und nicht abgelaufen ist
3. versucht bei Bedarf einen Refresh mit dem Refresh-Token
4. prueft Rollen fuer sensible Bereiche wie `/admin`
5. leitet bei fehlender Authentifizierung auf `/login` um
6. leitet bereits eingeloggte Nutzer von `/login` und `/register` auf das Dashboard weiter

## Wichtige Konfigurationswerte

Die wichtigsten Server-Variablen liegen in:

- `src/lib/auth/auth.server.ts`

Verwendete Defaults:

```env
AUTH_SERVICE_BASE_URL=https://auth.ci-hosting.de
AUTH_SERVICE_LOGIN_PATH=/user/login
AUTH_SERVICE_REFRESH_PATH=/refresh
AUTH_SERVICE_REGISTER_URL=https://api.ci-hosting.de/user/register
```

## Wichtige Dateien im aktuellen Aufbau

### Registrierung
- `src/components/auth/register-form.tsx`
- `src/app/api/auth/register/route.ts`
- `src/lib/auth/auth.service.ts`
- `src/lib/auth/auth.types.ts`

### Login und Session
- `src/components/auth/login-panel.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/refresh/route.ts`
- `src/app/api/auth/logout/route.ts`
- `src/app/api/auth/me/route.ts`
- `src/components/auth/auth-provider.tsx`
- `src/lib/auth/auth.service.ts`
- `src/lib/auth/api.client.ts`
- `src/lib/auth/jwt.ts`
- `src/lib/auth/device.ts`
- `src/lib/auth/authorization.ts`
- `src/lib/auth/token.storage.ts`
- `src/middleware.ts`

## Zusammenfassung

### Registrierung
Die Registrierung ist ein serverseitig geproxyter Flow mit festen Pflichtfeldern und hartem Mapping auf die dokumentierte externe API `https://api.ci-hosting.de/public/user/registration`.

### Login
Der Login ist ein serverseitig geproxyter JWT-Flow gegen `https://auth.ci-hosting.de/user/login`, speichert Tokens sicher in `HttpOnly`-Cookies, baut daraus eine Session, schuetzt Routen ueber Middleware und verarbeitet Rollen fuer UI und Guards.
