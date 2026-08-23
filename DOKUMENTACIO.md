# Rendli — Műszaki dokumentáció

Fiók-alapú vállalkozáskezelő webalkalmazás szabadúszóknak: megkeresések → ajánlat → szerződés → megrendelés → projekt → számla, plusz bevétel/kiadás, valamint egy beágyazható megrendelő-űrlap. Adattárolás felhőben (Firebase). Nincs build lépés, nincs keretrendszer.

> Ez a fájl a **fejlesztői/műszaki** dokumentáció. A felhasználói szintű bemutatás a [README.md](README.md)-ben van.

---

## 1. Technológiai stack

| Réteg | Megoldás |
| --- | --- |
| Nyelv | Vanilla HTML5 + CSS3 + ES2020+ JavaScript (nincs transpiler, nincs bundler) |
| Auth | Firebase Authentication (e-mail + jelszó) |
| Adattár | Cloud Firestore (dokumentum-alapú), felhasználónkénti „vault" |
| E-mail | EmailJS (kliensoldali sablon-alapú küldés, saját szerver nélkül) |
| Diagramok | Saját rajzolású `<canvas>` (oszlop- és gyűrűdiagram), külső chart-könyvtár nélkül |
| Árfolyam | EUR/HUF a Frankfurter (EKB) API-ból |
| Ikonok/betűk | Inline SVG + rendszer/Google betűk |

A teljes UI **kétnyelvű (HU/EN)**, a megjelenés **világos / sötét / auto**, mobil-first reszponzív.

---

## 2. Fájlszerkezet és betöltési sorrend

```
04_Rendli/
├── index.html            # teljes DOM: auth-kapu, oldalsáv, fülek, ablakok (modálok)
├── style.css             # „Stúdió" dizájnrendszer + reszponzív elrendezés + téma-változók
├── firebase-store.js     # Firebase Auth + Firestore burkoló (LocalStore objektum)
├── theme.js              # világos/sötét/auto téma (localStorage: rendli_theme, rendli_mode)
├── fit-text.js           # nagy számkijelzők automatikus zsugorítása
├── script.js             # az app magja: auth-folyamat, state, dashboard, számlázás, űrlap-generátor, i18n, dialógusok
├── leads.js              # beérkező megkeresések (Firestore inbox figyelése), ajánlatküldés
├── contract.js           # megbízási szerződés összeállítása, küldése, PDF-nézet
├── email-sablon*.html    # EmailJS sablonok (ajánlat, szerződés, tulajdonosi értesítő, ügyfél-visszaigazolás)
├── firebase.json / firestore.rules / firestore.indexes.json   # Firebase projekt-konfiguráció
└── rendli-pelda-adatok.json   # példa state (importálható demó adat)
```

**Szkript-betöltési sorrend** (fontos, mert globális függvényekre és a betöltési sorrendre épül):

```
Firebase SDK  →  firebase-store.js  →  theme.js  →  script.js  →  leads.js  →  contract.js
```

A modulok **nem ES-modulok**: minden IIFE-be vagy a globális névtérbe kerül, és a fájlok egymás globális függvényeit hívják (pl. a `leads.js` felüldefiniálja a `window.showTab`-ot, a `contract.js` a `script.js`-beli `uiAlert`/`escHtml`/`state` elemeket használja).

---

## 3. Architektúra és életciklus

### 3.1 Indulás és auth

1. `DOMContentLoaded` → `initSidebar()` + `initStore()`, majd feliratkozás: `LocalStore.onAuthChange(cb)`.
2. Ha **nincs** bejelentkezett user → `showAuthGate(true)` (az `#auth-gate` látszik, az `#app-root` rejtett).
3. Ha **van** user → `showAuthGate(false)`, egyszeri inicializálás (`_appInitialized` őr), `await load()`, dátummezők feltöltése, `showTab('bizdash')`, végül `document.dispatchEvent(new Event('swm:ready'))` — erre iratkozik fel a `leads.js` a beérkező-mappa figyelés indításához.

`firebase-store.js` — a `LocalStore` objektum a teljes adatréteget elrejti a Firebase mögé:
- `onAuthChange(cb)` → `auth.onAuthStateChanged`;
- `login / register / logout / resetPassword / reauth / updatePassword`;
- `loadVault()` → `vaults/<uid>` dokumentum beolvasása; `saveVault(obj)` → ugyanoda mentés (JSON-tisztítással);
- `kvSet('formcfg_…')` → a beágyazott űrlap konfigurációjának közzététele a `form_configs/<uid>` dokumentumba.

### 3.2 State és perzisztencia

- Az egész app állapota egyetlen memóriabeli objektum: `state` (lásd [4. Adatmodell](#4-adatmodell)).
- **`load()`** — beolvassa a `vaults/<uid>`-t; ha nincs, `defaultState()`. Sikeres betöltés után: `normalizeState()` (hiányzó mezők pótlása, migrációk), `ensureInboxKey()` (az űrlaphoz tartozó egyedi kulcs), `publishFormConfig()`, `fetchEurHuf()`. Beállítja a `_stateLoaded = true` őrt.
- **`save()`** — **kritikus védelem**: ha `_stateLoaded` hamis, a mentés **le van tiltva**, hogy egy be nem töltött (üres) state ne írja felül a felhőben lévő valódi adatot. Egyébként `LocalStore.saveVault(state)` + `flashSaved()` visszajelzés. Szinte minden adatmódosító függvény a végén meghívja a `save()`-et.
- **`normalizeState()`** hívja a migrációkat: `migrateOrderNames`, `migrateOrderNumbers`, `migrateRevenueTax`, `reconcileOrderIncomes`, `reconcileInvoiceIncomes` — ezek biztosítják, hogy régebbi adatok is konzisztensek maradjanak (számlaszámok, könyvelt bevételek).
- Export/import: `exportData()` JSON letöltés, `importData(input)` JSON visszatöltés, `resetAllData()` teljes törlés (megerősítéssel).

### 3.3 Renderelés

- `showTab(id)` (a `script.js`-ben) állítja az aktív fület (`.tab-content.active`), és a végén `renderAll()`-t hív.
- `renderAll()` a modul-renderelők gyűjtője: `renderRevenues, renderExpenses, renderOrders, renderClients, renderBizDash, renderInvoices` (+ a `leads.js` a `showTab` felüldefiniálásával `renderLeadsTable`-t is meghív az „orders" fülön).
- A renderelők a `state`-ből építik a DOM-ot (template-string `innerHTML`), majd a `fit-text.js` méretezi a nagy számokat.

### 3.4 Kétnyelvűség (i18n)

A Rendli **futásidejű DOM-fordítással** dolgozik (nem sablon-kulcsokkal):
- alap a magyar DOM; `translateToEn(root)` / `restoreHu(root)` bejárja a szövegcsomópontokat (`_i18nWalk`) és egy szótár szerint cseréli őket;
- `startI18nObserver()` egy `MutationObserver`-rel a később renderelt tartalmat is lefordítja;
- `setUiLang(lang)` állítja a `state.uiLang`-ot; `L(hu, en)` és `isEn()` a JS-ből generált szövegekhez ad nyelvfüggő stringet; `locDate()` a lokalizált dátumhoz.

### 3.5 Téma

`theme.js` (IIFE): `data-theme` + `data-mode` attribútumot tesz a `<html>`-re. `setAppearanceMode('light'|'dark'|'auto')` váltja a módot (localStorage kulcs: `rendli_mode`); `auto` esetén napszak szerint (19:00–06:00 sötét). Váltáskor újrarajzolja az aktív dashboard-diagramokat (`redrawCharts`).

---

## 4. Adatmodell (`state`)

A `defaultState()` által adott főbb kulcsok:

| Kulcs | Tartalom |
| --- | --- |
| `uiLang` | `'hu'` / `'en'` |
| `inboxKey` | az űrlaphoz tartozó egyedi azonosító (a beágyazó kódba kerül) |
| `bizTaxRate`, `fxEurHuf` | adókulcs, EUR/HUF árfolyam |
| `profile`, `sellerInfo` | fiók-profil, ill. az ajánlatokon/számlákon/szerződéseken használt eladói/cégadatok |
| `leads` | `{ id: lead }` — beérkező megkeresések (státusz, ár, ajánlat, szerződés) |
| `orders` | tömb — megrendelések/projektek (`num`, `status`, `deadline`, `price`, `currency`…) |
| `invoices` | kiállított számlák (tételek, kiállítás/fizetés dátuma, `paid`) |
| `bizIncome`, `bizExpense` | bevétel/kiadás tételek |
| `orderNumByYear` | évenkénti sorszám-számláló a megrendelésekhez/számlákhoz |
| `importedLeadIds` | a már behúzott inbox-elemek azonosítói (duplikáció ellen) |
| `formConfig` | a beágyazható űrlap beállításai (szolgáltatások, mezők) |

---

## 5. Fájlonkénti bontás és kulcsfüggvények

### 5.1 `script.js` (~2670 sor) — az app magja

**Auth és fiók.** `authLogin / authRegister / authLogout / authResetPassword`, `changeAccountPassword` (reauth + updatePassword), `setAuthMode` (belépés/regisztráció váltás), `hibaSzoveg(err)` a Firebase hibakódok magyarra fordítása. Fiókoldal: `populateAccountForms`, `saveAccountProfile`, `saveBusinessProfile`, `saveSellerInfo`, `onVatStatusChange` (ÁFA-alany kapcsoló).

**State és perzisztencia.** `defaultState`, `normalizeState`, `save`, `load`, `setSaveStatus`/`flashSaved`, `exportData`/`importData`/`resetAllData` — lásd [3.2](#32-state-és-perzisztencia).

**Pénzügyi segédek.** `eurHufRate`, `toHuf(amount, cur, rate)`, `orderPriceHuf(o)`, `fmtCur(amount, cur)`, `fetchEurHuf()` (Frankfurter API). A számok kezelése: `parseAmount`, `formatThousands`, `fmt`/`fmtNum`.

**Sorszámozás.** `nextOrderNum(dateStr)` és `nextInvoiceNumForOrder(order)` — `orderNumByYear` alapján `rendli/ÉÉÉÉ/NNN` formátumú azonosítót ad; `migrateOrderNumbers` a régi rekordokhoz.

**Megrendelések.** `addOrder`, `setOrderStatus`, `deleteOrder`, `renderOrders` (kártya/tábla + státusz-legördülő), `selectOrderClientType`. `syncOrderIncome`/`reconcileOrderIncomes` a megrendelésből könyvelt bevétel szinkronban tartása.

**Bevétel/kiadás.** `addRevenue`/`deleteRevenue`/`renderRevenues`, `addExpense`/`deleteExpense`/`renderExpenses`, `revenueCalc(r)` (nettó/ÁFA/bruttó).

**Ügyfelek.** `renderClients` — a `leads` + `orders` adatokból automatikusan épített ügyféltörzs (név, e-mail, telefon, utolsó kapcsolat).

**Áttekintő dashboard.** `renderBizDash()` — a legösszetettebb renderelő: kiszámolja az idei árbevételt, költséget, eredményt, projekt-státuszokat, közelgő határidőket, és `<canvas>`-ra rajzol **havi bevétel/kiadás oszlopdiagramot** és **projekt-státusz gyűrűdiagramot**, plusz egy havi pénzforgalom-táblát.

**Számlázás.** `invOpen(orderId)` (számla-modal előtöltése), `invUpdatePreview` (élő végösszeg), `invSave`, `invMarkPaid`, `invDelete`, `invTotal`/`invTotalHuf`, `renderInvoices` (kiegyenlített/függő bontás, stat-kártyák), `reconcileInvoiceIncomes`. `invDownloadPDF(id)` **külön nyomtatási ablakot** nyit tiszta HTML-lel; a `@page{margin:0}` szabály miatt a böngésző nem tesz rá fejlécet/láblécet.

**Beágyazható űrlap (generátor).** `renderFormConfig`/`renderServiceRows`/`addService`/`updateService`/`removeService` — a szolgáltatások (HU/EN név + ár) és mezők szerkesztése; `formPreviewHtml()` élő előnézet; `inboxEmbedSnippet()` és `priceListSnippet()` a weboldalra másolható, önálló JS-widget kódját generálja (ez a látogató oldalán fut, és a Firestore-ba ír); `publishFormConfig()` a konfigot közzéteszi (`form_configs/<uid>`); `copyFormSnippet`/`copyInbox` vágólapra másolás.

**Dialógusok.** `uiDialog(opts)` egy Promise-alapú modal; `uiConfirm`/`uiAlert` erre épül (a natív `confirm/alert` helyett, egységes megjelenéssel).

**Segédek.** `escHtml(s)` (XSS-védelem template-ekhez), `now()`, `uid()`, `showTab`, `openModal`/`closeModal`, `toggleNav`/`toggleSidebarCollapse`.

### 5.2 `leads.js` (~517 sor) — beérkező megkeresések + ajánlat

- **`initPortfolioInboxSync()`** — a `swm:ready` eseményre indul: `firebase.firestore().collection('inbox').doc(currentUid).collection('items')` **élő figyelése** (`onSnapshot`). Minden új elemet behúz a `state.leads` közé (`importedLeadIds` alapján duplikáció ellen), majd **törli** a sorból, és frissíti a nézeteket. Hiba esetén `showLeadsSyncError` jelez.
- **`LEAD_STATUS_MAP`** — a státusz-lánc: `uj → ajanlat → elfogadva → szerzodes → megrendelve → atirva`.
- **`setLeadStatus(id, status)`** — a legördülő logika kapuja:
  - `ajanlat` → `openOfferModal` (ajánlat összeállítása);
  - `elfogadva` → csak ha az ajánlat már kiment (`lead.offer.sentAt`); rögzíti az elfogadást;
  - `szerzodes` → csak ha `canSendContract(lead)` igaz (ajánlat kiment **és** elfogadva), különben figyelmeztet;
  - `megrendelve` → `convertLeadToOrder`.
- **`canSendContract(lead)`** — a szerződés-kapu egyetlen igazságforrása: `offer.sentAt && offer.accepted`.
- **`convertLeadToOrder(id)`** — a megkeresésből `orders`-elemet készít (sorszámmal), a lead státuszát `atirva`-ra állítja, és az „orders" fülre visz.
- **Ajánlat.** `openOfferModal`, `offerAddRow`/`_offerRows`/`offerRecalc` (tételek + nettó/ÁFA/bruttó), `_offerDetailsHtml` (az e-mail HTML-táblája), **`sendOffer()`** — EmailJS-sel kiküldi az ajánlatot, elmenti `lead.offer`-be (`sentAt`), státuszt `ajanlat`-ra állít.
- `renderLeadsTable()` — a megkeresések táblája: státusz-legördülő, ár/határidő mezők, „✉ Ajánlat" és „📄 Szerződés" gombok (utóbbi letiltva, amíg `canSendContract` hamis).

### 5.3 `contract.js` (~236 sor) — megbízási szerződés

- `_contractCtx(lead)` — összegyűjti a szerződéshez a cég- és megrendelő-adatokat, tételeket, összegeket, ÁFA-státuszt.
- `buildContractInner(ctx)` / `buildContractDoc(ctx)` — a Ptk. megbízási szerződésre hivatkozó, `[ ]` helykitöltőket tartalmazó **sablon-tervezetet** állít össze (figyelmeztetéssel, hogy ügyvéddel véglegesítendő).
- `openContractModal(leadId)` — **itt is** ellenőrzi a `canSendContract`-ot (kettős védelem a legördülő mellett).
- `printContract(leadId)` — nyomtatási/PDF ablak; `sendContract()` — EmailJS-sel kiküldi és a státuszt „Szerződéskötésre vár"-ra állítja.

### 5.4 `firebase-store.js` / `theme.js` / `fit-text.js`

- `firebase-store.js` — a `LocalStore` réteg (lásd [3.1](#31-indulás-és-auth)).
- `theme.js` — téma/mód kezelés (lásd [3.5](#35-téma)).
- `fit-text.js` — `fit(el)` a `[data-fit]` elemek betűméretét csökkenti, amíg beférnek; `fitAll()` + `MutationObserver`/`resize` a változásokra.

---

## 6. Külső integrációk

- **Firebase.** Auth (e-mail/jelszó) + Firestore. Dokumentumok: `vaults/<uid>` (app-state), `form_configs/<uid>` (közzétett űrlap-config), `inbox/<uid>/items` (beérkező rendelések sora). A `firestore.rules` szabályozza a hozzáférést. Beállítás: `BEALLITAS-Firebase.txt`.
- **EmailJS.** `emailjsSend(templateId, params)`; sablonok: ajánlat, szerződés, tulajdonosi értesítő, ügyfél-visszaigazolás. Beállítás: `BEALLITAS-EmailJS.txt`.
- **Frankfurter (EKB).** `fetchEurHuf()` — EUR/HUF árfolyam a többdevizás megrendelésekhez/számlákhoz.

### Beágyazott űrlap adatáramlása (végponttól végpontig)

```
Látogató weboldala (beágyazott widget)                Rendli admin
  ├─ beolvassa: form_configs/<uid>  (szolgáltatások, mezők)
  └─ beküldés → inbox/<uid>/items ─────onSnapshot──────►  leads.js: state.leads-be húzza,
                                                            törli a sort, renderel
```

---

## 7. Reszponzivitás

Mobil-first CSS. Az oldalsáv telefonon hamburger-menüvé csukódik; a rácsok `auto-fit`/töréspontok mentén 4→2→1 oszlopra rendeződnek; a széles adattáblák a saját, `overflow-x`-es konténerükön belül görgethetők, így **nincs oldalszintű vízszintes túllógás** egyik nézetben sem (mobil/tablet/asztali tesztelve).

---

## 8. Beüzemelés

1. Firebase-projekt létrehozása, a konfiguráció kitöltése (`BEALLITAS-Firebase.txt`), a `firestore.rules` telepítése.
2. EmailJS beállítása és a sablon-azonosítók megadása (`BEALLITAS-EmailJS.txt`).
3. A fájlok feltöltése bármilyen statikus tárhelyre (Firebase Hosting / GitHub Pages / Netlify / saját szerver).
4. Regisztráció, majd a **Fiók** és az **Űrlap** fül beállítása; a generált beágyazó kód a weboldalra másolása.

Nincs build lépés; a fejlesztéshez elég egy statikus fájlkiszolgáló (pl. `python3 -m http.server`).
