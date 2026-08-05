

const SWM_APP_ID = 'rendli';

let _appInitialized = false;
let currentUid = null;

function initStore() {
  LocalStore.init(SWM_APP_ID);
}

function showAuthGate(show) {
  const gate = document.getElementById('auth-gate');
  const root = document.getElementById('app-root');
  if (gate) gate.style.display = show ? 'flex' : 'none';
  if (root) root.style.display = show ? 'none' : '';
}

function hibaSzoveg(err) {
  var c = (err && err.code) || '';
  switch (c) {
    case 'auth/invalid-email': return 'Érvénytelen e-mail cím.';
    case 'auth/user-not-found': return 'Nincs fiók ezzel az e-mail címmel — regisztrálj.';
    case 'auth/wrong-password': return 'Hibás jelszó ehhez az e-mail címhez.';
    case 'auth/invalid-credential': return 'Hibás e-mail cím vagy jelszó.';
    case 'auth/email-already-in-use': return 'Ezzel az e-mail címmel már van fiók — lépj be inkább.';
    case 'auth/weak-password': return 'Túl gyenge jelszó (min. 6 karakter).';
    case 'auth/too-many-requests': return 'Túl sok próbálkozás — próbáld később.';
    case 'auth/requires-recent-login': return 'A jelszó módosításához jelentkezz ki, majd be újra, és próbáld rögtön.';
    default: return 'Hiba történt: ' + ((err && err.message) || c || 'ismeretlen');
  }
}

async function authLogin() {
  const emailEl = document.getElementById('auth-email');
  const passEl  = document.getElementById('auth-password');
  const errEl   = document.getElementById('auth-error');
  const btn     = document.getElementById('auth-login-btn');
  const email = (emailEl.value || '').trim();
  const pass  = passEl.value || '';

  if (errEl) errEl.style.display = 'none';

  if (!email || !pass) {
    if (errEl) { errEl.textContent = 'Add meg az e-mail címet és a jelszót!'; errEl.style.display = 'block'; }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Belépés…';
  try {
    await LocalStore.login(email, pass);
  } catch (err) {
    if (errEl) { errEl.textContent = hibaSzoveg(err); errEl.style.display = 'block'; }
  }
  btn.disabled = false;
  btn.textContent = 'Belépés';
}

function authLogout() {
  LocalStore.logout();
}

async function authRegister() {
  const emailEl = document.getElementById('auth-email');
  const passEl  = document.getElementById('auth-password');
  const errEl   = document.getElementById('auth-error');
  const btn     = document.getElementById('auth-login-btn');
  const email = (emailEl.value || '').trim();
  const pass  = passEl.value || '';
  const pass2 = (document.getElementById('auth-password2') || {}).value || '';

  if (errEl) errEl.style.display = 'none';
  if (!email || !pass) {
    if (errEl) { errEl.textContent = 'Add meg az e-mail címet és a jelszót!'; errEl.style.display = 'block'; }
    return;
  }
  if (pass !== pass2) {
    if (errEl) { errEl.textContent = 'A két jelszó nem egyezik.'; errEl.style.display = 'block'; }
    return;
  }
  if (pass.length < 6) {
    if (errEl) { errEl.textContent = 'A jelszó legalább 6 karakter legyen.'; errEl.style.display = 'block'; }
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Fiók létrehozása…';
  try {
    await LocalStore.register(email, pass);
  } catch (err) {
    if (errEl) { errEl.textContent = hibaSzoveg(err); errEl.style.display = 'block'; }
  }
  btn.disabled = false;
  setAuthMode(_authMode);
}

function authResetPassword() {
  const emailEl = document.getElementById('auth-email');
  const errEl   = document.getElementById('auth-error');
  const infoEl  = document.getElementById('auth-info');
  const email = (emailEl.value || '').trim();
  if (errEl)  errEl.style.display = 'none';
  if (infoEl) infoEl.style.display = 'none';
  if (!email) {
    if (errEl) { errEl.textContent = 'Add meg az e-mail címed a jelszó helyi visszaállításához.'; errEl.style.display = 'block'; }
    return;
  }
  LocalStore.resetPassword(email).then(() => {
    if (infoEl) { infoEl.textContent = 'Elküldtük a jelszó-visszaállító linket az e-mail címedre.'; infoEl.style.display = 'block'; }
  }).catch(err => {
    if (errEl) { errEl.textContent = hibaSzoveg(err); errEl.style.display = 'block'; }
  });
}

let _authMode = 'login';
function setAuthMode(mode) {
  _authMode = (mode === 'register') ? 'register' : 'login';
  const btn   = document.getElementById('auth-login-btn');
  const pass  = document.getElementById('auth-password');
  const pass2 = document.getElementById('auth-password2');
  const sub   = document.getElementById('auth-subtitle');
  const toggle= document.getElementById('auth-toggle');
  const errEl = document.getElementById('auth-error');
  const infoEl= document.getElementById('auth-info');
  const confirmWrap = document.getElementById('auth-confirm-wrap');
  const forgot = document.getElementById('auth-forgot');
  const card  = document.getElementById('auth-card');
  if (errEl)  errEl.style.display = 'none';
  if (infoEl) infoEl.style.display = 'none';
  if (pass2)  pass2.value = '';
  if (_authMode === 'register') {
    if (btn)    { btn.textContent = 'Fiók létrehozása'; btn.setAttribute('onclick', 'authRegister()'); }
    if (pass)   pass.setAttribute('autocomplete', 'new-password');
    if (sub)    sub.textContent = 'Új fiók létrehozása';
    if (toggle) toggle.innerHTML = 'Van már fiókod? <a href="#" onclick="setAuthMode(\'login\');return false">Belépés</a>';
    if (confirmWrap) confirmWrap.classList.add('open');
    if (forgot) forgot.classList.add('hidden');
  } else {
    if (btn)    { btn.textContent = 'Belépés'; btn.setAttribute('onclick', 'authLogin()'); }
    if (pass)   pass.setAttribute('autocomplete', 'current-password');
    if (sub)    sub.textContent = 'Bejelentkezés';
    if (toggle) toggle.innerHTML = 'Még nincs fiókod? <a href="#" onclick="setAuthMode(\'register\');return false">Regisztrálj</a>';
    if (confirmWrap) confirmWrap.classList.remove('open');
    if (forgot) forgot.classList.remove('hidden');
  }

  if (card) { card.classList.remove('auth-anim'); void card.offsetWidth; card.classList.add('auth-anim'); }
}

const I18N_HU_EN = {

  'Áttekintés':'Overview','Megrendelések':'Orders','Projektek':'Projects','Ügyfelek':'Clients',
  'Számlák':'Invoices','Bevételek':'Income','Kiadások':'Expenses','Űrlap':'Form','Fiók':'Account',
  'Űrlap / weboldal':'Form / website',

  'Mentés':'Save','Törlés':'Delete','Bezárás':'Close','Mégse':'Cancel','Hozzáadás':'Add',
  'Belépés':'Sign in','Kilépés':'Sign out','Kijelentkezés':'Sign out','Fiók létrehozása':'Create account',
  'Beállítások mentése':'Save settings','Cégadatok mentése':'Save company details','Kód másolása':'Copy code',
  '+ Szolgáltatás':'+ Service','+ Bevétel rögzítése':'+ Add income','+ Költség rögzítése':'+ Add expense',
  '+ Megkeresés':'+ Inquiry','+ Megkeresés rögzítése':'+ Add inquiry','+ Megrendelés rögzítése':'+ Add order',
  '+ Rögzítés':'+ Add','Megnyitás':'Open','Profil mentése':'Save profile','Vállalkozási adatok mentése':'Save business details',
  'Visszaállító e-mail küldése':'Send reset email','↻ Frissítés':'↻ Refresh','⬇ Mentés fájlba (JSON)':'⬇ Export to file (JSON)',
  '💾 Mentés':'💾 Save','🗑 Adatok nullázása':'🗑 Reset data','Nyomtatás / Mentés PDF-ként':'Print / Save as PDF',
  'Regisztrálj':'Register','Elfelejtett jelszó?':'Forgot password?','Számla készítése':'Create invoice','+ Számla':'+ Invoice',
  'Kifizetettnek jelöl':'Mark as paid','Kész':'Done',

  'Profil':'Profile','Jelszó módosítása':'Change password','Vállalkozási forma és adózás':'Business form & taxation',
  'Cég adatai (számlázás)':'Company details (invoicing)','Világos / sötét':'Light / dark','Nyelv / Language':'Language',
  'Automatikus':'Auto','Világos':'Light','Sötét':'Dark','Magyar':'Magyar','English':'English',
  'Automatikus (napszak szerint)':'Auto (by time of day)','Bejelentkezett fiók':'Signed-in account',
  'Biztonsági mentés JSON-fájlba':'Backup to a JSON file','A bejelentkezéshez tartozik — itt nem módosítható.':'Tied to your login — cannot be changed here.',

  'Adószám':'VAT number','Adószám (nem kötelező)':'VAT number (optional)','Adózási mód':'Taxation type',
  'Az űrlap nyelve / pénzneme':'Form language / currency','Bankszámlaszám':'Bank account number','Cég / név':'Company / name',
  'Cégjegyzék- / nyilvántartási szám':'Company reg. number','Cím':'Address','Cím (székhely)':'Address (registered office)',
  'Dátum':'Date','E-mail':'Email','E-mail (számlához)':'Email (for invoicing)','E-mail cím':'Email address',
  'Egység':'Unit','Egységár (Ft)':'Unit price','Fizetési határidő':'Payment due','Fiókazonosító (a kódban: OWNER_UID)':'Account ID (OWNER_UID in the code)',
  'Határidő':'Deadline','Jelszó':'Password','Jelszó újra':'Repeat password','Kategória':'Category','Keresztnév':'First name',
  'Kiállítás dátuma':'Issue date','Megjegyzés (nem kötelező)':'Note (optional)','Megkeresés dátuma':'Inquiry date',
  'Megnevezés':'Description','Megrendelés dátuma':'Order date','Mennyiség':'Quantity','Név':'Name','Név / Cégnév':'Name / company',
  'Projekt típusa':'Project type','Számlaszám':'Invoice no.','Telefon':'Phone','Téma / rövid leírás':'Subject / short description',
  'Vezetéknév':'Last name','Vállalkozási forma':'Business form','ÁFA-kulcs (%)':'VAT rate (%)','ÁFA-státusz':'VAT status',
  'Állapot':'Status','Ár (Ft)':'Price','Összeg (Ft)':'Amount','Jelenlegi jelszó':'Current password','Új jelszó':'New password','Új jelszó megerősítése':'Confirm new password',
  'Ügyfél / forrás':'Client / source','Ügyfél kerete':'Client budget','Ügyfél típusa':'Client type','Üzenet / részletek (nem kötelező)':'Message / details (optional)',

  'Azonosító':'ID','Bevétel':'Income','Beárazás (Ft)':'Pricing','Eredmény':'Result','Forrás':'Source','Hónap':'Month',
  'Kiállítva':'Issued','Költség':'Expense','Megjegyzés':'Note','Projekt':'Project','Típus':'Type','Típus / téma':'Type / subject',
  'Utolsó kapcsolat':'Last contact','Vevő':'Buyer','Ár':'Price','Összeg':'Amount','Ügyfél':'Client','Üzenet':'Message',
  'Egységár':'Unit price','Nettó egységár':'Net unit price','Nettó összeg':'Net amount',

  '< 100 000 Ft':'< 100,000 HUF','100–300 000 Ft':'100–300,000 HUF','300–600 000 Ft':'300–600,000 HUF','600 000 Ft <':'600,000 HUF <',
  'Alanyi adómentes (nem ÁFA-körös)':'VAT-exempt (not VAT-registered)','Angol (€)':'English (EUR)','Bankköltség':'Bank fees',
  'Bemutatkozó weboldal':'Portfolio website','Betéti társaság (Bt.)':'Limited partnership (Bt.)','Egyedi webalkalmazás':'Custom web app',
  'Egyéb':'Other','Egyéni cég (EC)':'Sole company (EC)','Egyéni vállalkozó':'Sole proprietor','Eszköz / hardver':'Equipment / hardware',
  'Fejlesztés alatt':'In development','Karbantartás / frissítés':'Maintenance / update','Kifizetve':'Paid',
  'Korlátolt felelősségű társaság (Kft.)':'Limited liability company (Kft.)','Könyvelés':'Accounting',
  'Közkereseti társaság (Kkt.)':'General partnership (Kkt.)','Magyar (Ft)':'Hungarian (HUF)','Magánszemély':'Individual',
  'Marketing / hirdetés':'Marketing / ads','Mindkettő — a weboldal nyelvét követi (HU=Ft, EN=€)':'Both — follows the website language (HU=HUF, EN=EUR)',
  'Nem megadott':'Not specified','Nincs megadva':'Not specified','Nyilvános részvénytársaság (Nyrt.)':'Public company (Nyrt.)',
  'Oktatás / tanfolyam':'Education / course','Szoftver / licenc':'Software / license','Szövetkezet':'Cooperative',
  'Tanácsadás':'Consulting','Teszt verzió':'Test version','Tárhely / domain':'Hosting / domain','Utazás / üzemanyag':'Travel / fuel',
  'Weboldal projekt':'Website project','Webáruház':'Webshop','Zártkörű részvénytársaság (Zrt.)':'Private company (Zrt.)',
  'ÁFA-körös (ÁFA-t számláz)':'VAT-registered (charges VAT)','Élesben':'Live','Landing page':'Landing page',

  'Beillesztendő kód (HTML + JavaScript) — elég egyszer':'Embed code (HTML + JavaScript) — paste once','Bevételi napló':'Income log',
  'Beérkezett megkeresések':'Incoming inquiries','E havi kiadások megoszlása':"This month's expense breakdown",
  'Folyamatban lévő projektek':'Projects in progress','Függőben':'Pending','Függőben lévő számlák':'Pending invoices',
  'Havi bevétel / kiadás — utolsó 6 hónap':'Monthly income / expense — last 6 months','Havi pénzforgalom':'Monthly cash flow',
  'Havi átlag':'Monthly average','Havi összes':'Monthly total','Idei költségek':'Expenses this year','Idei árbevétel':'Revenue this year',
  'Idei összes':'Total this year','Idei összes projekt':'Total projects this year','Kategóriák megoszlása':'Category breakdown',
  'Kifizetett':'Paid','Következő határidő':'Next deadline','Közelgő határidők':'Upcoming deadlines','Legnagyobb kategória':'Largest category',
  'Lejárt':'Overdue','Megjelenő mezők':'Visible fields','Projektek státusza':'Project status','Szolgáltatások (ár is)':'Services (with price)',
  'Számlázható projektek':'Billable projects','Tételek':'Items','Élő előnézet':'Live preview','Összes számla':'All invoices',
  'Ügyféllista':'Client list','🔔 Beérkező megkeresések':'🔔 Incoming inquiries','Árak megjelenítése a szolgáltatásoknál':'Show prices on services',

  'Bevétel rögzítése':'Add income','Megrendelés rögzítése':'Add order','Vállalkozási költség rögzítése':'Add business expense',
  'Új megkeresés rögzítése':'Add new inquiry',

  'Új':'New','Megrendelve':'Ordered','Folyamatban':'In progress','Lezárva':'Closed','Vállalkozó':'Company','Névtelen':'Unnamed',

  'Kiállító (Eladó)':'Issuer (Seller)','Kiállítás dátuma':'Issue date','Teljesítés dátuma':'Fulfilment date',
  'Fizetési mód':'Payment method','Átutalás':'Bank transfer','Fizetendő':'Total due','Fizetendő (bruttó)':'Total due (gross)',
  'Nettó összesen':'Net total',

  // --- Kiegészítő fordítások ---
  'fejlesztés + teszt':'in development + test','az idén rögzített':'recorded this year',
  'aktív, még nem lejárt':'active, not yet overdue','árazásra vár':'awaiting pricing',
  'Árbevétel − költségek (idei)':'Revenue − expenses (this year)','Idei aktív hónapok átlaga':'Average of active months this year',
  'Következő határidő':'Next deadline','Nincs':'None','Nincs adat':'No data','Nincs közelgő határidő.':'No upcoming deadlines.',

  'A weboldalakról érkezett rendelési űrlapok — itt árazza be és kezeli őket':'Order forms received from your websites — price and manage them here',
  'Fejlesztés alatt és teszt verzió':'In development and test version',
  'Új megkeresés':'New inquiry','Ajánlat elküldve':'Quote sent','Projektté alakítva':'Converted to project',
  'Törölve':'Deleted','Karbantartás':'Maintenance','Megrendelés':'Order','Automatikusan könyvelt':'Booked automatically',
  'Számla':'Invoice','Bemutatkozó oldal':'Landing page','Webshop':'Web shop',

  'Nincs függőben lévő számla.':'No pending invoices.','Még nincs kifizetett számla.':'No paid invoices yet.',
  'Kattints a „+ Számla" gombra a kiállításhoz':'Click the “+ Invoice” button to issue one',
  'Nincs élesben lévő projekt.':'No live projects.',
  'Még nincs rögzített megkeresés. Új felvétele a „+ Megkeresés" gombbal.':'No inquiries recorded yet. Add one with the “+ Inquiry” button.',

  'Fiók, vállalkozás és megjelenés':'Account, business & appearance',
  'Adatok mentése / visszatöltése':'Save / restore data','Megjelenés':'Appearance','Válaszd ki, mikor legyen világos vagy sötét a felület.':'Choose when the interface is light or dark.',
  'KATA – Kisadózó vállalkozók tételes adója':'KATA – Itemized tax for small taxpayers',
  'Átalányadózás':'Flat-rate taxation','Vállalkozói SZJA (tételes költségelszámolás)':'Entrepreneurial PIT (itemized costs)',
  'Társasági adó (TAO)':'Corporate tax (TAO)','KIVA – Kisvállalati adó':'KIVA – Small business tax',
  'KATA: csak főállású egyéni vállalkozó, aki kizárólag magánszemélyeknek számláz. Havi tétel 50 000 Ft, éves bevételi plafon 18 M Ft.':'KATA: full-time sole proprietors invoicing individuals only. Monthly HUF 50,000, annual revenue cap HUF 18M.',
  'Átalányadózás: vélelmezett költséghányad alapján; a legtöbb egyéni vállalkozó számára egyszerű, kiszámítható.':'Flat-rate taxation: based on a presumed cost ratio; simple and predictable for most sole proprietors.',
  'Vállalkozói SZJA: tételes költségelszámolás — a ténylegesen igazolt költségeket vonhatod le.':'Entrepreneurial PIT: itemized cost accounting — you can deduct actually documented costs.',
  'Társasági adó: 9% társasági adó a nyereségre; társaságok általános adózási módja.':'Corporate tax: 9% on profit; the general taxation method for companies.',
  'KIVA: kisvállalati adó — a bér- és osztalékalapú társaságoknak lehet kedvező.':'KIVA: small business tax — can be favorable for wage- and dividend-based companies.',
  'Válaszd ki a vállalkozási formát, majd a hozzá tartozó adózási módot — ezt később az adószámításnál használjuk.':'Choose your business form, then the matching taxation type — we use this for tax calculation.',
  'Ezek automatikusan bekerülnek minden új számla „Kiállító" mezőibe — nem kell újra beírni.':'These are automatically added to the “Issuer” fields of every new invoice — no need to re-enter.',
  'Ez határozza meg, hogyan jelenik meg az ÁFA a számlán: alanyi adómentesnél „AAM" (áfa nélkül), ÁFA-körösnél nettó + ÁFA + bruttó bontásban. Az űrlapon megadott árakat nettóként kezeli.':'This determines how VAT appears on the invoice: for VAT-exempt “AAM” (no VAT), for VAT-registered a net + VAT + gross breakdown. Prices entered on the form are treated as net.',

  'Automatikus: 19:00 és 06:00 között sötét, egyébként világos. Most sötét változat aktív.':'Auto: dark between 19:00 and 06:00, light otherwise. Dark variant active now.',
  'Automatikus: 19:00 és 06:00 között sötét, egyébként világos. Most világos változat aktív.':'Auto: dark between 19:00 and 06:00, light otherwise. Light variant active now.',
  'Mindig sötét változat, a napszaktól függetlenül.':'Always dark, regardless of time of day.',
  'Mindig világos változat, a napszaktól függetlenül.':'Always light, regardless of time of day.',
  'Felület nyelve: Magyar':'Interface language: Magyar','Interface language: English':'Interface language: English',

  'Állítsd be a saját rendelő-űrlapodat: a szolgáltatásaidat (árral), a mezőket, a vállalkozó opciót. Alul a beállításaid alapján frissül a beillesztendő kód — másold a weboldaladra. Ha módosítasz, mentsd, majd másold ki újra.':'Set up your own order form: your services (with prices), the fields, the company option. The embed code below updates from your settings — copy it to your website. If you change something, save, then copy it again.',
  'A szolgáltatások legördülőként jelennek meg az űrlapon. Add meg a magyar és (ha szeretnéd) az angol nevet, valamint az árat forintban és euróban — angol nyelvű oldalon az angol név és az euró ár jelenik meg. Az euró mező üresen hagyható: ekkor a rendszer az aktuális árfolyammal átszámol. A megadott ár a beérkező megrendelésbe is bekerül (a Rendliben módosítható).':'Services appear as a dropdown on the form. Provide the Hungarian and (optionally) the English name, plus the price in HUF and EUR — on an English page the English name and EUR price are shown. The EUR field can be left empty: the system then converts using the current exchange rate. The price is also included in the incoming order (editable in Rendli).',
  'Az űrlap nyelve és pénzneme automatikusan a weboldal nyelvét követi: magyar oldalon':'The form language and currency automatically follow the website language: on a Hungarian page',
  'magyar szöveg + Ft':'Hungarian text + HUF','angol szöveg + €':'English text + EUR',
  '. Ez rögzített — nincs teendőd vele.':'. This is fixed — nothing to do.',
  'Magánszemély / Vállalkozó választó + cégadatok (cégnév, adószám)':'Individual / Company selector + company details (name, VAT number)',
  'Telefon mező':'Phone field','Üzenet mező':'Message field','Kívánt határidő mező':'Preferred deadline field','Tervezett keret mező':'Budget field',
  'E-mail értesítők':'Email notifications',
  'Automatikus: minden leadott rendelésnél a rendszer e-mailt küld — neked egy értesítőt (a regisztrációs e-mail címedre), az ügyfélnek egy visszaigazolást (a weboldal nyelvén). Nincs vele teendőd.':'Automatic: for every submitted order the system sends emails — a notification to you (to your registration email) and a confirmation to the customer (in the website language). Nothing to do.',
  'Így fog kinézni az űrlap (a te weboldalad stílusát veszi majd fel).':'This is how the form will look (it will take on your website’s style).',
  'Ezt a kódot':'This code','elég egyetlen egyszer':'just once is enough',
  'beilleszteni a weboldaladba. Utána, ha itt módosítasz valamit és mentesz, a weboldaladon lévő űrlap magától frissül — nem kell újramásolni. A beérkező rendelés a „Megrendelések" fülön jelenik meg. Bármilyen oldalon működik (sima HTML, WordPress „Egyéni HTML" blokk, stb.).':'to paste into your website. After that, if you change something here and save, the form on your website updates automatically — no need to re-copy. The incoming order appears on the “Orders” tab. Works on any page (plain HTML, WordPress “Custom HTML” block, etc.).',
  'Mentve ✓ — a weboldaladon lévő űrlap magától frissül.':'Saved ✓ — the form on your website updates automatically.',
  'Vállalkozási adatok mentve ✓':'Business details saved ✓','Profil mentve ✓':'Profile saved ✓','Cégadatok mentve ✓':'Company details saved ✓',
  'Mentve ✓':'Saved ✓','Jelszó módosítva ✓':'Password changed ✓','Kód a vágólapra másolva ✓':'Code copied to clipboard ✓',
  'Vágólapra másolva ✓':'Copied to clipboard ✓',
  'Felhő':'Cloud','Betöltés…':'Loading…','Mentve ✓':'Saved ✓','Mentve':'Saved',
  'Nincs bejelentkezett fiók':'No signed-in account','Betöltési hiba':'Loading error','Mentés sikertelen':'Save failed',
  'új':'new','Aktív':'Active','Összes':'Total','Havi':'Monthly',
  'Ez csak előnézet — a valódi űrlap a weboldaladon küld.':'This is only a preview — the real form on your site sends the order.'
};

function _i18nWalk(root, fn) {
  if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.nodeName; if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
      return (n.nodeValue && n.nodeValue.trim()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  let n; while ((n = w.nextNode())) fn(n);
}
const _i18nText = new WeakMap();
const _i18nAttr = new WeakMap();

function translateToEn(root) {
  root = root || document.body;
  _i18nWalk(root, n => {
    const raw = n.nodeValue, key = raw.trim();
    if (I18N_HU_EN[key]) {
      if (!_i18nText.has(n)) _i18nText.set(n, raw);
      n.nodeValue = raw.replace(key, I18N_HU_EN[key]);
    }
  });
  root.querySelectorAll('[placeholder],[title]').forEach(el => {
    ['placeholder', 'title'].forEach(a => {
      const v = el.getAttribute(a); if (!v) return;
      const key = v.trim(); if (!I18N_HU_EN[key]) return;
      let store = _i18nAttr.get(el) || {};
      if (store[a] === undefined) { store[a] = v; _i18nAttr.set(el, store); }
      el.setAttribute(a, I18N_HU_EN[key]);
    });
  });
}
function restoreHu(root) {
  root = root || document.body;
  _i18nWalk(root, n => { if (_i18nText.has(n)) { n.nodeValue = _i18nText.get(n); _i18nText.delete(n); } });
  root.querySelectorAll('[placeholder],[title]').forEach(el => {
    const store = _i18nAttr.get(el); if (!store) return;
    ['placeholder', 'title'].forEach(a => { if (store[a] !== undefined) el.setAttribute(a, store[a]); });
    _i18nAttr.delete(el);
  });
}

/* Dinamikusan létrehozott tartalom (táblák, modálok, listák) automatikus fordítása
   angol módban — a szótár egyszeri lefuttatása után is naprakész marad. */
let _i18nObserver = null;
function startI18nObserver() {
  if (_i18nObserver || typeof MutationObserver === 'undefined') return;
  _i18nObserver = new MutationObserver(muts => {
    if (!state || state.uiLang !== 'en') return;
    for (const m of muts) {
      m.addedNodes.forEach(n => {
        if (n.nodeType === 1) {
          translateToEn(n);
        } else if (n.nodeType === 3) {
          const key = (n.nodeValue || '').trim();
          if (I18N_HU_EN[key]) {
            if (!_i18nText.has(n)) _i18nText.set(n, n.nodeValue);
            n.nodeValue = n.nodeValue.replace(key, I18N_HU_EN[key]);
          }
        }
      });
      if (m.type === 'attributes' && m.target && m.target.nodeType === 1) {
        const el = m.target, a = m.attributeName;
        if (a === 'placeholder' || a === 'title') {
          const v = el.getAttribute(a); const key = (v || '').trim();
          if (I18N_HU_EN[key]) el.setAttribute(a, I18N_HU_EN[key]);
        }
      }
    }
  });
  _i18nObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['placeholder', 'title'] });
}

/* Nyelvfüggő segédek a dinamikus (szám + szó, dátum) szövegekhez. */
function isEn() { return !!(state && state.uiLang === 'en'); }
function L(hu, en) { return isEn() ? en : hu; }
function locDate(d, opts) {
  try { return d.toLocaleDateString(isEn() ? 'en-GB' : 'hu-HU', opts); } catch (e) { return ''; }
}

function applyUiLang() {
  const lang = (state && state.uiLang === 'en') ? 'en' : 'hu';
  try { document.documentElement.setAttribute('lang', lang); } catch (e) {}
  document.querySelectorAll('#acct-lang-seg [data-lang-pref]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-lang-pref') === lang);
  });
  if (lang === 'en') { translateToEn(document.body); startI18nObserver(); }
}

function setUiLang(lang) {
  lang = (lang === 'en') ? 'en' : 'hu';
  state.uiLang = lang;
  if (lang === 'hu') restoreHu(document.body);
  if (typeof save === 'function') save();
  if (typeof renderAll === 'function') renderAll();
  applyUiLang();

  if (document.getElementById('fc-preview') && typeof updateFormOutputs === 'function') {
    try { updateFormOutputs(); } catch (e) {}
  }
  const note = document.getElementById('acct-lang-note');
  if (note) note.textContent = (lang === 'en') ? 'Interface language: English' : 'Felület nyelve: Magyar';
}

function defaultState() {
  return {
    stocks: [],
    crypto: [],
    loans: [],
    pledges: [],
    gold: { grams: 0, cost: 0, pricePerGram: 28000 },
    goldItems: [],
    goldSpot: 28000,
    services: [],
    bizIncome: [],
    bizExpense: [],
    orders: [],
    invoices: [],
    orderNumByYear: {},
    fxEurHuf: 0,
    bizTaxRate: 15,
    paidInstallments: {},
    leads: {},
    importedLeadIds: {},
    sellerInfo: { name: '', address: '', tax: '', reg: '', bank: '', email: '', phone: '', vatRegistered: false, vatRate: 27 },
    profile: { name: '', businessForm: '', taxForm: '' },
    inboxKey: '',
    uiLang: 'hu',
    formConfig: {
      services: [
        { name: 'Bemutatkozó oldal', nameEn: 'Landing page', cat: '', catEn: '', note: '', noteEn: '', price: 0, priceEur: 0, priceMode: 'exact', period: 'once' },
        { name: 'Webshop',           nameEn: 'Web shop',     cat: '', catEn: '', note: '', noteEn: '', price: 0, priceEur: 0, priceMode: 'exact', period: 'once' },
        { name: 'Karbantartás',      nameEn: 'Maintenance',  cat: '', catEn: '', note: '', noteEn: '', price: 0, priceEur: 0, priceMode: 'exact', period: 'monthly' }
      ],
      showPrices: true,
      business: false,
      formLang: 'both',
      fields: { phone: true, message: true, deadline: false, budget: false }
    }
  };
}

function normalizeFormConfig() {
  if (!state.formConfig || typeof state.formConfig !== 'object') state.formConfig = {};
  const fc = state.formConfig;
  if (!Array.isArray(fc.services)) fc.services = [{ name: 'Bemutatkozó oldal', nameEn: 'Landing page', cat: '', catEn: '', note: '', noteEn: '', price: 0, priceEur: 0, priceMode: 'exact', period: 'once' }];
  fc.services = fc.services.map(s => ({
    name: (s && s.name) || '',
    nameEn: (s && s.nameEn) || '',
    cat: (s && s.cat) || '',
    catEn: (s && s.catEn) || '',
    note: (s && s.note) || '',
    noteEn: (s && s.noteEn) || '',
    price: Number(s && s.price) || 0,
    priceEur: Number(s && s.priceEur) || 0,
    priceMode: ['exact', 'from', 'free'].indexOf(s && s.priceMode) >= 0 ? s.priceMode : 'exact',
    period: (s && s.period === 'monthly') ? 'monthly' : 'once'
  }));
  if (typeof fc.showPrices !== 'boolean') fc.showPrices = true;
  if (typeof fc.business !== 'boolean') fc.business = false;

  fc.formLang = 'both';
  if (!fc.fields || typeof fc.fields !== 'object') fc.fields = {};
  ['phone', 'message', 'deadline', 'budget'].forEach(k => { if (typeof fc.fields[k] !== 'boolean') fc.fields[k] = (k === 'phone' || k === 'message'); });
}

let state = defaultState();

let _stateLoaded = false;

function save() {
  if (!_stateLoaded) {

    setSaveStatus('Mentés letiltva — az adatok nem töltődtek be', 'sync-err');
    console.warn('[Rendli] save() blokkolva: a state nem töltődött be sikeresen (a felhő felülírásának megelőzése).');
    return;
  }
  if (!currentUid) {
    setSaveStatus('Nincs bejelentkezett fiók', 'sync-err');
    return;
  }
  try {
    LocalStore.saveVault(state);
    flashSaved();
  } catch (e) {
    setSaveStatus('Mentés sikertelen', 'sync-err');
    console.error('[Rendli] Mentési hiba:', e);
  }
}

let _saveTimer = null;
function setSaveStatus(text, cls) {
  const el = document.getElementById('sync-status');
  if (el) { el.textContent = text; el.className = 'sync-pill ' + (cls || ''); }
}
function flashSaved() {
  setSaveStatus('Mentve \u2713', 'sync-ok');
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => setSaveStatus('Felhő', ''), 1400);
}

function normalizeState() {
  if (!state.bizIncome)  state.bizIncome  = [];
  if (!state.bizExpense) state.bizExpense = [];
  if (!state.orders)     state.orders     = [];
  if (!state.invoices)   state.invoices   = [];
  if (!state.leads)            state.leads            = {};
  if (!state.importedLeadIds)  state.importedLeadIds   = {};
  if (!state.sellerInfo)       state.sellerInfo        = { name: '', address: '', tax: '', reg: '', bank: '', email: '', phone: '', vatRegistered: false, vatRate: 27 };
  ['name','address','tax','reg','bank','email','phone'].forEach(k => { if (state.sellerInfo[k] == null) state.sellerInfo[k] = ''; });
  if (typeof state.sellerInfo.vatRegistered !== 'boolean') state.sellerInfo.vatRegistered = false;
  if (state.sellerInfo.vatRate == null) state.sellerInfo.vatRate = 27;
  if (!state.profile)          state.profile           = { name: '', businessForm: '', taxForm: '' };
  if (state.inboxKey == null)  state.inboxKey          = '';
  if (state.uiLang !== 'en')   state.uiLang            = 'hu';
  normalizeFormConfig();
  if (state.bizTaxRate == null) state.bizTaxRate = 15;
  if (!state.orderNumByYear || typeof state.orderNumByYear !== 'object') state.orderNumByYear = {};
  if (typeof state.fxEurHuf !== 'number' || state.fxEurHuf < 0) state.fxEurHuf = 0;
  migrateOrderNames();
  migrateOrderNumbers();
  migrateRevenueTax();
  reconcileOrderIncomes();
  reconcileInvoiceIncomes();
}

function migrateOrderNames() {
  if (!Array.isArray(state.orders)) return;
  state.orders.forEach(o => {
    if (o.topic && typeof o.name === 'string') {
      const suffix = ' — ' + o.topic;
      if (o.name.endsWith(suffix)) {
        o.name = o.name.slice(0, o.name.length - suffix.length).trim();
      }
    }
    if ((!o.lastname && !o.firstname) && typeof o.name === 'string' && o.name.trim()) {
      const parts = o.name.trim().split(/\s+/);
      o.lastname = parts[0] || '';
      o.firstname = parts.slice(1).join(' ');
    }
  });
}

function pad3(n) { return String(n).padStart(3, '0'); }

function nextOrderNum(dateStr) {
  const year = (dateStr || now()).slice(0, 4);
  if (!state.orderNumByYear) state.orderNumByYear = {};
  const seq = (state.orderNumByYear[year] || 0) + 1;
  state.orderNumByYear[year] = seq;
  return 'rendli/' + year + '/' + pad3(seq);
}

function migrateOrderNumbers() {
  if (!Array.isArray(state.orders)) return;
  if (!state.orderNumByYear || typeof state.orderNumByYear !== 'object') state.orderNumByYear = {};
  state.orders.forEach(o => {
    const m = o.num && /^rendli\/(\d{4})\/(\d+)$/.exec(o.num);
    if (m) { const y = m[1], n = parseInt(m[2], 10); if (n > (state.orderNumByYear[y] || 0)) state.orderNumByYear[y] = n; }
  });
  state.orders.filter(o => !o.num)
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.id || '').localeCompare(b.id || ''))
    .forEach(o => { o.num = nextOrderNum(o.date); });
}

function nextInvoiceNumForOrder(order) {
  const base = (order && order.num) ? order.num : ('rendli/' + now().slice(0, 4) + '/000');
  const seq = (state.invoices || []).filter(iv => order && iv.orderId === order.id).length + 1;
  return 'sz_' + base + '_' + pad3(seq);
}

const FX_FALLBACK_EUR_HUF = 400;
function eurHufRate() { return (state.fxEurHuf && state.fxEurHuf > 0) ? state.fxEurHuf : FX_FALLBACK_EUR_HUF; }
function toHuf(amount, cur, rate) {
  const a = Number(amount) || 0;
  return (cur === 'EUR') ? Math.round(a * (Number(rate) || eurHufRate())) : Math.round(a);
}
function orderPriceHuf(o) { return toHuf(o.price || 0, o.currency, o.fxRate); }
function fmtCur(amount, cur) {
  const n = Math.round(Number(amount) || 0);
  return (cur === 'EUR') ? '€' + n.toLocaleString('hu-HU') : n.toLocaleString('hu-HU') + ' Ft';
}

function fetchEurHuf() {
  try {
    fetch('https://api.frankfurter.app/latest?from=EUR&to=HUF')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && d.rates && d.rates.HUF) { state.fxEurHuf = d.rates.HUF; if (typeof publishFormConfig === 'function') publishFormConfig(); } })
      .catch(() => {});
  } catch (e) {}
}

function load() {
  return new Promise(resolve => {
    if (!currentUid) {
      _stateLoaded = false;
      normalizeState();
      resolve(false);
      return;
    }
    const finish = (persist) => {
      _stateLoaded = true;
      normalizeState();
      ensureInboxKey();
      if (persist) { try { LocalStore.saveVault(state); } catch (e) {} }
      publishFormConfig();
      fetchEurHuf();
      resolve(true);
    };
    LocalStore.loadVault()
      .then(d => {
        // Meglévő fiók → a mentett adat; új, üres fiók → üres állapottal indul.
        state = (d && typeof d === 'object') ? d : defaultState();
        finish(false);
      })
      .catch(() => { state = defaultState(); finish(false); });
  });
}

function showLoadError(err) {
  var app  = document.getElementById('app-root');
  if (app)  app.style.display  = 'none';
  var gate = document.getElementById('auth-gate');
  if (gate) gate.style.display = 'none';

  var box = document.getElementById('load-error-gate');
  if (!box) {
    box = document.createElement('div');
    box.id = 'load-error-gate';
    box.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--surface,#111);color:var(--text,#eee);font-family:inherit';
    box.innerHTML =
      '<div style="max-width:440px;text-align:center;background:var(--surface2,#1b1b1b);border:1px solid var(--border,#333);border-radius:14px;padding:28px 24px">' +
        '<div style="font-size:34px;line-height:1;margin-bottom:12px">\u26A0\uFE0F</div>' +
        '<h2 style="margin:0 0 8px;font-size:18px">Nem sikerült betölteni az adatokat</h2>' +
        '<p style="margin:0 0 6px;font-size:13px;color:var(--muted,#999);line-height:1.5">A felhőből most nem tudtuk beolvasni a fiókod adatait (valószínűleg gyenge vagy megszakadt internetkapcsolat).</p>' +
        '<p style="margin:0 0 18px;font-size:13px;color:var(--muted,#999);line-height:1.5"><strong>A meglévő adataid biztonságban vannak</strong> — a mentés le van tiltva, amíg a betöltés nem sikerül, így semmi nem íródik felül.</p>' +
        '<button type="button" onclick="location.reload()" style="cursor:pointer;border:none;border-radius:8px;padding:11px 20px;font-size:14px;font-weight:600;background:var(--accent,#2f63e6);color:#fff">Újratöltés</button>' +
        '<div class="le-code" style="margin-top:14px;font-size:11px;color:var(--muted,#777);word-break:break-word"></div>' +
      '</div>';
    document.body.appendChild(box);
  }
  box.style.display = 'flex';
  try {
    var codeEl = box.querySelector('.le-code');
    if (codeEl) codeEl.textContent = err ? (err.code || err.message || '') : '';
  } catch (e) {}
}

function generateInboxKey() {
  const bytes = new Uint8Array(18);
  (window.crypto || crypto).getRandomValues(bytes);
  return 'rk_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function ensureInboxKey() {
  if (state.inboxKey) return;
  state.inboxKey = generateInboxKey();
  try { LocalStore.saveVault(state); } catch (e) { console.warn('[Rendli] kulcs mentése:', e); }
}

function openDataModal() { openModal('data-modal'); }

/* Stílusos, az oldal kinézetéhez igazodó megerősítő/értesítő ablak (natív alert/confirm helyett). */
function uiDialog(opts) {
  return new Promise(resolve => {
    const o = opts || {};
    const wrap = document.createElement('div');
    wrap.className = 'modal open';
    const cancelBtn = o.showCancel
      ? `<button class="btn btn-secondary btn-sm" data-act="cancel">${escHtml(o.cancelText || 'Mégsem')}</button>`
      : '';
    wrap.innerHTML = `
      <div class="modal-card" style="max-width:400px">
        <div class="section-title" style="font-size:16px;margin-bottom:10px">${escHtml(o.title || 'Megerősítés')}</div>
        <div style="font-size:13px;line-height:1.6;white-space:pre-line">${escHtml(o.message || '')}</div>
        ${o.detail ? `<div style="font-size:12.5px;color:var(--muted);line-height:1.6;margin-top:8px;white-space:pre-line">${escHtml(o.detail)}</div>` : ''}
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px;flex-wrap:wrap">
          ${cancelBtn}
          <button class="btn ${o.danger ? 'btn-danger' : ''} btn-sm" data-act="ok">${escHtml(o.confirmText || 'OK')}</button>
        </div>
      </div>`;
    document.body.appendChild(wrap);
    const done = val => { document.removeEventListener('keydown', onKey); wrap.remove(); resolve(val); };
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); done(false); }
      else if (e.key === 'Enter') { e.preventDefault(); done(true); }
    };
    wrap.addEventListener('click', e => {
      if (e.target === wrap) { done(false); return; }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      done(act.getAttribute('data-act') === 'ok');
    });
    document.addEventListener('keydown', onKey);
    const ok = wrap.querySelector('[data-act="ok"]');
    if (ok) ok.focus();
  });
}
function uiConfirm(message, opts) {
  return uiDialog(Object.assign({ showCancel: true, confirmText: 'Törlés', danger: true }, opts || {}, { message }));
}
function uiAlert(message, opts) {
  return uiDialog(Object.assign({ showCancel: false, confirmText: 'Rendben', danger: false, title: 'Értesítés' }, opts || {}, { message }));
}

function exportData() {
  try {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rendli-mentes-' + now() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    uiAlert('A mentés exportálása nem sikerült.', { title: 'Hiba' });
    console.error('[Rendli] export error:', e);
  }
}

function importData(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let data;
    try { data = JSON.parse(reader.result); }
    catch (e) { uiAlert('Hibás mentésfájl — nem JSON formátum.', { title: 'Hiba' }); input.value = ''; return; }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      uiAlert('Ez nem egy érvényes Rendli mentésfájl.', { title: 'Hiba' }); input.value = ''; return;
    }
    if (!await uiConfirm('Biztosan visszatöltöd ezt a mentést? A jelenlegi adatok felülíródnak ezen az eszközön.', { title: 'Visszatöltés', confirmText: 'Visszatöltés', danger: false })) {
      input.value = ''; return;
    }
    state = data;
    _stateLoaded = true;
    normalizeState();
    save();
    renderAll();
    closeModal('data-modal');
    uiAlert('A mentés visszatöltve.', { title: 'Kész' });
    input.value = '';
  };
  reader.readAsText(file);
}

async function resetAllData() {
  if (!await uiConfirm('Biztosan törlöd az ÖSSZES adatodat ebben a böngészőben (bevételek, kiadások, projektek, megkeresések, számlák)? Ez a művelet nem visszavonható — előtte érdemes fájlba menteni!', { title: 'Adatok nullázása', confirmText: 'Tovább' })) return;
  if (!await uiConfirm('Utolsó megerősítés: minden rögzített adat véglegesen törlődik. Folytatod?', { title: 'Végleges törlés', confirmText: 'Végleges törlés' })) return;
  const keepKey = state.inboxKey;
  state = defaultState();
  state.inboxKey = keepKey || '';
  try { await LocalStore.saveVault(state); } catch (e) { console.error('[Rendli] reset error:', e); }
  location.reload();
}

const TAX_FORMS = {
  kata:    'KATA – Kisadózó vállalkozók tételes adója',
  atalany: 'Átalányadózás',
  vszja:   'Vállalkozói SZJA (tételes költségelszámolás)',
  tao:     'Társasági adó (TAO)',
  kiva:    'KIVA – Kisvállalati adó'
};
const BIZ_TAX_OPTIONS = {
  ev:   ['kata', 'atalany', 'vszja'],
  ec:   ['atalany', 'vszja', 'tao', 'kiva'],
  bt:   ['tao', 'kiva'],
  kkt:  ['tao', 'kiva'],
  kft:  ['tao', 'kiva'],
  zrt:  ['tao', 'kiva'],
  nyrt: ['tao', 'kiva'],
  szov: ['tao', 'kiva'],
  '':   ['kata', 'atalany', 'vszja', 'tao', 'kiva']
};
const TAX_NOTES = {
  kata:    'KATA: csak főállású egyéni vállalkozó, aki kizárólag magánszemélyeknek számláz. Havi tétel 50 000 Ft, éves bevételi plafon 18 M Ft.',
  atalany: 'Átalányadózás: vélelmezett költséghányad alapján; a legtöbb egyéni vállalkozó számára egyszerű, kiszámítható.',
  vszja:   'Vállalkozói SZJA: tételes költségelszámolás — a ténylegesen igazolt költségeket vonhatod le.',
  tao:     'Társasági adó: 9% társasági adó a nyereségre; társaságok általános adózási módja.',
  kiva:    'KIVA: kisvállalati adó — a bér- és osztalékalapú társaságoknak lehet kedvező.'
};

function onBizFormChange() {
  const bizSel = document.getElementById('acct-bizform');
  const taxSel = document.getElementById('acct-taxform');
  if (!bizSel || !taxSel) return;
  const allowed = BIZ_TAX_OPTIONS[bizSel.value] || BIZ_TAX_OPTIONS[''];
  const prev = taxSel.value;
  let html = '<option value="">Nincs megadva</option>';
  allowed.forEach(k => { html += '<option value="' + k + '">' + TAX_FORMS[k] + '</option>'; });
  taxSel.innerHTML = html;

  taxSel.value = allowed.indexOf(prev) !== -1 ? prev : '';
  updateTaxNote();
}
function updateTaxNote() {
  const taxSel = document.getElementById('acct-taxform');
  const note = document.getElementById('acct-tax-note');
  if (!note) return;
  const k = taxSel ? taxSel.value : '';
  note.textContent = TAX_NOTES[k] || 'Válaszd ki a vállalkozási formát, majd a hozzá tartozó adózási módot — ezt később az adószámításnál használjuk.';
}

window.populateAccountForms = function () {
  const p = (state && state.profile) || { name: '', businessForm: '', taxForm: '' };

  const nameEl = document.getElementById('acct-name');
  if (nameEl) nameEl.value = p.name || '';

  const emailEl = document.getElementById('acct-email-input');
  let email = '';
  try { if (LocalStore.currentUser) email = LocalStore.currentUser.email || ''; } catch (e) {}
  if (emailEl) emailEl.value = email;

  const bizSel = document.getElementById('acct-bizform');
  if (bizSel) bizSel.value = p.businessForm || '';
  onBizFormChange();
  const taxSel = document.getElementById('acct-taxform');
  if (taxSel) { taxSel.value = p.taxForm || ''; taxSel.onchange = updateTaxNote; }
  updateTaxNote();

  const si = (state && state.sellerInfo) || {};
  const setv = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  setv('seller-name',    si.name);
  setv('seller-tax',     si.tax);
  setv('seller-address', si.address);
  setv('seller-reg',     si.reg);
  setv('seller-bank',    si.bank);
  setv('seller-email',   si.email);
  setv('seller-phone',   si.phone);
  const vatSel = document.getElementById('seller-vat');
  if (vatSel) vatSel.value = si.vatRegistered ? 'afas' : 'alanyi';
  const vatRate = document.getElementById('seller-vatrate');
  if (vatRate) vatRate.value = (si.vatRate == null ? 27 : si.vatRate);
  if (typeof onVatStatusChange === 'function') onVatStatusChange();

  const epEl = document.getElementById('inbox-endpoint'); if (epEl) epEl.value = inboxTargetUid();
  const keyEl = document.getElementById('inbox-key'); if (keyEl) keyEl.value = (state && state.inboxKey) || '';
  const snipEl = document.getElementById('inbox-snippet'); if (snipEl) snipEl.value = inboxEmbedSnippet();

  ['acct-pw0', 'acct-pw1', 'acct-pw2'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setAcctNote('acct-pw-note', '');
  setAcctNote('acct-profile-note', '');
  setAcctNote('acct-biz-note', '');
  setAcctNote('acct-seller-note', '');

  refreshSidebarAccount();
};

function setAcctNote(id, text, isErr) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text || '';
  el.style.color = isErr ? 'var(--red)' : 'var(--muted)';
}

function refreshSidebarAccount() {
  const p = (state && state.profile) || {};
  let email = '';
  try { if (LocalStore.currentUser) email = LocalStore.currentUser.email || ''; } catch (e) {}
  const name = (p.name || '').trim();
  const nameEl = document.getElementById('side-account-name');
  const subEl  = document.getElementById('side-account-sub');
  const avEl   = document.getElementById('side-avatar');
  if (nameEl) nameEl.textContent = name || 'Fiók';
  if (subEl)  subEl.textContent  = email || 'Beállítások';
  if (avEl) {
    const basis = name || email || 'R';
    avEl.textContent = basis.trim().charAt(0).toUpperCase() || 'R';
  }
}

function saveAccountProfile() {
  const nameEl = document.getElementById('acct-name');
  const name = nameEl ? nameEl.value.trim() : '';
  if (!state.profile) state.profile = { name: '', businessForm: '', taxForm: '' };
  state.profile.name = name;
  save();
  refreshSidebarAccount();
  setAcctNote('acct-profile-note', 'Profil mentve \u2713');
  try { LocalStore.updateProfileName(name); } catch (e) {}
  setTimeout(() => setAcctNote('acct-profile-note', ''), 2500);
}

function saveBusinessProfile() {
  const bizSel = document.getElementById('acct-bizform');
  const taxSel = document.getElementById('acct-taxform');
  if (!state.profile) state.profile = { name: '', businessForm: '', taxForm: '' };
  state.profile.businessForm = bizSel ? bizSel.value : '';
  state.profile.taxForm      = taxSel ? taxSel.value : '';
  save();
  setAcctNote('acct-biz-note', 'Mentve \u2713');
  setTimeout(() => setAcctNote('acct-biz-note', ''), 2500);
}

async function changeAccountPassword() {
  const p0 = document.getElementById('acct-pw0');
  const p1 = document.getElementById('acct-pw1');
  const p2 = document.getElementById('acct-pw2');
  const v0 = p0 ? p0.value : '';
  const v1 = p1 ? p1.value : '';
  const v2 = p2 ? p2.value : '';
  if (!v0)           { setAcctNote('acct-pw-note', 'Add meg a jelenlegi jelszavad.', true); return; }
  if (v1.length < 6) { setAcctNote('acct-pw-note', 'A jelszó legalább 6 karakter legyen.', true); return; }
  if (v1 !== v2)     { setAcctNote('acct-pw-note', 'A két jelszó nem egyezik.', true); return; }
  if (!LocalStore.currentUser) { setAcctNote('acct-pw-note', 'Nincs bejelentkezett fiók.', true); return; }

  try {
    await LocalStore.reauth(v0);
    await LocalStore.updatePassword(v1);
    if (p0) p0.value = ''; if (p1) p1.value = ''; if (p2) p2.value = '';
    setAcctNote('acct-pw-note', 'Jelszó módosítva \u2713');
  } catch (err) {
    setAcctNote('acct-pw-note', hibaSzoveg(err), true);
  }
}

function sendAccountPasswordReset() {
  var u = LocalStore.currentUser;
  if (!u || !u.email) { setAcctNote('acct-pw-note', 'Nincs bejelentkezett fiók.', true); return; }
  LocalStore.resetPassword(u.email).then(function () {
    setAcctNote('acct-pw-note', 'Elküldtük a jelszó-visszaállító linket az e-mail címedre.');
  }).catch(function (err) { setAcctNote('acct-pw-note', hibaSzoveg(err), true); });
}

function saveSellerInfo() {
  const gv = id => (document.getElementById(id)?.value || '').trim();
  state.sellerInfo = {
    name:    gv('seller-name'),
    address: gv('seller-address'),
    tax:     gv('seller-tax'),
    reg:     gv('seller-reg'),
    bank:    gv('seller-bank'),
    email:   gv('seller-email'),
    phone:   gv('seller-phone'),
    vatRegistered: gv('seller-vat') === 'afas',
    vatRate: (parseFloat((document.getElementById('seller-vatrate') || {}).value) || 0) || 27
  };
  save();
  setAcctNote('acct-seller-note', 'Cégadatok mentve \u2713');
  setTimeout(() => setAcctNote('acct-seller-note', ''), 2500);
}

function onVatStatusChange() {
  const sel = document.getElementById('seller-vat');
  const wrap = document.getElementById('seller-vatrate-wrap');
  if (wrap) wrap.style.display = (sel && sel.value === 'afas') ? '' : 'none';
}

function inboxTargetUid() {
  return currentUid || 'A_TE_FIOK_AZONOSITOD';
}

/* ─────────────────────────────────────────────────────────────────────────
   EmailJS — visszaigazoló e-mailek közös (beégetett) fiókkal.
   KÉT sablon: egy a rendelőnek szóló visszaigazolásra (templateCustomer),
   egy a tulajnak szóló értesítésre (templateOwner). Mindkét sablon ezekkel a
   változókkal dolgozik: to_email, to_name, subject, heading, intro, details,
   from_name, reply_to. (A sablon „To Email" mezőjébe {{to_email}} kerüljön.)
   Az összes érték PUBLIKUS az EmailJS böngészős használatában, nem titok.
   ───────────────────────────────────────────────────────────────────────── */
const EMAILJS_CFG = {
  publicKey:        "eTf1OffvvcrBwZcAm",
  serviceId:        "service_598rmjv",
  templateCustomer: "template_6tb81uj",     // visszaigazolás a rendelőnek (design A)
  templateOwner:    "template_net34ym"      // értesítés a tulajnak (design B)
};

function inboxEmbedSnippet() {
  const uid = inboxTargetUid();
  const key = (state && state.inboxKey) || '';
  return `<!-- Rendli rendelő-űrlap (dinamikus, a weboldal nyelvét követi — elég EGYSZER beilleszteni) -->
<!-- A beérkező rendelés a Rendli felhő-adatbázisába (Firestore) kerül, és azonnal megjelenik a Rendli-fiókodban. -->
<div id="rendli-order-mount"></div>
<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"><\/script>
<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"><\/script>
<script>
(function () {
  var OWNER_UID = "${uid}";
  var KEY = "${key}";
  var FB = { apiKey: "AIzaSyD8Ps4RDjEnN4X-NTdQsoiBp6d-_gR-P5A", authDomain: "rendli-202608.firebaseapp.com", projectId: "rendli-202608", storageBucket: "rendli-202608.firebasestorage.app", messagingSenderId: "638877114951", appId: "1:638877114951:web:24396e83b719f604b04762" };
  try { if (!firebase.apps.length) firebase.initializeApp(FB); } catch (e) { console.error(e); }
  var fs = firebase.firestore();
  var db = {
    addInbox: function (data) {
      return fs.collection("inbox").doc(OWNER_UID).collection("items").add(data);
    },
    getConfig: function () {
      return fs.collection("form_configs").doc(OWNER_UID).get()
        .then(function (d) { return d.exists ? d.data() : {}; })
        .catch(function () { return {}; });
    }
  };
  var mount = document.getElementById("rendli-order-mount");
  var CFG = {}, LANG = "hu";
  var T = {
    hu: { name:"Név", email:"E-mail", company:"Cég neve", tax:"Adószám", priv:"Magánszemély", biz:"Vállalkozó", choose:"Válassz szolgáltatást…", service:"Munka típusa", phone:"Telefon", budget:"Tervezett keret", message:"Üzenet", submit:"Rendelés elküldése", thanks:"Köszönjük, a rendelést megkaptuk!", err:"Hiba történt a küldéskor, próbáld újra.", needCo:"Vállalkozóként a cég nevét kötelező megadni.", mo:"/ hó", moWord:"havi", moTag:"[Havidíjas szolgáltatás]" },
    en: { name:"Name", email:"Email", company:"Company name", tax:"VAT number", priv:"Individual", biz:"Company", choose:"Choose a service…", service:"Type of work", phone:"Phone", budget:"Budget", message:"Message", submit:"Send order", thanks:"Thank you, we received your order!", err:"Something went wrong, please try again.", needCo:"Company name is required.", mo:"/ mo", moWord:"monthly", moTag:"[Monthly service]" }
  };
  // Visszaigazoló e-mailek (közös, beégetett EmailJS-fiók). Ha üres/placeholder, nem küld.
  var EMAILJS = { publicKey: "${EMAILJS_CFG.publicKey}", serviceId: "${EMAILJS_CFG.serviceId}", templateCustomer: "${EMAILJS_CFG.templateCustomer}", templateOwner: "${EMAILJS_CFG.templateOwner}" };
  var M = {
    hu: { cSub:"Visszaigazolás — ", cHi:"Köszönjük a megrendelésed!", cIn:"Megkaptuk a rendelésed, hamarosan felvesszük veled a kapcsolatot. Az összesítés:", cTag:"Megrendelés visszaigazolás",
          oSub:"Új megrendelés — ", oHi:"Új megrendelés érkezett", oIn:"Az alábbi rendelés futott be a weboldalad űrlapján keresztül:", oTag:"Új megrendelés",
          svc:"Szolgáltatás", price:"Ár", date:"Dátum", nm:"Név", em:"E-mail", ph:"Telefon", msg:"Üzenet", deadline:"Kívánt határidő", budget:"Tervezett keret", ctype:"Ügyféltípus", comp:"Cég", tax:"Adószám", mo:"/ hó" },
    en: { cSub:"Confirmation — ", cHi:"Thank you for your order!", cIn:"We've received your order and will get back to you shortly. Here's the summary:", cTag:"Order confirmation",
          oSub:"New order — ", oHi:"New order received", oIn:"The following order came in through your website form:", oTag:"New order",
          svc:"Service", price:"Price", date:"Date", nm:"Name", em:"Email", ph:"Phone", msg:"Message", deadline:"Deadline", budget:"Budget", ctype:"Client type", comp:"Company", tax:"VAT number", mo:"/ mo" }
  };
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function ft(n, lang) { n = Math.round(Number(n) || 0); return lang === "en" ? "€" + n.toLocaleString("hu-HU") : n.toLocaleString("hu-HU") + " Ft"; }
  function priceFor(s, lang) {
    if (lang === "en") {
      var eur = Number(s.priceEur) || 0;
      if (eur > 0) return eur;                                   // kézzel megadott euró ár
      var r = Number(CFG.eurHuf) || 0;                           // különben átszámolás az aktuális árfolyammal
      return r > 0 ? Math.round((Number(s.price) || 0) / r) : 0;
    }
    return Number(s.price) || 0;
  }
  function svcName(s, lang) { return (lang === "en" && s.nameEn) ? s.nameEn : s.name; }
  function pageLang() {
    var l = (document.documentElement.getAttribute("lang") || "").toLowerCase();
    if (l.indexOf("en") === 0) return "en";
    if (l.indexOf("hu") === 0) return "hu";
    return null;
  }
  function pickLang() {
    if (CFG.formLang === "hu") return "hu";
    if (CFG.formLang === "en") return "en";
    if (window.RENDLI_LANG === "hu" || window.RENDLI_LANG === "en") return window.RENDLI_LANG;
    return pageLang() || "hu";
  }
  function emailReady() { var e = EMAILJS; return !!(e.publicKey && e.serviceId && e.templateCustomer && e.templateOwner) && [e.publicKey, e.serviceId, e.templateCustomer, e.templateOwner].join("|").indexOf("EMAILJS_") < 0; }
  function sendMail(templateId, params) {
    try {
      fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: EMAILJS.serviceId, template_id: templateId, user_id: EMAILJS.publicKey, template_params: params })
      }).catch(function () {});
    } catch (e) {}
  }
  // Két visszaigazoló levél: az ügyfélnek és a tulajnak. Best-effort — sosem blokkolja a rendelést.
  function initialOf(s) { s = (s || "").trim(); return s ? s.charAt(0).toUpperCase() : "•"; }
  function erow(label, val) {
    if (val == null || String(val) === "") return "";
    return '<tr><td style="padding:10px 0;border-bottom:1px solid #eef0f5;font-size:12px;color:#8a91a3;vertical-align:top;white-space:nowrap">' + esc(label) +
           '</td><td style="padding:10px 0 10px 18px;border-bottom:1px solid #eef0f5;font-size:14px;color:#1f2430;vertical-align:top;text-align:right">' + esc(val) + '</td></tr>';
  }
  function sendConfirmations(data, x) {
    if (!emailReady()) return;
    x = x || {};
    var notify = CFG.notify || {}, owner = notify.ownerEmail || "", biz = notify.bizName || "";
    var m = M[LANG] || M.hu;
    var svc = x.locName || data.type || "";
    var priceTxt = data.price ? ft(data.price, LANG) : "";
    if (priceTxt && x.period === "monthly") priceTxt += " " + m.mo;
    // Az összes beküldött mező, tételes HTML-táblázatba (üres mezők kimaradnak).
    var rows =
      erow(m.nm, data.name) + erow(m.em, data.email) + erow(m.ph, x.phone) +
      erow(m.svc, svc) + erow(m.price, priceTxt) +
      erow(m.ctype, x.clientType) + erow(m.comp, x.company) + erow(m.tax, x.tax) +
      erow(m.deadline, x.deadline) + erow(m.budget, x.budget) +
      erow(m.msg, x.message) + erow(m.date, data.date);
    if (data.email) {
      sendMail(EMAILJS.templateCustomer, { to_email: data.email, to_name: data.name || "", from_name: biz || "Rendli",
        brand_initial: initialOf(biz || "Rendli"), tagline: m.cTag, reply_to: owner || "",
        subject: m.cSub + svc, heading: m.cHi, intro: m.cIn, details: rows });
    }
    if (owner) {
      sendMail(EMAILJS.templateOwner, { to_email: owner, to_name: biz || "", from_name: "Rendli",
        brand_initial: "R", tagline: m.oTag, reply_to: data.email || "",
        subject: m.oSub + svc, heading: m.oHi, intro: m.oIn, details: rows });
    }
  }
  function build() {
    var fc = CFG, t = T[LANG], f = fc.fields || {};
    var services = (fc.services || []).filter(function (s) { return s && s.name; });
    var h = '<form id="rendli-order">';
    h += '<input name="name" placeholder="' + esc(t.name) + ' *" required>';
    h += '<input name="email" type="email" placeholder="' + esc(t.email) + ' *" required>';
    if (fc.business) {
      h += '<select name="clientType"><option>' + esc(t.priv) + '</option><option>' + esc(t.biz) + '</option></select>';
      h += '<span data-biz style="display:none"><input name="companyName" placeholder="' + esc(t.company) + ' *"><input name="taxNumber" placeholder="' + esc(t.tax) + '"></span>';
    }
    if (services.length) {
      h += '<select name="type" required><option value="">' + esc(t.choose) + '</option>';
      services.forEach(function (s) {
        var monthly = s.period === "monthly", pr = priceFor(s, LANG), dn = svcName(s, LANG);
        var label = (fc.showPrices && pr) ? esc(dn) + " — " + ft(pr, LANG) + (monthly ? " " + t.mo : "") : esc(dn) + (monthly ? " (" + t.moWord + ")" : "");
        /* a value marad a magyar (kanonikus) név — így az owner rendelés-listája következetes;
           a data-loc a megjelenített (nyelvhelyes) név, a vevő visszaigazoló e-mailjéhez */
        h += '<option value="' + esc(s.name) + '" data-loc="' + esc(dn) + '" data-price="' + pr + '" data-period="' + (monthly ? "monthly" : "once") + '">' + label + '</option>';
      });
      h += '</select>';
    } else {
      h += '<input name="type" placeholder="' + esc(t.service) + '">';
    }
    if (f.phone)    h += '<input name="phone" placeholder="' + esc(t.phone) + '">';
    if (f.budget)   h += '<input name="budget" placeholder="' + esc(t.budget) + '">';
    if (f.deadline) h += '<input name="deadline" type="date">';
    if (f.message)  h += '<textarea name="message" placeholder="' + esc(t.message) + '"></textarea>';
    h += '<input type="text" name="_hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px">';
    h += '<button type="submit">' + esc(t.submit) + '</button></form>';
    mount.innerHTML = h;
    wire();
  }
  function wire() {
    var t = T[LANG], fc = CFG;
    var form = document.getElementById("rendli-order");
    if (!form) return;
    var g = function (n) { return (form[n] && form[n].value ? String(form[n].value) : "").slice(0, 4000); };
    if (fc.business) {
      var ctSel = form.querySelector("[name=clientType]"), bizBox = form.querySelector("[data-biz]");
      if (ctSel && bizBox) ctSel.addEventListener("change", function () { bizBox.style.display = (ctSel.value === t.biz) ? "" : "none"; });
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form._hp && form._hp.value) return;
      var f = fc.fields || {};
      var typeSel = form.querySelector("[name=type]"), price = 0, per = "", locName = g("type");
      if (typeSel && typeSel.selectedOptions && typeSel.selectedOptions[0]) { price = Number(typeSel.selectedOptions[0].getAttribute("data-price")) || 0; per = typeSel.selectedOptions[0].getAttribute("data-period") || ""; locName = typeSel.selectedOptions[0].getAttribute("data-loc") || locName; }
      var nameV = g("name") || "—", emailV = g("email");
      var phoneV = f.phone ? g("phone") : "", budgetV = f.budget ? g("budget") : "", deadlineV = f.deadline ? g("deadline") : "";
      var rawMsg = g("message"), ctV = "", coV = "", taxV = "";
      if (fc.business) {
        ctV = g("clientType") || t.priv;
        if (ctV === t.biz && !g("companyName")) { alert(t.needCo); return; }
        coV = g("companyName"); taxV = g("taxNumber");
      }
      var msg = rawMsg;
      if (per === "monthly") msg += (msg ? "\\n\\n" : "") + t.moTag;
      if (fc.business && ctV === t.biz && (coV || taxV)) msg += (msg ? "\\n\\n" : "") + "[" + t.company + ": " + coV + (taxV ? " · " + t.tax + ": " + taxV : "") + "]";
      var currency = (LANG === "en") ? "EUR" : "HUF";
      var data = { name: nameV, email: emailV, type: g("type"), key: KEY, status: "uj", price: price, currency: currency, date: new Date().toISOString().slice(0, 10), createdAt: Date.now() };
      if (currency === "EUR") data.fxRate = Number(CFG.eurHuf) || 0;
      if (fc.business) data.clientType = (ctV === t.biz) ? "Vállalkozó" : "Magánszemély";
      if (f.phone)    data.phone = phoneV;
      if (f.budget)   data.budget = budgetV;
      if (f.deadline) data.deadline = deadlineV;
      data.message = msg;
      db.addInbox(data)
        .then(function () {
          try { sendConfirmations(data, { locName: locName, phone: phoneV, budget: budgetV, deadline: deadlineV, clientType: (fc.business ? ctV : ""), company: coV, tax: taxV, message: rawMsg, period: per }); } catch (e) {}
          form.reset(); alert(t.thanks);
        })
        .catch(function (err) { console.error(err); alert(t.err); });
    });
  }
  window.rendliSetLang = function (l) { if (l === "hu" || l === "en") { LANG = l; build(); } };
  try {
    var mo = new MutationObserver(function () {
      if (CFG.formLang === "hu" || CFG.formLang === "en") return;
      var nl = pageLang(); if (nl && nl !== LANG) { LANG = nl; build(); }
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  } catch (e) {}
  db.getConfig().then(function (cfg) { CFG = cfg || {}; LANG = pickLang(); build(); });
})();
<\/script>`;
}

/* Árlista beágyazható snippet — a form_configs/{uid} publikus configból, élőben.
   Kategóriákba csoportosít, tiszteli az ár-módot (pontos / „…-tól” / Ingyenes) és
   a havidíjas jelölést, követi a weboldal nyelvét. A weboldal stílusát örökli. */
function priceListSnippet() {
  const uid = inboxTargetUid() || 'OWNER_UID';
  return `<!-- Rendli árlista — élőben a Rendli beállításaidból. Elég EGYSZER beilleszteni; ha módosítasz és mentesz, magától frissül. -->
<div id="rendli-prices"></div>
<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"><\/script>
<script src="https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js"><\/script>
<script>
(function () {
  var OWNER_UID = "${uid}";
  var FB = { apiKey: "AIzaSyD8Ps4RDjEnN4X-NTdQsoiBp6d-_gR-P5A", authDomain: "rendli-202608.firebaseapp.com", projectId: "rendli-202608", storageBucket: "rendli-202608.firebasestorage.app", messagingSenderId: "638877114951", appId: "1:638877114951:web:24396e83b719f604b04762" };
  try { if (!firebase.apps.length) firebase.initializeApp(FB); } catch (e) { console.error(e); }
  var fs = firebase.firestore();
  var mount = document.getElementById("rendli-prices");
  if (!mount) return;
  function esc(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
  function pageLang(){var l=(document.documentElement.getAttribute("lang")||"").toLowerCase();if(l.indexOf("en")===0)return "en";if(l.indexOf("hu")===0)return "hu";return null;}
  function pickLang(){ if(window.RENDLI_LANG==="hu"||window.RENDLI_LANG==="en")return window.RENDLI_LANG; return pageLang()||"hu"; }
  function money(v,EN){ v=Math.round(+v||0); return EN?("\\u20AC"+v.toLocaleString("hu-HU")):(v.toLocaleString("hu-HU")+" Ft"); }
  function priceText(s,EN,rate){
    if(s.priceMode==="free") return EN?"Free":"Ingyenes";
    var v; if(EN){ v=+s.priceEur||0; if(!v&&rate>0) v=Math.round((+s.price||0)/rate); } else { v=+s.price||0; }
    if(!v) return "";
    var m=money(v,EN);
    if(s.priceMode==="from") m=EN?("from "+m):(m+"-t\\u00F3l");
    if(s.period==="monthly") m+=EN?" / mo":" / h\\u00F3";
    return m;
  }
  function render(cfg, LANG){
    var EN=LANG==="en", rate=+cfg.eurHuf||0;
    var svcs=(cfg.services||[]).filter(function(s){return s&&s.name;});
    function nm(s){return EN&&s.nameEn?s.nameEn:s.name;}
    function nt(s){return EN&&s.noteEn?s.noteEn:(s.note||"");}
    function ct(s){return EN&&s.catEn?s.catEn:(s.cat||"");}
    var order=[], map={};
    svcs.forEach(function(s){ var c=ct(s)||""; if(!(c in map)){ map[c]=[]; order.push(c); } map[c].push(s); });
    var h="";
    order.forEach(function(c){
      h+='<div class="rlp-cat">';
      if(c) h+='<div class="rlp-cat-title">'+esc(c)+'</div>';
      map[c].forEach(function(s){
        var p=priceText(s,EN,rate);
        h+='<div class="rlp-row"><span class="rlp-name">'+esc(nm(s))+(nt(s)?' <small>'+esc(nt(s))+'</small>':'')+'</span><span class="rlp-dots"></span><span class="rlp-amt">'+esc(p)+'</span></div>';
      });
      h+='</div>';
    });
    mount.innerHTML='<div class="rendli-prices">'+(h||'')+'</div>';
    injectStyle();
  }
  function injectStyle(){
    if(document.getElementById("rendli-prices-style")) return;
    var s=document.createElement("style"); s.id="rendli-prices-style";
    s.textContent=".rendli-prices{max-width:640px}.rlp-cat{margin-bottom:22px}.rlp-cat-title{font-size:12.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;opacity:.6;margin:0 0 10px}.rlp-row{display:flex;align-items:baseline;gap:10px;padding:7px 0}.rlp-name{font-weight:600}.rlp-name small{display:block;font-weight:400;font-size:.82em;opacity:.6;margin-top:2px}.rlp-dots{flex:1;border-bottom:1px dotted currentColor;opacity:.28;transform:translateY(-3px)}.rlp-amt{font-weight:700;white-space:nowrap}";
    document.head.appendChild(s);
  }
  var LAST={};
  function load(){ fs.collection("form_configs").doc(OWNER_UID).get().then(function(d){ LAST=d.exists?d.data():{}; render(LAST, pickLang()); }).catch(function(){ mount.innerHTML=""; }); }
  try{ var mo=new MutationObserver(function(){ render(LAST, pickLang()); }); mo.observe(document.documentElement,{attributes:true,attributeFilter:["lang"]}); }catch(e){}
  load();
})();
<\/script>`;
}

function formPreviewHtml() {
  const fc = (state && state.formConfig) || {};
  const f = fc.fields || {};
  const en = (state && state.uiLang === 'en');
  const esc = s => escHtml(s == null ? '' : String(s));
  const rate = (typeof eurHufRate === 'function') ? eurHufRate() : 400;
  const money = n => en
    ? '€' + Math.round(Number(n) || 0).toLocaleString('hu-HU')
    : (Number(n) || 0).toLocaleString('hu-HU') + ' Ft';

  const svcPrice = s => en
    ? (Number(s.priceEur) > 0 ? Number(s.priceEur) : (rate > 0 ? Math.round((Number(s.price) || 0) / rate) : 0))
    : (Number(s.price) || 0);
  const svcName = s => en ? (s.nameEn || s.name) : s.name;
  const L = en
    ? { name:'Name *', email:'Email *', priv:'Individual', biz:'Company', co:'Company name *', tax:'VAT number', choose:'Choose a service…', work:'Type of work', phone:'Phone', budget:'Budget', deadlineType:'date', message:'Message', submit:'Send order', mo:' / mo', moWord:' (monthly)', note:'This is only a preview — the real form on your site sends the order.' }
    : { name:'Név *', email:'E-mail *', priv:'Magánszemély', biz:'Vállalkozó', co:'Cég neve *', tax:'Adószám', choose:'Válassz szolgáltatást…', work:'Munka típusa', phone:'Telefon', budget:'Tervezett keret', deadlineType:'date', message:'Üzenet', submit:'Rendelés elküldése', mo:' / hó', moWord:' (havi)', note:'Ez csak előnézet — a valódi űrlap a weboldaladon küld.' };
  const services = Array.isArray(fc.services) ? fc.services.filter(s => s && s.name) : [];
  const P = [];
  P.push('<input class="fp-inp" placeholder="' + esc(L.name) + '">');
  P.push('<input class="fp-inp" placeholder="' + esc(L.email) + '">');
  if (fc.business) {
    P.push('<select class="fp-inp" onchange="var b=document.getElementById(\'fp-biz\');if(b)b.style.display=this.value===\'' + esc(L.biz) + '\'?\'flex\':\'none\'"><option>' + esc(L.priv) + '</option><option>' + esc(L.biz) + '</option></select>');
    P.push('<span id="fp-biz" style="display:none;flex-direction:column;gap:10px"><input class="fp-inp" placeholder="' + esc(L.co) + '"><input class="fp-inp" placeholder="' + esc(L.tax) + '"></span>');
  }
  if (services.length) {
    const label = s => {
      const monthly = s.period === 'monthly', pr = svcPrice(s);
      if (fc.showPrices && pr) return esc(svcName(s)) + ' — ' + money(pr) + (monthly ? L.mo : '');
      return esc(svcName(s)) + (monthly ? L.moWord : '');
    };
    P.push('<select class="fp-inp"><option>' + esc(L.choose) + '</option>' +
      services.map(s => '<option>' + label(s) + '</option>').join('') + '</select>');
  } else {
    P.push('<input class="fp-inp" placeholder="' + esc(L.work) + '">');
  }
  if (f.phone)    P.push('<input class="fp-inp" placeholder="' + esc(L.phone) + '">');
  if (f.budget)   P.push('<input class="fp-inp" placeholder="' + esc(L.budget) + '">');
  if (f.deadline) P.push('<input class="fp-inp" type="date">');
  if (f.message)  P.push('<textarea class="fp-inp" placeholder="' + esc(L.message) + '"></textarea>');
  P.push('<button type="button" class="btn" style="width:100%" onclick="var n=document.getElementById(\'fp-note\');if(n){n.textContent=' + JSON.stringify(L.note) + ';setTimeout(function(){n.textContent=\'\';},2500);}">' + esc(L.submit) + '</button>');
  P.push('<div id="fp-note" style="font-size:11.5px;color:var(--muted);text-align:center;min-height:14px"></div>');
  return P.join('');
}

function copyInbox(which) {
  const text = (which === 'uid') ? inboxTargetUid() : inboxEmbedSnippet();
  const done = () => setAcctNote('acct-inbox-note', 'Vágólapra másolva \u2713');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else { fallbackCopy(text, done); }
  } catch (e) { fallbackCopy(text, done); }
  setTimeout(() => setAcctNote('acct-inbox-note', ''), 2500);
}
function fallbackCopy(text, done) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove(); done();
  } catch (e) { setAcctNote('acct-inbox-note', 'A másolás nem sikerült — jelöld ki kézzel.', true); }
}

function renderServiceRows() {
  const wrap = document.getElementById('fc-services');
  if (!wrap) return;
  const fc = state.formConfig;
  wrap.innerHTML = (fc.services || []).map((s, i) => `
    <div class="fc-srv-row">
      <div class="fc-srv-grid">
        <div class="fc-srv-hu">
          <span class="fc-srv-lbl">Magyar · Ft</span>
          <input type="text" value="${escHtml(s.name)}" placeholder="Szolgáltatás neve"
            oninput="updateService(${i},'name',this.value)">
          <input type="text" inputmode="numeric" value="${s.price ? Math.round(s.price).toLocaleString('hu-HU') : ''}" placeholder="Ár (Ft)"
            oninput="formatThousands(this);updateService(${i},'price',this.value)" style="text-align:right">
        </div>
        <div class="fc-srv-en">
          <span class="fc-srv-lbl">English · €</span>
          <input type="text" value="${escHtml(s.nameEn || '')}" placeholder="Service name (English)"
            oninput="updateService(${i},'nameEn',this.value)">
          <input type="text" inputmode="numeric" value="${s.priceEur ? Math.round(s.priceEur).toLocaleString('hu-HU') : ''}" placeholder="Price (€) — automatikus, ha üres"
            oninput="formatThousands(this);updateService(${i},'priceEur',this.value)" style="text-align:right">
        </div>
      </div>
      <div class="fc-srv-foot">
        <select onchange="updateService(${i},'period',this.value)">
          <option value="once"${s.period !== 'monthly' ? ' selected' : ''}>egyszeri</option>
          <option value="monthly"${s.period === 'monthly' ? ' selected' : ''}>havidíjas</option>
        </select>
        <select onchange="updateService(${i},'priceMode',this.value)" title="Ár megjelenítése az árlistán">
          <option value="exact"${(s.priceMode || 'exact') === 'exact' ? ' selected' : ''}>Pontos ár</option>
          <option value="from"${s.priceMode === 'from' ? ' selected' : ''}>„…-tól” ár</option>
          <option value="free"${s.priceMode === 'free' ? ' selected' : ''}>Ingyenes</option>
        </select>
        <span class="fc-srv-spacer"></span>
        <button class="btn btn-secondary btn-sm" onclick="removeService(${i})" title="Törlés">×</button>
      </div>
    </div>`).join('') ||
    '<div style="color:var(--muted);font-size:12.5px">Még nincs szolgáltatás. Adj hozzá a lenti gombbal.</div>';
}

function updateService(i, field, val) {
  const fc = state.formConfig;
  if (!fc.services[i]) return;
  if (field === 'price') fc.services[i].price = Number(String(val).replace(/[^\d]/g, '')) || 0;
  else if (field === 'priceEur') fc.services[i].priceEur = Number(String(val).replace(/[^\d]/g, '')) || 0;
  else if (field === 'period') fc.services[i].period = (val === 'monthly') ? 'monthly' : 'once';
  else if (field === 'priceMode') fc.services[i].priceMode = ['exact', 'from', 'free'].indexOf(val) >= 0 ? val : 'exact';
  else if (field === 'nameEn') fc.services[i].nameEn = val;
  else if (field === 'cat') fc.services[i].cat = val;
  else if (field === 'catEn') fc.services[i].catEn = val;
  else if (field === 'note') fc.services[i].note = val;
  else if (field === 'noteEn') fc.services[i].noteEn = val;
  else fc.services[i].name = val;
  updateFormOutputs();
}
function addService() {
  state.formConfig.services.push({ name: '', nameEn: '', cat: '', catEn: '', note: '', noteEn: '', price: 0, priceEur: 0, priceMode: 'exact', period: 'once' });
  renderServiceRows();
  updateFormOutputs();
}
function removeService(i) {
  state.formConfig.services.splice(i, 1);
  renderServiceRows();
  updateFormOutputs();
}

function readFormToggles() {
  const fc = state.formConfig;
  const chk = id => { const el = document.getElementById(id); return el ? el.checked : undefined; };
  const b = chk('fc-business');    if (b !== undefined) fc.business = b;
  const sp = chk('fc-showprices'); if (sp !== undefined) fc.showPrices = sp;
  fc.formLang = 'both';

  ['phone', 'message', 'deadline', 'budget'].forEach(k => {
    const v = chk('fc-field-' + k); if (v !== undefined) fc.fields[k] = v;
  });
}

function updateFormOutputs() {
  readFormToggles();
  const prev = document.getElementById('fc-preview');
  if (prev) prev.innerHTML = formPreviewHtml();
  const snip = document.getElementById('fc-snippet');
  if (snip) snip.value = inboxEmbedSnippet();
  const uidEl = document.getElementById('fc-uid'); if (uidEl) uidEl.value = inboxTargetUid();
}

function renderFormConfig() {
  const fc = state.formConfig;
  if (!fc) return;
  const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
  setChk('fc-business', fc.business);
  setChk('fc-showprices', fc.showPrices);
  setChk('fc-field-phone', fc.fields.phone);
  setChk('fc-field-message', fc.fields.message);
  setChk('fc-field-deadline', fc.fields.deadline);
  setChk('fc-field-budget', fc.fields.budget);
  renderServiceRows();
  updateFormOutputs();
}

function saveFormConfig() {
  readFormToggles();

  state.formConfig.services = state.formConfig.services.filter(s => s && s.name && s.name.trim());
  if (!state.formConfig.services.length) state.formConfig.services = [];
  save();
  publishFormConfig();
  renderServiceRows();
  updateFormOutputs();
  const note = document.getElementById('fc-save-note');
  if (note) { note.textContent = 'Mentve \u2713 — a weboldaladon lévő űrlap magától frissül.'; setTimeout(() => { note.textContent = ''; }, 4500); }
}

function registeredEmail() {
  try { return (LocalStore.currentUser && LocalStore.currentUser.email) ? LocalStore.currentUser.email : ''; }
  catch (e) { return ''; }
}

function publishFormConfig() {
  if (!currentUid) return;
  const fc = state.formConfig || {};
  const pub = {
    services: (fc.services || []).filter(s => s && s.name).map(s => ({
      name: String(s.name),
      nameEn: String(s.nameEn || ''),
      cat: String(s.cat || ''),
      catEn: String(s.catEn || ''),
      note: String(s.note || ''),
      noteEn: String(s.noteEn || ''),
      price: Number(s.price) || 0,
      priceEur: Number(s.priceEur) || 0,
      priceMode: ['exact', 'from', 'free'].indexOf(s.priceMode) >= 0 ? s.priceMode : 'exact',
      period: s.period === 'monthly' ? 'monthly' : 'once'
    })),
    showPrices: !!fc.showPrices,
    business: !!fc.business,
    formLang: 'both',
    eurHuf: Number(state.fxEurHuf) || 0,
    fields: {
      phone:    !!(fc.fields && fc.fields.phone),
      message:  !!(fc.fields && fc.fields.message),
      deadline: !!(fc.fields && fc.fields.deadline),
      budget:   !!(fc.fields && fc.fields.budget)
    },
    // Visszaigazoló e-mailekhez: a tulaj (fiók) e-mailje + a vállalkozás neve.
    // A küldő EmailJS-fiók közös (beégetett) — ezek csak a CÍMZETT és a feladónév.
    notify: {
      ownerEmail: (function () { try { return (LocalStore.currentUser && LocalStore.currentUser.email) || ''; } catch (e) { return ''; } })(),
      bizName: String((state.profile && state.profile.name) || '')
    },
    updatedAt: Date.now()
  };
  try { LocalStore.kvSet('formcfg_' + currentUid, pub); }
  catch (e) { console.warn('[Rendli] form_config közzététel:', e); }
}

function copyFormSnippet() {
  const text = inboxEmbedSnippet();
  const done = () => { const n = document.getElementById('fc-save-note'); if (n) { n.textContent = 'Kód a vágólapra másolva \u2713'; setTimeout(() => n.textContent = '', 3000); } };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => fallbackFormCopy(text, done));
    else fallbackFormCopy(text, done);
  } catch (e) { fallbackFormCopy(text, done); }
}
function fallbackFormCopy(text, done) {
  try {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); done();
  } catch (e) {}
}

const fmt = n => {
  if (n === undefined || n === null || isNaN(n)) n = 0;
  if (state && state.uiLang === 'en') {
    const r = (typeof eurHufRate === 'function') ? eurHufRate() : 400;
    return '€' + Math.round(Number(n) / r).toLocaleString('en-US');
  }
  return Math.round(n).toLocaleString('hu-HU') + ' Ft';
};

const fmtNum = n => parseFloat(n.toFixed(5)).toLocaleString('hu-HU', { maximumFractionDigits: 5 });

function formatThousands(el) {
  const caretFromEnd = el.value.length - el.selectionStart;
  const digits = el.value.replace(/\D/g, '');
  el.value = digits ? parseInt(digits, 10).toLocaleString('hu-HU') : '';
  const newPos = Math.max(0, el.value.length - caretFromEnd);
  el.setSelectionRange(newPos, newPos);
}

function parseAmount(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const digits = (el.value || '').replace(/\s|\u00a0/g, '').replace(/\D/g, '');
  return parseFloat(digits) || 0;
}

const now = () => new Date().toISOString().slice(0,10);

const uid = () => Math.random().toString(36).slice(2,9);

const TAB_TITLES = {
  bizdash:  'Áttekintés',
  orders:   'Megrendelések',
  projects: 'Projektek',
  clients:  'Ügyfelek',
  formcfg:  'Űrlap / weboldal',
  invoices: 'Számlák',
  income:   'Bevételek',
  expense:  'Kiadások',
  account:  'Fiók, vállalkozás és megjelenés'
};

function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#main-nav button').forEach(b => b.classList.remove('active'));
  const tab = document.getElementById('tab-' + id);
  if (tab) tab.classList.add('active');

  const navBtn = document.querySelector('#main-nav button[data-tab="' + id + '"]');
  if (navBtn) navBtn.classList.add('active');

  const acctBtn = document.getElementById('side-account-btn');
  if (acctBtn) acctBtn.classList.toggle('active', id === 'account');

  const label = document.getElementById('nav-current-label');
  if (label) label.textContent = TAB_TITLES[id] || (navBtn ? navBtn.textContent.trim() : '');

  if (id === 'account') {
    if (typeof window.refreshAppearanceControls === 'function') { try { window.refreshAppearanceControls(); } catch (e) {} }
    if (typeof window.populateAccountForms === 'function') { try { window.populateAccountForms(); } catch (e) {} }
  }
  if (id === 'formcfg' && typeof renderFormConfig === 'function') { try { renderFormConfig(); } catch (e) {} }

  closeNav();
  renderAll();
}

function toggleNav() {
  document.body.classList.toggle('sidebar-open');
}
function closeNav() {
  document.body.classList.remove('sidebar-open');
}

const LS_SIDEBAR = 'rendli_sidebar';
function toggleSidebarCollapse() {
  const collapsed = document.body.classList.toggle('sidebar-collapsed');
  try { localStorage.setItem(LS_SIDEBAR, collapsed ? 'collapsed' : 'expanded'); } catch (e) {}
}
function initSidebar() {
  let s = null;
  try { s = localStorage.getItem(LS_SIDEBAR); } catch (e) {}
  if (s === 'collapsed') document.body.classList.add('sidebar-collapsed');
}

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('open');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('open');
}

function renderAll() {
  renderRevenues();
  renderExpenses();
  renderOrders();
  renderClients();
  renderBizDash();
  renderInvoices();
  if (typeof applyUiLang === 'function') { try { applyUiLang(); } catch (e) {} }
}

function renderClients() {
  const tbody = document.getElementById('clients-tbody');
  const countEl = document.getElementById('clients-count');
  if (!tbody) return;

  const src = [];
  Object.values(state.leads || {}).forEach(l => src.push(l));
  (state.orders || []).forEach(o => src.push(o));

  const map = {};
  src.forEach(x => {
    const email = (x.email || '').trim().toLowerCase();
    const name  = (x.name || '').trim();
    const phone = (x.phone || '').trim();
    const key = email || (name + '|' + phone).toLowerCase();
    if (!key || key === '|') return;
    const date = x.date || '';
    if (!map[key]) {
      map[key] = { name: name || x.email || 'Névtelen', email: x.email || '', phone: x.phone || '', last: date };
    } else {
      const c = map[key];
      if (name && !c.name)  c.name  = name;
      if (x.email && !c.email) c.email = x.email;
      if (phone && !c.phone) c.phone = phone;
      if (date > c.last) c.last = date;
    }
  });

  const list = Object.values(map).sort((a, b) => (b.last || '').localeCompare(a.last || ''));
  if (countEl) countEl.textContent = list.length + ' fő';

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--muted);text-align:center;padding:24px">Még nincs ügyfél. Amint beérkezik egy megrendelés, az ügyfél automatikusan megjelenik itt.</td></tr>';
    return;
  }

  const dash = '<span style="color:var(--muted)">—</span>';
  tbody.innerHTML = list.map(c => `<tr>
    <td><strong>${escHtml(c.name || '—')}</strong></td>
    <td>${c.email ? escHtml(c.email) : dash}</td>
    <td>${c.phone ? escHtml(c.phone) : dash}</td>
    <td style="color:var(--muted);white-space:nowrap">${c.last || '—'}</td>
  </tr>`).join('');
}

let _resizeRedrawTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_resizeRedrawTimer);
  _resizeRedrawTimer = setTimeout(() => {
    const bizTab = document.getElementById('tab-bizdash');
    if (bizTab && bizTab.classList.contains('active') && typeof renderBizDash === 'function') {
      renderBizDash();
    }
  }, 150);
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    const bizTab = document.getElementById('tab-bizdash');
    if (bizTab && bizTab.classList.contains('active') && typeof renderBizDash === 'function') {
      renderBizDash();
    }
  }, 250);
});

document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initStore();

  LocalStore.onAuthChange(async user => {
    if (!user) {
      currentUid = null;
      showAuthGate(true);
      _appInitialized = false;
      return;
    }

    currentUid = LocalStore.uid();
    showAuthGate(false);
    if (_appInitialized) return;
    _appInitialized = true;

    setSaveStatus('Betöltés…', '');
    const _loadOk = await load();
    if (!_loadOk) {

      _appInitialized = false;
      return;
    }

    const rvDate = document.getElementById('rv-date'); if (rvDate) rvDate.value = now();
    loadRevenueRateInput();
    const exDate = document.getElementById('ex-date'); if (exDate) exDate.value = now();
    const orDate = document.getElementById('or-date'); if (orDate) orDate.value = now();
    selectOrderClientType('Magánszemély');
    const hd = document.getElementById('header-date');
    if (hd) hd.textContent = locDate(new Date(), {year:'numeric',month:'long',day:'numeric',weekday:'long'});

    refreshSidebarAccount();
    setSaveStatus('Felhő', '');
    showTab('bizdash');

    document.dispatchEvent(new Event('swm:ready'));
  });

  LocalStore.start();
});

function fmtMonth(m) {
  if (!m) return '—';
  const d = new Date(m + '-01T00:00:00');
  return isNaN(d) ? m : locDate(d, { year: 'numeric', month: 'long' });
}

const REVENUE_CAT_BADGE = {
  'Weboldal projekt': 'badge-green',
  'Karbantartás': 'badge-cyan',
  'Tárhely / domain': 'badge-purple',
  'Tanácsadás': 'badge-yellow',
  'Egyéb': 'badge-gray'
};

function revenueCalc(r) {
  const gross = r.amount || 0;
  const tax = gross * (r.taxPct || 0) / 100;
  return { gross, tax, net: gross - tax };
}

function loadRevenueRateInput() {   }

function saveRevenueRate() {   }

function updateRevenuePreview() {   }

function addRevenue() {
  const date = document.getElementById('rv-date').value;
  const source = document.getElementById('rv-source').value.trim();
  const cat = document.getElementById('rv-cat').value;
  const amount = parseAmount('rv-amount');
  const note = document.getElementById('rv-note').value.trim();
  if (!date) { uiAlert('Add meg a dátumot!'); return; }
  if (!source) { uiAlert('Add meg az ügyfelet / forrást!'); return; }
  if (!amount) { uiAlert('Add meg az összeget!'); return; }
  state.bizIncome.push({ id: uid(), date, source, cat, amount, taxPct: 0, note });
  save();
  document.getElementById('rv-source').value = '';
  document.getElementById('rv-amount').value = '';
  document.getElementById('rv-note').value = '';
  closeModal('revenue-modal');
  renderAll();
}

function migrateRevenueTax() {
  if (!state.bizIncome) return;
  state.bizIncome.forEach(r => { if (r.taxPct == null) r.taxPct = state.bizTaxRate || 0; });
}

function deleteRevenue(id) {
  const r = state.bizIncome.find(x => x.id === id);
  if (r && r.orderId) return;
  state.bizIncome = state.bizIncome.filter(x => x.id !== id);
  save(); renderAll();
}

function renderRevenues() {
  const tbody = document.getElementById('revenue-tbody');
  if (!tbody) return;

  const today = now();
  const year = today.slice(0, 4);

  const yearRows = state.bizIncome.filter(r => (r.date || '').startsWith(year));
  let gross = 0, tax = 0, net = 0;
  yearRows.forEach(r => { const c = revenueCalc(r); gross += c.gross; tax += c.tax; net += c.net; });
  const fromInvoices = yearRows.filter(r => r.invoiceId);
  const fromInvoicesSum = fromInvoices.reduce((s, r) => s + r.amount, 0);

  const rvg = document.getElementById('rv-sum-gross'); if (rvg) rvg.textContent = fmt(gross);
  const rvgs = document.getElementById('rv-sum-gross-sub'); if (rvgs) rvgs.textContent = yearRows.length + ' ' + L('tétel','items');

  const rows = [...state.bizIncome].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  tbody.innerHTML = rows.length === 0
    ? '<tr><td colspan="5" style="color:var(--muted)">Még nincs bevétel.</td></tr>'
    : rows.map(r => {
        return `<tr>
          <td>${r.date}</td>
          <td style="color:var(--muted);font-size:11.5px">${r.note ? escHtml(r.note) : '—'}</td>
          <td style="font-weight:600">${escHtml(r.source)}${r.invoiceId ? ' <span class="badge badge-green">Számla</span>' : r.orderId ? ' <span class="badge badge-cyan">Megrendelés</span>' : ''}</td>
          <td><span class="badge ${REVENUE_CAT_BADGE[r.cat] || 'badge-gray'}">${r.cat}</span></td>
          <td style="font-weight:700">${fmt(r.amount)}</td>
          <td>${r.invoiceId || r.orderId
              ? '<span style="color:var(--muted);font-size:11px">Automatikusan könyvelt</span>'
              : `<button class="btn btn-danger btn-sm" onclick="deleteRevenue('${r.id}')">Törlés</button>`}</td>
        </tr>`;
      }).join('');
}

const EXPENSE_CAT_BADGE = {
  'Tárhely / domain': 'badge-purple',
  'Szoftver / licenc': 'badge-cyan',
  'Eszköz / hardver': 'badge-yellow',
  'Marketing': 'badge-green',
  'Könyvelés': 'badge-cyan',
  'Bankköltség': 'badge-red',
  'Utazás / üzemanyag': 'badge-yellow',
  'Oktatás': 'badge-green',
  'Egyéb': 'badge-gray'
};

const EXPENSE_CAT_COLORS = ['#2456d6', '#0e7490', '#b45309', '#6d4fc4', '#178746', '#d23b3b', '#0d9488', '#be185d', '#66748a'];

function addExpense() {
  const date = document.getElementById('ex-date').value;
  const cat = document.getElementById('ex-cat').value;
  const amount = parseAmount('ex-amount');
  const note = document.getElementById('ex-note').value.trim();
  if (!date) { uiAlert('Add meg a dátumot!'); return; }
  if (!amount) { uiAlert('Add meg az összeget!'); return; }
  state.bizExpense.push({ id: uid(), date, cat, amount, note });
  save();
  document.getElementById('ex-amount').value = '';
  document.getElementById('ex-note').value = '';
  closeModal('expense-modal');
  const sel = document.getElementById('ex-month');
  if (sel) sel.dataset.want = date.slice(0, 7);
  renderAll();
}

function deleteExpense(id) {
  state.bizExpense = state.bizExpense.filter(e => e.id !== id);
  save(); renderAll();
}

function buildExpenseMonthOptions() {
  const sel = document.getElementById('ex-month');
  if (!sel) return now().slice(0, 7);
  const months = new Set(state.bizExpense.map(e => (e.date || '').slice(0, 7)).filter(Boolean));
  months.add(now().slice(0, 7));
  const list = [...months].sort().reverse();
  const want = sel.dataset.want || sel.value || now().slice(0, 7);
  delete sel.dataset.want;
  sel.innerHTML = list.map(m => `<option value="${m}">${fmtMonth(m)}</option>`).join('');
  sel.value = list.includes(want) ? want : list[0];
  return sel.value;
}

function renderExpenses() {
  const tbody = document.getElementById('expense-tbody');
  if (!tbody) return;

  const month = buildExpenseMonthOptions();
  const inMonth = state.bizExpense.filter(e => (e.date || '').startsWith(month));
  const sumMonth = inMonth.reduce((s, e) => s + e.amount, 0);

  const year = now().slice(0, 4);
  const yearRows = state.bizExpense.filter(e => (e.date || '').startsWith(year));
  const sumYear = yearRows.reduce((s, e) => s + e.amount, 0);
  const activeMonths = new Set(yearRows.map(e => (e.date || '').slice(0, 7))).size;

  const byCat = {};
  inMonth.forEach(e => { byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  document.getElementById('ex-sum-month').textContent = fmt(sumMonth);
  document.getElementById('ex-sum-month-sub').textContent = inMonth.length + ' ' + L('tétel','items') + ' — ' + fmtMonth(month);
  document.getElementById('ex-avg-month').textContent = fmt(activeMonths ? sumYear / activeMonths : 0);
  document.getElementById('ex-top-cat').textContent = cats.length ? cats[0][0] : '—';
  document.getElementById('ex-top-cat-sub').textContent = cats.length ? fmt(cats[0][1]) : '—';
  document.getElementById('ex-sum-year').textContent = fmt(sumYear);
  document.getElementById('ex-sum-year-sub').textContent = yearRows.length + ' ' + L('tétel','items');

  const catBox = document.getElementById('expense-cats');
  if (catBox) {
    catBox.innerHTML = cats.length === 0
      ? '<div style="color:var(--muted);font-size:12px">Ebben a hónapban még nincs költség.</div>'
      : cats.map(([cat, sum], i) => {
          const pct = sumMonth ? (sum / sumMonth * 100) : 0;
          const color = EXPENSE_CAT_COLORS[i % EXPENSE_CAT_COLORS.length];
          return `
          <div class="progress-wrap">
            <div class="progress-label"><span>${cat}</span><span>${fmt(sum)} · ${pct.toFixed(0)}%</span></div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
          </div>`;
        }).join('');
  }

  const rows = [...inMonth].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  tbody.innerHTML = rows.length === 0
    ? '<tr><td colspan="5" style="color:var(--muted)">Ebben a hónapban még nincs rögzített költség.</td></tr>'
    : rows.map(e => `<tr>
        <td>${e.date}</td>
        <td><span class="badge ${EXPENSE_CAT_BADGE[e.cat] || 'badge-gray'}">${e.cat}</span></td>
        <td style="color:var(--muted)">${e.note ? escHtml(e.note) : ''}</td>
        <td style="font-weight:600">${fmt(e.amount)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteExpense('${e.id}')">Törlés</button></td>
      </tr>`).join('');
}

const ORDER_STATUS = {

  folyamatban: { label: 'Fejlesztés alatt', badge: 'badge-yellow', active: true  },
  teszt:       { label: 'Teszt verzió',     badge: 'badge-cyan',   active: true  },
  eles:        { label: 'Élesben',          badge: 'badge-green',  active: false },
  atadva:      { label: 'Átadva',           badge: 'badge-purple', active: true  },
  kifizetve:   { label: 'Kifizetve',        badge: 'badge-green',  active: false },
  torolve:     { label: 'Törölve',          badge: 'badge-red',    active: false },
};

function syncOrderIncome(o) {
  const idx = state.bizIncome.findIndex(r => r.orderId === o.id);
  if (o.status === 'kifizetve') {
    if (idx === -1) {
      state.bizIncome.push({
        id: uid(), orderId: o.id,
        date: o.paidDate || now(),
        source: o.name, cat: 'Weboldal projekt',
        amount: orderPriceHuf(o), taxPct: state.bizTaxRate || 0, note: o.type || ''
      });
    } else {
      const r = state.bizIncome[idx];
      r.date = o.paidDate || r.date;
      r.source = o.name;
      r.amount = orderPriceHuf(o);
      if (r.taxPct == null) r.taxPct = state.bizTaxRate || 0;
    }
  } else if (idx !== -1) {
    state.bizIncome.splice(idx, 1);
  }
}

function reconcileOrderIncomes() {
  if (!state.orders || !state.bizIncome) return;
  state.orders.forEach(syncOrderIncome);
  state.bizIncome = state.bizIncome.filter(r =>
    !r.orderId || state.orders.some(o => o.id === r.orderId && o.status === 'kifizetve'));
}

function selectOrderClientType(type) {
  const ct = document.getElementById('or-client-type');
  if (!ct) return;
  ct.value = type;
  const pb = document.getElementById('or-ct-private');
  const bb = document.getElementById('or-ct-business');
  if (!pb || !bb) return;
  if (type === 'Vállalkozó') {
    bb.style.background = 'var(--primary)'; bb.style.color = '#fff'; bb.className = 'btn';
    pb.style.background = ''; pb.style.color = ''; pb.className = 'btn btn-secondary';
  } else {
    pb.style.background = 'var(--primary)'; pb.style.color = '#fff'; pb.className = 'btn';
    bb.style.background = ''; bb.style.color = ''; bb.className = 'btn btn-secondary';
  }
}

function addOrder() {
  const lastname   = document.getElementById('or-lastname').value.trim();
  const firstname  = document.getElementById('or-firstname').value.trim();
  const email      = document.getElementById('or-email').value.trim();
  const phone      = document.getElementById('or-phone').value.trim();
  const clientType = document.getElementById('or-client-type').value;
  const type       = document.getElementById('or-type').value;
  const topic      = document.getElementById('or-topic').value.trim();
  const price      = parseAmount('or-price');
  const budget     = document.getElementById('or-budget').value;
  const date       = document.getElementById('or-date').value;
  const deadline   = document.getElementById('or-deadline').value;
  const status     = document.getElementById('or-status').value;
  const note       = document.getElementById('or-note').value.trim();

  if (!lastname && !firstname) { uiAlert('Add meg az ügyfél nevét!'); return; }

  const fullName = [lastname, firstname].filter(Boolean).join(' ');
  const name = fullName;

  const noteParts = [
    clientType,
    email,
    phone ? '📞 ' + phone : '',
    budget && budget !== 'Nem megadott' ? '💰 ' + budget : '',
    note
  ].filter(Boolean).join(' · ');

  const o = {
    id: uid(), num: nextOrderNum(date), name, type, price, date, deadline, status,
    note: noteParts,
    lastname, firstname, email, phone, clientType, topic, budget,
    currency: 'HUF', fxRate: 0,
    paidDate: ''
  };
  if (status === 'kifizetve') o.paidDate = now();
  state.orders.push(o);
  syncOrderIncome(o);
  save();

  ['or-lastname','or-firstname','or-email','or-phone','or-topic','or-note'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('or-price').value = '';
  document.getElementById('or-deadline').value = '';
  document.getElementById('or-budget').value = '';
  document.getElementById('or-client-type').value = 'Magánszemély';
  selectOrderClientType('Magánszemély');
  closeModal('order-modal');
  renderAll();
}

function setOrderStatus(id, status) {
  const o = state.orders.find(x => x.id === id);
  if (!o) return;
  o.status = status;
  if (status === 'kifizetve' && !o.paidDate) o.paidDate = now();
  if (status !== 'kifizetve') o.paidDate = '';
  syncOrderIncome(o);
  save(); renderAll();
}

async function deleteOrder(id) {
  if (!await uiConfirm('Biztosan törlöd ezt a megrendelést? A hozzá könyvelt bevétel-tétel is törlődik.', { title: 'Megerősítés' })) return;
  state.orders = state.orders.filter(o => o.id !== id);
  state.bizIncome = state.bizIncome.filter(r => r.orderId !== id);
  save(); renderAll();
}

function renderOrders() {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  const today = now();
  const year = today.slice(0, 4);

  const leadsCount = Object.values(state.leads || {}).filter(l => l.status !== 'atirva').length;

  const inProgress = state.orders.filter(o => o.status === 'folyamatban' || o.status === 'teszt');

  const allThisYear = state.orders.filter(o => (o.date || '').startsWith(year));

  const withDeadline = state.orders
    .filter(o => o.deadline && o.status !== 'torolve' && o.status !== 'eles')
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  const _oac = document.getElementById('or-active-count'); if (_oac) _oac.textContent = leadsCount + ' ' + L('db','pcs');
  document.getElementById('or-active-value').textContent = inProgress.length + ' ' + L('db','pcs');
  document.getElementById('or-paid-year').textContent = allThisYear.length + ' ' + L('db','pcs');
  document.getElementById('or-paid-year-sub').textContent = allThisYear.length + ' projekt';

  const nd = document.getElementById('or-next-deadline');
  const nds = document.getElementById('or-next-deadline-sub');
  if (withDeadline.length) {
    const o = withDeadline[0];
    const late = o.deadline < today;
    nd.textContent = o.deadline;
    nd.style.color = late ? 'var(--red)' : '';
    nds.textContent = (late ? 'Lejárt! — ' : '') + o.name;
  } else {
    nd.textContent = '—'; nd.style.color = ''; nds.textContent = 'Nincs aktív határidő';
  }

  const STATUS_CLASS = { folyamatban:'s-yellow', teszt:'s-cyan', eles:'s-green', torolve:'s-red', atadva:'s-purple', kifizetve:'s-green' };
  const ORDER_STATUS_KEYS = ['folyamatban','teszt','eles','torolve'];
  const statusSelect = o => {
    const cls = STATUS_CLASS[o.status] || 's-gray';
    return `<select class="status-select ${cls}" onchange="setOrderStatus('${o.id}', this.value);this.className='status-select ${STATUS_CLASS[this.value]||'s-gray'}'">` +
      ORDER_STATUS_KEYS.map(k => {
        const v = ORDER_STATUS[k] || { label: k };
        return `<option value="${k}"${k === o.status ? ' selected' : ''}>${v.label}</option>`;
      }).join('') +
      '</select>';
  };

  const rows = [...state.orders].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  tbody.innerHTML = rows.length === 0
    ? '<tr><td colspan="7" style="color:var(--muted)">Még nincs projekt. A megkereséseket a „Megrendelések" fülről alakítsd projektté.</td></tr>'
    : rows.map(o => {
        const st = ORDER_STATUS[o.status] || { label: o.status, badge: 'badge-gray', active: false };
        const late = st.active && o.deadline && o.deadline < today;
        const isTorolve = o.status === 'torolve';
        const isLocked = o.status === 'eles' || o.status === 'torolve';
        return `<tr style="${isTorolve ? 'opacity:0.45' : ''}">
          <td style="font-family:var(--mono);font-size:11.5px;color:var(--muted);white-space:nowrap">${escHtml(o.num || '—')}</td>
          <td style="font-weight:600">${escHtml(o.name)}${o.topic ? `<div style="color:var(--muted);font-size:11.5px;font-weight:500">${escHtml(o.topic)}</div>` : ''}${o.note ? `<div style="color:var(--muted);font-size:11px;font-weight:400">${escHtml(o.note)}</div>` : ''}</td>
          <td>${o.type}</td>
          <td style="font-weight:600">${isTorolve ? '<span style="color:var(--muted)">' + fmt(orderPriceHuf(o)) + '</span>' : fmt(orderPriceHuf(o))}</td>
          <td style="white-space:nowrap">${o.date || '—'}</td>
          <td style="white-space:nowrap${late ? ';color:var(--red);font-weight:600' : ''}">${o.deadline || '—'}${late ? ' — lejárt' : ''}</td>
          <td>${isLocked ? `<span class="badge ${st.badge}">${st.label}</span>` : statusSelect(o)}</td>
        </tr>`;
      }).join('');
}

function renderBizDash() {
  const revEl = document.getElementById('bd-rev');
  if (!revEl) return;

  const today = now();
  const year = today.slice(0, 4);
  const thisMonth = today.slice(0, 7);

  const yearRev = state.bizIncome.filter(r => (r.date || '').startsWith(year));
  let grossRev = 0, taxRev = 0, netRev = 0;
  yearRev.forEach(r => { const c = revenueCalc(r); grossRev += c.gross; taxRev += c.tax; netRev += c.net; });

  const yearExp = state.bizExpense.filter(e => (e.date || '').startsWith(year));
  const expSum = yearExp.reduce((s, e) => s + e.amount, 0);
  const balance = grossRev - expSum;

  const inProgress = state.orders.filter(o => o.status === 'folyamatban' || o.status === 'teszt');

  revEl.textContent = fmt(grossRev);
  document.getElementById('bd-rev-sub').textContent = yearRev.length + ' ' + L('tétel','items');
  document.getElementById('bd-exp').textContent = fmt(expSum);
  document.getElementById('bd-exp-sub').textContent = yearExp.length + ' ' + L('tétel','items');
  const balEl = document.getElementById('bd-balance');
  balEl.textContent = (balance < 0 ? '−' : '') + fmt(Math.abs(balance));
  balEl.style.color = balance < 0 ? 'var(--red)' : 'var(--accent)';
  document.getElementById('bd-orders').textContent = inProgress.length + ' ' + L('db','pcs');
  document.getElementById('bd-orders-sub').textContent = 'fejlesztés + teszt';

  const yearProjects   = state.orders.filter(o => (o.date || '').startsWith(year)).length;
  const leadsActive    = Object.values(state.leads || {}).filter(l => l.status !== 'atirva').length;
  const deadlineUpcoming = state.orders.filter(o =>
    o.deadline && o.status !== 'torolve' && o.status !== 'eles' && o.deadline >= today).length;
  const _set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  _set('bd-year-projects', yearProjects + ' ' + L('db','pcs'));
  _set('bd-deadline-count', deadlineUpcoming + ' ' + L('db','pcs'));
  _set('bd-leads-count', leadsActive + ' ' + L('db','pcs'));

  const months = [];
  const d = new Date(today + 'T00:00:00');
  for (let i = 5; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    months.push(m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0'));
  }

  const monthData = months.map(m => {
    let inc = 0, exp = 0;
    state.bizIncome.forEach(r => { if ((r.date || '').slice(0, 7) === m) inc += r.amount || 0; });
    state.bizExpense.forEach(e => { if ((e.date || '').slice(0, 7) === m) exp += e.amount; });
    return { m, inc, exp };
  });

  const _cv = (name, fb) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fb;
    } catch (e) { return fb; }
  };
  const CH = {
    grid:   _cv('--surface3', '#eef2f7'),
    muted:  _cv('--muted',    '#66748a'),
    inc:    _cv('--accent',   '#178746'),
    exp:    _cv('--red',      '#d23b3b'),
    surface:_cv('--surface',  '#ffffff'),
    text:   _cv('--text',     '#1b2535'),
    amber:  _cv('--accent3',  '#b45309'),
    teal:   _cv('--accent2',  '#0e7490'),
    uiFont: _cv('--ui',       'Inter, sans-serif').replace(/["']/g, '')
  };

  const barCanvas = document.getElementById('bd-bar-chart');
  if (barCanvas) {
    const ctx = barCanvas.getContext('2d');
    const W = barCanvas.parentElement.clientWidth - 40 || 500;
    barCanvas.width = W;
    barCanvas.height = 180;
    ctx.clearRect(0, 0, W, 180);

    const maxVal = Math.max(...monthData.flatMap(d => [d.inc, d.exp]), 1);
    const padL = 60, padR = 16, padT = 16, padB = 40;
    const chartW = W - padL - padR;
    const chartH = 180 - padT - padB;
    const barW = chartW / months.length / 3;
    const gap  = chartW / months.length;

    ctx.strokeStyle = CH.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + chartH - (chartH * i / 4);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      ctx.fillStyle = CH.muted;
      ctx.font = '10px ' + CH.uiFont;
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * i / 4 / 1000) + 'k', padL - 6, y + 3);
    }

    monthData.forEach(({ m, inc, exp }, i) => {
      const x = padL + i * gap + gap / 2;
      const incH = inc ? (inc / maxVal) * chartH : 0;
      const expH = exp ? (exp / maxVal) * chartH : 0;

      ctx.fillStyle = CH.inc;
      ctx.beginPath();
      ctx.roundRect(x - barW - 2, padT + chartH - incH, barW, incH, [3,3,0,0]);
      ctx.fill();

      ctx.fillStyle = CH.exp;
      ctx.beginPath();
      ctx.roundRect(x + 2, padT + chartH - expH, barW, expH, [3,3,0,0]);
      ctx.fill();

      ctx.fillStyle = CH.muted;
      ctx.font = '10px ' + CH.uiFont;
      ctx.textAlign = 'center';
      let label = locDate(new Date(m + '-01T00:00:00'), { month: 'long' });
      if (gap < 52) label = label.slice(0, 3);
      ctx.fillText(label, x, padT + chartH + 16);
    });

    ctx.fillStyle = CH.inc;
    ctx.fillRect(padL, 180 - 12, 10, 10);
    ctx.fillStyle = CH.muted;
    ctx.font = '10px ' + CH.uiFont;
    ctx.textAlign = 'left';
    ctx.fillText('Bevétel', padL + 14, 180 - 4);
    ctx.fillStyle = CH.exp;
    ctx.fillRect(padL + 70, 180 - 12, 10, 10);
    ctx.fillStyle = CH.muted;
    ctx.fillText('Kiadás', padL + 84, 180 - 4);
  }

  const donutCanvas = document.getElementById('bd-donut-chart');
  if (donutCanvas) {
    const STATUS_COLORS = { folyamatban: CH.amber, teszt: CH.teal, eles: CH.inc, torolve: CH.exp };
    const STATUS_LABELS = { folyamatban:'Fejlesztés alatt', teszt:'Teszt verzió', eles:'Élesben', torolve:'Törölve' };
    const counts = {};
    (state.orders || []).forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    const segments = Object.entries(counts).map(([k, v]) => ({
      label: STATUS_LABELS[k] || k, value: v, color: STATUS_COLORS[k] || CH.muted
    })).filter(s => s.value > 0);

    const ctx = donutCanvas.getContext('2d');
    ctx.clearRect(0, 0, 160, 160);
    const total = segments.reduce((s, x) => s + x.value, 0);

    if (total === 0) {
      ctx.fillStyle = CH.grid;
      ctx.beginPath(); ctx.arc(80, 80, 60, 0, Math.PI * 2); ctx.fill();
    } else {
      let angle = -Math.PI / 2;
      segments.forEach(s => {
        const slice = (s.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(80, 80);
        ctx.arc(80, 80, 65, angle, angle + slice);
        ctx.closePath();
        ctx.fillStyle = s.color;
        ctx.fill();
        angle += slice;
      });

      ctx.beginPath();
      ctx.arc(80, 80, 38, 0, Math.PI * 2);
      ctx.fillStyle = CH.surface;
      ctx.fill();

      ctx.fillStyle = CH.text;
      ctx.font = 'bold 18px ' + CH.uiFont;
      ctx.textAlign = 'center';
      ctx.fillText(total, 80, 84);
      ctx.fillStyle = CH.muted;
      ctx.font = '10px ' + CH.uiFont;
      ctx.fillText('projekt', 80, 97);
    }

    const legend = document.getElementById('bd-donut-legend');
    if (legend) {
      legend.innerHTML = segments.map(s => `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:12px">
          <div style="width:10px;height:10px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
          <span style="color:var(--muted)">${s.label}</span>
          <span style="margin-left:auto;font-weight:700">${s.value} db</span>
        </div>`).join('') || '<div style="color:var(--muted);font-size:12px">Még nincs projekt.</div>';
    }
  }

  const cfBody = document.getElementById('bd-cashflow');
  let anyData = false;
  cfBody.innerHTML = monthData.map(({ m, inc, exp }) => {
    if (inc || exp) anyData = true;
    const bal = inc - exp;
    return `<tr>
      <td>${fmtMonth(m)}</td>
      <td style="text-align:right" class="green">${inc ? fmt(inc) : '—'}</td>
      <td style="text-align:right" class="red">${exp ? '−' + fmt(exp) : '—'}</td>
      <td style="text-align:right;font-weight:600;color:${bal < 0 ? 'var(--red)' : 'var(--accent)'}">${(bal < 0 ? '−' : '') + fmt(Math.abs(bal))}</td>
    </tr>`;
  }).join('');
  if (!anyData) cfBody.innerHTML = '<tr><td colspan="4" style="color:var(--muted)">Még nincs rögzített forgalom.</td></tr>';

  const catBox = document.getElementById('bd-cats');
  const inMonth = state.bizExpense.filter(e => (e.date || '').startsWith(thisMonth));
  const sumMonth = inMonth.reduce((s, e) => s + e.amount, 0);
  const byCat = {};
  inMonth.forEach(e => { byCat[e.cat] = (byCat[e.cat] || 0) + e.amount; });
  const cats = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  catBox.innerHTML = cats.length === 0
    ? '<div style="color:var(--muted);font-size:12px">Ebben a hónapban még nincs költség.</div>'
    : cats.map(([cat, sum], i) => {
        const pct = sumMonth ? (sum / sumMonth * 100) : 0;
        const color = EXPENSE_CAT_COLORS[i % EXPENSE_CAT_COLORS.length];
        return `
        <div class="progress-wrap">
          <div class="progress-label"><span>${cat}</span><span>${fmt(sum)} · ${pct.toFixed(0)}%</span></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
        </div>`;
      }).join('');

  const dlBox = document.getElementById('bd-deadlines');
  const withDl = (state.orders || [])
    .filter(o => o.deadline && o.status !== 'torolve' && o.status !== 'eles')
    .sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
  dlBox.innerHTML = withDl.length === 0
    ? '<div style="color:var(--muted);font-size:12px">Nincs közelgő határidő.</div>'
    : withDl.map(o => {
        const st = ORDER_STATUS[o.status] || { label: o.status, badge: 'badge-gray' };
        const late = o.deadline < today;
        return `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--surface3)">
          <div style="min-width:0">
            <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(o.name)}</div>
            <span class="badge ${st.badge}">${st.label}</span>
          </div>
          <div style="text-align:right;white-space:nowrap;flex-shrink:0;font-variant-numeric:tabular-nums;${late ? 'color:var(--red);font-weight:700' : 'color:var(--muted)'}">${o.deadline}${late ? '<div style="font-size:10px">lejárt</div>' : ''}</div>
        </div>`;
      }).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

if (!state.invoices) state.invoices = [];

function reconcileInvoiceIncomes() {
  if (!state.invoices || !state.bizIncome) return;
  state.invoices.filter(inv => inv.paid).forEach(inv => {
    const exists = state.bizIncome.some(r => r.invoiceId === inv.id);
    if (!exists) {
      const total = (inv.items || []).reduce((s, it) => s + (it.qty || 1) * (it.unitPrice || 0), 0);
      state.bizIncome.push({
        id: uid(), invoiceId: inv.id, orderId: inv.orderId || '',
        date: inv.paidDate || now(), source: inv.buyerName,
        cat: 'Weboldal projekt', amount: invTotalHuf(inv),
        taxPct: state.bizTaxRate || 0, note: inv.invoiceNum
      });
    }
  });

  state.bizIncome = state.bizIncome.filter(r =>
    !r.invoiceId || state.invoices.some(inv => inv.id === r.invoiceId)
  );
}

function invTotal(inv) {
  return (inv.items || []).reduce((s, it) => s + (it.qty || 1) * (it.unitPrice || 0), 0);
}

function invTotalHuf(inv) {
  const net = invTotal(inv);
  return (inv && inv.currency === 'EUR') ? Math.round(net * (Number(inv.fxRate) || eurHufRate())) : net;
}

function invNextNum() {
  const y = new Date().getFullYear();
  const nums = (state.invoices || [])
    .map(i => i.invoiceNum || '')
    .filter(n => n.startsWith(y + '-'))
    .map(n => parseInt(n.slice(5)) || 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return y + '-' + String(next).padStart(3, '0');
}

function invOpen(orderId) {
  const o = state.orders.find(x => x.id === orderId);
  if (!o) return;
  const sv = (id, val) => { const el = document.getElementById(id); if (el) el.value = (val == null ? '' : val); };
  sv('inv-order-id',    orderId);
  sv('inv-num',         nextInvoiceNumForOrder(o));
  sv('inv-issue-date',  now());
  const due = new Date(); due.setDate(due.getDate() + 8);
  sv('inv-due-date', due.toISOString().slice(0, 10));
  const buyer = [o.lastname, o.firstname].filter(Boolean).join(' ') || o.name || '';
  sv('inv-buyer-name',    buyer);
  sv('inv-buyer-address', '');
  sv('inv-buyer-tax',     '');
  sv('inv-item-desc',  (o.type || '') + (o.topic ? ' — ' + o.topic : ''));
  sv('inv-item-qty',   '1');
  sv('inv-item-unit',  'db');
  sv('inv-item-price', o.price || 0);
  const si = state.sellerInfo || {};
  sv('inv-seller-name',    si.name    || '');
  sv('inv-seller-address', si.address || '');
  sv('inv-seller-tax',     si.tax     || '');
  sv('inv-note', '');
  invUpdatePreview();
  openModal('invoice-modal');
}

function invUpdatePreview() {
  const qty   = parseFloat(document.getElementById('inv-item-qty')?.value) || 0;
  const price = parseFloat((document.getElementById('inv-item-price')?.value || '').replace(/\s/g, '')) || 0;
  const el = document.getElementById('inv-preview-total');
  if (el) el.textContent = qty && price ? L('Végösszeg','Total') + ': ' + Math.round(qty * price).toLocaleString('hu-HU') + ' Ft' : '';
}

function invSave() {
  const gv = id => (document.getElementById(id)?.value || '').trim();
  const orderId    = gv('inv-order-id');
  const invoiceNum = gv('inv-num');
  const issueDate  = gv('inv-issue-date');
  const dueDate    = gv('inv-due-date');
  const sellerName = gv('inv-seller-name');
  const sellerAddr = gv('inv-seller-address');
  const sellerTax  = gv('inv-seller-tax');
  const buyerName  = gv('inv-buyer-name');
  const buyerAddr  = gv('inv-buyer-address');
  const buyerTax   = gv('inv-buyer-tax');
  const itemDesc   = gv('inv-item-desc');
  const itemUnit   = gv('inv-item-unit') || 'db';
  const itemQty    = parseFloat(document.getElementById('inv-item-qty')?.value) || 1;
  const itemPrice  = parseFloat((document.getElementById('inv-item-price')?.value || '').replace(/\s/g, '')) || 0;
  const note       = gv('inv-note');
  if (!invoiceNum) { uiAlert('Add meg a számlaszámot!'); return; }
  if (!issueDate)  { uiAlert('Add meg a kiállítás dátumát!'); return; }
  if (!sellerName) { uiAlert('Add meg a kiállító nevét!'); return; }
  if (!buyerName)  { uiAlert('Add meg a vevő nevét!'); return; }
  const prevSeller = state.sellerInfo || {};
  state.sellerInfo = {
    name: sellerName, address: sellerAddr, tax: sellerTax,
    reg:   prevSeller.reg   || '',
    bank:  prevSeller.bank  || '',
    email: prevSeller.email || '',
    phone: prevSeller.phone || '',
    vatRegistered: !!prevSeller.vatRegistered,
    vatRate: prevSeller.vatRate == null ? 27 : prevSeller.vatRate
  };
  const linkedOrder = (state.orders || []).find(x => x.id === orderId);
  const invCurrency = (linkedOrder && linkedOrder.currency === 'EUR') ? 'EUR' : 'HUF';
  const invFxRate   = invCurrency === 'EUR' ? (Number(linkedOrder && linkedOrder.fxRate) || eurHufRate()) : 0;
  const inv = {
    id: uid(), orderId, invoiceNum, issueDate, dueDate,
    sellerName, sellerAddress: sellerAddr, sellerTax,
    sellerReg: state.sellerInfo.reg, sellerBank: state.sellerInfo.bank,
    sellerEmail: state.sellerInfo.email, sellerPhone: state.sellerInfo.phone,
    buyerName, buyerAddress: buyerAddr, buyerTax,
    items: [{ desc: itemDesc, qty: itemQty, unit: itemUnit, unitPrice: itemPrice }],
    currency: invCurrency, fxRate: invFxRate,
    vatRegistered: state.sellerInfo.vatRegistered,
    vatRate: state.sellerInfo.vatRate,
    note, paid: false, paidDate: ''
  };
  if (!state.invoices) state.invoices = [];
  state.invoices.push(inv);
  save();
  closeModal('invoice-modal');
  renderInvoices();
}

function invMarkPaid(id) {
  const inv = (state.invoices || []).find(x => x.id === id);
  if (!inv || inv.paid) return;
  inv.paid = true;
  inv.paidDate = now();

  const total = invTotal(inv);
  if (!state.bizIncome) state.bizIncome = [];
  state.bizIncome.push({
    id: uid(), invoiceId: inv.id, orderId: inv.orderId || '',
    date: inv.paidDate, source: inv.buyerName,
    cat: 'Weboldal projekt', amount: invTotalHuf(inv),
    taxPct: state.bizTaxRate || 0, note: inv.invoiceNum
  });
  save(); renderAll();
}

async function invDelete(id) {
  if (!await uiConfirm('Biztosan törlöd ezt a számlát?', { title: 'Megerősítés' })) return;
  state.invoices = (state.invoices || []).filter(x => x.id !== id);
  save(); renderInvoices();
}

function renderInvoices() {
  if (!state.invoices) state.invoices = [];
  const allInv     = state.invoices;
  const paidInv    = allInv.filter(i => i.paid);
  const unpaidInv  = allInv.filter(i => !i.paid && (!i.dueDate || i.dueDate >= now()));
  const overdueInv = allInv.filter(i => !i.paid && i.dueDate && i.dueDate < now());
  const sumOf = arr => arr.reduce((s, i) => s + invTotal(i), 0);
  const se = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  se('inv-total-count',   allInv.length + ' ' + L('db','pcs'));
  se('inv-total-sum',     fmt(sumOf(allInv)));
  se('inv-paid-count',    paidInv.length + ' ' + L('db','pcs'));
  se('inv-paid-sum',      fmt(sumOf(paidInv)));
  se('inv-unpaid-count',  unpaidInv.length + ' ' + L('db','pcs'));
  se('inv-unpaid-sum',    fmt(sumOf(unpaidInv)) + ' ' + L('kintlévőség','outstanding'));
  se('inv-overdue-count', overdueInv.length + ' ' + L('db','pcs'));
  se('inv-overdue-sum',   fmt(sumOf(overdueInv)));

  const panel = document.getElementById('inv-projects-list');
  if (panel) {
    const elesOrders = (state.orders || []).filter(o => o.status === 'eles' && !allInv.some(i => i.orderId === o.id));
    if (!elesOrders.length) {
      panel.innerHTML = '<div style="color:var(--muted);font-size:12.5px">Nincs élesben lévő projekt.</div>';
    } else {
      panel.innerHTML = elesOrders.map(o => {
        const invCount = allInv.filter(i => i.orderId === o.id).length;
        return `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--surface3)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(o.name)}</div>
            <div style="font-size:11px;color:var(--muted)">${fmt(orderPriceHuf(o))}${invCount ? ' · <span style="color:var(--accent)">' + invCount + ' számla</span>' : ''}</div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="invOpen('${o.id}')">+ Számla</button>
        </div>`;
      }).join('');
    }
  }

  const unpaidTbody = document.getElementById('invoices-unpaid-tbody');
  const paidTbody   = document.getElementById('invoices-paid-tbody');
  if (!unpaidTbody || !paidTbody) return;

  const sorted = [...allInv].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));

  const renderRow = inv => {
    const order   = (state.orders || []).find(o => o.id === inv.orderId);
    const total   = invTotal(inv);
    const overdue = !inv.paid && inv.dueDate && inv.dueDate < now();
    const statusBadge = inv.paid
      ? `<span class="badge badge-green">Fizetve</span><div style="font-size:10px;color:var(--muted)">${inv.paidDate}</div>`
      : overdue
        ? `<span class="badge badge-red">Lejárt</span><div style="font-size:10px;color:var(--muted)">hat: ${inv.dueDate}</div>`
        : `<span class="badge badge-yellow">Függőben</span><div style="font-size:10px;color:var(--muted)">hat: ${inv.dueDate || '—'}</div>`;
    return `<tr>
      <td style="font-family:var(--mono);font-size:12px;font-weight:600">${escHtml(inv.invoiceNum)}</td>
      <td>${inv.issueDate || '—'}</td>
      <td style="font-weight:600">${escHtml(inv.buyerName)}</td>
      <td style="color:var(--muted);font-size:11.5px">${order ? escHtml(order.name) : '—'}</td>
      <td style="font-weight:700">${fmt(total)}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-secondary btn-sm" onclick="invDownloadPDF('${inv.id}')">📄 PDF</button>
          ${!inv.paid ? `<button class="btn btn-sm" style="background:var(--accent);border-color:var(--accent);color:#fff" onclick="invMarkPaid('${inv.id}')">✓ Fizetve</button>` : ''}
        </div>
      </td>
    </tr>`;
  };

  const unpaid = sorted.filter(i => !i.paid);
  const paid   = sorted.filter(i => i.paid);

  unpaidTbody.innerHTML = unpaid.length
    ? unpaid.map(renderRow).join('')
    : '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:24px">Nincs függőben lévő számla.</td></tr>';

  paidTbody.innerHTML = paid.length
    ? paid.map(renderRow).join('')
    : '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:24px">Még nincs kifizetett számla.</td></tr>';
}

function invDownloadPDF(id) {
  const inv = (state.invoices || []).find(x => x.id === id);
  if (!inv) return;
  const net    = invTotal(inv);
  const vatReg = !!inv.vatRegistered;
  const vatRate= Number(inv.vatRate) || 27;
  const vat    = vatReg ? Math.round(net * vatRate / 100) : 0;
  const gross  = net + vat;
  const cur    = inv.currency === 'EUR' ? 'EUR' : 'HUF';
  const fx     = Number(inv.fxRate) || eurHufRate();
  const fmtM   = n => cur === 'EUR' ? '€' + Math.round(n).toLocaleString('hu-HU') : Math.round(n).toLocaleString('hu-HU') + ' Ft';
  const esc    = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const itemRows = (inv.items || []).map(it => `
    <tr>
      <td>${esc(it.desc)}</td>
      <td style="text-align:center">${it.qty} ${esc(it.unit)}</td>
      <td style="text-align:right">${fmtM(it.unitPrice)}</td>
      <td style="text-align:right;font-weight:600">${fmtM(it.qty * it.unitPrice)}</td>
    </tr>`).join('');

  const eurNote = (cur === 'EUR')
    ? `<div class="aam" style="font-style:normal;color:#4b463c">Átváltás tájékoztató jelleggel — 1 € = ${Math.round(fx).toLocaleString('hu-HU')} Ft · Fizetendő HUF-ban: <strong>${Math.round(gross * fx).toLocaleString('hu-HU')} Ft</strong></div>`
    : '';

  const totalsHtml = (vatReg
    ? `<div class="trow"><span>Nettó összesen</span><span>${fmtM(net)}</span></div>
       <div class="trow sep"><span>ÁFA (${vatRate}%)</span><span>${fmtM(vat)}</span></div>
       <div class="tfinal"><span class="lbl">Fizetendő (bruttó)</span><span class="amt">${fmtM(gross)}</span></div>`
    : `<div class="tfinal"><span class="lbl">Fizetendő</span><span class="amt">${fmtM(net)}</span></div>
       <div class="aam">Alanyi adómentes (AAM) — a számla áfát nem tartalmaz.</div>`) + eurNote;

  const html = `<!DOCTYPE html>
<html lang="hu"><head><meta charset="UTF-8"><title>Számla ${esc(inv.invoiceNum)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;font-size:13px;color:#211d16;background:#fbf9f4;padding:48px 40px}
  .sheet{max-width:820px;margin:0 auto;background:#fffdf8;border:1px solid #e6dfd0;padding:44px 46px}
  .top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:38px}
  .brand{display:flex;align-items:center;gap:11px}
  .brand .tile{width:34px;height:34px;flex:0 0 34px}
  .logo{font-family:'Fraunces',serif;font-size:22px;font-weight:600;color:#211d16}.logo span{color:#b23a2e}
  .inv-meta{text-align:right}
  .inv-meta h1{font-family:'Fraunces',serif;font-size:34px;font-weight:600;letter-spacing:-0.5px;color:#211d16}
  .inv-meta .num{font-size:12.5px;color:#7c7365;font-weight:500;margin-top:2px;letter-spacing:.3px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-bottom:30px}
  .party{border-top:2px solid #211d16;padding-top:12px}
  .plabel{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:#7c7365;margin-bottom:8px}
  .pname{font-size:15px;font-weight:600;margin-bottom:3px}
  .pinfo{font-size:12px;color:#7c7365;line-height:1.65}
  .dates{display:flex;gap:32px;flex-wrap:wrap;padding:14px 0;border-top:1px solid #e6dfd0;border-bottom:1px solid #e6dfd0;margin-bottom:26px}
  .dlabel{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7c7365;margin-bottom:3px}
  .dval{font-size:13.5px;font-weight:600}
  table{width:100%;border-collapse:collapse;margin-bottom:6px}
  thead th{border-bottom:2px solid #211d16;padding:9px 10px;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#7c7365;text-align:left}
  tbody td{padding:12px 10px;border-bottom:1px solid #ece5d6;font-size:13px}
  .totals{display:flex;justify-content:flex-end;margin-top:24px}
  .totals .box{min-width:320px}
  .trow{display:flex;justify-content:space-between;padding:7px 2px;font-size:13px;color:#3a352c}
  .trow.sep{border-top:1px solid #e6dfd0}
  .tfinal{display:flex;justify-content:space-between;align-items:center;margin-top:10px;background:#b23a2e;color:#fff;padding:14px 18px}
  .tfinal .lbl{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;opacity:.92}
  .tfinal .amt{font-family:'Fraunces',serif;font-size:26px;font-weight:600;letter-spacing:-0.5px}
  .aam{margin-top:10px;text-align:right;font-size:11.5px;color:#7c7365;font-style:italic}
  .pay{text-align:right;margin-top:16px;font-size:12px;color:#4b463c}
  .note{border-left:3px solid #b23a2e;background:#f6efe2;padding:11px 15px;font-size:12px;color:#5a4a20;margin-top:22px}
  .footer{border-top:1px solid #e6dfd0;margin-top:30px;padding-top:14px;font-size:11px;color:#7c7365;text-align:center}
  .print-btn{margin-top:16px;background:#211d16;color:#fbf9f4;border:none;border-radius:6px;padding:10px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:'Inter',sans-serif}
  @media print{.print-btn{display:none}body{background:#fff;padding:0}.sheet{border:none;padding:22px 24px;max-width:none}}
</style></head><body>
<div class="sheet">
  <div class="top">
    <div class="brand">
      <svg class="tile" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3c4a68"/><stop offset="1" stop-color="#232e44"/></linearGradient></defs>
        <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#bg)"/>
        <rect x="16" y="20" width="32" height="6" rx="3" fill="#ffffff"/>
        <rect x="16" y="30" width="24" height="6" rx="3" fill="#ffffff" opacity="0.82"/>
        <rect x="16" y="40" width="14" height="6" rx="3" fill="#b23a2e"/>
      </svg>
      <div class="logo">Rend<span>li</span></div>
    </div>
    <div class="inv-meta"><h1>Számla</h1><div class="num">${esc(inv.invoiceNum)}</div></div>
  </div>
  <div class="parties">
    <div class="party"><div class="plabel">Kiállító (Eladó)</div><div class="pname">${esc(inv.sellerName)}</div>
      <div class="pinfo">${inv.sellerAddress ? esc(inv.sellerAddress) : ''}${inv.sellerTax ? '<br>Adószám: '+esc(inv.sellerTax) : ''}${inv.sellerReg ? '<br>Cégjegyzék-/nyilv. szám: '+esc(inv.sellerReg) : ''}${inv.sellerEmail ? '<br>'+esc(inv.sellerEmail) : ''}${inv.sellerPhone ? '<br>'+esc(inv.sellerPhone) : ''}</div></div>
    <div class="party"><div class="plabel">Vevő</div><div class="pname">${esc(inv.buyerName)}</div>
      <div class="pinfo">${inv.buyerAddress ? esc(inv.buyerAddress) : ''}${inv.buyerTax ? '<br>Adószám: '+esc(inv.buyerTax) : ''}</div></div>
  </div>
  <div class="dates">
    <div><div class="dlabel">Kiállítás dátuma</div><div class="dval">${inv.issueDate||'—'}</div></div>
    <div><div class="dlabel">Teljesítés dátuma</div><div class="dval">${inv.issueDate||'—'}</div></div>
    <div><div class="dlabel">Fizetési határidő</div><div class="dval">${inv.dueDate||'—'}</div></div>
    <div><div class="dlabel">Fizetési mód</div><div class="dval">Átutalás</div></div>
  </div>
  <table>
    <thead><tr><th style="width:50%">Megnevezés</th><th style="text-align:center">Mennyiség</th><th style="text-align:right">${vatReg ? 'Nettó egységár' : 'Egységár'}</th><th style="text-align:right">${vatReg ? 'Nettó összeg' : 'Összeg'}</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals"><div class="box">${totalsHtml}</div></div>
  ${inv.sellerBank ? `<div class="pay">Fizetés átutalással · Bankszámlaszám: <strong style="color:#211d16">${esc(inv.sellerBank)}</strong></div>` : ''}
  ${inv.note ? `<div class="note">📝 ${esc(inv.note)}</div>` : ''}
  <div class="footer">${esc(inv.invoiceNum)} · Kiállítva: ${inv.issueDate||'—'} · Rendli<br>
  <button class="print-btn" onclick="window.print()">Nyomtatás / Mentés PDF-ként</button></div>
</div>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=1160');
  if (!win) { uiAlert('A böngésző blokkolta a felugró ablakot. Engedélyezd az oldal számára.'); return; }
  win.document.write(html);
  win.document.close();
}

(function () {
  function labelTable(table) {
    const heads = table.querySelectorAll('thead th');
    if (!heads.length) return;
    const labels = Array.prototype.map.call(heads, th => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach(tr => {
      Array.prototype.forEach.call(tr.children, (td, i) => {
        if (td.hasAttribute('colspan')) {
          td.setAttribute('data-fullrow', '');
          td.removeAttribute('data-label');
          return;
        }
        const lbl = labels[i] || '';
        if (lbl) td.setAttribute('data-label', lbl);
        else td.removeAttribute('data-label');
      });
    });
  }
  function labelAll() {
    document.querySelectorAll('.scroll-table:not(.cashflow-table) table').forEach(labelTable);
  }
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;

    setTimeout(() => { scheduled = false; labelAll(); }, 0);
  }

  function observeAll() {
    const mo = new MutationObserver(schedule);
    document.querySelectorAll('.scroll-table:not(.cashflow-table) tbody')
      .forEach(tb => mo.observe(tb, { childList: true }));
    schedule();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeAll);
  } else {
    observeAll();
  }
  document.addEventListener('swm:ready', schedule);
})();
