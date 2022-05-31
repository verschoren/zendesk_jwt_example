var jwt = require("jwt-simple");

// 3 functions from https://github.com/tsndr/cloudflare-worker-jwt
function base64URLParse(s) {
  return new Uint8Array(
    Array.prototype.map.call(
      atob(s.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "")),
      (c) => c.charCodeAt(0)
    )
  );
}
function base64URLStringify(a) {
  return btoa(String.fromCharCode.apply(0, a))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
function utf8ToUint8Array(s) {
  return base64URLParse(btoa(unescape(encodeURIComponent(s))));
}

addEventListener("fetch", function (event) {
  const { request } = event;
  const response = handleRequest(request).catch(handleError);
  event.respondWith(response);
});

async function handleRequest(request) {
  const { method, url } = request;
  const { host, pathname } = new URL(url);

  const json = await request.json();
  console.log(json);

  switch (pathname) {
    case "/":
      return new Response("Bad path", { status: 401 });
    case "/chat":
      return respondChat(json);
    case "/sdk":
      return await respondSDK(json);
    case "/guide":
      var response_guide = await respondGuide(json);
      response_guide.headers.set("access-control-allow-origin", "*");
      return response_guide;
    case "/messaging":
      var response_messaging = await respondMessaging(json);
      response_messaging.headers.set("access-control-allow-origin", "*");
      return response_messaging;
  }
}

function respondChat(json) {
  //{"name":"Thomas Verschoren","email":"thomas@verschoren.com","external_id":"123456"}
  if (!json.name || !json.email || !json.external_id) {
    return new Response("missing parameters", { status: 401 });
  } else {
    var secret = "abc123";

    var token_raw = {
      iat: Math.floor(Date.now() / 1000),
      name: json.name,
      external_id: json.external_id,
      email: json.email,
    };
    console.log(token_raw);

    var token = jwt.encode(token_raw, secret);

    return new Response('{"jwt": "' + token + '"}');
  }
}

async function respondSDK(json) {
  //{"user_token":"thomas@verschoren.com"}

  if (!json.user_token) {
    return new Response("missing parameters", { status: 401 });
  } else {
    var secret = "abc123";

    var token_raw = {
      jti: Math.floor(Math.random() * 10000000),
      iat: Math.floor(Date.now() / 1000),
      name: json.user_token,
      email: json.user_token,
    };
    console.log(token_raw);

    var token = jwt.encode(token_raw, secret);

    return new Response('{"jwt": "' + token + '"}');
  }
}

async function respondGuide(json) {
  //{"external_id":1906365876753,"user_email":"thomas@verschoren.com","user_name":"Thomas Verschoren"}

  if (!json.external_id || !json.user_email || !json.user_name) {
    return new Response("missing parameters", { status: 401 });
  } else {
    var secret = "abc123";

    var token_raw = {
      jti: Math.floor(Math.random() * 10000000),
      iat: Math.floor(Date.now() / 1000),
      name: json.user_name,
      email: json.user_email,
    };
    console.log(token_raw);

    var token = jwt.encode(token_raw, secret);
    var payload = token;
    console.log(payload);
    return new Response(payload);
  }
}

async function respondMessaging(json) {
  //{"external_id":1906365876753,"user_email":"thomas@verschoren.com","user_name":"Thomas Verschoren"}

  if (!json.external_id || !json.user_email || !json.user_name) {
    return new Response("missing parameters", { status: 401 });
  } else {
    var app_id = "app_123";
    var secret ="abc123";

    const key = await crypto.subtle.importKey(
      "raw",
      utf8ToUint8Array(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const header = JSON.stringify({ alg: "HS256", typ: "JWT", kid: app_id });

    //exp = now + 24h
    const payload = JSON.stringify({
      scope: "user",
      name: json.user_name,
      email: json.user_email,
      external_id: json.external_id,
      exp: Math.floor(new Date().getTime() / 1000.0) + 86400,
    });

    const partialToken = `${base64URLStringify(
      utf8ToUint8Array(header)
    )}.${base64URLStringify(utf8ToUint8Array(payload))}`;
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      utf8ToUint8Array(partialToken)
    );
    const jwt = `${partialToken}.${base64URLStringify(
      new Uint8Array(signature)
    )}`;
    console.log(jwt);

    return new Response(jwt);
  }
}

function handleError(error) {
  console.error("Uncaught error:", error);

  const { stack } = error;
  return new Response(stack || error, { status: 401 });
}
