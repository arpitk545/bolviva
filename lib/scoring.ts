// BolViva scoring engine — build plan section 5 wala rubric.
//
//   Concept accuracy : 40  (key terms kitne cover hue)
//   Completeness     : 30  (model answer ke kitne points cover hue)
//   Example / clarity: 20  (example diya? answer structured tha?)
//   Confidence       : 10  (answer ki length + filler words ka heuristic)
//
// Matching is NOT naive exact-string search. The student's spoken answer
// (Gnani Prisma transcript) is matched against the answer key with:
//   1. Morphological word forms — "processes / executing / sharing" count
//      for "process / execution / share".
//   2. Fuzzy near-match (edit distance) for longer words — small STT
//      mis-hearings or spelling variants still earn the point.
//   3. Phrase fallback — a multi-word key term counts when >=70% of its
//      content words are present, so paraphrases in the student's own
//      words (English or Hinglish) score fairly.
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

/**
 * Ek word ke morphological forms: "processes" -> {processes, process},
 * "executing" -> {executing, execut, execute}, "sharing" -> {sharing, shar,
 * share}, "studies" -> {studies, study}. Do words "same" mane jate hain agar
 * unke form-sets intersect karein — isse student ke apne shabdon wala jawab
 * bhi answer key se match ho jata hai.
 */
function wordForms(word: string): Set<string> {
  const forms = new Set<string>([word]);
  const add = (s: string) => {
    if (s.length >= 3) forms.add(s);
  };
  if (word.endsWith("ies") && word.length > 4) add(word.slice(0, -3) + "y");
  if (word.endsWith("es") && word.length > 3) add(word.slice(0, -2));
  if (word.endsWith("s") && word.length > 3) add(word.slice(0, -1));
  if (word.endsWith("ing") && word.length > 5) {
    const base = word.slice(0, -3);
    add(base);
    add(base + "e");
    // double-letter stem: "running" -> "run"
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      add(base.slice(0, -1));
    }
  }
  if (word.endsWith("ed") && word.length > 4) {
    const base = word.slice(0, -2);
    add(base);
    add(base + "e");
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      add(base.slice(0, -1));
    }
  }
  if (word.endsWith("ly") && word.length > 4) add(word.slice(0, -2));
  return forms;
}

/** Classic Levenshtein edit distance (do rows, chhote words par hi chalta hai). */
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3; // threshold se bahar — early exit
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/** Transcript ka precomputed index — tokens + unke saare word forms. */
interface TranscriptIndex {
  normalized: string;
  tokens: string[];
  formSet: Set<string>;
}

function buildIndex(normalized: string): TranscriptIndex {
  const tokens = normalized.split(" ").filter(Boolean);
  const formSet = new Set<string>();
  for (const t of tokens) {
    for (const f of wordForms(t)) formSet.add(f);
  }
  return { normalized, tokens, formSet };
}

/**
 * Ek content word transcript me "mila" mana jata hai agar:
 *  - uska koi morphological form transcript ke kisi word ke form se mile, ya
 *  - lamba word (>=6 chars) ho aur transcript ke kisi word se edit distance
 *    chhota ho (STT ki halki galti / spelling variant maaf).
 */
function tokenMatches(word: string, idx: TranscriptIndex): boolean {
  for (const f of wordForms(word)) {
    if (idx.formSet.has(f)) return true;
  }
  if (word.length >= 6) {
    const maxDist = word.length <= 7 ? 1 : 2;
    for (const t of idx.tokens) {
      if (
        Math.abs(t.length - word.length) <= maxDist &&
        editDistance(word, t) <= maxDist
      ) {
        return true;
      }
    }
  }
  return false;
}

/** keyTerm entry "variant1|variant2|..." — koi bhi variant transcript me mile toh match. */
function keyTermFound(entry: string, idx: TranscriptIndex): boolean {
  return entry
    .split("|")
    .map((v) => normalize(v))
    .some((v) => {
      if (v.length === 0) return false;
      // Phrase as-is mil jaye toh pakka match.
      if (idx.normalized.includes(v)) return true;
      // Warna content words se match: single word -> token match;
      // multi-word phrase -> >=70% content words present hon.
      const words = v
        .split(" ")
        .filter((w) => w.length > 2 && !STOPWORDS.has(w));
      if (words.length === 0) return false;
      if (words.length === 1) return tokenMatches(words[0], idx);
      const hit = words.filter((w) => tokenMatches(w, idx)).length;
      return hit / words.length >= 0.7;
    });
}

function keyTermLabel(entry: string): string {
  return entry.split("|")[0].trim();
}

/** Ek model point "cover" hua mana jata hai agar uske >=40% content words
 *  transcript me milen (morphological/fuzzy matching ke saath). */
function pointCovered(point: string, idx: TranscriptIndex): boolean {
  const words = contentWords(point);
  if (words.length === 0) return false;
  const found = words.filter((w) => tokenMatches(w, idx)).length;
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
  const idx = buildIndex(normalized);

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
    if (keyTermFound(entry, idx)) foundTerms.push(keyTermLabel(entry));
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
    if (pointCovered(point, idx)) coveredPoints.push(point);
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
