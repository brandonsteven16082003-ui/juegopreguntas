export const QUESTIONS_PER_LEVEL = 10;
export const INITIAL_LIVES = 3;
export const QUESTION_TIME_SECONDS = 20;

export const LEVELS = [
  {
    title: "Pradera de los comienzos",
    topic: "Fundamentos de C",
    color: "#c8db9c",
    questions: [
      {
        question: "¿Qué tipo de dato se usa normalmente para guardar un número entero?",
        options: ["float", "char", "int", "void"],
        answer: 2,
      },
      {
        question: "¿Qué función se utiliza para mostrar texto en la consola?",
        options: ["scanf", "printf", "fopen", "strlen"],
        answer: 1,
      },
      {
        question: "¿Qué símbolo termina normalmente una instrucción en C?",
        options: [":", ".", ";", ","],
        answer: 2,
      },
      {
        question: "¿Qué directiva permite usar funciones como printf?",
        options: [
          "#include <stdio.h>",
          "#define <stdio.h>",
          "#using <stdio.h>",
          "#import <stdio.h>",
        ],
        answer: 0,
      },
      {
        question: "¿Qué función sirve como punto de entrada habitual de un programa en C?",
        options: ["start", "main", "begin", "run"],
        answer: 1,
      },
      {
        question: "¿Qué tipo de dato almacena normalmente un solo carácter?",
        options: ["int", "char", "double", "void"],
        answer: 1,
      },
      {
        question: "¿Qué tipo de dato permite guardar números con parte decimal?",
        options: ["char", "void", "float", "long"],
        answer: 2,
      },
      {
        question: "¿Qué operador se usa para asignar un valor a una variable?",
        options: ["==", "=", "!=", "<="],
        answer: 1,
      },
      {
        question: "¿Qué operador calcula el residuo de una división entre enteros?",
        options: ["/", "*", "%", "+"],
        answer: 2,
      },
      {
        question: "¿Qué símbolos inician un comentario de una sola línea en C?",
        options: ["//", "/*", "<!--", "##"],
        answer: 0,
      },
    ],
  },
  {
    title: "Circuito de la lógica",
    topic: "Condicionales, arreglos y ciclos",
    color: "#a5c9e8",
    questions: [
      {
        question: "¿Qué estructura permite ejecutar instrucciones según una condición?",
        options: ["if", "include", "define", "typedef"],
        answer: 0,
      },
      {
        question: "¿Qué índice tiene el primer elemento de un arreglo en C?",
        options: ["0", "1", "-1", "Depende del arreglo"],
        answer: 0,
      },
      {
        question: "¿Qué ciclo revisa su condición antes de cada repetición?",
        options: ["while", "do-while", "switch", "case"],
        answer: 0,
      },
      {
        question: "¿Qué palabra clave ofrece una alternativa cuando la condición de if es falsa?",
        options: ["else", "case", "break", "return"],
        answer: 0,
      },
      {
        question: "¿Qué palabra clave selecciona una opción dentro de una estructura switch?",
        options: ["when", "case", "choose", "option"],
        answer: 1,
      },
      {
        question: "¿Qué ciclo ejecuta su bloque al menos una vez antes de revisar la condición?",
        options: ["for", "while", "do-while", "switch"],
        answer: 2,
      },
      {
        question: "¿Cómo se declara un arreglo de cinco enteros en C?",
        options: [
          "int numeros[5];",
          "array int numeros(5);",
          "int[5] numeros;",
          "numeros int = 5;",
        ],
        answer: 0,
      },
      {
        question: "¿Qué palabra clave termina inmediatamente un ciclo?",
        options: ["stop", "exit", "break", "skip"],
        answer: 2,
      },
      {
        question: "¿Qué operador lógico significa Y (AND) en C?",
        options: ["||", "&&", "!", "&"],
        answer: 1,
      },
      {
        question: "¿Qué parte de un ciclo for se ejecuta normalmente después de cada iteración?",
        options: ["Inicialización", "Condición", "Actualización", "Declaración"],
        answer: 2,
      },
    ],
  },
  {
    title: "Fortaleza de punteros",
    topic: "Punteros y archivos",
    color: "#e39469",
    questions: [
      {
        question: "¿Qué operador se utiliza para obtener la dirección de una variable?",
        options: ["*", "&", "%", "->"],
        answer: 1,
      },
      {
        question: "¿Qué modo de fopen agrega datos al final de un archivo?",
        options: ["r", "w", "a", "x"],
        answer: 2,
      },
      {
        question: "¿Qué función libera la memoria reservada dinámicamente?",
        options: ["malloc", "fopen", "free", "sizeof"],
        answer: 2,
      },
      {
        question: "¿Qué operador permite acceder al valor apuntado por un puntero?",
        options: ["*", "&", "->", "%"],
        answer: 0,
      },
      {
        question: "¿Qué función cierra un archivo abierto con fopen?",
        options: ["fclose", "closefile", "free", "fcloseall"],
        answer: 0,
      },
      {
        question: "¿Qué función reserva memoria dinámicamente?",
        options: ["sizeof", "malloc", "printf", "fclose"],
        answer: 1,
      },
      {
        question: "¿Qué constante representa normalmente un puntero que no apunta a un objeto?",
        options: ["EOF", "NULL", "stdin", "false"],
        answer: 1,
      },
      {
        question: "¿Qué función lee datos con formato desde un archivo?",
        options: ["fprintf", "fscanf", "fopen", "fclose"],
        answer: 1,
      },
      {
        question: "¿Cómo se declara un puntero a un entero?",
        options: ["int ptr;", "int *ptr;", "*int ptr;", "pointer int ptr;"],
        answer: 1,
      },
      {
        question: "¿Qué operador obtiene el tamaño en bytes de un tipo o variable?",
        options: ["length", "bytes", "sizeof", "size"],
        answer: 2,
      },
    ],
  },
];

export const QUESTIONS = LEVELS.flatMap((level, levelIndex) =>
  level.questions.map((question) => ({ ...question, level: levelIndex + 1 })),
);
