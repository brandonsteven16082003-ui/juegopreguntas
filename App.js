import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  INITIAL_LIVES,
  LEVELS,
  QUESTIONS,
  QUESTION_TIME_SECONDS,
} from "./questions";

const BEST_SCORE_KEY = "@el-desafio/best-score-v1";
const ANSWER_LABELS = ["A", "B", "C", "D"];
const LADDERS = new Map([
  [5, 16],
  [23, 28],
  [42, 59],
  [64, 78],
  [71, 91],
  [85, 96],
]);
const SNAKES = new Map([
  [32, 14],
  [50, 37],
  [72, 58],
  [89, 68],
  [95, 75],
  [98, 80],
]);
const BOARD_MARKERS = new Map([
  ...Array.from(LADDERS.keys(), (cell) => [cell, "↗"]),
  ...Array.from(SNAKES.keys(), (cell) => [cell, "↘"]),
]);

function getBoardNumber(displayIndex) {
  const displayRow = Math.floor(displayIndex / 10);
  const column = displayIndex % 10;
  const boardRow = 9 - displayRow;
  return boardRow * 10 + (boardRow % 2 === 0 ? column + 1 : 10 - column);
}

function getNextBoardPosition(position, isCorrect) {
  const roll = Math.floor(Math.random() * 6) + 1;
  const moved = Math.max(1, Math.min(100, position + (isCorrect ? roll : -roll)));
  return { roll, position: LADDERS.get(moved) || SNAKES.get(moved) || moved };
}

function ActionButton({ label, onPress, secondary = false, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.pressedButton,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Board({ position }) {
  return (
    <View
      accessibilityLabel={`Tablero: casilla ${position} de 100`}
      style={styles.board}
    >
      {Array.from({ length: 100 }, (_, displayIndex) => {
        const number = getBoardNumber(displayIndex);
        const marker = BOARD_MARKERS.get(number);
        return (
          <View
            key={number}
            style={[
              styles.boardCell,
              number === 1 && styles.startCell,
              number === 100 && styles.finishCell,
              marker && (marker === "↗" ? styles.ladderCell : styles.snakeCell),
              number === position && styles.currentCell,
            ]}
          >
            <Text style={styles.boardNumber}>{number}</Text>
            {marker ? <Text style={styles.boardMarker}>{marker}</Text> : null}
            {number === position ? <Text style={styles.playerToken}>●</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [playerName, setPlayerName] = useState("");
  const [player, setPlayer] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [score, setScore] = useState(0);
  const [boardPosition, setBoardPosition] = useState(1);
  const [diceRoll, setDiceRoll] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [bestScore, setBestScore] = useState(null);
  const [storageMessage, setStorageMessage] = useState("");
  const [result, setResult] = useState(null);
  const answerLockedRef = useRef(false);
  const resultSavedRef = useRef(false);

  const currentQuestion = QUESTIONS[questionIndex];
  const currentLevel = LEVELS[currentQuestion.level - 1];
  const questionNumberInLevel = (questionIndex % 10) + 1;

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(BEST_SCORE_KEY)
      .then((stored) => {
        if (!active || stored === null) return;
        const record = JSON.parse(stored);
        if (
          typeof record.score === "number" &&
          Number.isFinite(record.score) &&
          typeof record.name === "string"
        ) {
          setBestScore(record);
        } else {
          throw new Error("El formato del récord guardado no es válido.");
        }
      })
      .catch((error) => {
        console.error("No se pudo leer el récord local:", error);
        if (active) {
          setStorageMessage("No se pudo leer el récord guardado en este dispositivo.");
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const resolveAnswer = useCallback(
    (answerIndex) => {
      if (answerLockedRef.current) return;
      answerLockedRef.current = true;

      const timedOut = answerIndex === -1 || timeLeft === 0;
      const correct = !timedOut && answerIndex === currentQuestion.answer;
      const { roll, position } = getNextBoardPosition(boardPosition, correct);
      setSelectedAnswer(timedOut ? -1 : answerIndex);
      setDiceRoll(roll);
      setBoardPosition(position);

      if (correct) {
        const earned = currentQuestion.level * 10;
        setScore((previous) => previous + earned);
        setAnswerFeedback({
          correct: true,
          text: `¡Correcto! +${earned} puntos. Avanzas ${roll} casillas.`,
        });
      } else {
        setLives((previous) => Math.max(0, previous - 1));
        const answerText = currentQuestion.options[currentQuestion.answer];
        setAnswerFeedback({
          correct: false,
          text:
            timedOut
              ? `¡Se acabó el tiempo! La respuesta era ${ANSWER_LABELS[currentQuestion.answer]}) ${answerText}. Retrocedes ${roll} casillas.`
              : `La respuesta era ${ANSWER_LABELS[currentQuestion.answer]}) ${answerText}. Retrocedes ${roll} casillas.`,
        });
      }
    },
    [boardPosition, currentQuestion, timeLeft],
  );

  useEffect(() => {
    if (screen !== "game" || selectedAnswer !== null) return undefined;
    const timer = setInterval(() => {
      setTimeLeft((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, questionIndex, selectedAnswer]);

  useEffect(() => {
    if (screen === "game" && timeLeft === 0 && selectedAnswer === null) {
      resolveAnswer(-1);
    }
  }, [resolveAnswer, screen, selectedAnswer, timeLeft]);

  useEffect(() => {
    if (screen !== "result" || !result || resultSavedRef.current) return;
    resultSavedRef.current = true;
    if (bestScore && bestScore.score >= result.score) return;

    const nextRecord = { name: result.name, score: result.score };
    AsyncStorage.setItem(BEST_SCORE_KEY, JSON.stringify(nextRecord))
      .then(() => {
        setBestScore(nextRecord);
        setStorageMessage("¡Nuevo récord guardado en este dispositivo!");
      })
      .catch((error) => {
        console.error("No se pudo guardar el récord local:", error);
        setStorageMessage("No se pudo guardar el nuevo récord. Inténtalo de nuevo más tarde.");
      });
  }, [bestScore, result, screen]);

  function startGame() {
    const cleanName = playerName.trim();
    if (!cleanName) {
      setStorageMessage("Escribe tu nombre para comenzar.");
      return;
    }
    setPlayer(cleanName);
    setQuestionIndex(0);
    setLives(INITIAL_LIVES);
    setScore(0);
    setBoardPosition(1);
    setDiceRoll(null);
    setTimeLeft(QUESTION_TIME_SECONDS);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    setResult(null);
    setStorageMessage("");
    answerLockedRef.current = false;
    resultSavedRef.current = false;
    setScreen("game");
  }

  function continueGame() {
    if (lives === 0 || questionIndex === QUESTIONS.length - 1) {
      const won = lives > 0 && questionIndex === QUESTIONS.length - 1;
      const finalResult = {
        name: player,
        score,
        level: currentQuestion.level,
        won,
      };
      setResult(finalResult);
      setScreen("result");
      return;
    }

    const nextIndex = questionIndex + 1;
    if (nextIndex % 10 === 0) setLives(INITIAL_LIVES);
    setQuestionIndex(nextIndex);
    setTimeLeft(QUESTION_TIME_SECONDS);
    setSelectedAnswer(null);
    setAnswerFeedback(null);
    answerLockedRef.current = false;
  }

  function resetToHome() {
    setScreen("home");
    setPlayerName("");
    setStorageMessage("");
  }

  const isLastStep = lives === 0 || questionIndex === QUESTIONS.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.brand}>EL DESAFÍO</Text>
              <Text style={styles.headerCaption}>AVENTURA DE PROGRAMACIÓN EN C</Text>
            </View>
            <Text style={styles.headerIcon}>✦</Text>
          </View>

          {screen === "home" ? (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>UNA AVENTURA DE CONOCIMIENTO</Text>
              <Text style={styles.heroTitle}>El camino empieza aquí.</Text>
              <Text style={styles.bodyText}>
                Cruza tres mundos, supera cada desafío y demuestra cuánto sabes de programación en C.
              </Text>

              <View style={styles.worldList}>
                {LEVELS.map((level, index) => (
                  <View key={level.title} style={styles.worldRow}>
                    <View style={[styles.worldNumber, { borderColor: level.color }]}>
                      <Text style={[styles.worldNumberText, { color: level.color }]}>
                        0{index + 1}
                      </Text>
                    </View>
                    <View style={styles.worldCopy}>
                      <Text style={styles.worldName}>{level.title}</Text>
                      <Text style={styles.mutedText}>{level.topic}</Text>
                    </View>
                    <Text style={[styles.worldArrow, { color: level.color }]}>›</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.fieldLabel}>NOMBRE DEL JUGADOR</Text>
              <TextInput
                accessibilityLabel="Nombre del jugador"
                autoCapitalize="words"
                maxLength={30}
                onChangeText={setPlayerName}
                onSubmitEditing={startGame}
                placeholder="Escribe tu nombre"
                placeholderTextColor="#858c97"
                returnKeyType="go"
                style={styles.input}
                value={playerName}
              />
              <ActionButton label="Comenzar aventura  →" onPress={startGame} />

              <View style={styles.ruleStrip}>
                <Text style={styles.ruleTitle}>30 PREGUNTAS · 3 VIDAS · 20 SEGUNDOS</Text>
                <Text style={styles.ruleCopy}>
                  Acierta para ganar puntos y avanzar. Un error o el tiempo agotado resta una vida.
                </Text>
              </View>

              <View style={styles.bestScoreBox}>
                <Text style={styles.bestScoreLabel}>RÉCORD LOCAL</Text>
                {bestScore ? (
                  <Text style={styles.bestScoreValue}>
                    {bestScore.name} · {bestScore.score} pts
                  </Text>
                ) : (
                  <Text style={styles.mutedText}>Aún no hay récord. ¡Ve por el primero!</Text>
                )}
              </View>
              {storageMessage ? <Text style={styles.notice}>{storageMessage}</Text> : null}
            </View>
          ) : null}

          {screen === "game" ? (
            <View style={styles.card}>
              <View style={styles.levelHeader}>
                <View>
                  <Text style={styles.eyebrow}>MUNDO {currentQuestion.level}</Text>
                  <Text style={[styles.levelTitle, { color: currentLevel.color }]}>
                    {currentLevel.title}
                  </Text>
                </View>
                <View style={styles.timerBadge}>
                  <Text style={styles.timerIcon}>◷</Text>
                  <Text style={[styles.timerText, timeLeft <= 5 && styles.timerWarning]}>
                    00:{String(timeLeft).padStart(2, "0")}
                  </Text>
                </View>
              </View>
              <Text style={styles.mutedText}>{currentLevel.topic}</Text>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>PREGUNTA</Text>
                  <Text style={styles.statValue}>
                    {questionIndex + 1}
                    <Text style={styles.statMuted}> / {QUESTIONS.length}</Text>
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>VIDAS</Text>
                  <Text style={styles.livesText}>
                    {"♥".repeat(lives)}
                    <Text style={styles.emptyLife}>{"♡".repeat(INITIAL_LIVES - lives)}</Text>
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>PUNTAJE</Text>
                  <Text style={styles.statValue}>{score}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${((questionIndex + 1) / QUESTIONS.length) * 100}%`,
                      backgroundColor: currentLevel.color,
                    },
                  ]}
                />
              </View>

              <View style={styles.boardHeading}>
                <View>
                  <Text style={styles.boardTitle}>SERPIENTES Y ESCALERAS</Text>
                  <Text style={styles.mutedText}>Casilla {boardPosition} de 100</Text>
                </View>
                <View style={styles.diceBox}>
                  <Text style={styles.diceValue}>{diceRoll ?? "—"}</Text>
                  <Text style={styles.diceCaption}>DADO</Text>
                </View>
              </View>
              <Board position={boardPosition} />
              <View style={styles.boardLegend}>
                <Text style={styles.legendText}>● Tú</Text>
                <Text style={styles.legendText}>↗ Escalera</Text>
                <Text style={styles.legendText}>↘ Serpiente</Text>
              </View>

              <View style={styles.questionCard}>
                <Text style={styles.questionCount}>
                  DESAFÍO {questionNumberInLevel} / {LEVELS[currentQuestion.level - 1].questions.length}
                </Text>
                <Text style={styles.questionText}>{currentQuestion.question}</Text>
                <View style={styles.answerList}>
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = selectedAnswer !== null && index === currentQuestion.answer;
                    const isWrong = selectedAnswer === index && index !== currentQuestion.answer;
                    return (
                      <Pressable
                        key={`${questionIndex}-${option}`}
                        accessibilityRole="button"
                        accessibilityState={{ disabled: selectedAnswer !== null }}
                        disabled={selectedAnswer !== null}
                        onPress={() => resolveAnswer(index)}
                        style={({ pressed }) => [
                          styles.answerButton,
                          isCorrect && styles.answerCorrect,
                          isWrong && styles.answerWrong,
                          pressed && selectedAnswer === null && styles.pressedAnswer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.answerLetter,
                            isCorrect && styles.answerLetterCorrect,
                            isWrong && styles.answerLetterWrong,
                          ]}
                        >
                          {ANSWER_LABELS[index]}
                        </Text>
                        <Text style={styles.answerText}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {answerFeedback ? (
                <View
                  accessibilityLiveRegion="polite"
                  style={[
                    styles.feedback,
                    answerFeedback.correct ? styles.feedbackSuccess : styles.feedbackError,
                  ]}
                >
                  <Text style={styles.feedbackText}>{answerFeedback.text}</Text>
                </View>
              ) : null}
              {selectedAnswer !== null ? (
                <ActionButton
                  label={isLastStep ? "Ver resultado  →" : "Continuar  →"}
                  onPress={continueGame}
                />
              ) : null}
            </View>
          ) : null}

          {screen === "result" && result ? (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>
                {result.won ? "AVENTURA COMPLETADA" : "FIN DE LA PARTIDA"}
              </Text>
              <Text style={styles.resultIcon}>{result.won ? "✦" : "↻"}</Text>
              <Text style={styles.heroTitle}>
                {result.won ? "¡Lo lograste!" : "¡Sigue intentándolo!"}
              </Text>
              <Text style={styles.bodyText}>
                {result.won
                  ? `¡Felicidades, ${result.name}! Completaste los tres mundos.`
                  : `${result.name}, te quedaste sin vidas en el nivel ${result.level}.`}
              </Text>
              <View style={styles.resultScore}>
                <Text style={styles.statLabel}>PUNTAJE FINAL</Text>
                <Text style={styles.resultScoreValue}>{result.score}</Text>
                <Text style={styles.mutedText}>puntos</Text>
              </View>
              <View style={styles.bestScoreBox}>
                <Text style={styles.bestScoreLabel}>MEJOR PUNTAJE GUARDADO</Text>
                <Text style={styles.bestScoreValue}>
                  {bestScore ? `${bestScore.name} · ${bestScore.score} pts` : "Aún no hay récord"}
                </Text>
              </View>
              {storageMessage ? <Text style={styles.notice}>{storageMessage}</Text> : null}
              <ActionButton label="Jugar otra vez  ↻" onPress={resetToHome} />
              <ActionButton label="Volver al inicio" onPress={resetToHome} secondary />
            </View>
          ) : null}

          <Text style={styles.footer}>EL DESAFÍO · APRENDE JUGANDO</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#10131d",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  container: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingBottom: 18,
  },
  brand: {
    color: "#f7f5ef",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2.8,
  },
  headerCaption: {
    color: "#a9b0ba",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginTop: 4,
  },
  headerIcon: {
    color: "#c8db9c",
    fontSize: 26,
  },
  card: {
    backgroundColor: "#191f2a",
    borderColor: "#343b47",
    borderWidth: 1,
    borderRadius: 22,
    padding: 20,
  },
  eyebrow: {
    color: "#c8db9c",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#f7f5ef",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
    marginBottom: 10,
  },
  bodyText: {
    color: "#c1c4cb",
    fontSize: 14,
    lineHeight: 22,
  },
  worldList: {
    marginTop: 22,
    marginBottom: 22,
    borderTopColor: "#343b47",
    borderTopWidth: 1,
  },
  worldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: "#343b47",
    borderBottomWidth: 1,
  },
  worldNumber: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  worldNumberText: {
    fontSize: 12,
    fontWeight: "900",
  },
  worldCopy: {
    flex: 1,
  },
  worldName: {
    color: "#f7f5ef",
    fontSize: 13,
    fontWeight: "700",
  },
  worldArrow: {
    fontSize: 26,
    fontWeight: "300",
    paddingHorizontal: 4,
  },
  mutedText: {
    color: "#a9b0ba",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },
  fieldLabel: {
    color: "#c1c4cb",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#111620",
    borderColor: "#454c59",
    borderWidth: 1,
    borderRadius: 12,
    color: "#f7f5ef",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },
  button: {
    minHeight: 50,
    backgroundColor: "#c8db9c",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 10,
  },
  buttonText: {
    color: "#19221d",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderColor: "#68717e",
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: "#e1e4e9",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pressedButton: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  ruleStrip: {
    backgroundColor: "#242c38",
    borderRadius: 12,
    marginTop: 18,
    padding: 13,
  },
  ruleTitle: {
    color: "#dce6c2",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  ruleCopy: {
    color: "#b9c0ca",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },
  bestScoreBox: {
    backgroundColor: "#121923",
    borderColor: "#343b47",
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    marginTop: 14,
  },
  bestScoreLabel: {
    color: "#a9b0ba",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  bestScoreValue: {
    color: "#f7f5ef",
    fontSize: 14,
    fontWeight: "700",
  },
  notice: {
    color: "#f2c07d",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  levelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#48505d",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  timerIcon: {
    color: "#c8db9c",
    fontSize: 16,
    marginRight: 5,
  },
  timerText: {
    color: "#f7f5ef",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  timerWarning: {
    color: "#f07c70",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#121923",
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 11,
  },
  stat: {
    minWidth: 62,
  },
  statLabel: {
    color: "#929aa6",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 5,
  },
  statValue: {
    color: "#f7f5ef",
    fontSize: 15,
    fontWeight: "800",
  },
  statMuted: {
    color: "#8e97a4",
    fontSize: 11,
    fontWeight: "600",
  },
  livesText: {
    color: "#ef8b79",
    fontSize: 16,
    letterSpacing: 1,
  },
  emptyLife: {
    color: "#6d7581",
  },
  progressTrack: {
    height: 5,
    backgroundColor: "#303743",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 17,
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  boardHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  boardTitle: {
    color: "#f7f5ef",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  diceBox: {
    width: 42,
    height: 42,
    backgroundColor: "#28323f",
    borderColor: "#4b5663",
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  diceValue: {
    color: "#c8db9c",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 19,
  },
  diceCaption: {
    color: "#a9b0ba",
    fontSize: 6,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  board: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#111620",
    borderColor: "#3d4753",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
    padding: 3,
  },
  boardCell: {
    width: "10%",
    height: 22,
    borderColor: "#242c37",
    borderWidth: 0.5,
    backgroundColor: "#202a32",
    alignItems: "center",
    justifyContent: "center",
  },
  startCell: {
    backgroundColor: "#59644c",
  },
  finishCell: {
    backgroundColor: "#826543",
  },
  ladderCell: {
    backgroundColor: "#3b5449",
  },
  snakeCell: {
    backgroundColor: "#5c413b",
  },
  currentCell: {
    borderColor: "#fff2b7",
    borderWidth: 1.5,
    backgroundColor: "#738355",
  },
  boardNumber: {
    color: "#d7d9d4",
    fontSize: 7,
    lineHeight: 9,
  },
  boardMarker: {
    color: "#f5d69a",
    fontSize: 7,
    fontWeight: "900",
    lineHeight: 8,
    position: "absolute",
    top: 0,
    right: 1,
  },
  playerToken: {
    color: "#fff2b7",
    fontSize: 8,
    lineHeight: 8,
    position: "absolute",
    bottom: 0,
  },
  boardLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    paddingTop: 7,
    paddingBottom: 16,
  },
  legendText: {
    color: "#b7bec8",
    fontSize: 9,
  },
  questionCard: {
    backgroundColor: "#121923",
    borderColor: "#343d49",
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
  },
  questionCount: {
    color: "#c8db9c",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  questionText: {
    color: "#f7f5ef",
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: 13,
  },
  answerList: {
    gap: 8,
  },
  answerButton: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202a36",
    borderColor: "#3b4653",
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 10,
  },
  answerLetter: {
    width: 25,
    height: 25,
    color: "#c8db9c",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    borderRadius: 7,
    backgroundColor: "#354138",
    overflow: "hidden",
    marginRight: 10,
    paddingTop: 5,
  },
  answerLetterCorrect: {
    color: "#112016",
    backgroundColor: "#9fcf99",
  },
  answerLetterWrong: {
    color: "#281310",
    backgroundColor: "#e99583",
  },
  answerText: {
    color: "#f0f1ee",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  answerCorrect: {
    borderColor: "#9fcf99",
    backgroundColor: "#263c31",
  },
  answerWrong: {
    borderColor: "#e99583",
    backgroundColor: "#432d2b",
  },
  pressedAnswer: {
    opacity: 0.75,
  },
  feedback: {
    borderRadius: 11,
    padding: 12,
    marginTop: 12,
  },
  feedbackSuccess: {
    backgroundColor: "#24392e",
    borderColor: "#537b58",
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: "#412c2a",
    borderColor: "#875348",
    borderWidth: 1,
  },
  feedbackText: {
    color: "#f4f2e9",
    fontSize: 12,
    lineHeight: 18,
  },
  resultIcon: {
    color: "#c8db9c",
    fontSize: 44,
    marginTop: 5,
    marginBottom: 5,
  },
  resultScore: {
    alignItems: "center",
    backgroundColor: "#121923",
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
  },
  resultScoreValue: {
    color: "#c8db9c",
    fontSize: 42,
    fontWeight: "900",
    marginVertical: 2,
  },
  footer: {
    color: "#75808d",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    textAlign: "center",
    paddingVertical: 22,
  },
});
