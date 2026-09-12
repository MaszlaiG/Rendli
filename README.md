# Rendli

**Language / Nyelv:** [English](#english) · [Magyar](#magyar)

**🌐 Live / Élő oldal:** <https://maszlaig.github.io/Rendli/>
**📄 Részletes tervdokumentáció / Full design doc:** [`dokumentumok/`](dokumentumok/) (PDF, HU + EN)

---

## English

**Rendli** is an account-based **business manager** web app for freelancers and small businesses — leads, orders, projects, clients, invoices, contracts, income/expenses in one place, plus an **embeddable order form** whose submissions appear automatically. Data is stored per account in **Firebase** (Auth + Firestore). No build step, no framework: plain HTML/CSS/JS. Bilingual (HU/EN), light/dark/auto "Studio" design.

**Highlights**
- Lead → **offer** → **contract** → order workflow; offers are accepted and contracts **signed online** by the client, auto-updating the status.
- Offer e-mail with **PDF download** + one-click accept; contract e-mail with **drawn e-signature**.
- Invoices and contracts as printable **PDF**; e-mails via **EmailJS**.

**Tech:** vanilla HTML/CSS/JS · Firebase (Auth + Firestore) · EmailJS · custom canvas charts.

**Structure:** `index.html`, `ajanlat.html`, `szerzodes.html` · `css/` · `js/` · `e-mail sablonok/` · `firebase/` · `dokumentumok/`.
Setup notes: `dokumentumok/BEALLITAS-Firebase.txt`, `dokumentumok/BEALLITAS-EmailJS.txt`. Full documentation: the **tervdokumentáció PDF** in `dokumentumok/`.

---

## Magyar

A **Rendli** fiók-alapú **vállalkozáskezelő** webapp szabadúszóknak és kisvállalkozásoknak — megkeresések, megrendelések, projektek, ügyfelek, számlák, szerződések, bevétel/kiadás egy helyen, plusz egy **beágyazható megrendelő-űrlap**, amelynek leadásai automatikusan megjelennek. Az adat fiókonként a **Firebase**-ben (Auth + Firestore). Nincs build lépés, nincs keretrendszer: tiszta HTML/CSS/JS. Kétnyelvű (HU/EN), világos/sötét/auto „Stúdió" dizájn.

**Kiemelt funkciók**
- Megkeresés → **ajánlat** → **szerződés** → megrendelés folyamat; az ajánlatot elfogadják, a szerződést az ügyfél **online írja alá**, a státusz automatikusan frissül.
- Ajánlat-e-mail **PDF-letöltéssel** + egykattintásos elfogadással; szerződés-e-mail **rajzolt aláírással**.
- Számlák és szerződések nyomtatható **PDF**-ként; e-mailek **EmailJS**-en.

**Technológia:** vanilla HTML/CSS/JS · Firebase (Auth + Firestore) · EmailJS · egyedi canvas diagramok.

**Szerkezet:** `index.html`, `ajanlat.html`, `szerzodes.html` · `css/` · `js/` · `e-mail sablonok/` · `firebase/` · `dokumentumok/`.
Beállítási jegyzetek: `dokumentumok/BEALLITAS-Firebase.txt`, `dokumentumok/BEALLITAS-EmailJS.txt`. Teljes leírás: a **tervdokumentáció PDF** a `dokumentumok/` mappában.
