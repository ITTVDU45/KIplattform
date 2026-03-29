
## 🔧 Übersicht

Diese API ermöglicht:

* Registrierung neuer Nutzer über die Plattform
* Abruf von Nutzerdaten durch Admins
* Öffentlichen Zugriff auf Nutzerliste (eingeschränkt beachten!)

---

## 🧾 1. Nutzerregistrierung

### Endpoint

```
POST https://api.ci-hosting.de/public/user/registration
```

### Beschreibung

Erstellt einen neuen Nutzer in der Plattform.

### Pflichtfelder

| Feld      | Typ    | Beschreibung                 | Beispiel                              |
| --------- | ------ | ---------------------------- | ------------------------------------- |
| anrede    | string | Anrede des Nutzers           | "Herr", "Frau", "Divers"              |
| firstname | string | Vorname                      | "Max"                                 |
| lastname  | string | Nachname                     | "Mustermann"                          |
| email     | string | E-Mail-Adresse (einzigartig) | "[max@mail.com](mailto:max@mail.com)" |
| password  | string | Passwort                     | "Max123!"                             |

👉 Laut Dokumentation: 

---

### Beispiel Request (JSON)

```json
{
  "anrede": "Herr",
  "firstname": "Max",
  "lastname": "Mustermann",
  "email": "max.mustermann@gmail.com",
  "password": "Max123!"
}
```

### Beispiel (Fetch / JavaScript)

```javascript
await fetch("https://api.ci-hosting.de/public/user/registration", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    anrede: "Herr",
    firstname: "Max",
    lastname: "Mustermann",
    email: "max@example.com",
    password: "Max123!"
  })
});
```

---

## 🔐 2. Admin – Nutzer abrufen

### Endpoint

```
GET https://api.ci-hosting.de/v1/admin/user
```

### Beschreibung

* Liefert alle registrierten Nutzer
* Zugriff nur mit Admin-Authentifizierung

👉 Hinweis: Admin muss eingeloggt sein 

---

### Beispiel (Fetch)

```javascript
await fetch("https://api.ci-hosting.de/v1/admin/user", {
  method: "GET",
  headers: {
    "Authorization": "Bearer DEIN_ADMIN_TOKEN"
  }
});
```

---

## 🌍 3. Öffentliche Nutzer-API

### Endpoint

```
GET https://api.ci-hosting.de/api/user
```

### Beschreibung

* Öffentlicher Zugriff auf Nutzerdaten
* ⚠️ Achtung: Datenschutz beachten!

👉 Laut Dokumentation verfügbar 

---

## 🧠 Integration in deine KI-Plattform

### Typischer Workflow

1. **User registriert sich im Frontend**
2. Frontend sendet POST Request an API
3. User wird gespeichert
4. Admin sieht Nutzer im Dashboard
5. KI kann (optional) auf Userdaten zugreifen

---

## 🧱 Empfohlene Architektur

### Frontend (z. B. Next.js)

* Formular für Registrierung
* Validierung (E-Mail, Passwort)

### Backend (optional Middleware)

* Proxy API (für Sicherheit)
* Token Handling
* Logging

### Admin Dashboard

* Nutzerliste anzeigen
* Filter / Suche
* Status (aktiv, bestätigt, etc.)

---

## 🔒 Sicherheit & Best Practices

* ✅ Passwort niemals im Klartext speichern (falls eigene Erweiterung)
* ✅ HTTPS verwenden
* ✅ Rate Limiting einbauen
* ⚠️ Öffentliche API nur eingeschränkt nutzen
* ✅ E-Mail Validierung implementieren

---

## 🚀 Erweiterungen für deine KI-Plattform

Du kannst darauf aufbauen:

* 🔑 Login-System (JWT)
* 👤 Rollen (Admin / User / Kunde)
* 🤖 KI-User-Verknüpfung (z. B. Chat-Historie)
* 📊 Tracking & Analytics
* 📬 E-Mail-Verifizierung

