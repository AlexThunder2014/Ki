import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";

const KEY = "AI_BUILDER_V2";

const defaults = {
  theme: "dark",
  projectName: "Mein AI-Projekt",
  activeFile: "index.html",
  mode: "auto",
  endpoint: "",
  responseStyle: "Hilfreich & ausführlich",
  autoPlan: "Aktiv",
  messages: [],
  tasks: [],

  files: {

    "index.html": `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Mein Projekt</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<main>
<h1>Mein Projekt</h1>
<p>Hier entsteht etwas Neues.</p>
</main>

<script src="app.js"><\\/script>

</body>
</html>`,

    "style.css": `body{
margin:0;
min-height:100vh;
display:grid;
place-items:center;
font-family:system-ui;
background:#111827;
color:white
}

main{
text-align:center;
padding:40px
}`,

    "app.js": `console.log("Mein AI-Projekt läuft!");`

  }
};

let state = load();

let three = {};


/* -----------------------------
   HILFSFUNKTIONEN
----------------------------- */

function load(){

  try{

    let x = JSON.parse(
      localStorage.getItem(KEY)
    );

    return x
      ? merge(structuredClone(defaults), x)
      : structuredClone(defaults);

  }catch{

    return structuredClone(defaults);

  }

}


function merge(a,b){

  for(const k in b){

    if(
      b[k] &&
      typeof b[k] === "object" &&
      !Array.isArray(b[k]) &&
      a[k]
    ){

      a[k] = {
        ...a[k],
        ...b[k]
      };

    }else{

      a[k] = b[k];

    }

  }

  return a;

}


const $ = id =>
  document.getElementById(id);


const save = () =>
  localStorage.setItem(
    KEY,
    JSON.stringify(state)
  );


const wait = ms =>
  new Promise(
    resolve => setTimeout(resolve,ms)
  );


/* -----------------------------
   START
----------------------------- */

function init(){

  theme();
  navigation();
  chat();
  files();
  builder();
  creative();
  settings();
  render();
  init3d();

}

init();


/* -----------------------------
   THEME
----------------------------- */

function theme(){

  $("theme").textContent =
    state.theme === "dark"
      ? "☀️"
      : "🌙";

  document.body.classList.toggle(
    "light",
    state.theme === "light"
  );

}


/* -----------------------------
   NAVIGATION
----------------------------- */

function navigation(){

  document
    .querySelectorAll(".nav")
    .forEach(button => {

      button.onclick = () =>
        view(button.dataset.view);

    });


  document
    .querySelectorAll("[data-prompt]")
    .forEach(button => {

      button.onclick = () => {

        $("input").value =
          button.dataset.prompt;

        view("chat");

        $("input").focus();

      };

    });


  $("menu").onclick = () => {

    $("sidebar").classList.toggle(
      "open"
    );

  };


  $("newChat").onclick = () => {

    state.messages = [];
    state.tasks = [];

    save();
    render();

  };


  $("theme").onclick = () => {

    state.theme =
      state.theme === "dark"
        ? "light"
        : "dark";

    save();
    theme();

  };


  $("clear").onclick = () => {

    if(
      confirm(
        "Chat wirklich leeren?"
      )
    ){

      state.messages = [];
      state.tasks = [];

      save();
      render();

    }

  };

}


function view(v){

  document
    .querySelectorAll(".view")
    .forEach(x =>
      x.classList.remove("active")
    );


  $(v).classList.add("active");


  document
    .querySelectorAll(".nav")
    .forEach(x =>
      x.classList.toggle(
        "active",
        x.dataset.view === v
      )
    );


  const titles = {

    chat: "Chat",
    builder: "Builder",
    files: "Dateien",
    creative: "Bilder & 3D",
    settings: "Einstellungen"

  };


  $("title").textContent =
    titles[v];


  $("sidebar").classList.remove(
    "open"
  );


  if(v === "creative"){

    setTimeout(
      resize3d,
      50
    );

  }

}


/* -----------------------------
   CHAT
----------------------------- */

function chat(){

  document
    .querySelectorAll(".chip")
    .forEach(button => {

      button.onclick = () => {

        document
          .querySelectorAll(".chip")
          .forEach(x =>
            x.classList.remove(
              "active"
            )
          );

        button.classList.add(
          "active"
        );

        state.mode =
          button.dataset.mode;

        save();

      };

    });


  $("send").onclick = send;


  $("input").onkeydown = e => {

    if(
      e.key === "Enter" &&
      !e.shiftKey
    ){

      e.preventDefault();

      send();

    }

  };


  $("input").oninput = e => {

    e.target.style.height =
      "auto";

    e.target.style.height =
      Math.min(
        e.target.scrollHeight,
        170
      ) + "px";

  };


  $("project").oninput = e => {

    state.projectName =
      e.target.value;

    save();

  };


  $("activeFile").onchange = e => {

    state.activeFile =
      e.target.value;

    save();

    renderFiles();

  };

}


/* -----------------------------
   NACHRICHT SENDEN
----------------------------- */

async function send(){

  let text =
    $("input").value.trim();


  if(!text)
    return;


  $("input").value = "";

  $("input").style.height =
    "auto";


  add(
    "user",
    text
  );


  task(
    "Aufgabe analysieren",
    true
  );


  render();


  let reply;


  if(state.endpoint){

    try{

      reply =
        await backend(text);

    }catch(e){

      reply =
        "⚠️ Backend nicht erreichbar.\n\n" +
        "Demo-Modus:\n\n" +
        localAI(text);

    }

  }else{

    await wait(300);

    reply =
      localAI(text);

  }


  add(
    "ai",
    reply
  );


  task(
    "Antwort erstellen",
    true
  );


  save();

  render();

}


/* -----------------------------
   BACKEND
----------------------------- */

async function backend(message){

  let response =
    await fetch(
      state.endpoint,
      {

        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify({

          message,
          files:state.files,
          projectName:
            state.projectName,
          mode:
            state.mode

        })

      }
    );


  if(!response.ok)
    throw Error(
      "HTTP " +
      response.status
    );


  let data =
    await response.json();


  if(data.files){

    state.files = {
      ...state.files,
      ...data.files
    };

  }


  return (
    data.reply ||
    data.message ||
    "Keine Antwort."
  );

}


/* -----------------------------
   DEMO-KI
----------------------------- */

function localAI(t){

  let p =
    t.toLowerCase();


  /* BILD */

  if(
    state.mode === "image" ||
    /bild|grafik|bildprompt/.test(p)
  ){

    return `🖼️ Bild-Prompt

Erstelle ein hochwertiges, modernes Bild zum Thema:

${t}

Stil:
${state.responseStyle}

Klare Komposition,
professionelle Beleuchtung,
hohe Detailqualität.`;

  }


  /* 3D */

  if(
    state.mode === "3d" ||
    /3d|animation/.test(p)
  ){

    return `🧊 3D-Konzept

Three.js-Szene mit:

1. Zentralem Objekt
2. Beleuchtung
3. Kameraanimation
4. Responsiver Darstellung

Die aktuelle V2 enthält bereits
eine 3D-Vorschau.`;

  }


  /* PLAN */

  if(
    state.mode === "plan" ||
    /plan|schritte/.test(p)
  ){

    return makePlan(t);

  }


  /* PROGRAMMIERUNG */

  if(
    /html|css|javascript|website|webseite|code|spiel|programm/.test(p)
  ){

    return `💻 PROGRAMMIERUNG ERKANNT

Deine Aufgabe:

${t}

Ich würde das Projekt so aufbauen:

1. Anforderungen analysieren
2. Dateien planen
3. HTML erstellen
4. CSS erstellen
5. JavaScript programmieren
6. Funktionen testen
7. Fehler verbessern
8. Projekt exportieren

📁 Vorgeschlagene Dateien:

• index.html
• style.css
• app.js

Für eine echte autonome KI müssen
die Dateien anschließend durch ein
echtes KI-Backend generiert werden.

Der aktuelle Demo-Modus kann den
Bauplan darstellen und Dateien
verwalten.`;

  }


  return `Ich bin AI Builder V2.

Im Demo-Modus kann ich:

• Aufgaben analysieren
• Baupläne erstellen
• Projektdateien verwalten
• kreative Ideen vorbereiten
• 3D-Vorschauen anzeigen

Für echte Antworten wie bei einer
großen KI wird ein KI-Backend benötigt.

Deine Aufgabe:

${t}`;

}


/* -----------------------------
   BAUPLAN
----------------------------- */

function makePlan(goal){

  let plan =
`PROJEKT: ${state.projectName}

ZIEL
${goal}

BAUPLAN

1. Anforderungen ableiten
2. Seiten und Komponenten planen
3. HTML erstellen
4. CSS gestalten
5. JavaScript programmieren
6. Testen
7. Fehler beheben
8. Ergebnis verbessern`;

  $("plan").textContent =
    plan;

  return plan;

}


/* -----------------------------
   CHAT-NACHRICHTEN
----------------------------- */

function add(role,text){

  state.messages.push({

    role,
    text,

    time:
      new Date()
        .toLocaleTimeString(
          "de-DE",
          {
            hour:"2-digit",
            minute:"2-digit"
          }
        )

  });

}


/* -----------------------------
   AUFGABEN
----------------------------- */

function task(text,done){

  state.tasks.push({
    text,
    done
  });


  state.tasks =
    state.tasks.slice(-8);

}


/* -----------------------------
   RENDER
----------------------------- */

function render(){

  renderMessages();

  renderFiles();


  $("project").value =
    state.projectName;


  $("fc").textContent =
    Object.keys(
      state.files
    ).length;


  $("mc").textContent =
    state.messages.length;


  $("badge").textContent =
    state.endpoint
      ? "KI"
      : "Demo";


  $("status").textContent =
    state.endpoint
      ? "Backend verbunden"
      : "Demo-Modus";


  let tasks =
    $("tasks");


  tasks.innerHTML =
    state.tasks.length

      ? state.tasks
          .slice()
          .reverse()
          .map(x =>
            `<div>${
              x.done
                ? "✓"
                : "○"
            } ${esc(x.text)}</div>`
          )
          .join("")

      : "<small>Noch keine Aufgaben.</small>";

}


/* -----------------------------
   NACHRICHTEN ANZEIGEN
----------------------------- */

function renderMessages(){

  let box =
    $("messages");


  box.innerHTML = "";


  $("welcome").style.display =
    state.messages.length
      ? "none"
      : "";


  box.classList.toggle(
    "show",
    !!state.messages.length
  );


  state.messages.forEach(m => {

    let d =
      document.createElement(
        "div"
      );


    d.className =
      "msg " +
      m.role;


    d.innerHTML = `
      <div class="avatar">
        ${
          m.role === "user"
            ? "👤"
            : "✦"
        }
      </div>

      <div>

        <div class="role">
          ${
            m.role === "user"
              ? "Du"
              : "AI Builder"
          }

          ·

          ${m.time || ""}
        </div>

        <div class="msgbody"></div>

      </div>
    `;


    d.querySelector(
      ".msgbody"
    ).textContent =
      m.text;


    box.appendChild(d);

  });


  box.scrollTop =
    box.scrollHeight;

}


/* -----------------------------
   SICHERER TEXT
----------------------------- */

function esc(s){

  return String(s)
    .replace(
      /[&<>"']/g,
      c => ({

        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"

      })[c]
    );

}


/* -----------------------------
   DATEIEN
----------------------------- */

function files(){

  $("save").onclick = () => {

    state.files[
      state.activeFile
    ] =
      $("code").value;


    save();


    $("save").textContent =
      "✓ Gespeichert";


    setTimeout(
      () =>
        $("save").textContent =
          "Speichern",
      900
    );


    renderFiles();

  };


  $("newFile").onclick = () => {

    let name =
      prompt(
        "Dateiname, z. B. script.js"
      );


    if(
      name &&
      !state.files[name]
    ){

      state.files[name] =
        "";

      state.activeFile =
        name;

      save();

      renderFiles();

    }

  };


  $("export").onclick = () => {

    let bundle =
      Object
        .entries(state.files)
        .map(
          ([name,content]) =>
`===== ${name} =====
${content}`
        )
        .join("\n\n");


    let link =
      document.createElement(
        "a"
      );


    link.href =
      URL.createObjectURL(
        new Blob(
          [bundle],
          {
            type:
              "text/plain"
          }
        )
      );


    link.download =
      (
        state.projectName ||
        "AI-Projekt"
      )
      .replace(
        /\s+/g,
        "-"
      ) +
      ".txt";


    link.click();

  };

}


function renderFiles(){

  let list =
    $("filelist");


  let select =
    $("activeFile");


  list.innerHTML = "";

  select.innerHTML = "";


  Object
    .keys(state.files)
    .forEach(name => {

      let button =
        document.createElement(
          "button"
        );


      button.className =
        "fileitem" +
        (
          name ===
          state.activeFile
            ? " active"
            : ""
        );


      button.textContent =
        "📄 " + name;


      button.onclick = () => {

        state.activeFile =
          name;

        save();

        renderFiles();

      };


      list.appendChild(
        button
      );


      let option =
        document.createElement(
          "option"
        );


      option.value =
        name;


      option.textContent =
        name;


      select.appendChild(
        option
      );

    });


  select.value =
    state.activeFile;


  $("filename").textContent =
    state.activeFile;


  $("code").value =
    state.files[
      state.activeFile
    ] || "";

}


/* -----------------------------
   BUILDER
----------------------------- */

function builder(){

  $("runBuilder").onclick =
    () => {

      let plan =
        makePlan(
          $("goal")
            .value
            .trim()
        );


      task(
        "Bauplan erstellt",
        true
      );


      add(
        "ai",
        "📋 Bauplan erstellt.\n\n" +
        plan
      );


      save();

      render();

      view("chat");

    };

}


/* -----------------------------
   CREATIVE
----------------------------- */

function creative(){

  $("makePrompt").onclick =
    () => {

      $("imagePrompt").value =
`Hochwertiges ${
  $("style").value
}-Bild:

${$("idea").value ||
  "eine futuristische Szene"}.

Cinematic composition,
detaillierte Umgebung,
professionelle Beleuchtung,
starke Tiefenwirkung,
hochwertiges Ergebnis.`;

    };


  $("rotate").onclick =
    () => {

      three.auto =
        !three.auto;

    };


  $("reset3d").onclick =
    () => {

      if(three.mesh){

        three.mesh.rotation.set(
          0,
          0,
          0
        );

        three.camera.position.z =
          4;

      }

    };

}


/* -----------------------------
   EINSTELLUNGEN
----------------------------- */

function settings(){

  $("endpoint").value =
    state.endpoint;


  $("responseStyle").value =
    state.responseStyle;


  $("autoPlan").value =
    state.autoPlan;


  $("saveEndpoint").onclick =
    () => {

      state.endpoint =
        $("endpoint")
          .value
          .trim();


      save();

      render();

      renderSettings();

    };


  $("responseStyle").onchange =
    e => {

      state.responseStyle =
        e.target.value;

      save();

    };


  $("autoPlan").onchange =
    e => {

      state.autoPlan =
        e.target.value;

      save();

    };


  $("reset").onclick =
    () => {

      if(
        confirm(
          "Wirklich alles löschen?"
        )
      ){

        localStorage.removeItem(
          KEY
        );

        location.reload();

      }

    };


  renderSettings();

}


function renderSettings(){

  $("endpointState").textContent =
    state.endpoint
      ? "Backend gespeichert."
      : "Kein Backend – Demo-Modus.";

}


/* -----------------------------
   THREE.JS
----------------------------- */

function init3d(){

  let host =
    $("three");


  let scene =
    new THREE.Scene();


  let camera =
    new THREE.PerspectiveCamera(
      55,
      1,
      0.1,
      100
    );


  camera.position.z =
    4;


  let renderer =
    new THREE.WebGLRenderer({
      antialias:true,
      alpha:true
    });


  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      2
    )
  );


  renderer.setClearColor(
    0,
    0
  );


  host.appendChild(
    renderer.domElement
  );


  let geometry =
    new THREE.IcosahedronGeometry(
      1.05,
      1
    );


  let material =
    new THREE.MeshStandardMaterial({
      metalness:0.45,
      roughness:0.25
    });


  let mesh =
    new THREE.Mesh(
      geometry,
      material
    );


  scene.add(mesh);


  let light =
    new THREE.PointLight(
      0xffffff,
      2.5,
      10
    );


  light.position.set(
    2,
    2,
    3
  );


  scene.add(light);


  scene.add(
    new THREE.AmbientLight(
      0xffffff,
      0.6
    )
  );


  three = {
    scene,
    camera,
    renderer,
    mesh,
    auto:true
  };


  function loop(){

    requestAnimationFrame(
      loop
    );


    if(three.auto){

      mesh.rotation.x +=
        0.006;

      mesh.rotation.y +=
        0.012;

    }


    renderer.render(
      scene,
      camera
    );

  }


  loop();

  resize3d();


  new ResizeObserver(
    resize3d
  ).observe(host);

}


function resize3d(){

  if(!three.renderer)
    return;


  let host =
    $("three");


  let width =
    Math.max(
      host.clientWidth,
      1
    );


  let height =
    Math.max(
      host.clientHeight,
      1
    );


  three.renderer.setSize(
    width,
    height,
    false
  );


  three.camera.aspect =
    width / height;


  three.camera.updateProjectionMatrix();

}


window.addEventListener(
  "resize",
  resize3d
);
