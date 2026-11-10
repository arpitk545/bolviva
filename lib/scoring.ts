// BolViva scoring engine — build plan section 5 wala rubric.
//
//   Concept accuracy : 40  (key terms kitne cover hue)
//   Completeness     : 30  (model answer ke kitne points cover hue)
//   Example / clarity: 20  (example diya? answer structured tha?)
//   Confidence       : 10  (answer ki length + filler words ka heuristic)
//
// Output: total + per-section scores + kya sahi tha + kya miss hua +
// Hinglish feedback (hamesha pehle positive, phir correction).

import type { Question } from "./questions";

export interface ScoreResult {
  total: number; // 0-100
  concept: number; // /40
  completeness: number; // /30
  clarity: number; // /20
  confidence: number; // /10
  whatWasRight: string[];
  whatWasMissed: string[];
  /** English feedback — praise first, then the correction. */
  feedback: string;
  wordCount: number;
}

const STOPWORDS = new Set([
  "hai", "hota", "hoti", "hote", "hai.", "ka", "ki", "ke", "ko", "me", "mein",
  "ek", "aur", "ya", "toh", "hai", "the", "a", "an", "is", "are", "of", "to",
  "in", "on", "it", "this", "that", "se", "par", "bhi", "jab", "tab", "kya",
  "jo", "woh", "ye", "yeh", "kar", "karke", "wala", "wali", "h",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:"“”‘’()\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contentWords(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** keyTerm entry "variant1|variant2|..." — koi bhi variant transcript me mile toh match. */
function keyTermFound(entry: string, normalizedTranscript: string): boolean {
  return entry
    .split("|")
    .map((v) => normalize(v))
    .some((v) => v.length > 0 && normalizedTranscript.includes(v));
}

function keyTermLabel(entry: string): string {
  return entry.split("|")[0].trim();
}

/** Ek model point "cover" hua mana jata hai agar uske >=40% content words
 *  transcript me milen (ya point ka koi 3+ word phrase as-is mil jaye). */
function pointCovered(point: string, normalizedTranscript: string): boolean {
  const words = contentWords(point);
  if (words.length === 0) return false;
  const found = words.filter((w) => normalizedTranscript.includes(w)).length;
  return found / words.length >= 0.4;
}

const EXAMPLE_MARKERS = [
  "example", "for example", "jaise", "jaise ki", "maan lo", "maan lijiye",
  "udahaaran", "udaharan", "suppose", "agar hum", "socho",
];

const STRUCTURE_MARKERS = [
  "pehle", "dusra", "doosra", "teesra", "phir", "first", "second", "third",
  "isliye", "kyunki", "because", "matlab", "aur dusri taraf", "jabki",
];

const FILLERS = ["umm", "uhh", "uh", "err", "aaa", "woh woh", "matlab matlab"];

export function scoreAnswer(transcript: string, question: Question): ScoreResult {
  const normalized = normalize(transcript);
  const words = normalized.length ? normalized.split(" ").filter(Boolean) : [];
  const wordCount = words.length;

  // ---------- Khali answer ----------
  if (wordCount === 0) {
    return {
      total: 0,
      concept: 0,
      completeness: 0,
      clarity: 0,
      confidence: 0,
      whatWasRight: [],
      whatWasMissed: [...question.modelAnswerPoints],
      feedback:
        "No problem — everyone gets stuck the first time. The answer was empty, so just start speaking, in English or Hinglish. Begin with one line, and the points will come back to you.",
      wordCount: 0,
    };
  }

  // ---------- Concept accuracy (40) ----------
  const foundTerms: string[] = [];
  const missedTerms: string[] = [];
  for (const entry of question.keyTerms) {
    if (keyTermFound(entry, normalized)) foundTerms.push(keyTermLabel(entry));
    else missedTerms.push(keyTermLabel(entry));
  }
  const concept =
    question.keyTerms.length === 0
      ? 0
      : Math.round((foundTerms.length / question.keyTerms.length) * 40);

  // ---------- Completeness (30) ----------
  const coveredPoints: string[] = [];
  const missedPoints: string[] = [];
  for (const point of question.modelAnswerPoints) {
    if (pointCovered(point, normalized)) coveredPoints.push(point);
    else missedPoints.push(point);
  }
  const completeness =
    question.modelAnswerPoints.length === 0
      ? 0
      : Math.round((coveredPoints.length / question.modelAnswerPoints.length) * 30);

  // ---------- Example / clarity (20) ----------
  let clarity = 0;
  const hasExample = EXAMPLE_MARKERS.some((m) => normalized.includes(m));
  if (hasExample) clarity += 10;
  const structureHits = STRUCTURE_MARKERS.filter((m) => normalized.includes(m)).length;
  clarity += Math.min(6, structureHits * 2); // structured bolna: max 6
  if (wordCount >= 25) clarity += 4; // itna lamba answer = soch ke bola gaya
  else if (wordCount >= 15) clarity += 2;
  clarity = Math.min(20, clarity);

  // ---------- Confidence (10) ----------
  let confidence = 0;
  if (wordCount >= 50) confidence = 10;
  else if (wordCount >= 35) confidence = 8;
  else if (wordCount >= 25) confidence = 7;
  else if (wordCount >= 15) confidence = 5;
  else if (wordCount >= 8) confidence = 3;
  else confidence = 1;
  // Filler words zyada hon toh confidence ghatta hai
  const fillerCount = FILLERS.reduce(
    (acc, f) => acc + (normalized.split(f).length - 1),
    0
  );
  if (fillerCount >= 4) confidence = Math.max(1, confidence - 3);
  else if (fillerCount >= 2) confidence = Math.max(1, confidence - 1);
  confidence = Math.min(10, confidence);

  const total = concept + completeness + clarity + confidence;

  // ---------- Feedback (Hinglish, positive pehle) ----------
  const rightSummary =
    coveredPoints.length > 0
      ? coveredPoints[0]
      : foundTerms.length > 0
        ? `you correctly caught the "${foundTerms[0]}" concept`
        : "you attempted the full answer in your own words";
  const missSummary =
    missedPoints.length > 0
      ? missedPoints[0]
      : missedTerms.length > 0
        ? `you missed adding the "${missedTerms[0]}" point`
        : null;

  let opening: string;
  if (total >= 80) opening = "Excellent — that was a strong answer!";
  else if (total >= 60) opening = "Very good, your concept is clear.";
  else if (total >= 40) opening = "Good try — the base is there.";
  else opening = "Alright, this is a start — improvement begins here.";

  let feedback = `${opening} What you got right: ${rightSummary}.`;
  if (missSummary) {
    feedback += ` One more thing would have secured the marks: ${missSummary}.`;
  } else {
    feedback += " Almost all points are covered — keep speaking exactly like this.";
  }
  if (!hasExample && total < 90) {
    feedback += " Next time, add a small example (\"for example...\") — examiners love that.";
  }

  return {
    total,
    concept,
    completeness,
    clarity,
    confidence,
    whatWasRight: coveredPoints,
    whatWasMissed: missedPoints,
    feedback,
    wordCount,
  };
}
