const fs = require("node:fs");
const path = require("node:path");

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const INK = [0.09, 0.11, 0.16];
const CARD = [0.1, 0.13, 0.18];
const LIGHT = [0.97, 0.96, 0.93];
const MUTED = [0.72, 0.75, 0.79];
const GREEN = [0.78, 0.86, 0.61];
const BLUE = [0.65, 0.79, 0.91];
const ORANGE = [0.89, 0.58, 0.41];

function winAnsiHex(value) {
  const special = new Map([
    ["€", 0x80], ["‘", 0x91], ["’", 0x92], ["“", 0x93], ["”", 0x94],
    ["–", 0x96], ["—", 0x97], ["…", 0x85], ["•", 0x95],
  ]);
  return Array.from(value, (character) => {
    const code = special.has(character) ? special.get(character) : character.charCodeAt(0);
    if (code > 255) throw new Error(`Caracter no disponible en el PDF: ${character}`);
    return code.toString(16).padStart(2, "0");
  }).join("").toUpperCase();
}

function colorCommand(color, stroke = false) {
  return `${color.map((part) => part.toFixed(3)).join(" ")} ${stroke ? "RG" : "rg"}`;
}

function rectangle(x, y, width, height, fill, stroke = null) {
  return `${colorCommand(fill)} ${stroke ? colorCommand(stroke, true) : ""} ${x} ${y} ${width} ${height} re ${stroke ? "B" : "f"}`;
}

function line(x1, y1, x2, y2, color, width = 1) {
  return `${colorCommand(color, true)} ${width} w ${x1} ${y1} m ${x2} ${y2} l S`;
}

function text(x, y, size, value, bold = false, color = LIGHT) {
  return `${colorCommand(color)} BT /${bold ? "F2" : "F1"} ${size} Tf 1 0 0 1 ${x} ${y} Tm <${winAnsiHex(value)}> Tj ET`;
}

function wrap(value, limit) {
  const words = value.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > limit && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function paragraph(commands, x, y, value, limit, size = 10, color = MUTED, step = 15) {
  let cursor = y;
  for (const row of wrap(value, limit)) {
    commands.push(text(x, cursor, size, row, false, color));
    cursor -= step;
  }
  return cursor;
}

function pageBase(pageNumber, title) {
  return [
    rectangle(0, 0, PAGE_WIDTH, PAGE_HEIGHT, INK),
    text(42, 798, 10, "EL DESAFIO  /  PROYECTO MOVIL", true, GREEN),
    text(42, 757, 23, title, true, LIGHT),
    line(42, 739, 553, 739, [0.25, 0.29, 0.34], 0.8),
    line(42, 43, 553, 43, [0.25, 0.29, 0.34], 0.6),
    text(42, 26, 8, "React Native  ·  Expo  ·  JavaScript  ·  AsyncStorage", false, MUTED),
    text(532, 26, 8, String(pageNumber), false, MUTED),
  ];
}

function addSection(commands, y, title, body, color = GREEN) {
  commands.push(text(48, y, 13, title, true, color));
  return paragraph(commands, 48, y - 20, body, 86, 10) - 13;
}

function makeIntroPage() {
  const commands = [
    rectangle(0, 0, PAGE_WIDTH, PAGE_HEIGHT, INK),
    rectangle(0, 490, PAGE_WIDTH, 352, [0.11, 0.16, 0.21]),
    text(48, 786, 11, "PROYECTO INDIVIDUAL  /  APLICACION MOVIL", true, GREEN),
    text(48, 716, 39, "EL DESAFIO", true, LIGHT),
    text(48, 680, 19, "Aventura de programacion en C", true, BLUE),
    rectangle(48, 457, 499, 1, [0.28, 0.34, 0.38]),
    text(48, 424, 15, "DESCRIPCION DEL PROYECTO", true, GREEN),
  ];

  paragraph(
    commands,
    48,
    635,
    "Un concurso de preguntas que transforma el aprendizaje de C en una travesia por tres mundos y un tablero de serpientes y escaleras.",
    70,
    13,
    LIGHT,
    20,
  );
  let y = paragraph(
    commands,
    48,
    398,
    "La aplicacion movil El Desafio propone 30 preguntas de seleccion multiple sobre el lenguaje C. El jugador responde desde una interfaz tactil, administra sus vidas y recorre el tablero mientras acumula puntos.",
    86,
    11,
    MUTED,
    17,
  );
  y -= 18;
  y = addSection(
    commands,
    y,
    "OBJETIVO",
    "Completar los tres niveles con al menos una vida. El juego refuerza conceptos de fundamentos, control de flujo, arreglos, punteros y archivos.",
  );
  y = addSection(
    commands,
    y,
    "REQUISITOS IMPLEMENTADOS",
    "Pantalla de inicio con instrucciones y nombre; interfaz grafica propia; botones tactiles; reglas y puntaje; tres niveles; temporizador de 20 segundos; victoria o derrota; reinicio y mejor puntaje local.",
    BLUE,
  );
  commands.push(text(48, Math.max(75, y - 7), 9, "El puntaje se guarda en el dispositivo; no se requiere una cuenta ni conexion.", false, GREEN));
  return commands.join("\n");
}

function makeRulesPage() {
  const commands = pageBase(2, "Reglas, niveles y arquitectura");
  let y = 708;
  const rules = [
    "Cada nivel tiene 10 preguntas y se presentan cuatro opciones tactiles por pregunta.",
    "Una respuesta correcta suma 10 puntos en el nivel 1, 20 en el nivel 2 y 30 en el nivel 3.",
    "Cada nivel comienza con 3 vidas. Un error o agotar los 20 segundos consume una vida.",
    "Al comenzar un nuevo nivel, las vidas se restauran a 3. Con 0 vidas la partida termina.",
    "El dado avanza de 1 a 6 casillas con una respuesta correcta y retrocede esa cantidad con un error. Las escaleras suben y las serpientes bajan.",
    "Completar las 30 preguntas con una o mas vidas es victoria. La pantalla final permite reiniciar.",
  ];
  commands.push(text(48, y, 14, "REGLAS DEL JUEGO", true, GREEN));
  y -= 27;
  for (let index = 0; index < rules.length; index += 1) {
    commands.push(text(49, y, 10, `${index + 1}.`, true, BLUE));
    y = paragraph(commands, 70, y, rules[index], 78, 10, MUTED, 14) - 9;
  }

  commands.push(text(48, y - 1, 14, "TRES NIVELES DE DIFICULTAD", true, GREEN));
  y -= 25;
  const levels = [
    ["01  PRADERA DE LOS COMIENZOS", "Fundamentos de C  ·  10 puntos por acierto", GREEN],
    ["02  CIRCUITO DE LA LOGICA", "Condicionales, arreglos y ciclos  ·  20 puntos", BLUE],
    ["03  FORTALEZA DE PUNTEROS", "Punteros y archivos  ·  30 puntos", ORANGE],
  ];
  for (const [title, detail, color] of levels) {
    commands.push(rectangle(48, y - 24, 499, 42, [0.12, 0.15, 0.2], [0.25, 0.29, 0.34]));
    commands.push(text(60, y + 3, 10, title, true, color));
    commands.push(text(60, y - 13, 9, detail, false, MUTED));
    y -= 52;
  }

  commands.push(text(48, y - 1, 14, "ARQUITECTURA Y ESTADO", true, GREEN));
  y -= 22;
  y = paragraph(
    commands,
    48,
    y,
    "App.js organiza las pantallas, componentes y reglas del juego. questions.js contiene el banco de preguntas, las tres categorias y los valores de configuracion. app.json y package.json describen la aplicacion Expo y sus dependencias.",
    86,
    9,
    MUTED,
    13,
  );
  y -= 5;
  paragraph(
    commands,
    48,
    y,
    "useState conserva pantalla, pregunta, vidas, puntaje, dado y temporizador; useEffect controla el reloj y carga/guarda el record; useRef evita procesar dos veces una respuesta. AsyncStorage persiste el mejor puntaje y nombre en el dispositivo.",
    86,
    9,
    MUTED,
    13,
  );
  return commands.join("\n");
}

function drawPhone(commands, x, y, width, height, mode) {
  commands.push(rectangle(x, y, width, height, [0.04, 0.05, 0.08], [0.43, 0.48, 0.53]));
  commands.push(rectangle(x + 7, y + 8, width - 14, height - 16, [0.1, 0.12, 0.17]));
  commands.push(text(x + 17, y + height - 29, 9, "EL DESAFIO", true, LIGHT));
  commands.push(text(x + 17, y + height - 41, 5, "AVENTURA DE PROGRAMACION EN C", true, MUTED));
  if (mode === "home") {
    commands.push(text(x + 17, y + height - 68, 6, "UNA AVENTURA DE CONOCIMIENTO", true, GREEN));
    commands.push(text(x + 17, y + height - 85, 13, "El camino empieza", true, LIGHT));
    commands.push(text(x + 17, y + height - 101, 13, "aqui.", true, LIGHT));
    commands.push(text(x + 17, y + height - 119, 6, "Cruza tres mundos y demuestra", false, MUTED));
    commands.push(text(x + 17, y + height - 128, 6, "cuanto sabes de programacion en C.", false, MUTED));
    const worldColors = [GREEN, BLUE, ORANGE];
    for (let index = 0; index < 3; index += 1) {
      const rowY = y + height - 158 - index * 24;
      commands.push(rectangle(x + 16, rowY - 5, width - 32, 20, [0.13, 0.16, 0.21], [0.25, 0.29, 0.34]));
      commands.push(text(x + 22, rowY + 2, 6, `0${index + 1}`, true, worldColors[index]));
      commands.push(text(x + 42, rowY + 2, 5, ["Pradera de los comienzos", "Circuito de la logica", "Fortaleza de punteros"][index], true, LIGHT));
    }
    commands.push(rectangle(x + 16, y + 37, width - 32, 22, [0.07, 0.09, 0.13], [0.26, 0.29, 0.34]));
    commands.push(text(x + 23, y + 46, 6, "Escribe tu nombre", false, MUTED));
    commands.push(rectangle(x + 16, y + 11, width - 32, 20, GREEN));
    commands.push(text(x + 45, y + 18, 7, "Comenzar aventura", true, INK));
  } else {
    commands.push(text(x + 17, y + height - 68, 6, "MUNDO 1  ·  PRADERA DE LOS COMIENZOS", true, GREEN));
    commands.push(text(x + width - 51, y + height - 68, 7, "00:20", true, LIGHT));
    commands.push(text(x + 17, y + height - 85, 6, "PREGUNTA 1/30     VIDAS 3/3     0 PTS", true, MUTED));
    commands.push(rectangle(x + 16, y + height - 96, width - 32, 3, [0.25, 0.29, 0.34]));
    commands.push(rectangle(x + 16, y + height - 96, (width - 32) / 3, 3, GREEN));
    commands.push(text(x + 17, y + height - 113, 6, "SERPIENTES Y ESCALERAS", true, LIGHT));
    const boardX = x + 17;
    const boardY = y + height - 206;
    const cellW = (width - 34) / 10;
    const cellH = 8.5;
    for (let index = 0; index < 100; index += 1) {
      const row = 9 - Math.floor(index / 10);
      const column = index % 10;
      const fill = index === 90 ? [0.43, 0.5, 0.34] : index === 99 ? [0.53, 0.42, 0.28] : index % 8 === 0 ? [0.25, 0.34, 0.3] : [0.13, 0.17, 0.2];
      commands.push(rectangle(boardX + column * cellW, boardY + row * cellH, cellW - 0.5, cellH - 0.5, fill));
    }
    commands.push(text(x + 17, y + height - 222, 6, "DESAFIO 1/10", true, GREEN));
    commands.push(text(x + 17, y + height - 239, 7, "Que tipo de dato guarda un", true, LIGHT));
    commands.push(text(x + 17, y + height - 249, 7, "numero entero?", true, LIGHT));
    for (let index = 0; index < 4; index += 1) {
      const rowY = y + height - 273 - index * 20;
      commands.push(rectangle(x + 16, rowY, width - 32, 16, [0.13, 0.17, 0.22], [0.24, 0.28, 0.33]));
      commands.push(text(x + 23, rowY + 5, 6, "ABCD"[index], true, GREEN));
      commands.push(text(x + 37, rowY + 5, 6, ["float", "char", "int", "void"][index], false, LIGHT));
    }
  }
}

function makeScreensPage() {
  const commands = pageBase(3, "Vistas de la aplicacion");
  paragraph(
    commands,
    48,
    710,
    "Referencias visuales de las pantallas implementadas. La composicion adaptable, los controles y los textos se renderizan con componentes nativos de React Native.",
    86,
    10,
    MUTED,
    15,
  );
  drawPhone(commands, 70, 193, 205, 464, "home");
  drawPhone(commands, 320, 193, 205, 464, "game");
  commands.push(text(84, 170, 10, "INICIO", true, GREEN));
  commands.push(text(84, 154, 8, "Nombre, mundos y reglas resumidas", false, MUTED));
  commands.push(text(334, 170, 10, "PARTIDA", true, BLUE));
  commands.push(text(334, 154, 8, "Temporizador, vidas, tablero y opciones", false, MUTED));
  commands.push(
    paragraph(
      commands,
      48,
      108,
      "El tablero muestra la posicion de la ficha y las casillas especiales. El resultado final comunica victoria o derrota, puntaje y mejor marca local, con acceso para iniciar otra partida.",
      86,
      9,
      MUTED,
      13,
    ),
  );
  return commands.join("\n");
}

function buildPdf(pages) {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];

  for (let index = 0; index < pages.length; index += 1) {
    const pageId = 5 + index * 2;
    const streamId = pageId + 1;
    const stream = pages[index];
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
  }

  let output = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.byteLength(output, "latin1"));
    output += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(output, "latin1");
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    output += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(output, "latin1");
}

const pages = [makeIntroPage(), makeRulesPage(), makeScreensPage()];
const outputPath = path.join(__dirname, "..", "DOCUMENTACION.pdf");
const pdf = buildPdf(pages);
if (
  pdf.subarray(0, 8).toString("ascii") !== "%PDF-1.4" ||
  (pdf.toString("latin1").match(/\/Type \/Page\b/g) || []).length !== pages.length
) {
  throw new Error("El documento PDF generado no pasó la validación básica.");
}
fs.writeFileSync(outputPath, pdf);
console.log(`Documento generado: ${outputPath}`);
