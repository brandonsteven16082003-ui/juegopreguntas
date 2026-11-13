#include <ctype.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#ifdef _WIN32
#include <windows.h>
#endif

#define ARCHIVO_PUNTAJES "puntajes.txt"
#define MAX_NOMBRE 50
#define MAX_LINEA 128
#define MAX_TOP 5
#define VIDAS_INICIALES 3
#define PREGUNTAS_POR_NIVEL 10
#define TOTAL_NIVELES 3
#define TOTAL_PREGUNTAS (PREGUNTAS_POR_NIVEL * TOTAL_NIVELES)

typedef struct {
    const char *enunciado;
    const char *opciones[4];
    char respuesta;
} Pregunta;

typedef struct {
    char nombre[MAX_NOMBRE];
    int puntaje;
    int nivel;
    char resultado[16];
} Puntaje;

#define COLOR_RESET "\x1b[0m"
#define COLOR_CIAN "\x1b[96m"
#define COLOR_MAGENTA "\x1b[95m"
#define COLOR_AMARILLO "\x1b[93m"
#define COLOR_VERDE "\x1b[92m"
#define COLOR_ROJO "\x1b[91m"
#define COLOR_AZUL "\x1b[94m"
#define COLOR_GRIS "\x1b[90m"

const Pregunta preguntas[TOTAL_PREGUNTAS] = {
    {"Nivel 1 - Que tipo de dato se usa normalmente para guardar un numero entero?", {"float", "char", "int", "void"}, 'C'},
    {"Nivel 1 - Que funcion se utiliza para mostrar texto en la consola?", {"scanf", "printf", "fopen", "strlen"}, 'B'},
    {"Nivel 1 - Que simbolo termina normalmente una instruccion en C?", {":", ".", ";", ","}, 'C'},
    {"Nivel 1 - Que directiva permite usar funciones de entrada y salida como printf?", {"#include <stdio.h>", "#define <stdio.h>", "#using <stdio.h>", "#import <stdio.h>"}, 'A'},
    {"Nivel 1 - Que funcion sirve como punto de entrada habitual de un programa en C?", {"start", "main", "begin", "run"}, 'B'},
    {"Nivel 1 - Que tipo de dato almacena normalmente un solo caracter?", {"int", "char", "double", "void"}, 'B'},
    {"Nivel 1 - Que tipo de dato permite guardar numeros con parte decimal?", {"char", "void", "float", "long"}, 'C'},
    {"Nivel 1 - Que operador se usa para asignar un valor a una variable?", {"==", "=", "!=", "<="}, 'B'},
    {"Nivel 1 - Que operador calcula el residuo de una division entre enteros?", {"/", "*", "%", "+"}, 'C'},
    {"Nivel 1 - Que simbolos inician un comentario de una sola linea en C?", {"//", "/*", "<!--", "##"}, 'A'},
    {"Nivel 2 - Que estructura permite ejecutar instrucciones segun una condicion?", {"if", "include", "define", "typedef"}, 'A'},
    {"Nivel 2 - Que indice tiene el primer elemento de un arreglo en C?", {"0", "1", "-1", "Depende del arreglo"}, 'A'},
    {"Nivel 2 - Que ciclo revisa su condicion antes de cada repeticion?", {"while", "do-while", "switch", "case"}, 'A'},
    {"Nivel 2 - Que palabra clave ofrece una alternativa cuando la condicion de if es falsa?", {"else", "case", "break", "return"}, 'A'},
    {"Nivel 2 - Que palabra clave selecciona una opcion dentro de una estructura switch?", {"when", "case", "choose", "option"}, 'B'},
    {"Nivel 2 - Que ciclo ejecuta su bloque al menos una vez antes de revisar la condicion?", {"for", "while", "do-while", "switch"}, 'C'},
    {"Nivel 2 - Como se declara un arreglo de cinco enteros en C?", {"int numeros[5];", "array int numeros(5);", "int[5] numeros;", "numeros int = 5;"}, 'A'},
    {"Nivel 2 - Que palabra clave termina inmediatamente un ciclo?", {"stop", "exit", "break", "skip"}, 'C'},
    {"Nivel 2 - Que operador logico significa Y (AND) en C?", {"||", "&&", "!", "&"}, 'B'},
    {"Nivel 2 - Que parte de un ciclo for se ejecuta normalmente despues de cada iteracion?", {"Inicializacion", "Condicion", "Actualizacion", "Declaracion"}, 'C'},
    {"Nivel 3 - Que operador se utiliza para obtener la direccion de una variable?", {"*", "&", "%", "->"}, 'B'},
    {"Nivel 3 - Que modo de fopen agrega datos al final de un archivo?", {"r", "w", "a", "x"}, 'C'},
    {"Nivel 3 - Que funcion libera la memoria reservada dinamicamente?", {"malloc", "fopen", "free", "sizeof"}, 'C'},
    {"Nivel 3 - Que operador permite acceder al valor apuntado por un puntero?", {"*", "&", "->", "%"}, 'A'},
    {"Nivel 3 - Que funcion cierra un archivo abierto con fopen?", {"fclose", "closefile", "free", "fcloseall"}, 'A'},
    {"Nivel 3 - Que funcion reserva memoria dinamicamente?", {"sizeof", "malloc", "printf", "fclose"}, 'B'},
    {"Nivel 3 - Que constante representa normalmente un puntero que no apunta a un objeto?", {"EOF", "NULL", "stdin", "false"}, 'B'},
    {"Nivel 3 - Que funcion lee datos con formato desde un archivo?", {"fprintf", "fscanf", "fopen", "fclose"}, 'B'},
    {"Nivel 3 - Como se declara un puntero a un entero?", {"int ptr;", "int *ptr;", "*int ptr;", "pointer int ptr;"}, 'B'},
    {"Nivel 3 - Que operador obtiene el tamano en bytes de un tipo o variable?", {"length", "bytes", "sizeof", "size"}, 'C'}
};

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>

static int indicePreguntaWasm;
static int vidasWasm;
static int puntajeWasm;
static int respondidaWasm;

EMSCRIPTEN_KEEPALIVE
void juegoIniciarWasm(void) {
    indicePreguntaWasm = 0;
    vidasWasm = VIDAS_INICIALES;
    puntajeWasm = 0;
    respondidaWasm = 0;
}

EMSCRIPTEN_KEEPALIVE
int juegoTotalPreguntasWasm(void) {
    return TOTAL_PREGUNTAS;
}

EMSCRIPTEN_KEEPALIVE
int juegoIndicePreguntaWasm(void) {
    return indicePreguntaWasm;
}

EMSCRIPTEN_KEEPALIVE
int juegoNivelPreguntaWasm(int indice) {
    if (indice < 0 || indice >= TOTAL_PREGUNTAS) {
        return 0;
    }
    return indice / PREGUNTAS_POR_NIVEL + 1;
}

EMSCRIPTEN_KEEPALIVE
const char *juegoEnunciadoWasm(int indice) {
    if (indice < 0 || indice >= TOTAL_PREGUNTAS) {
        return "";
    }
    return preguntas[indice].enunciado;
}

EMSCRIPTEN_KEEPALIVE
const char *juegoOpcionWasm(int indice, int opcion) {
    if (indice < 0 || indice >= TOTAL_PREGUNTAS ||
        opcion < 0 || opcion >= 4) {
        return "";
    }
    return preguntas[indice].opciones[opcion];
}

EMSCRIPTEN_KEEPALIVE
int juegoRespuestaCorrectaWasm(int indice) {
    if (indice < 0 || indice >= TOTAL_PREGUNTAS) {
        return -1;
    }
    return preguntas[indice].respuesta - 'A';
}

EMSCRIPTEN_KEEPALIVE
int juegoVidasWasm(void) {
    return vidasWasm;
}

EMSCRIPTEN_KEEPALIVE
void juegoRestaurarVidasNivelWasm(void) {
    if (vidasWasm > 0 && indicePreguntaWasm > 0 &&
        indicePreguntaWasm % PREGUNTAS_POR_NIVEL == 0) {
        vidasWasm = VIDAS_INICIALES;
    }
}

EMSCRIPTEN_KEEPALIVE
int juegoPuntajeWasm(void) {
    return puntajeWasm;
}

EMSCRIPTEN_KEEPALIVE
int juegoResponderWasm(int opcion) {
    if (respondidaWasm || vidasWasm <= 0 ||
        indicePreguntaWasm >= TOTAL_PREGUNTAS ||
        opcion < 0 || opcion >= 4) {
        return -1;
    }

    respondidaWasm = 1;
    if (opcion == juegoRespuestaCorrectaWasm(indicePreguntaWasm)) {
        puntajeWasm += juegoNivelPreguntaWasm(indicePreguntaWasm) * 10;
        return 1;
    }

    vidasWasm--;
    return 0;
}

EMSCRIPTEN_KEEPALIVE
int juegoAvanzarWasm(void) {
    if (!respondidaWasm || vidasWasm <= 0 ||
        indicePreguntaWasm >= TOTAL_PREGUNTAS - 1) {
        return 0;
    }

    indicePreguntaWasm++;
    respondidaWasm = 0;
    return 1;
}

EMSCRIPTEN_KEEPALIVE
int juegoTerminadoWasm(void) {
    return vidasWasm <= 0 || indicePreguntaWasm >= TOTAL_PREGUNTAS - 1;
}

#else

static int coloresActivos = 1;

void configurarTerminal(void) {
#ifdef _WIN32
    HANDLE consola = GetStdHandle(STD_OUTPUT_HANDLE);
    DWORD modo;

    if (consola != INVALID_HANDLE_VALUE &&
        GetConsoleMode(consola, &modo) &&
        !SetConsoleMode(consola, modo | ENABLE_VIRTUAL_TERMINAL_PROCESSING)) {
        coloresActivos = 0;
    }
#endif
}

void ponerColor(const char *codigo) {
    if (coloresActivos) {
        fputs(codigo, stdout);
    }
}
void limpiarPantalla(void) {
    if (coloresActivos) {
        fputs("\x1b[2J\x1b[H", stdout);
    } else {
        putchar('\n');
    }
}

void mostrarTitulo(const char *subtitulo) {
    limpiarPantalla();
    ponerColor(COLOR_MAGENTA);
    puts("+==============================================================+");
    ponerColor(COLOR_CIAN);
    puts("|                  CONCURSO DE PREGUNTAS                       |");
    ponerColor(COLOR_AMARILLO);
    puts("|                  EL DESAFIO DE PROGRAMACION                  |");
    ponerColor(COLOR_MAGENTA);
    puts("+==============================================================+");
    ponerColor(COLOR_RESET);
    printf("\n  %s\n\n", subtitulo);
}

void mostrarSeparador(void) {
    ponerColor(COLOR_GRIS);
    puts("----------------------------------------------------------------");
    ponerColor(COLOR_RESET);
}

int leerLinea(const char *mensaje, char *destino, size_t capacidad) {
    size_t longitud;
    int caracter;

    printf("%s", mensaje);
    if (fgets(destino, (int)capacidad, stdin) == NULL) {
        return 0;
    }

    longitud = strlen(destino);
    if (longitud > 0 && destino[longitud - 1] == '\n') {
        destino[--longitud] = '\0';
    } else {
        while ((caracter = getchar()) != '\n' && caracter != EOF) {
            /* Descarta el resto de una entrada demasiado larga. */
        }
    }

    if (longitud > 0 && destino[longitud - 1] == '\r') {
        destino[longitud - 1] = '\0';
    }
    return 1;
}

int leerEntero(const char *mensaje, int minimo, int maximo, int *valor) {
    char linea[64];
    char *fin;
    long numero;

    while (1) {
        if (!leerLinea(mensaje, linea, sizeof(linea))) {
            return 0;
        }

        numero = strtol(linea, &fin, 10);
        while (isspace((unsigned char)*fin)) {
            fin++;
        }

        if (linea[0] != '\0' && *fin == '\0' &&
            numero >= minimo && numero <= maximo) {
            *valor = (int)numero;
            return 1;
        }

        printf("Entrada invalida. Escribe un numero entre %d y %d.\n",
               minimo, maximo);
    }
}

void mostrarInstrucciones(void) {
    mostrarTitulo("INSTRUCCIONES");
    puts("  Responde cada pregunta escribiendo A, B, C o D.");
    printf("  Comienzas con %d vidas. Cada error resta una vida.\n",
           VIDAS_INICIALES);
    printf("  Responde %d preguntas por nivel (%d en total) con vidas restantes para ganar.\n",
           PREGUNTAS_POR_NIVEL, TOTAL_PREGUNTAS);
    puts("");
    ponerColor(COLOR_VERDE);
    puts("  NIVEL 1   Fundamentos de C                 +10 puntos");
    ponerColor(COLOR_AZUL);
    puts("  NIVEL 2   Condicionales, arreglos y ciclos  +20 puntos");
    ponerColor(COLOR_MAGENTA);
    puts("  NIVEL 3   Punteros y archivos               +30 puntos");
    ponerColor(COLOR_RESET);
    mostrarSeparador();
    printf("  Los resultados se guardan en %s.\n", ARCHIVO_PUNTAJES);
}

void mostrarMenu(void) {
    mostrarTitulo("Elige una opcion para continuar");
    ponerColor(COLOR_VERDE);
    puts("       [1] Iniciar partida");
    ponerColor(COLOR_CIAN);
    puts("       [2] Ver instrucciones");
    ponerColor(COLOR_AMARILLO);
    puts("       [3] Mejores puntajes");
    ponerColor(COLOR_ROJO);
    puts("       [4] Salir");
    ponerColor(COLOR_RESET);
    putchar('\n');
}

void esperarContinuar(void) {
    char linea[8];

    printf("\n  Presiona Enter para volver al menu...");
    (void)leerLinea("", linea, sizeof(linea));
}

int leerRespuesta(void) {
    char linea[32];

    while (1) {
        if (!leerLinea("Tu respuesta (A-D): ", linea, sizeof(linea))) {
            return '\0';
        }
        if (linea[0] != '\0' && linea[1] == '\0') {
            int respuesta = toupper((unsigned char)linea[0]);
            if (respuesta >= 'A' && respuesta <= 'D') {
                return respuesta;
            }
        }
        printf("Respuesta invalida. Escribe solamente A, B, C o D.\n");
    }
}

int pedirNombre(char nombre[MAX_NOMBRE]) {
    size_t inicio;
    size_t fin;
    size_t longitud;

    while (1) {
        if (!leerLinea("Nombre del jugador: ", nombre, MAX_NOMBRE)) {
            return 0;
        }

        inicio = 0;
        while (isspace((unsigned char)nombre[inicio])) {
            inicio++;
        }
        fin = strlen(nombre);
        while (fin > inicio && isspace((unsigned char)nombre[fin - 1])) {
            fin--;
        }
        longitud = fin - inicio;

        if (longitud == 0) {
            printf("El nombre no puede estar vacio.\n");
            continue;
        }
        if (memchr(nombre + inicio, ',', longitud) != NULL) {
            printf("El nombre no puede contener comas.\n");
            continue;
        }

        memmove(nombre, nombre + inicio, longitud);
        nombre[longitud] = '\0';
        return 1;
    }
}

int guardarPuntaje(const Puntaje *puntaje) {
    FILE *archivo = fopen(ARCHIVO_PUNTAJES, "a");
    int correcto;

    if (archivo == NULL) {
        perror("No se pudo abrir el archivo de puntajes");
        return 0;
    }

    correcto = fprintf(archivo, "%s,%d,%d,%s\n",
                       puntaje->nombre, puntaje->puntaje,
                       puntaje->nivel, puntaje->resultado) >= 0;
    if (fclose(archivo) != 0) {
        perror("No se pudo cerrar el archivo de puntajes");
        return 0;
    }
    if (!correcto) {
        fprintf(stderr, "Error al escribir el puntaje en %s.\n",
                ARCHIVO_PUNTAJES);
        return 0;
    }
    return 1;
}

static void restaurarVidasPorNivel(int *vidas, int preguntaActual) {
    if (*vidas > 0 &&
        (preguntaActual + 1) % PREGUNTAS_POR_NIVEL == 0 &&
        *vidas < VIDAS_INICIALES) {
        *vidas = VIDAS_INICIALES;
        printf("\nNivel superado. Tus vidas se reiniciaron a %d.\n",
               VIDAS_INICIALES);
    }
}

void jugarPartida(void) {
    Puntaje puntaje = {"", 0, 1, ""};
    int vidas = VIDAS_INICIALES;
    int i;

    mostrarTitulo("NUEVA PARTIDA");
    if (!pedirNombre(puntaje.nombre)) {
        return;
    }

    for (i = 0; i < TOTAL_PREGUNTAS && vidas > 0; i++) {
        int nivel = i / PREGUNTAS_POR_NIVEL + 1;
        int respuesta;

        mostrarTitulo("RESPONDE LA PREGUNTA");
        if (nivel > puntaje.nivel) {
            puntaje.nivel = nivel;
        }

        ponerColor(COLOR_AMARILLO);
        printf("  NIVEL %d   |   PREGUNTA %d/%d\n", nivel, i + 1,
               TOTAL_PREGUNTAS);
        ponerColor(COLOR_ROJO);
        printf("  Vidas: ");
        {
            int vida;
            for (vida = 0; vida < VIDAS_INICIALES; vida++) {
                fputs(vida < vidas ? "<3 " : "-- ", stdout);
            }
        }
        ponerColor(COLOR_RESET);
        printf("   Puntaje: %d\n\n", puntaje.puntaje);
        mostrarSeparador();
        ponerColor(COLOR_CIAN);
        printf("\n  %s\n\n", preguntas[i].enunciado);
        ponerColor(COLOR_RESET);
        printf("       [A] %s\n       [B] %s\n       [C] %s\n       [D] %s\n\n",
               preguntas[i].opciones[0], preguntas[i].opciones[1],
               preguntas[i].opciones[2], preguntas[i].opciones[3]);

        respuesta = leerRespuesta();
        if (respuesta == '\0') {
            printf("\nEntrada finalizada. La partida no se registro.\n");
            return;
        }

        if (respuesta == preguntas[i].respuesta) {
            puntaje.puntaje += nivel * 10;
            ponerColor(COLOR_VERDE);
            printf("Correcto. +%d puntos.\n", nivel * 10);
        } else {
            vidas--;
            ponerColor(COLOR_ROJO);
            printf("Incorrecto. La respuesta era %c. Vidas restantes: %d.\n",
                   preguntas[i].respuesta, vidas);
        }
        ponerColor(COLOR_RESET);

        if ((i + 1) % PREGUNTAS_POR_NIVEL == 0 && vidas > 0 && vidas < VIDAS_INICIALES) {
            restaurarVidasPorNivel(&vidas, i);
        }
    }

    mostrarTitulo("FIN DE LA PARTIDA");
    if (vidas > 0) {
        strcpy(puntaje.resultado, "VICTORIA");
        ponerColor(COLOR_VERDE);
        printf("\nFelicidades, completaste el concurso.\n");
    } else {
        strcpy(puntaje.resultado, "DERROTA");
        ponerColor(COLOR_ROJO);
        printf("\nTe quedaste sin vidas. Fin de la partida.\n");
    }
    ponerColor(COLOR_RESET);

    printf("Jugador: %s | Puntaje: %d | Nivel alcanzado: %d | Resultado: %s\n",
           puntaje.nombre, puntaje.puntaje, puntaje.nivel, puntaje.resultado);

    if (guardarPuntaje(&puntaje)) {
        printf("Resultado guardado en %s.\n", ARCHIVO_PUNTAJES);
    }
    esperarContinuar();
}

void insertarEnTop(Puntaje mejores[MAX_TOP], int *cantidad,
                   const Puntaje *nuevo) {
    int posicion = 0;
    int i;

    while (posicion < *cantidad &&
           mejores[posicion].puntaje >= nuevo->puntaje) {
        posicion++;
    }
    if (posicion >= MAX_TOP) {
        return;
    }

    if (*cantidad < MAX_TOP) {
        (*cantidad)++;
    }
    for (i = *cantidad - 1; i > posicion; i--) {
        mejores[i] = mejores[i - 1];
    }
    mejores[posicion] = *nuevo;
}

void mostrarMejoresPuntajes(void) {
    FILE *archivo = fopen(ARCHIVO_PUNTAJES, "r");
    Puntaje mejores[MAX_TOP];
    char linea[MAX_LINEA];
    int cantidad = 0;
    int registrosInvalidos = 0;
    int i;

    mostrarTitulo("TABLA DE LOS CINCO MEJORES");
    if (archivo == NULL) {
        if (errno != ENOENT) {
            perror("Error al consultar el archivo de puntajes");
            esperarContinuar();
            return;
        }
        printf("  Todavia no hay puntajes guardados.\n");
        esperarContinuar();
        return;
    }

    while (fgets(linea, sizeof(linea), archivo) != NULL) {
        Puntaje actual;
        int finRegistro = -1;
        char *resto;

        if (sscanf(linea, "%49[^,],%d,%d,%15[^,\r\n]%n",
                   actual.nombre, &actual.puntaje, &actual.nivel,
                   actual.resultado, &finRegistro) == 4 &&
            finRegistro >= 0) {
            resto = linea + finRegistro;
            while (isspace((unsigned char)*resto)) {
                resto++;
            }
            if (*resto != '\0') {
                registrosInvalidos++;
                continue;
            }
            insertarEnTop(mejores, &cantidad, &actual);
        } else {
            registrosInvalidos++;
        }
    }

    if (ferror(archivo)) {
        perror("Error al leer el archivo de puntajes");
        fclose(archivo);
        esperarContinuar();
        return;
    }
    if (fclose(archivo) != 0) {
        perror("No se pudo cerrar el archivo de puntajes");
        esperarContinuar();
        return;
    }

    if (cantidad == 0) {
        printf("El archivo esta vacio o no contiene registros validos.\n");
    } else {
        ponerColor(COLOR_AMARILLO);
        printf("%-4s %-20s %-10s %-8s %s\n",
               "No.", "Jugador", "Puntaje", "Nivel", "Resultado");
        ponerColor(COLOR_RESET);
        mostrarSeparador();
        for (i = 0; i < cantidad; i++) {
            printf("%-4d %-20.20s %-10d %-8d %s\n",
                   i + 1, mejores[i].nombre, mejores[i].puntaje,
                   mejores[i].nivel, mejores[i].resultado);
        }
    }
    if (registrosInvalidos > 0) {
        printf("Aviso: se ignoraron %d registro(s) con formato invalido.\n",
               registrosInvalidos);
    }
    esperarContinuar();
}

int main(void) {
    int opcion;

    configurarTerminal();
    while (1) {
        mostrarMenu();
        if (!leerEntero("Selecciona una opcion: ", 1, 4, &opcion)) {
            printf("\nFin de la entrada. Programa terminado.\n");
            return 0;
        }

        switch (opcion) {
            case 1:
                jugarPartida();
                break;
            case 2:
                mostrarInstrucciones();
                esperarContinuar();
                break;
            case 3:
                mostrarMejoresPuntajes();
                break;
            case 4:
                printf("Gracias por jugar.\n");
                return 0;
        }
    }

}
#endif
