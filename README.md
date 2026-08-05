# Rendli — business manager (admin + embeddable order form)

**Language / Nyelv:** [English](#english) · [Magyar](#magyar)

**🔗 GitHub:** <!-- Paste the project repository link here, e.g. https://github.com/username/rendli / Illeszd be ide a projekt repójának linkjét --> _(link coming soon / link hamarosan)_

---

## English

An account-based, **backend-free business management web app** for freelancers and small businesses. It handles incoming leads, orders, projects, clients, invoices, plus income and expenses in one place — and it generates an **embeddable order form** whose submissions appear automatically on the dashboard, with no manual entry. **No cloud, no external service** — all data is stored in the browser's `localStorage`. No build step and no framework: plain HTML, CSS and JavaScript.

The interface is fully **bilingual (Hungarian / English)** and uses the shared **"Soft" (Lágy)** design with a collapsible left sidebar (icon + label, collapses to icon).

### Key features

The app is organised into tabs:

- **Overview (dashboard)** — this year's revenue, ongoing and total projects, upcoming deadlines, incoming leads, this year's costs and result, a monthly income/expense chart, a project-status donut and a monthly cash-flow table.
- **Orders** — managing incoming and recorded orders, with statuses.
- **Projects** — tracking ongoing and closed work.
- **Clients** — the client base.
- **Invoices** — a record of issued invoices.
- **Income / Expenses** — recording and summarising financial items.
- **Form** — configuring the embeddable order / lead form and the generated code.
- **Account** — profile, settings (the embedded form's business data), appearance (light/dark/auto) and language (HU/EN) as pill toggles.

### Files

- `index.html` — the UI (auth gate, sidebar, tabs)
- `style.css` — the shared "Soft" design + responsive layout
- `theme.js` — light / dark / auto appearance (keys: `rendli_theme`, `rendli_mode`)
- `script.js` — auth, shared state, dashboard, invoicing, **order-form generator**, i18n
- `leads.js` — live inbox monitoring from `localStorage`, incoming leads/orders module
- `local-store.js` — `localStorage`-based local auth + per-user data vault
- `icon.svg` — app icon
- `README.md`

> Script load order: `local-store.js` → `theme.js` → `script.js` → `leads.js`.

### Architecture in a nutshell

- **`local-store.js`** provides a browser-saved account and a per-user data vault in `localStorage` — no cloud, no backend. All app data is persisted locally via the `save()` call.
- The embedded order form writes to the account's **inbox** in the same browser's `localStorage` (`ls_rendli_inbox_<uid>`). `leads.js` monitors this live and automatically pulls incoming orders into `state.leads` — so an order submitted through the form appears without manual entry.
- Because data is local to the browser, it is **not synced across devices**; the embedded form shares data only within the **same site / browser**. Use **Account → Export / Import** to back up or move your data (JSON).

### Setup

There is **no build step and no cloud setup**. Either:

1. **Open `index.html` directly** in a modern browser, or
2. **Host the files on any static host** (GitHub Pages, Netlify, your own server) and open the site.

On first use, register a local account (email + password) — it is stored only in your browser. Then configure the **Form** tab and copy the generated order-form code onto your website.

### Tech stack

- **Vanilla HTML / CSS / JavaScript** — no build step, no framework.
- **`localStorage`** for storage (via `local-store.js`) — no backend, no cloud.
- Custom charts (canvas), no external charting library; responsive, mobile-first CSS with the "Soft" theme and light/dark/auto appearance; dictionary-based HU/EN i18n.

---

## Magyar

Fiók-alapú, **backend nélküli vállalkozáskezelő webalkalmazás** szabadúszóknak és kisvállalkozásoknak. Egy helyen kezeli a beérkező megkereséseket, a megrendeléseket, a projekteket, az ügyfeleket, a számlákat, valamint a bevételeket és kiadásokat — és generál egy **beágyazható megrendelő-űrlapot**, amelynek leadott rendelései automatikusan, kézi rögzítés nélkül megjelennek a felületen. **Nincs felhő, nincs külső szolgáltatás** — minden adat a böngésző `localStorage`-ában tárolódik. Nincs build lépés és nincs keretrendszer: tiszta HTML, CSS és JavaScript.

A felület teljesen **kétnyelvű (magyar / angol)**, a közös **„Lágy"** dizájnt használja, összecsukható bal oldali menüsávval (ikon + felirat, ikonná csukható).

### Főbb funkciók

Az alkalmazás fülekre tagolódik:

- **Áttekintés (dashboard)** — idei árbevétel, folyamatban lévő és összes projekt, közelgő határidők, beérkezett megkeresések, idei költségek és eredmény, havi bevétel/kiadás diagram, projekt-státusz donut és havi pénzforgalom-tábla.
- **Megrendelések** — a beérkező és rögzített rendelések kezelése, státuszokkal.
- **Projektek** — folyamatban lévő és lezárt munkák nyilvántartása.
- **Ügyfelek** — ügyféltörzs.
- **Számlák** — kiállított számlák nyilvántartása.
- **Bevételek / Kiadások** — pénzügyi tételek rögzítése és összesítése.
- **Űrlap** — a beágyazható megrendelő-/megkereső-űrlap beállítása és a generált kód.
- **Fiók** — profil, beállítások (a beágyazott űrlap üzleti adatai), megjelenés (világos/sötét/auto) és nyelv (HU/EN) pill-kapcsolókkal.

### Fájlok

- `index.html` — a felület (auth-kapu, oldalsáv, tabok)
- `style.css` — a közös „Lágy" dizájn + reszponzív elrendezés
- `theme.js` — világos / sötét / auto megjelenés (kulcsok: `rendli_theme`, `rendli_mode`)
- `script.js` — auth, közös állapot, dashboard, számlázás, **űrlap-generátor**, i18n
- `leads.js` — élő bejövő-mappa figyelés a `localStorage`-ból, beérkező megkeresések/rendelések modul
- `local-store.js` — `localStorage`-alapú helyi auth + felhasználónkénti adat-vault
- `icon.svg` — az alkalmazás ikonja
- `README.md`

> Szkript-betöltési sorrend: `local-store.js` → `theme.js` → `script.js` → `leads.js`.

### Architektúra dióhéjban

- A **`local-store.js`** böngészőbe mentett fiókot és felhasználónkénti adat-vaultot biztosít a `localStorage`-ban — nincs felhő, nincs backend. Minden appadat helyben, a `save()` hívással tárolódik.
- A beágyazott megrendelő-űrlap a fiók **bejövő-mappájába** ír, ugyanazon böngésző `localStorage`-ában (`ls_rendli_inbox_<uid>`). A `leads.js` ezt élőben figyeli, és az onnan érkező rendeléseket automatikusan behúzza a `state.leads` közé — így az űrlapon leadott rendelés kézi rögzítés nélkül megjelenik.
- Mivel az adat a böngészőhöz helyi, **nem szinkronizálódik eszközök között**; a beágyazott űrlap csak az **azonos webhelyen / böngészőben** oszt meg adatot. A **Fiók → Export / Import** funkcióval menthető/átvihető az adat (JSON).

### Beüzemelés

**Nincs build lépés és nincs felhő-beállítás.** Vagy:

1. **Nyisd meg közvetlenül az `index.html`-t** egy modern böngészőben, vagy
2. **Töltsd fel a fájlokat tetszőleges statikus tárhelyre** (GitHub Pages, Netlify, saját szerver) és nyisd meg az oldalt.

Első használatkor regisztrálj egy helyi fiókot (e-mail + jelszó) — ez kizárólag a böngésződben tárolódik. Ezután állítsd be az **Űrlap** fület, és másold a generált megrendelő-űrlap kódját a weboldaladra.

### Technológia

- **Vanilla HTML / CSS / JavaScript** — build lépés és keretrendszer nélkül.
- **`localStorage`** a tároláshoz (a `local-store.js` révén) — nincs backend, nincs felhő.
- Egyedi diagramok (canvas), külső chart-könyvtár nélkül; reszponzív, mobil-first CSS a „Lágy" témával és világos/sötét/auto megjelenéssel; szótáralapú HU/EN i18n.
