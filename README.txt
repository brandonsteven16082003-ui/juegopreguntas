Juego de preguntas: version web con WebAssembly y version de consola en C

La carpeta incluye el juego original y una nueva aplicacion movil:
- App.js, questions.js, app.json y package.json: aplicacion React Native con Expo.
- DOCUMENTACION.pdf: descripcion, reglas, arquitectura y vistas representativas del juego.
- scripts/generate-documentation.js: genera de nuevo el PDF sin dependencias externas.
- index.html, juego_preguntas.js y juego_preguntas.wasm: version web.
- juego_preguntas.c: version de consola en C.

Como ejecutar la aplicacion movil:
1. Instala Node.js LTS y las dependencias con `npm install`.
2. Ejecuta `npx expo start`.
3. Usa Expo Go compatible con SDK 58. Escanea el codigo QR con el telefono en la misma red Wi-Fi, o abre la aplicacion en un emulador Android con `npx expo start --android`.
4. El juego incluye 30 preguntas en tres niveles, un tablero de serpientes y escaleras, tres vidas por nivel y 20 segundos por pregunta.
5. El mejor puntaje se conserva en el dispositivo mediante AsyncStorage.
6. Ejecuta `npm run check` para comprobar la compilacion de Android, o `npm run check:ios` para iOS.
7. Ejecuta `npm run documentation` para regenerar DOCUMENTACION.pdf.

La carpeta tambien conserva las versiones anteriores:
- index.html: interfaz web con escenarios originales, 10 preguntas por nivel y tablero de serpientes y escaleras con dado.
- juego_preguntas.js y juego_preguntas.wasm: motor de juego compilado desde C para el navegador.
- juego_preguntas.c: version de consola en C.

Archivos principales:
- juego_preguntas.c: codigo fuente del juego
- compile_game.bat: compila el juego con GCC
- compile_wasm.bat: compila el motor C para el navegador con Emscripten
- run_game.bat: abre la version web en el navegador

Como compilar y abrir la version web:
1. Instala Emscripten. compile_wasm.bat busca automaticamente emcc en Documents\emsdk o en la carpeta de usuario.
2. Ejecuta compile_wasm.bat para generar juego_preguntas.js y juego_preguntas.wasm.
   Vuelve a ejecutar este archivo cada vez que cambies juego_preguntas.c para actualizar la version del navegador.
3. Instala Python si no esta disponible; se utiliza para servir los archivos al navegador.
4. Haz doble clic en run_game.bat. Inicia el servidor local en un puerto disponible y abre el navegador. Usa la direccion exacta que abre el lanzador; no reutilices una pestaña o enlace anterior.
5. Las 30 preguntas (10 por nivel), respuestas, vidas y puntaje se procesan en el motor C compilado a WebAssembly. En el tablero, las respuestas correctas avanzan la ficha con el dado y las incorrectas la hacen retroceder.
6. El ranking web consulta puntajes.txt mediante el servidor local y conserva una copia en el navegador. Muestra los puntajes de victorias y derrotas, ordenados de mayor a menor.
7. El servidor usa solo Python estandar y escucha en 127.0.0.1. Abre el juego con run_game.bat para habilitar la copia al archivo; abrir index.html directamente permite ver el ranking del navegador, pero no escribir puntajes.txt. Mantén abierta la ventana del servidor mientras juegas.

Como compilar la version de consola:
1. Abre una terminal en esta carpeta.
2. Ejecuta:
   compile_game.bat
3. Si GCC no esta instalado, instala MinGW o MSYS2 y agregalo al PATH.

Como ejecutar la version de consola:
- Compilala y escribe en la terminal:
  juego_preguntas.exe

La version de consola guarda los puntajes en:
- puntajes.txt

El archivo de puntajes comparte el formato CSV de la version de consola:
- nombre,puntaje,nivel,resultado
- Se copian victorias y derrotas; la tabla del juego muestra los puntajes guardados en el servidor y en este navegador.

Requisitos:
- Compilador GCC compatible con C11
- Emscripten (emcc) para generar la version WebAssembly
- Python para ejecutar un servidor local para la version web
- Entorno Windows
- Para la version web: navegador moderno
