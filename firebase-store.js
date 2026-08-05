/* ------------------------------------------------------------------
   firebase-store.js — Firebase Authentication + Cloud Firestore tárolás.
   Ugyanazt a window.LocalStore API-t adja, mint a korábbi localStorage-os
   változat, de a felhőben tárol: fiókonként egy dokumentum: vaults/{uid}.
   A form-konfiguráció a form_configs/{uid} publikus dokumentumba kerül.
   (A beérkező rendelések Firestore-inboxa — leads.js + widget — külön
   lépésben, a "B rész"-ben készül; addig a kvGet inbox üres listát ad.)
   Előfeltétel (index.html): a firebase-app/-auth/-firestore compat SDK
   betöltve, és lefutott a firebase.initializeApp(firebaseConfig).
   ------------------------------------------------------------------ */
(function () {
  var auth = firebase.auth();
  var db = firebase.firestore();

  function userObj(u) { return u ? { email: u.email, name: u.displayName || '' } : null; }

  var LocalStore = {
    init: function () { return this; },
    start: function () {},

    get currentUser() { return userObj(auth.currentUser); },

    onAuthChange: function (cb) {
      if (typeof cb !== 'function') return;
      auth.onAuthStateChanged(function (u) {
        try { cb(userObj(u)); } catch (e) { console.error('[Rendli] auth listener hiba:', e); }
      });
    },

    login: function (email, pass) {
      return auth.signInWithEmailAndPassword((email || '').trim(), pass);
    },

    register: function (email, pass, name) {
      return auth.createUserWithEmailAndPassword((email || '').trim(), pass)
        .then(function (cred) { if (name) return cred.user.updateProfile({ displayName: name }); });
    },

    logout: function () { return auth.signOut(); },

    resetPassword: function (email) {
      return auth.sendPasswordResetEmail((email || '').trim());
    },

    reauth: function (currentPass) {
      var u = auth.currentUser;
      if (!u) return Promise.reject({ code: 'no-user' });
      var cred = firebase.auth.EmailAuthProvider.credential(u.email, currentPass);
      return u.reauthenticateWithCredential(cred);
    },

    updatePassword: function (newPass) {
      var u = auth.currentUser;
      if (!u) return Promise.reject({ code: 'no-user' });
      return u.updatePassword(newPass);
    },

    updateProfileName: function (name) {
      var u = auth.currentUser;
      if (!u) return Promise.resolve();
      return u.updateProfile({ displayName: name || '' });
    },

    uid: function () { return auth.currentUser ? auth.currentUser.uid : ''; },

    /* Per-user adat-vault: vaults/{uid} egyetlen dokumentum. */
    loadVault: function () {
      var u = auth.currentUser;
      if (!u) return Promise.resolve(null);
      return db.collection('vaults').doc(u.uid).get()
        .then(function (doc) { return doc.exists ? doc.data() : null; });
    },

    saveVault: function (obj) {
      var u = auth.currentUser;
      if (!u) return Promise.resolve();
      var clean;
      try { clean = JSON.parse(JSON.stringify(obj)); } catch (e) { clean = obj; }
      return db.collection('vaults').doc(u.uid).set(clean)
        .catch(function (e) { console.error('[Rendli] mentés hiba:', e); });
    },

    /* Általános kulcs-érték tár.
       - 'formcfg_<uid>'  → a form_configs/{uid} publikus dokumentumba írja.
       - inbox olvasás     → egyelőre üres (a Firestore-inbox a B részben jön). */
    kvGet: function (key, def) { return def; },
    kvSet: function (key, val) {
      var u = auth.currentUser;
      if (!u) return;
      if (typeof key === 'string' && key.indexOf('formcfg_') === 0) {
        var clean;
        try { clean = JSON.parse(JSON.stringify(val)); } catch (e) { clean = val; }
        db.collection('form_configs').doc(u.uid).set(clean)
          .catch(function (e) { console.warn('[Rendli] form_config közzététel:', e); });
      }
    },
    kvKey: function (key) { return 'ls_rendli_' + key; }
  };

  window.LocalStore = LocalStore;
})();
