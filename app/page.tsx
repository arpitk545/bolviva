"use client";

// BolViva — single-page mock viva flow (mock mode).
//
// Flow: subject choose karo → sawal (voice me suno) → answer bolo/typo karo
//       → score card + Hinglish feedback → 3 sawal ke baad full report.
//
// Mock mode me:
//  - Mic recording MediaRecorder se hoti hai aur blob browser me rehta hai.
//    STT ke liye blob /api/stt par bheja jata hai — GNANI_API_KEY na ho toh
//    route { mock: true } deta hai aur hum typed answer ko transcript mante
//    hain (kuch invent nahi karte).
//  - "Sawal suno" / "Sahi answer suno" browser speechSynthesis (hi-IN) se
//    chalta hai. Real Gnani Timbre TTS /api/tts se plug hoga.

import { useMemo, useRef, useState } from "react";
import {
  QUESTIONS,
  SUBJECTS,
  SUBJECT_LABELS,
  getQuestionsBySubject,
  modelAnswerText,
  type Question,
  type Subject,
} from "@/lib/questions";
import { scoreAnswer, type ScoreResult } from "@/lib/scoring";

type Stage = "subject" | "question" | "feedback" | "report";

interface Attempt {
  question: Question;
  transcript: string;
  result: ScoreResult;
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "hi-IN";
  utter.rate = 0.98;
  window.speechSynthesis.speak(utter);
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold">
          {value}/{max}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div
          className="h-2 rounded-full bg-brand-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stage, setStage] = useState<Stage>("subject");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const [answerText, setAnswerText] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sttNote, setSttNote] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);

  const questions = useMemo(
    () => (subject ? getQuestionsBySubject(subject) : []),
    [subject]
  );
  const current: Question | undefined = questions[qIndex];
  const lastAttempt = attempts[attempts.length - 1];

  // ---------------- Subject select ----------------
  function startViva(s: Subject) {
    setSubject(s);
    setQIndex(0);
    setAttempts([]);
    setAnswerText("");
    setAudioUrl(null);
    audioBlobRef.current = null;
    setStage("question");
  }

  // ---------------- Recording ----------------
  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioBlobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setMicError(
        "Mic permission nahi mila. Koi baat nahi — answer neeche type karke bhi viva de sakte ho."
      );
    }
  }

  // ---------------- Submit / scoring ----------------
  async function submitAnswer() {
    if (!current || submitting) return;
    setSubmitting(true);
    setSttNote(null);

    let transcript = answerText.trim();

    // Agar recording hai toh pehle STT route ko try karo (mock-safe).
    if (audioBlobRef.current) {
      try {
        const form = new FormData();
        form.append("audio", audioBlobRef.current, "answer.webm");
        const res = await fetch("/api/stt", { method: "POST", body: form });
        const data = await res.json();
        if (!data.mock && typeof data.transcript === "string" && data.transcript.trim()) {
          transcript = data.transcript.trim();
        } else {
          setSttNote(
            "Mock mode: Gnani STT abhi configured nahi hai, isliye recording ki jagah typed answer se score kiya gaya hai."
          );
        }
      } catch {
        setSttNote("STT route se connect nahi hua — typed answer se score kiya gaya.");
      }
    }

    const result = scoreAnswer(transcript, current);
    setAttempts((prev) => [...prev, { question: current, transcript, result }]);
    setSubmitting(false);
    setStage("feedback");
  }

  function nextStep() {
    setAnswerText("");
    setAudioUrl(null);
    audioBlobRef.current = null;
    setSttNote(null);
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1);
      setStage("question");
    } else {
      setStage("report");
    }
  }

  function resetAll() {
    setStage("subject");
    setSubject(null);
    setAttempts([]);
    setQIndex(0);
    setAnswerText("");
    setAudioUrl(null);
    audioBlobRef.current = null;
  }

  // "Sahi answer suno" — pehle /api/tts try karo, mock ho toh speechSynthesis.
  async function hearModelAnswer() {
    if (!lastAttempt) return;
    const text = modelAnswerText(lastAttempt.question);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.mock && data.audioUrl) {
        new Audio(data.audioUrl).play();
        return;
      }
    } catch {
      /* mock fallback neeche hai */
    }
    speak(text);
  }

  const reportTotal = attempts.length
    ? Math.round(attempts.reduce((a, t) => a + t.result.total, 0) / attempts.length)
    : 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16">
      {/* Header */}
      <header className="py-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-brand-700">
          Bol<span className="text-slate-900">Viva</span>
        </h1>
        <p className="mt-2 text-slate-600">
          Bolke seekho, bina dare. 🎤 Hinglish me viva do — AI sunega, score dega,
          aur sahi answer voice me sunayega.
        </p>
        <span className="mt-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Mock mode — Gnani API plug-in baki hai
        </span>
      </header>

      {/* ---------- Stage: subject ---------- */}
      {stage === "subject" && (
        <section>
          <h2 className="text-lg font-semibold">1. Subject choose karo 👇</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => startViva(s)}
                className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-500 hover:shadow"
              >
                <div className="text-2xl font-bold text-brand-600">{s}</div>
                <div className="mt-1 font-medium">{SUBJECT_LABELS[s]}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {getQuestionsBySubject(s).length} sawal • voice viva
                </div>
              </button>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-slate-500">
            Kul {QUESTIONS.length} sawal ready hain. Ek viva = 3 sawal.
          </p>
        </section>
      )}

      {/* ---------- Stage: question ---------- */}
      {stage === "question" && current && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              {subject} • Sawal {qIndex + 1} / {questions.length}
            </span>
            <button onClick={resetAll} className="text-brand-600 hover:underline">
              Subject badlo
            </button>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-brand-500"
              style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h2 className="mt-6 text-2xl font-bold leading-snug">{current.question}</h2>
          <button
            onClick={() => speak(current.question)}
            className="mt-3 rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
          >
            🔊 Sawal suno
          </button>

          <div className="mt-8">
            <p className="font-semibold">Tumhara jawab 🎙️</p>
            <p className="mt-1 text-sm text-slate-500">
              Hinglish me bolo jaise viva me bolte — English terms English me,
              samjhana Hindi me. 30–45 second ka jawab best rehta hai.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={toggleRecording}
                className={`rounded-full px-5 py-2.5 font-semibold text-white transition ${
                  recording ? "bg-red-500 hover:bg-red-600" : "bg-slate-900 hover:bg-slate-700"
                }`}
              >
                {recording ? "⏹️ Recording roko" : "🎤 Bolke jawab do"}
              </button>
              {recording && (
                <span className="animate-pulse text-sm font-medium text-red-500">
                  Recording chal rahi hai… bolo!
                </span>
              )}
              {audioUrl && !recording && (
                <audio controls src={audioUrl} className="h-10" />
              )}
            </div>
            {micError && <p className="mt-2 text-sm text-red-500">{micError}</p>}
            <p className="mt-2 text-xs text-slate-400">
              Note: Mock mode me recording sirf save hoti hai — Gnani STT plug-in
              ke baad yahi audio auto-transcribe hoga. Abhi ke liye apna jawab
              neeche likh do (jaise tum bolte, waisa hi).
            </p>

            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={5}
              placeholder="Apna jawab yahan likho — Hinglish me hi likho, jaise bolte ho… jaise: 'Process ek program hai jo execution me hai, uski apni memory hoti hai…'"
              className="mt-3 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />

            <button
              onClick={submitAnswer}
              disabled={submitting || (!answerText.trim() && !audioUrl)}
              className="mt-4 w-full rounded-xl bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Score ho raha hai…" : "Jawab submit karo → Score dekho"}
            </button>
          </div>
        </section>
      )}

      {/* ---------- Stage: feedback ---------- */}
      {stage === "feedback" && lastAttempt && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">{lastAttempt.question.question}</p>

          <div className="mt-4 flex items-center gap-5">
            <div
              className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-3xl font-extrabold text-white ${
                lastAttempt.result.total >= 60
                  ? "bg-green-500"
                  : lastAttempt.result.total >= 40
                    ? "bg-amber-500"
                    : "bg-red-400"
              }`}
            >
              {lastAttempt.result.total}
            </div>
            <div className="flex-1 space-y-2">
              <ScoreBar label="Concept accuracy" value={lastAttempt.result.concept} max={40} />
              <ScoreBar label="Completeness (points cover)" value={lastAttempt.result.completeness} max={30} />
              <ScoreBar label="Example / clarity" value={lastAttempt.result.clarity} max={20} />
              <ScoreBar label="Confidence" value={lastAttempt.result.confidence} max={10} />
            </div>
          </div>

          {sttNote && <p className="mt-3 text-xs text-amber-600">{sttNote}</p>}

          <div className="mt-5 rounded-xl bg-brand-50 p-4">
            <p className="font-semibold">🗣️ Feedback</p>
            <p className="mt-1 leading-relaxed">{lastAttempt.result.feedback}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => speak(lastAttempt.result.feedback)}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100"
              >
                🔊 Feedback suno
              </button>
              <button
                onClick={hearModelAnswer}
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                ✅ Sahi answer suno
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-green-50 p-4">
              <p className="font-semibold text-green-800">Kya sahi tha 👍</p>
              {lastAttempt.result.whatWasRight.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-green-900">
                  {lastAttempt.result.whatWasRight.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-green-900">
                  Model points me se koi point pura cover nahi hua — neeche missed wala dekho.
                </p>
              )}
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="font-semibold text-red-800">Kya miss hua 👇</p>
              {lastAttempt.result.whatWasMissed.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-900">
                  {lastAttempt.result.whatWasMissed.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-red-900">
                  Kuch miss nahi hua — saare points cover! 🎉
                </p>
              )}
            </div>
          </div>

          <button
            onClick={nextStep}
            className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-700"
          >
            {qIndex + 1 < questions.length ? "Agla sawal →" : "Final report dekho 🏁"}
          </button>
        </section>
      )}

      {/* ---------- Stage: report ---------- */}
      {stage === "report" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-center text-2xl font-bold">🏁 Viva Report — {subject}</h2>
          <p className="mt-2 text-center text-5xl font-extrabold text-brand-700">
            {reportTotal}
            <span className="text-xl text-slate-400">/100</span>
          </p>
          <p className="mt-2 text-center text-slate-600">
            {reportTotal >= 75
              ? "Solid! Viva-ready ho tum — bas aise hi bolte raho. 🔥"
              : reportTotal >= 50
                ? "Achhi pakad hai. Miss hue points ek baar revise kar lo, score kud jayega."
                : "Shuruaat ho gayi hai — missed points padho, kal phir try karo. Roz thoda, pakka sudhar."}
          </p>

          <div className="mt-6 space-y-3">
            {attempts.map((a, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">
                    {i + 1}. {a.question.question}
                  </p>
                  <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                    {a.result.total}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{a.result.feedback}</p>
              </div>
            ))}
          </div>

          <button
            onClick={resetAll}
            className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-bold text-white hover:bg-brand-700"
          >
            🔁 Phir se try karo
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            BolViva — Built with Gnani AI (Prisma STT • Timbre TTS) • #GnaniAI
            #GreatIndianAIInternshipChallenge
          </p>
        </section>
      )}
    </main>
  );
}
