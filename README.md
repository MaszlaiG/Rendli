# Rendli — business manager (admin + embeddable order form)

**Language / Nyelv:** [English](#english) · [Magyar](#magyar)

**🌐 Live / Élő oldal:** <https://maszlaig.github.io/Rendli/>

**🔗 GitHub:** <!-- Paste the project repository link here / Illeszd be ide a projekt repójának linkjét --> _(link coming soon / link hamarosan)_

---

## English

An account-based **business management web app** for freelancers and small businesses. It handles incoming leads, orders, projects, clients, invoices and contracts, plus income and expenses in one place — and it generates an **embeddable order form** whose submissions appear on the dashboard automatically, with no manual entry. Data is stored per account in the cloud (**Firebase**). No build step and no framework: plain HTML, CSS and JavaScript.

The interface is fully **bilingual (Hungarian / English)** and uses the shared **"Studio" (Stúdió)** design with a collapsible left sidebar (icon + label, collapses to icon) and a light / dark / auto appearance.

### Key features

The app is organised into tabs:

- **Overview (dashboard)** — this year's revenue, ongoing and total projects, upcoming deadlines, incoming leads, this year's costs and result, a monthly income/expense chart, a project-status donut and a monthly cash-flow table.
- **Orders** — incoming leads and recorded orders with a status workflow, plus the offer and contract actions (see below).
- **Projects** — tracking ongoing and closed work.
- **Clients** — the client base, built automatically from leads and orders.
- **Invoices** — issuing invoices and a printable **PDF view** (opens in a clean print window with no browser header/footer).
- **Contracts** — the assignment-contract templates sent to clients, viewable and saveable as PDF.
- **Income / Expenses** — recording and summarising financial items.
- **Form** — configuring the embeddable order / lead form and copying the generated code.
- **Account** — profile, business data (used on offers, contracts and invoices), appearance (light/dark/auto) and language (HU/EN).

### Lead → offer → contract → order workflow

A job can be followed end to end through the lead status:

**New inquiry → Quote sent → Quote accepted → Awaiting contract → Ordered → Converted to project**

- **Quote (offer)** — compose an itemised quote and send it to the client by e-mail (EmailJS).
- **Quote accepted** — mark this once the client confirms; it records the acceptance on the lead.
- **Contract** — the assignment-contract can only be created **after the quote has been sent *and* accepted**. Until then the "Contract" button is disabled and the status can't be moved to "Awaiting contract". This gate is enforced both from the status dropdown and from the button.

### Files

- `index.html` — the UI (auth gate, sidebar, tabs, modals)
- `css/style.css` — the shared "Studio" design + responsive layout
- `js/theme.js` — light / dark / auto appearance (keys: `rendli_theme`, `rendli_mode`)
- `js/script.js` — auth flow, shared state, dashboard, invoicing (+ PDF view), **order-form generator**, dialogs, i18n
- `js/leads.js` — incoming-inbox listener (Firestore), leads/orders module, offer sending
- `js/contract.js` — assignment-contract builder, sending and PDF view
- `js/firebase-store.js` — Firebase Auth + Firestore data layer (`LocalStore` wrapper)
- `js/fit-text.js` — auto-fit for large numeric displays
- `e-mail sablonok/email-sablon*.html` — EmailJS templates (offer, contract, owner notification, client confirmation)
- `firebase/` — Firebase project config (`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`); run `firebase deploy` from inside this folder
- `README.md`, `BEALLITAS-Firebase.txt`, `BEALLITAS-EmailJS.txt` — docs / setup notes

> Script load order: Firebase SDK → `firebase-store.js` → `theme.js` → `script.js` → `leads.js` → `contract.js`.

### Architecture in a nutshell

- **`firebase-store.js`** wraps Firebase Auth (email/password) and Firestore behind a `LocalStore` object. Each user's data lives in a single Firestore document (`vaults/<uid>`), loaded on sign-in and persisted via `save()`.
- The embedded order form writes to the account's **inbox** in Firestore (`inbox/<uid>/items`). `leads.js` listens live (`onSnapshot`), pulls new submissions into `state.leads` and removes the queue item — so an order submitted through the form appears without manual entry.
- **EmailJS** sends the offer, contract and notification e-mails from the templates; no mail server of your own is needed.
- Because data is tied to the account in the cloud, it **syncs across devices** for the same login. **Account → Export / Import** can still back up or move the data as JSON.

### Setup

1. Create a Firebase project and fill in the config (see `BEALLITAS-Firebase.txt`); deploy `firestore.rules`.
2. Set up EmailJS and the template IDs (see `BEALLITAS-EmailJS.txt`).
3. **Publish the files with GitHub Pages** and open the site. (Firebase is used only for data storage — Auth + Firestore.)

On first use, register an account (email + password). Then configure the **Form** tab and copy the generated order-form code onto your website.

### Tech stack

- **Vanilla HTML / CSS / JavaScript** — no build step, no framework.
- **Firebase** (Auth + Firestore) for accounts and storage; **EmailJS** for outgoing mail.
- Custom charts (canvas), no external charting library; responsive, mobile-first CSS with the "Studio" theme and light/dark/auto appearance; dictionary-based HU/EN i18n.

---

## Magyar

Fiók-alapú **vállalkozáskezelő webalkalmazás** szabadúszóknak és kisvállalkozásoknak. Egy helyen kezeli a beérkező megkereséseket, a megrendeléseket, a projekteket, az ügyfeleket, a számlákat és a szerződéseket, valamint a bevételeket és kiadásokat — és generál egy **beágyazható megrendelő-űrlapot**, amelynek leadott rendelései automatikusan, kézi rögzítés nélkül megjelennek a felületen. Az adatok fiókonként a felhőben (**Firebase**) tárolódnak. Nincs build lépés és nincs keretrendszer: tiszta HTML, CSS és JavaScript.

A felület teljesen **kétnyelvű (magyar / angol)**, a közös **„Stúdió"** dizájnt használja, összecsukható bal oldali menüsávval (ikon + felirat, ikonná csukható) és világos / sötét / auto megjelenéssel.

### Főbb funkciók

Az alkalmazás fülekre tagolódik:

- **Áttekintés (dashboard)** — idei árbevétel, folyamatban lévő és összes projekt, közelgő határidők, beérkezett megkeresések, idei költségek és eredmény, havi bevétel/kiadás diagram, projekt-státusz donut és havi pénzforgalom-tábla.
- **Megrendelések** — beérkező megkeresések és rögzített rendelések státusz-folyamattal, valamint az ajánlat- és szerződés-műveletek (lásd lejjebb).
- **Projektek** — folyamatban lévő és lezárt munkák nyilvántartása.
- **Ügyfelek** — ügyféltörzs, a megkeresésekből és rendelésekből automatikusan.
- **Számlák** — számlakiállítás és nyomtatható **PDF-nézet** (tiszta nyomtatási ablakban nyílik, böngésző-fejléc/lábléc nélkül).
- **Szerződések** — az ügyfeleknek kiküldött megbízási szerződés-sablonok, megnézhetők és PDF-be menthetők.
- **Bevételek / Kiadások** — pénzügyi tételek rögzítése és összesítése.
- **Űrlap** — a beágyazható megrendelő-/megkereső-űrlap beállítása és a generált kód másolása.
- **Fiók** — profil, üzleti adatok (az ajánlatokon, szerződéseken és számlákon használva), megjelenés (világos/sötét/auto) és nyelv (HU/EN).

### Megkeresés → ajánlat → szerződés → megrendelés folyamat

Egy munka végigkövethető a megkeresés státuszán:

**Új megkeresés → Ajánlat elküldve → Ajánlat elfogadva → Szerződéskötésre vár → Megrendelve → Projektté alakítva**

- **Ajánlat** — tételes árajánlat összeállítása és kiküldése a megrendelőnek e-mailben (EmailJS).
- **Ajánlat elfogadva** — akkor állítsd be, ha a megrendelő visszaigazolta; ez rögzíti az elfogadást a megkeresésen.
- **Szerződés** — a megbízási szerződés csak **azután készíthető, hogy az árajánlat kiment *és* elfogadták**. Addig a „Szerződés" gomb letiltott, és a státusz sem állítható „Szerződéskötésre vár"-ra. Ez a feltétel a státusz-legördülőből és a gombból is védve van.

### Fájlok

- `index.html` — a felület (auth-kapu, oldalsáv, fülek, ablakok)
- `css/style.css` — a közös „Stúdió" dizájn + reszponzív elrendezés
- `js/theme.js` — világos / sötét / auto megjelenés (kulcsok: `rendli_theme`, `rendli_mode`)
- `js/script.js` — auth-folyamat, közös állapot, dashboard, számlázás (+ PDF-nézet), **űrlap-generátor**, párbeszédablakok, i18n
- `js/leads.js` — beérkező-mappa figyelése (Firestore), megkeresések/rendelések modul, ajánlatküldés
- `js/contract.js` — megbízási szerződés összeállítása, küldése és PDF-nézete
- `js/firebase-store.js` — Firebase Auth + Firestore adatréteg (`LocalStore` burkoló)
- `js/fit-text.js` — nagy számkijelzők automatikus méretezése
- `e-mail sablonok/email-sablon*.html` — EmailJS-sablonok (ajánlat, szerződés, tulajdonosi értesítő, ügyfél-visszaigazolás)
- `firebase/` — Firebase projekt-konfiguráció (`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`); a `firebase deploy`-t ebből a mappából futtasd
- `README.md`, `BEALLITAS-Firebase.txt`, `BEALLITAS-EmailJS.txt` — dokumentáció / beállítási jegyzetek

> Szkript-betöltési sorrend: Firebase SDK → `firebase-store.js` → `theme.js` → `script.js` → `leads.js` → `contract.js`.

### Architektúra dióhéjban

- A **`firebase-store.js`** a Firebase Autht (e-mail/jelszó) és a Firestore-t burkolja egy `LocalStore` objektum mögé. Minden felhasználó adata egyetlen Firestore-dokumentumban (`vaults/<uid>`) él, bejelentkezéskor betöltve és a `save()` hívással mentve.
- A beágyazott megrendelő-űrlap a fiók **bejövő-mappájába** ír a Firestore-ban (`inbox/<uid>/items`). A `leads.js` ezt élőben figyeli (`onSnapshot`), az új leadásokat behúzza a `state.leads` közé és törli a sorból — így az űrlapon leadott rendelés kézi rögzítés nélkül megjelenik.
- Az **EmailJS** küldi az ajánlat-, szerződés- és értesítő e-maileket a sablonokból; nincs szükség saját levelezőszerverre.
- Mivel az adat a fiókhoz kötve a felhőben van, **eszközök között szinkronizálódik** ugyanazzal a belépéssel. A **Fiók → Export / Import** így is menti/átviszi az adatot JSON-ként.

### Beüzemelés

1. Hozz létre egy Firebase-projektet és töltsd ki a konfigurációt (lásd `BEALLITAS-Firebase.txt`); telepítsd a `firestore.rules`-t.
2. Állítsd be az EmailJS-t és a sablon-azonosítókat (lásd `BEALLITAS-EmailJS.txt`).
3. **Tedd közzé a fájlokat GitHub Pages-szel** és nyisd meg az oldalt. (A Firebase csak az adattárolás — Auth + Firestore.)

Első használatkor regisztrálj egy fiókot (e-mail + jelszó). Ezután állítsd be az **Űrlap** fület, és másold a generált megrendelő-űrlap kódját a weboldaladra.

### Technológia

- **Vanilla HTML / CSS / JavaScript** — build lépés és keretrendszer nélkül.
- **Firebase** (Auth + Firestore) a fiókokhoz és tároláshoz; **EmailJS** a kimenő levelekhez.
- Egyedi diagramok (canvas), külső chart-könyvtár nélkül; reszponzív, mobil-first CSS a „Stúdió" témával és világos/sötét/auto megjelenéssel; szótáralapú HU/EN i18n.
