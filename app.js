import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js";


/* =========================================
   AI BUILDER V3
========================================= */

const KEY = "AI_BUILDER_V3";


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


/* =========================================
   SPEICHER
========================================= */

function load(){

  try{

    const saved =
      JSON.parse(
        localStorage.getItem(KEY)
      );

    return saved
      ? merge(
          structuredClone(defaults),
          saved
        )
      : structuredClone(defaults);

  }catch{

    return structuredClone(defaults);

  }

}


function merge(a,b){

  for(const key in b){

    if(
      b[key] &&
      typeof b[key] === "object" &&
      !Array.isArray(b[key]) &&
      a[key]
    ){

      a[key] = {
        ...a[key],
        ...b[key]
      };

    }else{

      a[key] = b[key];

    }

  }

  return a;

}


const $ = id =>
  document.getElementById(id);


function save(){

  localStorage.setItem(
    KEY,
    JSON.stringify(state)
  );

}


function wait(ms){

  return new Promise(
    resolve =>
      setTimeout(resolve,ms)
  );

}


/* =========================================
   START
========================================= */

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


/* =========================================
   THEME
========================================= */

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


/* =========================================
   NAVIGATION
========================================= */

function navigation(){

  document
    .querySelectorAll(".nav")
    .forEach(button => {

      button.onclick = () =>
        view(
          button.dataset.view
        );

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

    $("sidebar")
      .classList
      .toggle("open");

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
      x.classList.remove(
        "active"
      )
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


  $("sidebar")
    .classList
    .remove("open");


  if(v === "creative"){

    setTimeout(
      resize3d,
      50
    );

  }

}


/* =========================================
   CHAT
========================================= */

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


/* =========================================
   SENDEN
========================================= */

async function send(){

  const text =
    $("input")
      .value
      .trim();


  if(!text)
    return;


  $("input").value = "";

  $("input").style.height =
    "auto";


  addMessage(
    "user",
    text
  );


  addTask(
    "Aufgabe analysieren",
    true
  );


  render();


  let result;


  if(state.endpoint){

    try{

      result =
        await backend(text);

    }catch(error){

      result = {

        text:
          "⚠️ Das Backend konnte nicht erreicht werden.\n\n" +
          "Ich nutze deshalb den Demo-Modus.\n\n" +
          localAI(text).text,

        code:
          localAI(text).code,

        language:
          localAI(text).language,

        file:
          localAI(text).file,

        image:
          null

      };

    }

  }else{

    await wait(350);

    result =
      localAI(text);

  }


  addMessage(
    "ai",
    result.text,
    result.code,
    result.language,
    result.file,
    result.image
  );


  addTask(
    "Antwort erstellt",
    true
  );


  save();

  render();

}


/* =========================================
   BACKEND
========================================= */

async function backend(message){

  const response =
    await fetch(
      state.endpoint,
      {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          message,

          files:
            state.files,

          projectName:
            state.projectName,

          mode:
            state.mode

        })

      }
    );


  if(!response.ok){

    throw new Error(
      "HTTP " +
      response.status
    );

  }


  const data =
    await response.json();


  if(data.files){

    state.files = {

      ...state.files,

      ...data.files

    };

  }


  return {

    text:
      data.reply ||
      data.message ||
      "Keine Antwort.",

    code:
      data.code ||
      null,

    language:
      data.language ||
      "javascript",

    file:
      data.file ||
      null,

    image:
      data.imageUrl ||
      data.image ||
      null

  };

}


/* =========================================
   DEMO-KI
========================================= */

function localAI(text){

  const p =
    text.toLowerCase();


  /* BILD */

  if(
    state.mode === "image" ||
    /bild|bild erstellen|grafik|illustration|foto|image/.test(p)
  ){

    const prompt =
`Erstelle ein hochwertiges ${getImageStyle()}-Bild.

Thema:
${text}

Stil:
Modern, detailliert, professionelle Beleuchtung,
klare Komposition, starke Tiefenwirkung,
hochwertige Darstellung.

Format:
16:9`;

    return {

      text:
`🖼️ Bild-Anfrage erkannt.

Ich habe einen Bild-Prompt für deine Anfrage erstellt.

Im echten KI-Modus kann dein Backend
hier anschließend ein echtes Bild zurückgeben.`,

      code:
null,

      language:
null,

      file:
null,

      image:
createDemoImage(text)

    };

  }


  /* 3D */

  if(
    state.mode === "3d" ||
    /3d|three\.js|dreidimensional/.test(p)
  ){

    return {

      text:
`🧊 3D-Modus

Ich würde dafür eine Three.js-Szene erstellen.

Die aktuelle V3 besitzt bereits
eine interaktive 3D-Vorschau.

Wenn du eine echte 3D-Programmierung
möchtest, kann das Backend den
vollständigen Three.js-Code erzeugen.`,

      code:
`const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

camera.position.z = 5;

const geometry =
  new THREE.IcosahedronGeometry(1, 2);

const material =
  new THREE.MeshStandardMaterial({
    metalness: 0.5,
    roughness: 0.25
  });

const mesh =
  new THREE.Mesh(
    geometry,
    material
  );

scene.add(mesh);`,

      language:
"javascript",

      file:
"scene.js",

      image:
null

    };

  }


  /* PLAN */

  if(
    state.mode === "plan" ||
    /plan|bauplan|schritte|projekt planen/.test(p)
  ){

    const plan =
      makePlan(text);


    return {

      text:
"📋 Bauplan erstellt.\n\n" +
plan,

      code:
null,

      language:
null,

      file:
null,

      image:
null

    };

  }


  /* CODE */

  if(
    state.mode === "code" ||
    /programmiere|programmier|code|html|css|javascript|website|webseite|browser-spiel|spiel|app|app programmieren/.test(p)
  ){

    return generateDemoCode(
      text
    );

  }


  /* AUTO */

  return {

    text:
`🤖 AI Builder V3

Ich habe deine Aufgabe verstanden:

"${text}"

Wähle unten einen Modus:

💻 Code
🖼️ Bild
🧊 3D
📋 Plan

Oder verbinde ein echtes KI-Backend.
Dann kann die V3 echte KI-Antworten,
Code und Bilder verarbeiten.`,

    code:
null,

    language:
null,

    file:
null,

    image:
null

  };

}


/* =========================================
   DEMO CODE GENERIEREN
========================================= */

function generateDemoCode(request){

  const p =
    request.toLowerCase();


  /* SPIEL */

  if(
    /spiel|game|jump|highscore/.test(p)
  ){

    const html =
`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mein Browser-Spiel</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<div class="game">
  <h1>🎮 Mein Spiel</h1>
  <p>Punkte: <span id="score">0</span></p>
  <button id="play">Punkt sammeln</button>
</div>

<script src="game.js"><\\/script>

</body>
</html>`;


    const css =
`body{
margin:0;
min-height:100vh;
display:grid;
place-items:center;
font-family:system-ui;
background:#101827;
color:white;
}

.game{
text-align:center;
padding:40px;
border-radius:20px;
background:#182235;
}

button{
padding:12px 20px;
border:0;
border-radius:10px;
cursor:pointer;
}`;


    const js =
`let score = 0;

const scoreElement =
  document.getElementById("score");

document
  .getElementById("play")
  .addEventListener("click", () => {

    score++;

    scoreElement.textContent =
      score;

  });`;


    state.files["index.html"] =
      html;

    state.files["style.css"] =
      css;

    state.files["game.js"] =
      js;


    state.activeFile =
      "index.html";


    return {

      text:
`💻 Browser-Spiel programmiert!

Ich habe drei Dateien erstellt:

📄 index.html
📄 style.css
📄 game.js

Der Code wird direkt im Chat
als echte Code-Blöcke angezeigt
und gleichzeitig im Projekt gespeichert.`,

      code:
html,

      language:
"html",

      file:
"index.html",

      image:
null

    };

  }


  /* WEBSEITE */

  if(
    /website|webseite|homepage|portfolio/.test(p)
  ){

    const html =
`<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Meine Webseite</title>
<link rel="stylesheet" href="style.css">
</head>

<body>

<header>
  <nav>
    <strong>Meine Webseite</strong>
  </nav>
</header>

<main>

<section class="hero">
  <h1>Willkommen</h1>
  <p>Meine moderne Webseite.</p>
  <button id="start">Loslegen</button>
</section>

</main>

<script src="app.js"><\\/script>

</body>
</html>`;


    const css =
`*{
box-sizing:border-box;
}

body{
margin:0;
font-family:system-ui;
background:#0b1020;
color:white;
}

header{
padding:20px;
background:#111827;
}

.hero{
min-height:80vh;
display:grid;
place-items:center;
text-align:center;
padding:30px;
}

.hero h1{
font-size:clamp(40px,8vw,80px);
margin:0;
}

button{
border:0;
padding:13px 22px;
border-radius:12px;
background:#7657ff;
color:white;
cursor:pointer;
}`;


    const js =
`document
  .getElementById("start")
  .addEventListener("click", () => {

    alert("Willkommen auf deiner Webseite!");

  });`;


    state.files["index.html"] =
      html;

    state.files["style.css"] =
      css;

    state.files["app.js"] =
      js;


    state.activeFile =
      "index.html";


    return {

      text:
`💻 Webseite programmiert!

Erstellt wurden:

📄 index.html
📄 style.css
📄 app.js

Der Code steht direkt unten
in einem kopierbaren Code-Block.`,

      code:
html,

      language:
"html",

      file:
"index.html",

      image:
null

    };

  }


  /* STANDARD JAVASCRIPT */

  const code =
`function startProject(){

  const message =
    "Hallo von AI Builder V3!";

  console.log(message);

}

startProject();`;


  state.files["app.js"] =
    code;


  state.activeFile =
    "app.js";


  return {

    text:
`💻 Programmierung erkannt.

Ich habe JavaScript-Code für deine
Aufgabe vorbereitet.

Die Datei wurde außerdem im
Projekt gespeichert.`,

    code,

    language:
"javascript",

    file:
"app.js",

    image:
null

  };

}


/* =========================================
   BILD-STIL
========================================= */

function getImageStyle(){

  const select =
    $("style");


  return select
    ? select.value
    : "Cinematic";

}


/* =========================================
   DEMO-BILD
========================================= */

function createDemoImage(text){

  const title =
    escapeSvg(
      text
        .replace(
          /\s+/g,
          " "
        )
        .slice(
          0,
          70
        )
    );


  const svg =
`<svg xmlns="http://www.w3.org/2000/svg"
width="1200"
height="675"
viewBox="0 0 1200 675">

<defs>

<linearGradient
id="bg"
x1="0"
y1="0"
x2="1"
y2="1">

<stop
offset="0%"
stop-color="#15102f"/>

<stop
offset="50%"
stop-color="#283b78"/>

<stop
offset="100%"
stop-color="#071b2d"/>

</linearGradient>

</defs>

<rect
width="1200"
height="675"
fill="url(#bg)"/>

<circle
cx="900"
cy="180"
r="90"
fill="#ffffff"
opacity=".15"/>

<circle
cx="300"
cy="400"
r="170"
fill="#7657ff"
opacity=".18"/>

<text
x="600"
y="310"
text-anchor="middle"
font-family="Arial"
font-size="42"
font-weight="bold"
fill="white">
AI Builder V3
</text>

<text
x="600"
y="370"
text-anchor="middle"
font-family="Arial"
font-size="24"
fill="#dbeafe">
${title}
</text>

<text
x="600"
y="600"
text-anchor="middle"
font-family="Arial"
font-size="18"
fill="#a5b4fc">
DEMO-BILDVORSCHAU
</text>

</svg>`;


  return (
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(svg)
  );

}


function escapeSvg(text){

  return String(text)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    );

}


/* =========================================
   NACHRICHT HINZUFÜGEN
========================================= */

function addMessage(
  role,
  text,
  code = null,
  language = null,
  file = null,
  image = null
){

  state.messages.push({

    role,

    text,

    code,

    language,

    file,

    image,

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


/* =========================================
   TASK
========================================= */

function addTask(text,done){

  state.tasks.push({

    text,

    done

  });


  state.tasks =
    state.tasks.slice(-8);

}


/* =========================================
   RENDER
========================================= */

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


  const tasks =
    $("tasks");


  tasks.innerHTML =
    state.tasks.length

      ? state.tasks
          .slice()
          .reverse()
          .map(
            task =>
              `<div>${
                task.done
                  ? "✓"
                  : "○"
              } ${escapeHtml(task.text)}</div>`
          )
          .join("")

      : "<small>Noch keine Aufgaben.</small>";

}


/* =========================================
   NACHRICHTEN RENDERN
========================================= */

function renderMessages(){

  const box =
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


  state.messages.forEach(message => {

    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.className =
      "msg " +
      message.role;


    const avatar =
      message.role === "user"
        ? "👤"
        : "✦";


    wrapper.innerHTML = `

      <div class="avatar">
        ${avatar}
      </div>

      <div class="messageContent">

        <div class="role">
          ${
            message.role === "user"
              ? "Du"
              : "AI Builder"
          }
          ·
          ${message.time || ""}
        </div>

        <div class="msgbody"></div>

      </div>

    `;


    const body =
      wrapper.querySelector(
        ".msgbody"
      );


    body.textContent =
      message.text || "";


    /* CODE */

    if(message.code){

      const block =
        createCodeBlock(
          message.code,
          message.language,
          message.file
        );


      body.appendChild(
        block
      );

    }


    /* BILD */

    if(message.image){

      const image =
        createImageBlock(
          message.image
        );


      body.appendChild(
        image
      );

    }


    box.appendChild(
      wrapper
    );

  });


  box.scrollTop =
    box.scrollHeight;

}


/* =========================================
   CODE-BLOCK
========================================= */

function createCodeBlock(
  code,
  language,
  file
){

  const container =
    document.createElement(
      "div"
    );


  container.className =
    "codeblock";


  const header =
    document.createElement(
      "div"
    );


  header.className =
    "codehead";


  const label =
    document.createElement(
      "span"
    );


  label.className =
    "code-language";


  label.textContent =
    file
      ? `${language || "code"} · ${file}`
      : language ||
        "code";


  const copy =
    document.createElement(
      "button"
    );


  copy.className =
    "copycode";


  copy.textContent =
    "📋 Kopieren";


  copy.onclick = async () => {

    try{

      await navigator.clipboard.writeText(
        code
      );

      copy.textContent =
        "✓ Kopiert";

      setTimeout(
        () =>
          copy.textContent =
            "📋 Kopieren",
        1200
      );

    }catch{

      copy.textContent =
        "Kopieren nicht möglich";

    }

  };


  header.appendChild(
    label
  );

  header.appendChild(
    copy
  );


  const pre =
    document.createElement(
      "pre"
    );


  const codeElement =
    document.createElement(
      "code"
    );


  codeElement.textContent =
    code;


  pre.appendChild(
    codeElement
  );


  container.appendChild(
    header
  );

  container.appendChild(
    pre
  );


  return container;

}


/* =========================================
   BILD-BLOCK
========================================= */

function createImageBlock(
  source
){

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "image-result";


  const image =
    document.createElement(
      "img"
    );


  image.src =
    source;


  image.alt =
    "AI Builder Bild";


  const caption =
    document.createElement(
      "div"
    );


  caption.className =
    "image-caption";


  caption.textContent =
    "🖼️ Bildvorschau";


  wrapper.appendChild(
    image
  );

  wrapper.appendChild(
    caption
  );


  return wrapper;

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(text){

  return String(text)
    .replace(
      /[&<>"']/g,
      char =>
        ({
          "&":"&amp;",
          "<":"&lt;",
          ">":"&gt;",
          '"':"&quot;",
          "'":"&#39;"
        })[char]
    );

}


/* =========================================
   DATEIEN
========================================= */

function files(){

  $("save").onclick =
    () => {

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


  $("newFile").onclick =
    () => {

      const name =
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


  $("export").onclick =
    () => {

      const bundle =
        Object
          .entries(
            state.files
          )
          .map(
            ([name,content]) =>
`===== ${name} =====
${content}`
          )
          .join(
            "\n\n"
          );


      const link =
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

  const list =
    $("filelist");


  const select =
    $("activeFile");


  list.innerHTML = "";

  select.innerHTML = "";


  Object
    .keys(
      state.files
    )
    .forEach(name => {

      const button =
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


      button.onclick =
        () => {

          state.activeFile =
            name;

          save();

          renderFiles();

        };


      list.appendChild(
        button
      );


      const option =
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


/* =========================================
   BUILDER
========================================= */

function builder(){

  $("runBuilder").onclick =
    () => {

      const plan =
        makePlan(
          $("goal")
            .value
            .trim()
        );


      addTask(
        "Bauplan erstellt",
        true
      );


      addMessage(
        "ai",
        "📋 Bauplan erstellt.\n\n" +
        plan
      );


      save();

      render();

      view("chat");

    };

}


function makePlan(goal){

  const plan =
`PROJEKT
${state.projectName}

ZIEL
${goal}

BAUPLAN

1. Anforderungen analysieren
2. Seiten und Komponenten planen
3. HTML erstellen
4. CSS gestalten
5. JavaScript programmieren
6. Funktionen testen
7. Fehler beheben
8. Ergebnis verbessern
9. Projektdateien speichern
10. Ergebnis veröffentlichen`;

  $("plan").textContent =
    plan;


  return plan;

}


/* =========================================
   CREATIVE
========================================= */

function creative(){

  $("makePrompt").onclick =
    () => {

      const subject =
        $("idea")
          .value
          .trim() ||
        "eine futuristische Szene";


      $("imagePrompt").value =
`Hochwertiges ${
  $("style").value
}-Bild.

Motiv:
${subject}

Bildstil:
${$("style").value}

Detaillierte Umgebung,
professionelle Beleuchtung,
cinematische Komposition,
realistische Tiefenwirkung,
hohe Detailqualität,
hochwertige Darstellung.

Format:
16:9`;

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


/* =========================================
   SETTINGS
========================================= */

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
    event => {

      state.responseStyle =
        event.target.value;

      save();

    };


  $("autoPlan").onchange =
    event => {

      state.autoPlan =
        event.target.value;

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


/* =========================================
   THREE.JS
========================================= */

function init3d(){

  const host =
    $("three");


  const scene =
    new THREE.Scene();


  const camera =
    new THREE.PerspectiveCamera(
      55,
      1,
      0.1,
      100
    );


  camera.position.z =
    4;


  const renderer =
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


  const geometry =
    new THREE.IcosahedronGeometry(
      1.05,
      1
    );


  const material =
    new THREE.MeshStandardMaterial({
      metalness:0.45,
      roughness:0.25
    });


  const mesh =
    new THREE.Mesh(
      geometry,
      material
    );


  scene.add(mesh);


  const light =
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


  const host =
    $("three");


  const width =
    Math.max(
      host.clientWidth,
      1
    );


  const height =
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
