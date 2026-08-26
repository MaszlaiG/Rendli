function _contractCtx(lead) {
  const si = state.sellerInfo || {};
  const off = lead.offer || {};
  const afaAlany = off.vatReg != null ? !!off.vatReg : !!si.vatRegistered;
  const afaKulcs = off.vatRate != null ? off.vatRate : si.vatRate == null ? 27 : si.vatRate;
  return {
    m: {
      nev: si.name || '[A vállalkozó / megbízott neve / cégneve]',
      cim: si.address || '[székhely / cím]',
      adoszam: si.tax || '[adószám]',
      nyilv: si.reg || '',
      bank: si.bank || '[bankszámlaszám]',
      email: si.email || '[e-mail]',
      tel: si.phone || '[telefon]'
    },
    o: {
      nev: lead.name || '[A megrendelő / megbízó neve / cégneve]',
      email: lead.email || '[e-mail]',
      tel: lead.phone || '[telefon]',
      tipus: lead.clientType || ''
    },
    targy: lead.topic || lead.type || '[a projekt megnevezése]',
    tetelek: Array.isArray(off.items) ? off.items : [],
    netto: off.net || lead.price || 0,
    brutto: off.gross || lead.price || 0,
    afaAlany: afaAlany,
    afaKulcs: afaKulcs,
    kelt: new Date().toISOString().slice(0, 10),
    ekelt: (off.sentAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  };
}

function _ft(n) {
  return Math.round(Number(n) || 0).toLocaleString('hu-HU') + ' Ft';
}

function _contractItems(ctx) {
  if (!ctx.tetelek.length)
    return '<p style="margin:6px 0;color:#555">[A feladatok és tételek részletezése az árajánlat szerint.]</p>';
  const rows = ctx.tetelek
    .map(
      (it) =>
        '<tr><td style="padding:7px 8px;border:1px solid #ccc">' +
        escHtml(it.desc) +
        '</td>' +
        '<td style="padding:7px 8px;border:1px solid #ccc;text-align:center">' +
        it.qty +
        '</td>' +
        '<td style="padding:7px 8px;border:1px solid #ccc;text-align:right;white-space:nowrap">' +
        _ft(it.price) +
        '</td>' +
        '<td style="padding:7px 8px;border:1px solid #ccc;text-align:right;white-space:nowrap">' +
        _ft(it.qty * it.price) +
        '</td></tr>'
    )
    .join('');
  return (
    '<table style="border-collapse:collapse;width:100%;margin:8px 0;font-size:13px">' +
    '<thead><tr>' +
    '<th style="padding:7px 8px;border:1px solid #ccc;text-align:left;background:#f3f4f8">Megnevezés</th>' +
    '<th style="padding:7px 8px;border:1px solid #ccc;background:#f3f4f8">Menny.</th>' +
    '<th style="padding:7px 8px;border:1px solid #ccc;text-align:right;background:#f3f4f8">Egységár</th>' +
    '<th style="padding:7px 8px;border:1px solid #ccc;text-align:right;background:#f3f4f8">Összeg</th>' +
    '</tr></thead><tbody>' +
    rows +
    '</tbody></table>'
  );
}

function _P(t) {
  return '<p style="margin:6px 0;font-size:13px;line-height:1.6;text-align:justify">' + t + '</p>';
}

function _getContractSettings(tplId) {
  return (state.contractTemplates && state.contractTemplates[tplId]) || {};
}
function _optval(v) {
  return v != null && String(v).trim() !== '' ? String(v).trim() : '';
}

function _roles(tpl) {
  if (tpl.roles) return tpl.roles;
  return tpl.type === 'megbizasi'
    ? { client: 'Megbízó', provider: 'Megbízott', fee: 'megbízási díj' }
    : { client: 'Megrendelő', provider: 'Vállalkozó', fee: 'vállalkozói díj' };
}

function _legalBasisText(tpl) {
  if (tpl.type === 'megbizasi')
    return 'a Polgári Törvénykönyvről szóló 2013. évi V. törvény (a továbbiakban: Ptk.) megbízási szerződésre vonatkozó rendelkezései (6:272.–6:280. §)';
  if (tpl.id === 'construction')
    return 'a Polgári Törvénykönyvről szóló 2013. évi V. törvény (a továbbiakban: Ptk.) vállalkozási szerződésre vonatkozó rendelkezései (6:238.–6:256. §), valamint az építőipari kivitelezési tevékenységről szóló 191/2009. (IX. 15.) Korm. rendelet';
  return 'a Polgári Törvénykönyvről szóló 2013. évi V. törvény (a továbbiakban: Ptk.) vállalkozási szerződésre vonatkozó rendelkezései (6:238.–6:256. §)';
}

function _disclaimer() {
  return (
    '<div class="c-disclaimer" style="border:1px solid #d9a441;background:#fdf6e6;border-radius:8px;padding:12px 14px;margin-bottom:18px;font-size:12px;line-height:1.55;color:#6b4e12">' +
    '<strong>Fontos figyelmeztetés.</strong> Ez a dokumentum szerkeszthető <strong>sablon-tervezet</strong>, kizárólag tájékoztató jellegű, és <strong>nem minősül jogi tanácsadásnak</strong>. A tényleges felhasználás előtt a szerződést magyar <strong>ügyvéddel felül kell vizsgáltatni</strong> és a konkrét projektre, felekre és jogszabályi környezetre kell szabni. A szögletes zárójelben [ ] lévő részeket ki kell tölteni.' +
    '</div>'
  );
}

function _titleBlock(tpl) {
  return (
    '<h1 style="font-size:20px;text-align:center;margin:0 0 4px">' +
    escHtml(tpl.title) +
    '</h1>' +
    '<p style="text-align:center;font-size:12px;color:#666;margin:0 0 16px">' +
    escHtml(tpl.subtitle) +
    '</p>'
  );
}

function _partiesBlock(ctx, roles, tpl) {
  return (
    _P('amely létrejött egyrészről') +
    _P(
      '<strong>' +
        escHtml(ctx.o.nev) +
        '</strong> (székhely/lakcím: [cím]; ' +
        (ctx.o.tipus === 'Vállalkozó' ? 'adószám/cégjegyzékszám: [ ]; képviseli: [ ]; ' : '') +
        'e-mail: ' +
        escHtml(ctx.o.email) +
        '; telefon: ' +
        escHtml(ctx.o.tel) +
        ') mint <strong>' +
        roles.client +
        '</strong> (a továbbiakban: ' +
        roles.client +
        '),'
    ) +
    _P('másrészről') +
    _P(
      '<strong>' +
        escHtml(ctx.m.nev) +
        '</strong> (székhely: ' +
        escHtml(ctx.m.cim) +
        '; adószám: ' +
        escHtml(ctx.m.adoszam) +
        (ctx.m.nyilv ? '; nyilvántartási/cégjegyzékszám: ' + escHtml(ctx.m.nyilv) : '') +
        '; bankszámlaszám: ' +
        escHtml(ctx.m.bank) +
        '; e-mail: ' +
        escHtml(ctx.m.email) +
        '; telefon: ' +
        escHtml(ctx.m.tel) +
        ') mint <strong>' +
        roles.provider +
        '</strong> (a továbbiakban: ' +
        roles.provider +
        '),'
    ) +
    _P('(a továbbiakban együtt: Felek) között az alábbi feltételekkel.') +
    '<h2 style="font-size:14px;margin:18px 0 6px">Előzmények</h2>' +
    _P(
      'A ' +
        roles.provider +
        ' ' +
        escHtml(ctx.ekelt) +
        ' napon árajánlatot adott a jelen szerződés tárgyát képező feladatokra, amelyet a ' +
        roles.client +
        ' elfogadott. A Felek a jelen szerződést ' +
        _legalBasisText(tpl) +
        ' alapján kötik meg.'
    )
  );
}

function _feeBody(ctx, roles) {
  const d = ctx.def || {};
  const afaSor = ctx.afaAlany
    ? 'nettó ' +
      _ft(ctx.netto) +
      ' + ÁFA (' +
      ctx.afaKulcs +
      '%), azaz bruttó <strong>' +
      _ft(ctx.brutto) +
      '</strong>'
    : '<strong>' + _ft(ctx.netto) + '</strong> (a ' + roles.provider + ' alanyi adómentes, a díj ÁFA-t nem tartalmaz)';
  return (
    _P(
      'A ' +
        roles.provider +
        't a feladat ellátásáért ' +
        roles.fee +
        ' illeti meg: ' +
        afaSor +
        '. A díj részletezését az 1. számú melléklet / az elfogadott árajánlat tartalmazza.'
    ) +
    '<div style="margin:6px 0">' +
    _contractItems(ctx) +
    '</div>' +
    _P(
      'Fizetés módja: banki átutalás a ' +
        roles.provider +
        ' ' +
        escHtml(ctx.m.bank) +
        ' számú számlájára, a ' +
        roles.provider +
        ' által kiállított számla alapján, ' +
        (_optval(d.fizHatarido) ? escHtml(_optval(d.fizHatarido)) + ' napos' : '[ ] napos') +
        ' fizetési határidővel. ' +
        (_optval(d.eloleg)
          ? 'A Felek fizetési ütemezése: előleg ' +
            escHtml(_optval(d.eloleg)) +
            '% a szerződéskötéskor, a fennmaradó rész a teljesítéskor.'
          : 'A Felek [előleg: [ ]% a szerződéskötéskor, a fennmaradó rész a teljesítéskor] fizetési ütemezésben állapodnak meg.') +
        ' Késedelmes fizetés esetén a jogosultat a Ptk. 6:155. § szerinti késedelmi kamat illeti meg.'
    )
  );
}

function _confidentialityBody() {
  return _P(
    'A Felek a szerződés teljesítése során tudomásukra jutott, a másik félre vonatkozó minden nem közismert információt (üzleti titok, hozzáférések, adatok) bizalmasan kezelnek, azt harmadik személynek a másik fél előzetes írásbeli hozzájárulása nélkül nem adják ki, és kizárólag a szerződés teljesítéséhez használják fel. E kötelezettség a szerződés megszűnése után is fennmarad.'
  );
}

function _gdprBody(roles) {
  return _P(
    'A Felek a személyes adatokat az (EU) 2016/679 rendelet (GDPR) és az információs önrendelkezési jogról és az információszabadságról szóló 2011. évi CXII. törvény (Infotv.) szerint kezelik. Amennyiben a ' +
      roles.provider +
      ' a feladat ellátása során a ' +
      roles.client +
      ' nevében és utasítására személyes adatokat kezel (adatfeldolgozás), a Felek a GDPR 28. cikke szerinti adatfeldolgozási megállapodást külön mellékletben rögzítik.'
  );
}

function _forceMajeureBody() {
  return _P(
    'Egyik Fél sem felel a szerződés nem vagy késedelmes teljesítéséért, ha azt olyan előre nem látható, elháríthatatlan külső ok (vis maior) idézte elő, amelyre a Félnek nincs ráhatása. Az érintett Fél a másik Felet haladéktalanul értesíti.'
  );
}

function _modifyBody() {
  return _P(
    'A szerződés módosítása — ideértve a feladatok bővítését (pótmunka) — kizárólag a Felek írásbeli megállapodásával érvényes. A pótmunka külön díjazás ellenében, külön megállapodás alapján teljesíthető.'
  );
}

function _closingBody() {
  return _P(
    'Kapcsolattartás és értesítések írásban, a fenti e-mail címeken érvényesek. A szerződésre a magyar jog, elsősorban a Ptk. az irányadó. A Felek a vitáikat elsődlegesen egyeztetéssel rendezik; ennek eredménytelensége esetén a hatáskörrel és illetékességgel rendelkező magyar bíróság jár el. A jelen szerződésben nem szabályozott kérdésekben a Ptk. és a vonatkozó jogszabályok az irányadók. A szerződés a Felek aláírásával (ideértve az elektronikus aláírást / a Felek által kölcsönösen visszaigazolt elektronikus elfogadást) lép hatályba.'
  );
}

function _signaturesBlock(ctx, roles) {
  return (
    '<div style="display:flex;justify-content:space-between;gap:40px;margin-top:44px">' +
    '<div style="flex:1;text-align:center"><div style="border-top:1px solid #333;padding-top:6px;font-size:12px">' +
    roles.client +
    '<br><strong>' +
    escHtml(ctx.o.nev) +
    '</strong></div></div>' +
    '<div style="flex:1;text-align:center"><div style="border-top:1px solid #333;padding-top:6px;font-size:12px">' +
    roles.provider +
    '<br><strong>' +
    escHtml(ctx.m.nev) +
    '</strong></div></div>' +
    '</div>' +
    '<p style="margin-top:18px;font-size:12px;color:#555">Kelt: ' +
    (_optval((ctx.def || {}).teljHely) ? escHtml(_optval(ctx.def.teljHely)) : '[hely]') +
    ', ' +
    escHtml(ctx.kelt) +
    '.</p>'
  );
}

function _appendix(title, bodyHtml) {
  return (
    '<hr style="margin:26px 0;border:none;border-top:1px solid #ddd">' +
    '<h2 style="font-size:15px;margin:0 0 6px">' +
    escHtml(title) +
    '</h2>' +
    bodyHtml
  );
}

function _reminderNote() {
  return '<p style="margin-top:22px;font-size:11px;color:#8a6d1a;background:#fdf6e6;border:1px solid #e6cf8a;border-radius:6px;padding:10px 12px">Emlékeztető: ez sablon-tervezet — használat előtt magyar ügyvéddel véglegesíttesd. A jogszabályok időközben módosulhatnak.</p>';
}

function _buildWeb(ctx, roles) {
  return [
    {
      t: 'A szerződés tárgya',
      body:
        _P(
          'A ' +
            roles.client +
            ' megrendeli, a ' +
            roles.provider +
            ' elvállalja az alábbi mű elkészítését és átadását: <strong>' +
            escHtml(ctx.targy) +
            '</strong> (weboldal / webalkalmazás). A műszaki tartalmat és a leszállítandó eredményeket az 1. számú melléklet (Műszaki leírás) tartalmazza.'
        ) +
        _P(
          'A vállalkozási szerződés — a Ptk. 6:238. §-ára figyelemmel — eredménykötelem: a ' +
            roles.provider +
            ' a szerződés szerinti mű hibátlan megvalósítására, a ' +
            roles.client +
            ' annak átvételére és a ' +
            roles.fee +
            ' megfizetésére köteles.'
        )
    },
    {
      t: 'A ' + roles.provider + ' kötelezettségei',
      body:
        _P(
          'A ' +
            roles.provider +
            ' a művet a tőle elvárható szakértelemmel, a hatályos szabványoknak és jó szakmai gyakorlatnak megfelelően valósítja meg, és a feladat állásáról szükség szerint tájékoztatja a ' +
            roles.client +
            't.'
        ) +
        _P(
          'A ' +
            roles.provider +
            ' alvállalkozót (közreműködőt) vehet igénybe, akiért úgy felel, mintha maga járt volna el. A ' +
            roles.client +
            ' célszerűtlen vagy szakszerűtlen utasításáról a ' +
            roles.provider +
            ' köteles írásban figyelmeztetni; a figyelmeztetés ellenére fenntartott utasítás a ' +
            roles.client +
            ' kockázatára teljesíthető.'
        )
    },
    {
      t: 'A ' + roles.client + ' kötelezettségei',
      body:
        _P(
          'A ' +
            roles.client +
            ' a teljesítéshez szükséges tartalmakat (szövegek, képek, logók, adatok), hozzáféréseket és döntéseket határidőben biztosítja, és felel az általa átadott tartalmak jogtisztaságáért és valóságáért.'
        ) +
        _P(
          'A ' +
            roles.client +
            ' közreműködésének elmulasztása vagy késedelme miatti késedelem és többletköltség a ' +
            roles.client +
            't terheli, és a teljesítési határidők ezzel arányosan meghosszabbodnak.'
        )
    },
    {
      t: 'Teljesítés, átadás-átvétel, határidők',
      body:
        _P(
          'Az ütemezést és a (vég)teljesítési határidőt az 1. számú melléklet tartalmazza. Irányadó véghatáridő: <strong>[határidő]</strong>. A ' +
            roles.provider +
            ' előteljesítésre jogosult.'
        ) +
        _P(
          'A ' +
            roles.provider +
            ' a művet átadás-átvételi eljárás keretében adja át (Ptk. 6:247. §). A ' +
            roles.client +
            ' az átadott eredményt [ ] napon (a törvényi vélelem szerint legfeljebb 30 napon) belül megvizsgálja, és írásban elfogadja vagy indokolt hibajegyzékkel kifogást emel. A [éles üzembe helyezés előtti próbaüzem időtartama: [ ] nap].'
        )
    },
    { t: 'Vállalkozói díj, fizetési feltételek', body: _feeBody(ctx, roles) },
    {
      t: 'Szerzői és felhasználási jogok',
      body:
        _P(
          'A jelen szerződés keretében létrejövő, szerzői jogi védelem alá eső művekre a szerzői jogról szóló 1999. évi LXXVI. törvény (Szjt.) az irányadó.'
        ) +
        _P(
          'A szoftvernek (forráskódnak) minősülő alkotások vagyoni jogait a ' +
            roles.provider +
            ' — az Szjt. szoftverre biztosított kivétele alapján — a ' +
            roles.fee +
            ' teljes kiegyenlítésével a ' +
            roles.client +
            'ra átruházza. A nem szoftver jellegű művekre (grafika, szöveg, dizájn) a ' +
            roles.provider +
            ' a díj teljes kiegyenlítésével kizárólagos, területi és időbeli korlátozás nélküli, harmadik személynek átengedhető felhasználási engedélyt ad.'
        ) +
        _P(
          'A jogátszállás/engedély feltétele a díj hiánytalan megfizetése; addig a ' +
            roles.provider +
            ' a jogokat fenntartja. A harmadik felektől származó elemek (sablonok, betűtípusok, bővítmények, stockképek, nyílt forráskódú komponensek) a saját licencfeltételeik szerint használhatók, díjuk a ' +
            roles.client +
            't terheli. A ' +
            roles.provider +
            ' jogosult a munkát referenciaként feltüntetni, kivéve, ha a ' +
            roles.client +
            ' ez ellen írásban tiltakozik.'
        )
    },
    {
      t: 'Kellékszavatosság, hibás teljesítés, jótállás',
      body: _P(
        'A ' +
          roles.provider +
          ' hibás teljesítéséért a Ptk. 6:157.–6:167. §-ai szerint kellékszavatossággal tartozik. A neki felróható hibákat a ' +
          roles.client +
          ' írásbeli jelzését követően [ ] napos hibajavítási időn belül díjmentesen kijavítja. Nem minősül hibának a ' +
          roles.client +
          ' által kért módosítás, harmadik fél szolgáltatásának hibája, vagy a ' +
          roles.client +
          ' jogosulatlan módosításából eredő hiba. ' +
          (_optval((ctx.def || {}).jotallas)
            ? 'Jótállás: ' + escHtml(_optval(ctx.def.jotallas)) + ' hónap.'
            : 'Jótállás [vállalt / nem vállalt]; ha vállalt, időtartama [ ] hónap.')
      )
    },
    {
      t: 'Felelősség',
      body: _P(
        'A ' +
          roles.provider +
          ' a szerződésszegéssel okozott kárt a Ptk. szerint téríti meg. A Felek a ' +
          roles.provider +
          ' kártérítési felelősségének felső határát — a szándékos, valamint az életet, testi épséget vagy egészséget megkárosító károkozás kivételével — a ' +
          roles.fee +
          ' összegében korlátozzák. A ' +
          roles.provider +
          ' nem felel a ' +
          roles.client +
          ' elmaradt hasznáért és közvetett káraiért.'
      )
    },
    { t: 'Titoktartás', body: _confidentialityBody() },
    { t: 'Adatvédelem (GDPR)', body: _gdprBody(roles) },
    {
      t: 'Üzemeltetés, karbantartás',
      body: _P(
        'A weboldal folyamatos üzemeltetése, karbantartása, biztonsági mentése és frissítése [nem tárgya / külön megállapodás tárgya] a jelen szerződésnek. Ha vállalt: havi díja [ ] Ft, tartalma [ ], vállalt válaszideje [ ].'
      )
    },
    { t: 'A szerződés módosítása, pótmunka', body: _modifyBody() },
    {
      t: 'A szerződés megszűnése, elállás',
      body: _P(
        'A ' +
          roles.client +
          ' a szerződéstől a teljesítés megkezdése előtt elállhat, ezt követően a szerződést felmondhatja; ez esetben köteles a ' +
          roles.provider +
          ' igazolt költségeit és a már elvégzett munka arányos díját megtéríteni (Ptk. 6:249. §). Súlyos szerződésszegés esetén a másik Fél a szerződést azonnali hatállyal felmondhatja.'
      )
    },
    { t: 'Vis maior', body: _forceMajeureBody() },
    { t: 'Vegyes és záró rendelkezések', body: _closingBody() }
  ];
}

function _webAppendices(ctx) {
  return (
    _appendix(
      '1. számú melléklet — Műszaki leírás (feladatleírás)',
      _P('A projekt tárgya: <strong>' + escHtml(ctx.targy) + '</strong>.') +
        _P(
          'Funkciók, oldalak, mérföldkövek és határidők: [részletezés]. Átadandó eredmények (pl. forráskód, adminisztrációs hozzáférés): [ ]. A ' +
            '<em>Megrendelő</em> által biztosítandó tartalmak/hozzáférések: [ ]. Böngésző-/eszköztámogatás: [ ].'
        ) +
        _contractItems(ctx)
    ) +
    _appendix(
      '2. számú melléklet — Adatfeldolgozási megállapodás (GDPR 28. cikk)',
      _P(
        '<em>Akkor alkalmazandó, ha a Vállalkozó a Megrendelő nevében személyes adatokat kezel (pl. tárhely, űrlapadatok kezelése). Ha nincs ilyen adatfeldolgozás, e melléklet törölhető.</em>'
      ) +
        _P(
          '<strong>Az adatkezelés tárgya/célja/időtartama/jellege; az érintettek és az adatok köre; az adatfeldolgozó kötelezettségei a GDPR 28. cikk (3) szerint</strong> (kizárólag utasításra kezelés; titoktartás; 32. cikk szerinti adatbiztonság; további adatfeldolgozó engedélyhez kötése; érintetti jogok és incidenskezelés támogatása; a szerződés végén törlés/visszaadás; audit lehetővé tétele). Részletezés: [ ].'
        )
    )
  );
}

function _buildContent(ctx, roles) {
  return [
    {
      t: 'A szerződés tárgya',
      body:
        _P(
          'A ' +
            roles.client +
            ' megbízza a ' +
            roles.provider +
            'at az alábbi tartalomgyártási / marketing feladat ellátásával: <strong>' +
            escHtml(ctx.targy) +
            '</strong> (pl. szövegírás, közösségimédia-tartalom, blog, hírlevél, kampány). A feladatok részletét az 1. számú melléklet (Tartalomterv) tartalmazza.'
        ) +
        _P(
          'A megbízás — a Ptk. 6:272. §-ára figyelemmel — gondossági kötelem: a ' +
            roles.provider +
            ' a feladatot a tőle elvárható szakértelemmel és gondossággal, a ' +
            roles.client +
            ' érdekének megfelelően látja el.'
        )
    },
    {
      t: 'A ' + roles.provider + ' kötelezettségei',
      body: _P(
        'A ' +
          roles.provider +
          ' a feladatot a ' +
          roles.client +
          ' utasításai és a jóváhagyott tartalomterv szerint látja el (Ptk. 6:273. §), a munka állásáról tájékoztat, és közreműködőt igénybe vehet, akiért úgy felel, mintha maga járt volna el.'
      )
    },
    {
      t: 'A ' + roles.client + ' kötelezettségei',
      body: _P(
        'A ' +
          roles.client +
          ' biztosítja a briefet, a szükséges anyagokat, márkaelemeket és hozzáféréseket, a tartalmakat ésszerű határidőn belül jóváhagyja, és felel az általa átadott anyagok jogtisztaságáért és valóságáért.'
      )
    },
    {
      t: 'Teljesítés, ütemezés, revíziók',
      body: _P(
        'A leadási ütemezést az 1. számú melléklet tartalmazza. A ' +
          roles.client +
          ' tartalmanként [ ] revíziós kört vehet igénybe; az ezen felüli módosítás pótmunkának minősül. A leadott tartalmat a ' +
          roles.client +
          ' [ ] napon belül jóváhagyja vagy indokolt kifogást emel.'
      )
    },
    { t: 'Megbízási díj, fizetési feltételek', body: _feeBody(ctx, roles) },
    {
      t: 'Szerzői jogok, felhasználási engedély',
      body:
        _P(
          'A ' +
            roles.provider +
            ' által létrehozott szerzői művek (szöveg, kép, videó, grafika) tekintetében a szerzői jog az Szjt. szerint a ' +
            roles.provider +
            't illeti; a ' +
            roles.provider +
            ' a díj teljes kiegyenlítésével a ' +
            roles.client +
            ' javára [kizárólagos / nem kizárólagos] felhasználási engedélyt ad a megállapodott terjedelemben (felhasználás módja, területe, időtartama, csatornái).'
        ) +
        _P(
          'A díj hiánytalan megfizetéséig az engedély nem száll át. A ' +
            roles.provider +
            ' szavatolja, hogy a leszállított tartalom saját, jogtiszta alkotás; a harmadik féltől származó elemekre (stockkép/-zene, betűtípus) a ' +
            roles.provider +
            ' a szükséges licencet beszerzi, díja [a Megbízót / a Megbízottat] terheli.'
        )
    },
    {
      t: 'Reklámjelölés, felelős tartalom',
      body: _P(
        'A Felek betartják a reklámra vonatkozó jogszabályokat és a Gazdasági Versenyhivatal (GVH) iránymutatásait: a fizetett/kereskedelmi együttműködést a tartalomban egyértelműen, jól észlelhetően, magyar nyelven jelölni kell (tilos a bújtatott reklám). A ' +
          roles.client +
          ' felel az általa jóváhagyott állítások valóságáért; a ' +
          roles.provider +
          ' jogtiszta forrásból dolgozik.'
      )
    },
    { t: 'Titoktartás', body: _confidentialityBody() },
    { t: 'Adatvédelem (GDPR)', body: _gdprBody(roles) },
    {
      t: 'Felelősség',
      body: _P(
        'A ' +
          roles.provider +
          ' a szerződésszegéssel okozott kárt a Ptk. szerint téríti meg; a Felek a felelősség felső határát — a szándékos és a személyi sérüléses károkozás kivételével — a ' +
          roles.fee +
          ' összegében korlátozzák. A ' +
          roles.provider +
          ' nem felel a közvetett és elmaradt haszon jellegű károkért.'
      )
    },
    { t: 'A szerződés módosítása', body: _modifyBody() },
    {
      t: 'A szerződés megszűnése, felmondás',
      body: _P(
        'A szerződést bármelyik Fél a Ptk. 6:278. §-a szerint felmondhatja. [Határozott idejű / folyamatos megbízás esetén a felmondási idő: [ ].] Felmondás esetén a ' +
          roles.provider +
          't az arányos díj és az indokolt költségei megilletik; alkalmatlan időben történő felmondás esetén az ezzel okozott kárt a felmondó Fél megtéríti.'
      )
    },
    { t: 'Vis maior', body: _forceMajeureBody() },
    { t: 'Vegyes és záró rendelkezések', body: _closingBody() }
  ];
}

function _contentAppendices(ctx) {
  return _appendix(
    '1. számú melléklet — Tartalomterv / feladatleírás',
    _P('A megbízás tárgya: <strong>' + escHtml(ctx.targy) + '</strong>.') +
      _P(
        'Tartalomtípusok, mennyiség, csatornák, leadási ütemezés és határidők: [részletezés]. Hangnem/stílus, kulcsüzenetek: [ ]. Jóváhagyási folyamat és revíziós körök: [ ].'
      ) +
      _contractItems(ctx)
  );
}

function _buildPhoto(ctx, roles) {
  return [
    {
      t: 'A szerződés tárgya',
      body:
        _P(
          'A ' +
            roles.client +
            ' megrendeli, a ' +
            roles.provider +
            ' (a továbbiakban a szerzői jogi összefüggésben: Alkotó) elvállalja az alábbi fotó-/videóanyag elkészítését és átadását: <strong>' +
            escHtml(ctx.targy) +
            '</strong> (pl. esemény, portré, termék-, ingatlan-, promóciós anyag). Részletek az 1. számú mellékletben.'
        ) +
        _P(
          'A szerződés vállalkozási és felhasználási (Szjt.) elemeket vegyesen tartalmaz; eredménye a leszállított, feldolgozott (retusált) anyag.'
        )
    },
    {
      t: 'A ' + roles.provider + ' kötelezettségei',
      body: _P(
        'A ' +
          roles.provider +
          ' a megrendelt anyagot a megbeszélt helyszínen és időpontban, szakszerűen, saját (vagy biztosított) eszközeivel készíti el, és a megállapodott feldolgozás után határidőben átadja. Közreműködőt (pl. asszisztens, második fotós) igénybe vehet.'
      )
    },
    {
      t: 'A ' + roles.client + ' kötelezettségei',
      body: _P(
        'A ' +
          roles.client +
          ' biztosítja a helyszínt, a hozzáférést és a közreműködést (pl. szereplők, tárgyak, engedélyek), és felel a helyszínre/szereplőkre vonatkozó jogosultságokért. A ' +
          roles.client +
          ' a díjat a megállapodott ütemezésben megfizeti.'
      )
    },
    {
      t: 'Teljesítés, leadás',
      body: _P(
        'A ' +
          roles.provider +
          ' a kész anyagot [ ] munkanapon belül, [ ] db feldolgozott (retusált) fényképet / [ ] perc kész videót ad át [online galéria / letöltés / adathordozó] útján, [felbontás/formátum] minőségben. A leadás minőségi/mennyiségi paramétereit az 1. számú melléklet rögzíti.'
      )
    },
    { t: 'Vállalkozói díj, fizetési feltételek', body: _feeBody(ctx, roles) },
    {
      t: 'Szerzői és felhasználási jogok',
      body:
        _P(
          'A fényképek és videók az Szjt. szerint szerzői jogi védelem alatt állnak; a szerzői jog a ' +
            roles.provider +
            't (Alkotót) illeti. A ' +
            roles.provider +
            ' a díj teljes kiegyenlítésével a ' +
            roles.client +
            ' javára felhasználási engedélyt ad a megállapodott terjedelemben: <strong>felhasználás módja</strong> [pl. online, nyomtatott, közösségi média], <strong>területe</strong> [ ], <strong>időtartama</strong> [ ], <strong>kizárólagosság</strong> [kizárólagos / nem kizárólagos].'
        ) +
        _P(
          'A szerkesztetlen nyersanyag (RAW/nyers felvétel) nem képezi az átadás részét, kivéve külön megállapodást és díjazást. A ' +
            roles.provider +
            ' a nevének feltüntetéséhez (Szjt. szerinti névjog) és — a szereplők jogainak tiszteletben tartásával — az anyag referenciaként/portfólióban való bemutatásához fenntartja a jogot, kivéve, ha a Felek ezt írásban kizárják.'
        )
    },
    {
      t: 'Képmáshoz és hangfelvételhez való jog, modellnyilatkozat',
      body: _P(
        'Képmás vagy hangfelvétel elkészítéséhez és felhasználásához — a Ptk. 2:48. §-a szerint — az érintett személy hozzájárulása szükséges; megrendelésre készült képmás esetén a felhasználáshoz az ábrázolt személy beleegyezése is kell. A szereplők hozzájárulását a 2. számú melléklet (Modellnyilatkozat) tartalmazza. Kiskorú esetén a törvényes képviselő nyilatkozata szükséges. Tömegfelvétel/nyilvános közéleti esemény esetén az eltérő szabályok irányadók.'
      )
    },
    {
      t: 'Adatvédelem (GDPR)',
      body: _P(
        'A felismerhető személyt ábrázoló felvétel személyes adat; a ' +
          roles.provider +
          ' a készítéshez és felhasználáshoz megfelelő jogalappal (jellemzően az érintett hozzájárulásával) jár el a GDPR és az Infotv. szerint, és biztosítja az adatok megfelelő védelmét.'
      )
    },
    {
      t: 'Szavatosság, újrafotózás',
      body: _P(
        'A ' +
          roles.provider +
          ' szakmailag megfelelő minőséget szavatol. A ' +
          roles.provider +
          'nak felróható technikai hiba esetén [újrafotózás / arányos díjvisszatérítés] jár. Nem jár szavatosság a ' +
          roles.client +
          ' által kért, ízlésbeli utólagos igényekért, illetve az elháríthatatlan külső okból (pl. időjárás, a helyszín hibája) eredő korlátokért.'
      )
    },
    {
      t: 'Felelősség',
      body: _P(
        'A Felek a ' +
          roles.provider +
          ' kártérítési felelősségének felső határát — a szándékos és a személyi sérüléses károkozás kivételével — a ' +
          roles.fee +
          ' összegében korlátozzák. Adathordozó meghibásodása esetén a ' +
          roles.provider +
          ' az ésszerűen elvárható mentést megkísérli, de az ebből eredő adatvesztésért felelőssége korlátozott.'
      )
    },
    { t: 'Titoktartás', body: _confidentialityBody() },
    { t: 'A szerződés módosítása', body: _modifyBody() },
    {
      t: 'A szerződés megszűnése, lemondás',
      body: _P(
        'Foglaló fizetése esetén a Ptk. 6:185. §-a az irányadó (a foglalót adó általi meghiúsulásnál elveszti, a kapó általi meghiúsulásnál kétszeresen visszajár). Időponthoz kötött (pl. eseményi) megbízás [ ] napon belüli lemondása esetén [bánatpénz / a díj [ ]%-a] jár. Egyebekben a Ptk. vállalkozási szabályai szerint.'
      )
    },
    { t: 'Vis maior', body: _forceMajeureBody() },
    { t: 'Vegyes és záró rendelkezések', body: _closingBody() }
  ];
}

function _photoAppendices(ctx) {
  return (
    _appendix(
      '1. számú melléklet — Feladatleírás (fotó/videó)',
      _P('A megrendelés tárgya: <strong>' + escHtml(ctx.targy) + '</strong>.') +
        _P(
          'Helyszín(ek) és időpont(ok): [ ]. Leadandó darabszám/hossz: [ ]. Feldolgozás mértéke (retus/vágás): [ ]. Leadás módja és formátuma: [ ]. Utazás/kiszállás: [ ].'
        ) +
        _contractItems(ctx)
    ) +
    _appendix(
      '2. számú melléklet — Modellnyilatkozat (képmás-felhasználási hozzájárulás)',
      _P(
        'Alulírott [név] (szül. [ ], lakcím: [ ]) hozzájárulok, hogy a ' +
          escHtml(ctx.m.nev) +
          ' által [dátum] rólam készített fényképeket/videókat a jelen szerződés szerinti terjedelemben ([felhasználás módja, területe, időtartama]) a ' +
          escHtml(ctx.o.nev) +
          ' felhasználja. A hozzájárulás [visszavonható / visszavonhatatlan a már felhasznált anyag tekintetében]. Kiskorú esetén a törvényes képviselő aláírása szükséges.'
      ) +
        _P('Kelt: [hely], [dátum].  Aláírás: __________________')
    )
  );
}

function _buildConstruction(ctx, roles) {
  return [
    {
      t: 'A szerződés tárgya, műszaki tartalom',
      body:
        _P(
          'A ' +
            roles.client +
            ' megrendeli, a ' +
            roles.provider +
            ' elvállalja az alábbi építőipari kivitelezési tevékenység elvégzését: <strong>' +
            escHtml(ctx.targy) +
            '</strong>. A vállalt tevékenység pontos megnevezését és műszaki tartalmát az 1. számú melléklet (Műszaki tartalom / árazott költségvetés) és a [tervdokumentáció / építési engedély száma: [ ]] tartalmazza.'
        ) +
        _P(
          'A szerződés vállalkozási (eredmény)kötelem, amelyre a Ptk. mellett az építőipari kivitelezési tevékenységről szóló 191/2009. (IX. 15.) Korm. rendelet irányadó. A szerződés — a jogszabályi előírás szerint — írásban jön létre.'
        )
    },
    {
      t: 'Az építési munkaterület',
      body: _P(
        'A munkaterület pontos körülírása: [cím, helyrajzi szám, érintett rész]. A ' +
          roles.client +
          ' a munkaterületet [dátum]-kor, munkavégzésre alkalmas állapotban, jegyzőkönyvvel adja át a ' +
          roles.provider +
          'nak; a munkaterület átadásáig terjedő akadályoztatás a határidőt arányosan módosítja.'
      )
    },
    {
      t: 'A ' + roles.provider + ' (Kivitelező) kötelezettségei',
      body:
        _P(
          'A ' +
            roles.provider +
            ' a munkát a tervek, a vonatkozó szabványok, technológiai és munkavédelmi előírások szerint, I. osztályú minőségben végzi, a beépített anyagokról teljesítménynyilatkozatot biztosít, és vezeti az <strong>elektronikus építési naplót (e-építési napló)</strong>, ha a tevékenységre az kötelező.'
        ) +
        _P(
          'A ' +
            roles.provider +
            ' rendelkezik a tevékenységhez szükséges jogosultságokkal és [kötelező kivitelezői felelősségbiztosítással]. Alvállalkozót igénybe vehet, akiért úgy felel, mintha maga járt volna el; a láncszerű kifizetésre a jogszabályi (pl. teljesítésigazolás alapú) rend irányadó.'
        )
    },
    {
      t: 'A ' + roles.client + ' (Építtető) kötelezettségei',
      body: _P(
        'A ' +
          roles.client +
          ' biztosítja a munkaterületet, a hiánytalan tervdokumentációt és a szükséges hatósági engedélyeket, a közmű-csatlakozásokat és az érdemi döntéseket, ellenőrzi az építési naplót, és a ' +
          roles.fee +
          't a teljesítésigazolás alapján megfizeti.'
      )
    },
    {
      t: 'Teljesítési határidő, ütemezés',
      body: _P(
        'Kezdés: [dátum]. Befejezés/véghatáridő: <strong>[dátum]</strong>. Részhatáridők és ütemterv a 2. számú melléklet szerint. A ' +
          roles.provider +
          'nak felróható késedelem esetén késedelmi kötbér [ ]%/nap, legfeljebb [ ]%; a ' +
          roles.client +
          ' késedelme (pl. munkaterület, döntés) a határidőt arányosan hosszabbítja.'
      )
    },
    {
      t: 'Vállalkozói díj, elszámolás, fizetés',
      body:
        _feeBody(ctx, roles) +
        _P(
          'Az elszámolás formája [átalánydíj / tételes elszámolás árazott költségvetés alapján]. A ' +
            roles.provider +
            ' [rész-] számlát a ' +
            roles.client +
            ' által kiállított <strong>teljesítésigazolás</strong> alapján nyújt be; a fizetés az e-építési napló és a teljesítésigazolás szerinti, ténylegesen elvégzett és igazolt munka alapján történik.'
        )
    },
    {
      t: 'Többletmunka, pótmunka',
      body: _P(
        'A többletmunka (a tervben szereplő, de a költségvetésből hiányzó munka) ellenértéke — a Ptk. 6:244. §-a szerint — az átalánydíjban benne foglalt, kivéve, ha az előre nem volt látható. A pótmunka (utóbb megrendelt, a tervben nem szereplő munka) külön, írásbeli megrendelés és díjazás alapján teljesíthető.'
      )
    },
    {
      t: 'Teljesítés, műszaki átadás-átvétel',
      body: _P(
        'A teljesítés a <strong>műszaki átadás-átvételi eljárással</strong> valósul meg (Ptk. 6:247. §): a Felek jegyzőkönyvet vesznek fel, rögzítik az esetleges hibákat/hiányokat (hibajegyzék) és a kijavítási határidőt. A ' +
          roles.client +
          ' a művet nem tagadhatja meg olyan hiba miatt, amely a rendeltetésszerű használatot nem akadályozza. A birtokbaadással a kárveszély a ' +
          roles.client +
          're száll.'
      )
    },
    {
      t: 'Biztosíték',
      body: _P(
        'A Felek [teljesítési biztosítékban [ ]% és/vagy jólteljesítési (jótállási) biztosítékban [ ]%] állapodnak meg [bankgarancia / visszatartás formájában], amelynek felszabadulása a [sikeres átadás-átvételhez / a jótállási idő leteltéhez] kötött.'
      )
    },
    {
      t: 'Kellékszavatosság, jótállás',
      body: _P(
        'A ' +
          roles.provider +
          ' a hibás teljesítésért a Ptk. 6:157.–6:167. §-ai szerint kellékszavatossággal, valamint a jogszabályban előírt/vállalt <strong>jótállással</strong> tartozik; a jótállás időtartama ' +
          (_optval((ctx.def || {}).jotallas) ? escHtml(_optval(ctx.def.jotallas)) + ' hónap' : '[ ]') +
          ' (az egyes építményekre irányadó kötelező alkalmassági/jótállási idővel összhangban). A jótállási időben jelzett, a ' +
          roles.provider +
          'nak felróható hibákat díjmentesen kijavítja.'
      )
    },
    {
      t: 'Felelősség, kárveszély, biztosítás',
      body: _P(
        'A ' +
          roles.provider +
          ' a művet a birtokbaadásig megóvja; az addig bekövetkező kárveszélyt viseli. A ' +
          roles.provider +
          ' [rendelkezik / köteles rendelkezni] a tevékenységre vonatkozó felelősségbiztosítással. A felelősség a jogszabály keretei között korlátozható, a szándékos és a személyi sérüléses károkozás kivételével.'
      )
    },
    {
      t: 'Kötbér',
      body: _P(
        'A Felek [késedelmi], [hibás teljesítési] és [meghiúsulási] kötbérben állapodnak meg, mértéke [ ]. A kötbér meghaladó kár érvényesíthető.'
      )
    },
    { t: 'A szerződés módosítása', body: _modifyBody() },
    {
      t: 'A szerződés megszűnése, elállás',
      body: _P(
        'A ' +
          roles.client +
          ' a szerződéstől a Ptk. 6:249. §-a szerint elállhat (a ' +
          roles.provider +
          ' kárának megtérítése mellett). Súlyos szerződésszegés (pl. tartós késedelem, minőségi hiba a figyelmeztetés ellenére) esetén a másik Fél azonnali hatállyal felmondhat; elszámolás a ténylegesen elvégzett és igazolt munka alapján.'
      )
    },
    { t: 'Vis maior', body: _forceMajeureBody() },
    {
      t: 'Vegyes és záró rendelkezések',
      body:
        _P(
          'A szerződésre a magyar jog, a Ptk. és a 191/2009. (IX. 15.) Korm. rendelet az irányadó; a naplóvezetés az e-építési napló szabályai szerint történik.'
        ) + _closingBody()
    }
  ];
}

function _constructionAppendices(ctx) {
  return (
    _appendix(
      '1. számú melléklet — Műszaki tartalom / árazott költségvetés',
      _P('A kivitelezés tárgya: <strong>' + escHtml(ctx.targy) + '</strong>.') +
        _P(
          'A munkanemek, mennyiségek, anyagok és a vonatkozó tervek/rajzszámok: [részletezés]. Minőségi követelmények, szabványok: [ ].'
        ) +
        _contractItems(ctx)
    ) +
    _appendix(
      '2. számú melléklet — Ütemterv, részhatáridők',
      _P('Kezdés: [ ]. Mérföldkövek és részhatáridők: [ ]. Véghatáridő: [ ]. Teljesítésigazolási/számlázási ütemezés: [ ].')
    )
  );
}

const CONTRACT_TEMPLATES = {
  web: {
    id: 'web',
    label: 'Weboldal-fejlesztés (vállalkozási)',
    type: 'vallalkozasi',
    docType: 'Vállalkozási szerződés',
    title: 'VÁLLALKOZÁSI SZERZŐDÉS',
    subtitle: 'weboldal / webalkalmazás fejlesztése tárgyában',
    build: _buildWeb,
    appendices: _webAppendices
  },
  content: {
    id: 'content',
    label: 'Tartalomgyártás / marketing (megbízási)',
    type: 'megbizasi',
    docType: 'Megbízási szerződés',
    title: 'MEGBÍZÁSI SZERZŐDÉS',
    subtitle: 'tartalomgyártási / marketing szolgáltatás tárgyában',
    build: _buildContent,
    appendices: _contentAppendices
  },
  photo: {
    id: 'photo',
    label: 'Fotó / videó (vállalkozási + felhasználási)',
    type: 'vallalkozasi',
    docType: 'Vállalkozási szerződés',
    title: 'VÁLLALKOZÁSI SZERZŐDÉS',
    subtitle: 'fotó- / videógyártás és felhasználási engedély tárgyában',
    build: _buildPhoto,
    appendices: _photoAppendices
  },
  construction: {
    id: 'construction',
    label: 'Építőipari kivitelezés (vállalkozási)',
    type: 'vallalkozasi',
    docType: 'Kivitelezési (vállalkozási) szerződés',
    title: 'KIVITELEZÉSI (VÁLLALKOZÁSI) SZERZŐDÉS',
    subtitle: 'építőipari kivitelezési tevékenység tárgyában',
    build: _buildConstruction,
    appendices: _constructionAppendices,
    roles: { client: 'Építtető', provider: 'Kivitelező', fee: 'vállalkozói (kivitelezői) díj' }
  }
};
const CONTRACT_TEMPLATE_ORDER = ['web', 'content', 'photo', 'construction'];

const CONTRACT_TEMPLATE_META = {
  web: {
    icon: '💻',
    desc: 'Vállalkozási szerződés weboldal/webalkalmazás fejlesztésére: átadás-átvétel, forráskód-jogátruházás és felhasználási engedély, kellékszavatosság, üzemeltetés, GDPR-melléklet.'
  },
  content: {
    icon: '✍️',
    desc: 'Megbízási szerződés tartalomgyártásra/marketingre: felhasználási engedély, revíziós körök, reklámjelölési kötelezettség, titoktartás, felmondás.'
  },
  photo: {
    icon: '📷',
    desc: 'Vállalkozási + felhasználási szerződés fotó-/videógyártásra: felhasználási jog terjedelme, képmáshoz való jog (modellnyilatkozat), nyersanyag, GDPR.'
  },
  construction: {
    icon: '🏗️',
    desc: 'Kivitelezési (vállalkozási) szerződés: munkaterület, e-építési napló, teljesítésigazolás, műszaki átadás-átvétel, jótállás/szavatosság, biztosíték, kötbér.'
  }
};

function renderContractTemplates() {
  const box = document.getElementById('contract-templates-list');
  if (!box) return;
  box.innerHTML = CONTRACT_TEMPLATE_ORDER.map((id) => {
    const tpl = CONTRACT_TEMPLATES[id];
    const meta = CONTRACT_TEMPLATE_META[id] || { icon: '📄', desc: '' };
    const typeLbl = tpl.type === 'megbizasi' ? 'megbízási (gondossági)' : 'vállalkozási (eredmény)';
    return (
      '<div class="card">' +
      '<div style="display:flex;align-items:flex-start;gap:12px">' +
      '<div style="width:42px;height:42px;flex:none;border-radius:10px;background:var(--surface3);display:flex;align-items:center;justify-content:center;font-size:20px">' +
      meta.icon +
      '</div>' +
      '<div style="min-width:0">' +
      '<div style="font-weight:700;font-size:15px">' +
      escHtml(tpl.label) +
      '</div>' +
      '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">' +
      escHtml(tpl.subtitle) +
      ' · <strong>' +
      typeLbl +
      '</strong></div>' +
      '</div></div>' +
      '<p style="font-size:12px;color:var(--muted);line-height:1.55;margin:12px 0 0">' +
      escHtml(meta.desc) +
      '</p>' +
      (_contractSettingsFilled(id)
        ? '<div style="font-size:11px;color:var(--accent2);margin-top:10px">✓ Egyedi beállítások mentve</div>'
        : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">' +
      '<button class="btn btn-sm" onclick="printContractTemplate(\'' +
      id +
      '\')">📄 Megnézés / PDF</button>' +
      '<button class="btn btn-secondary btn-sm" onclick="openContractEditor(\'' +
      id +
      '\')">✎ Szerkesztés</button>' +
      '</div></div>'
    );
  }).join('');
}

function _contractSettingsFilled(tplId) {
  const s = _getContractSettings(tplId);
  return !!(
    _optval(s.intro) ||
    _optval(s.extra) ||
    _optval(s.fizHatarido) ||
    _optval(s.eloleg) ||
    _optval(s.teljHely) ||
    _optval(s.jotallas)
  );
}

function openContractEditor(tplId) {
  const tpl = _getTemplate(tplId);
  const s = _getContractSettings(tplId);
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.value = v || '';
  };
  const idEl = document.getElementById('ce-tplid');
  if (idEl) idEl.value = tplId;
  const titleEl = document.getElementById('ce-title');
  if (titleEl) titleEl.textContent = tpl.label;
  const jotRow = document.getElementById('ce-jotallas-row');
  if (jotRow) jotRow.style.display = tplId === 'content' || tplId === 'photo' ? 'none' : '';
  set('ce-intro', s.intro);
  set('ce-extra', s.extra);
  set('ce-fiz', s.fizHatarido);
  set('ce-eloleg', s.eloleg);
  set('ce-hely', s.teljHely);
  set('ce-jotallas', s.jotallas);
  openModal('contract-edit-modal');
}

function saveContractEditor() {
  const val = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };
  const id = val('ce-tplid');
  if (!id) return;
  state.contractTemplates = state.contractTemplates || {};
  state.contractTemplates[id] = {
    intro: val('ce-intro'),
    extra: val('ce-extra'),
    fizHatarido: val('ce-fiz'),
    eloleg: val('ce-eloleg'),
    teljHely: val('ce-hely'),
    jotallas: val('ce-jotallas')
  };
  save();
  closeModal('contract-edit-modal');
  renderContractTemplates();
  uiAlert('A(z) „' + _getTemplate(id).label + '" sablon beállításai elmentve.', { title: 'Mentve' });
}

function resetContractEditor() {
  const id = document.getElementById('ce-tplid').value;
  ['ce-intro', 'ce-extra', 'ce-fiz', 'ce-eloleg', 'ce-hely', 'ce-jotallas'].forEach((f) => {
    const el = document.getElementById(f);
    if (el) el.value = '';
  });
  if (id && state.contractTemplates) delete state.contractTemplates[id];
  save();
  renderContractTemplates();
}

function closeContractEditor() {
  closeModal('contract-edit-modal');
}

function _getTemplate(id) {
  return CONTRACT_TEMPLATES[id] || CONTRACT_TEMPLATES.web;
}

function _defaultTemplateForLead(lead) {
  if (lead && lead.contract && lead.contract.templateId && CONTRACT_TEMPLATES[lead.contract.templateId])
    return lead.contract.templateId;
  const t = ((lead && (lead.type || lead.topic)) || '').toLowerCase();
  if (/(oldal|webshop|shop|web|portál|portal|landing|honlap|karbantart)/.test(t)) return 'web';
  if (/(fotó|foto|videó|video|film|kép)/.test(t)) return 'photo';
  if (/(tartalom|szöveg|szoveg|marketing|közösség|kozosseg|social|blog|hírlevél|hirlevel)/.test(t)) return 'content';
  if (/(épít|epit|kivitelez|felújít|felujit|burkol|festés|festes|víz|viz|villany|tető|teto)/.test(t))
    return 'construction';
  return 'web';
}

function currentContractTemplateId() {
  const sel = document.getElementById('contract-template');
  if (sel && sel.value && CONTRACT_TEMPLATES[sel.value]) return sel.value;
  const id = document.getElementById('contract-lead-id');
  const lead = id && state.leads[id.value];
  return _defaultTemplateForLead(lead || null);
}

function populateContractTemplateSelect(selectedId) {
  const sel = document.getElementById('contract-template');
  if (!sel) return;
  sel.innerHTML = CONTRACT_TEMPLATE_ORDER.map(
    (k) => '<option value="' + k + '">' + escHtml(CONTRACT_TEMPLATES[k].label) + '</option>'
  ).join('');
  if (selectedId && CONTRACT_TEMPLATES[selectedId]) sel.value = selectedId;
  onContractTemplateChange();
}

function onContractTemplateChange() {
  const note = document.getElementById('contract-template-note');
  if (!note) return;
  const tpl = _getTemplate(currentContractTemplateId());
  const typeLbl = tpl.type === 'megbizasi' ? 'megbízási (gondossági kötelem)' : 'vállalkozási (eredménykötelem)';
  note.textContent = 'Jogi típus: ' + typeLbl + ' — ' + tpl.subtitle + '.';
}

function buildContractInner(ctx, tplId) {
  const tpl = _getTemplate(tplId || 'web');
  const roles = _roles(tpl);
  ctx.def = _getContractSettings(tpl.id);
  const d = ctx.def || {};
  const sections = tpl.build(ctx, roles);
  if (_optval(d.extra)) {
    const body = _optval(d.extra)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => _P(escHtml(l)))
      .join('');
    sections.splice(Math.max(0, sections.length - 1), 0, { t: 'Egyedi kikötések', body: body });
  }
  let n = 0;
  const secHtml = sections
    .map((s) => '<h2 style="font-size:14px;margin:20px 0 6px">' + ++n + '. ' + escHtml(s.t) + '</h2>' + s.body)
    .join('');
  const introHtml = _optval(d.intro) ? _P('<strong>Kiegészítő rendelkezés:</strong> ' + escHtml(_optval(d.intro))) : '';
  return (
    _disclaimer() +
    _titleBlock(tpl) +
    _partiesBlock(ctx, roles, tpl) +
    introHtml +
    secHtml +
    _signaturesBlock(ctx, roles) +
    (tpl.appendices ? tpl.appendices(ctx) : '') +
    _reminderNote()
  );
}

function buildContractDoc(ctx, tplId) {
  const tpl = _getTemplate(tplId || 'web');
  return (
    '<!DOCTYPE html><html lang="hu"><head><meta charset="UTF-8"><title>' +
    escHtml(tpl.docType) +
    ' — ' +
    escHtml(ctx.o.nev) +
    '</title>' +
    "<style>@page{margin:16mm}body{font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#1a1a1a;max-width:820px;margin:0 auto;padding:28px 24px}h1,h2{color:#171c28}" +
    '.print-btn{position:fixed;top:14px;right:14px;background:#3b5bdb;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer}' +
    '.edit-hint{position:sticky;top:0;background:#eef1fb;border:1px solid #c9d4f5;color:#2c3e66;border-radius:8px;padding:8px 12px;margin-bottom:14px;font-size:12px}' +
    '#doc:focus{outline:none}' +
    '@media print{.print-btn,.edit-hint{display:none}.c-disclaimer{border-color:#d9a441}}</style></head><body>' +
    '<button class="print-btn" onclick="window.print()">Nyomtatás / Mentés PDF-ként</button>' +
    '<div class="edit-hint">✎ Ez a nézet <strong>szerkeszthető</strong>: kattints bárhová, és írd át a szöveget vagy a [ ] részeket, mielőtt nyomtatsz / PDF-be mentesz. (A módosítás csak ebben az ablakban él, a Rendlibe nem mentődik vissza.)</div>' +
    '<div id="doc" contenteditable="true">' +
    buildContractInner(ctx, tpl.id) +
    '</div>' +
    '</body></html>'
  );
}

function printContractTemplate(tplId) {
  const html = buildContractDoc(_contractCtx({}), tplId || 'web');
  const win = window.open('', '_blank', 'width=900,height=1160');
  if (!win) {
    uiAlert('A böngésző blokkolta a felugró ablakot. Engedélyezd az oldal számára.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

function printContract(leadId) {
  const lead = state.leads[leadId];
  if (!lead) return;
  const html = buildContractDoc(_contractCtx(lead), currentContractTemplateId());
  const win = window.open('', '_blank', 'width=900,height=1160');
  if (!win) {
    uiAlert('A böngésző blokkolta a felugró ablakot. Engedélyezd az oldal számára.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

function openContractModal(leadId) {
  const lead = state.leads[leadId];
  if (!lead) return;
  if (typeof canSendContract === 'function' && !canSendContract(lead)) {
    uiAlert(
      'Szerződést csak azután állíthatsz elő, hogy az árajánlat kiment, és a megrendelő elfogadta. Állítsd előbb „Ajánlat elfogadva” állapotra.',
      {
        title: 'Előbb elfogadott ajánlat kell'
      }
    );
    return;
  }
  document.getElementById('contract-lead-id').value = leadId;
  const nm = document.getElementById('contract-to-name');
  const em = document.getElementById('contract-to-email');
  if (nm) nm.textContent = lead.name || '—';
  if (em) em.textContent = lead.email || '(nincs e-mail cím)';
  populateContractTemplateSelect(_defaultTemplateForLead(lead));
  const note = document.getElementById('contract-note');
  if (note) {
    note.textContent = '';
    note.className = 'mode-note';
  }
  openModal('contract-modal');
}

function closeContractModal() {
  closeModal('contract-modal');
  renderLeadsTable();
}

async function sendContract() {
  const id = document.getElementById('contract-lead-id').value;
  const lead = state.leads[id];
  const noteEl = document.getElementById('contract-note');
  const setNote = (m, err) => {
    if (noteEl) {
      noteEl.textContent = m;
      noteEl.className = 'mode-note';
      noteEl.style.color = err ? 'var(--red)' : 'var(--accent2)';
    }
  };
  if (!lead) return;
  if (!lead.email) {
    setNote('Ehhez a megkereséshez nincs e-mail cím — nem küldhető szerződés.', true);
    return;
  }
  if (!emailjsReady()) {
    setNote('Az EmailJS nincs beállítva (EMAILJS_CFG). Lásd: BEALLITAS-EmailJS.txt', true);
    return;
  }
  const tplId = currentContractTemplateId();
  const tpl = _getTemplate(tplId);
  const ctx = _contractCtx(lead);
  const si = state.sellerInfo || {};
  const bizName = si.name || 'Rendli';
  const ownerMail = si.email || (LocalStore.currentUser && LocalStore.currentUser.email) || '';
  const details = buildContractInner(ctx, tplId);
  const btn = document.getElementById('contract-send-btn');
  if (btn) btn.disabled = true;
  setNote('Küldés folyamatban…', false);
  const params = {
    to_email: lead.email,
    to_name: lead.name || '',
    from_name: bizName,
    brand_initial: (bizName.trim()[0] || 'R').toUpperCase(),
    tagline: tpl.docType,
    reply_to: ownerMail,
    subject: tpl.docType + ' – ' + bizName,
    heading: tpl.docType,
    intro:
      'Köszönjük, hogy elfogadtad az árajánlatot! Mellékeljük a szerződést. Kérjük, olvasd át; kérdés vagy elfogadás esetén válaszolj erre az e-mailre.',
    details: details,
    action_mail: ownerMail
  };
  try {
    await emailjsSend(EMAILJS_CFG.templateContract, params);
    lead.status = 'szerzodes';
    lead.contract = {
      sentAt: new Date().toISOString(),
      templateId: tplId
    };
    save();
    renderLeadsTable();
    updateLeadBadge();
    closeModal('contract-modal');
    uiAlert(
      'A szerződést (' +
        tpl.docType.toLowerCase() +
        ') elküldtük ' +
        (lead.name || 'a megrendelőnek') +
        ' részére. A státusz: „Szerződéskötésre vár".',
      {
        title: 'Szerződés elküldve'
      }
    );
  } catch (err) {
    setNote('A küldés nem sikerült: ' + ((err && err.message) || 'ismeretlen hiba') + '.', true);
  } finally {
    if (btn) btn.disabled = false;
  }
}
