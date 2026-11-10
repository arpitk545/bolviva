// BolViva question bank — v1 (12 questions, 3 per subject).
// Har question ke saath model answer points aur key terms hain — scoring
// engine (lib/scoring.ts) isi se student ke answer ko evaluate karta hai.
//
// keyTerms format: har entry ek concept hai. Agar ek concept ke kai common
// bolne ke tareeke hain (English + Hinglish variants), toh unhe "|" se
// separate karke ek hi entry me rakha hai — koi bhi variant mile toh concept
// "found" mana jayega. Example: "shared memory|memory share|share karta hai"

export type Subject = "OS" | "DBMS" | "CN" | "DSA";

export interface Question {
  id: string;
  subject: Subject;
  /** Sawaal — Hinglish-friendly phrasing, viva style me. */
  question: string;
  /** Model answer ke main points (short, ek-ek line). */
  modelAnswerPoints: string[];
  /** Key concepts — "|" separated variants per entry. */
  keyTerms: string[];
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  OS: "Operating Systems",
  DBMS: "DBMS (Database)",
  CN: "Computer Networks",
  DSA: "Data Structures & Algorithms",
};

export const SUBJECTS: Subject[] = ["OS", "DBMS", "CN", "DSA"];

export const QUESTIONS: Question[] = [
  // ---------------- Operating Systems ----------------
  {
    id: "os-1",
    subject: "OS",
    question: "Batao, process aur thread me kya difference hai?",
    modelAnswerPoints: [
      "Process ek program hai jo execution me hai; thread process ke andar ka ek execution unit hai",
      "Har process ki apni separate memory (address space) hoti hai",
      "Ek process ke saare threads usi process ki memory share karte hain",
      "Process creation heavy aur slow hota hai, thread creation light aur fast hoti hai",
      "Ek process crash ho toh doosra process safe rehta hai; ek thread crash poore process ko gira sakta hai",
    ],
    keyTerms: [
      "execution|execute ho raha",
      "own memory|apni memory|separate memory|alag memory|address space",
      "shared memory|memory share|share karte|share karta",
      "heavy|bhaari|slow creation",
      "lightweight|halka|light",
      "crash",
    ],
  },
  {
    id: "os-2",
    subject: "OS",
    question: "Deadlock kya hota hai? Ek example ke saath samjhao.",
    modelAnswerPoints: [
      "Deadlock woh situation hai jahan do ya zyada processes ek dusre ke resource ka wait karte hain aur koi aage nahi badh pata",
      "Har process ek resource hold kiye hue hai aur dusre ke resource ka wait kar raha hai (circular wait)",
      "Deadlock ke 4 conditions: mutual exclusion, hold and wait, no preemption, circular wait",
      "Example: Process A printer hold karke scanner wait kare, Process B scanner hold karke printer wait kare",
    ],
    keyTerms: [
      "wait kar|intezaar|waiting",
      "resource",
      "circular wait|gol gol|chakkar",
      "hold",
      "mutual exclusion",
      "no preemption|preemption",
      "aage nahi badh|ruk jaata|stuck|phans jaata",
    ],
  },
  {
    id: "os-3",
    subject: "OS",
    question: "Virtual memory kyun use karte hain? Isse kya fayda hota hai?",
    modelAnswerPoints: [
      "Virtual memory RAM se bada program bhi run karne deti hai — disk (swap/page file) ko RAM ka extension bana deti hai",
      "Jo pages abhi use nahi ho rahe woh disk par rehte hain, zaroorat padne par RAM me aate hain (paging)",
      "Har process ko apna alag virtual address space milta hai — memory protection aur isolation",
      "RAM ka better use hota hai kyunki sirf active pages memory me rehte hain",
    ],
    keyTerms: [
      "disk|swap|page file|hard disk",
      "ram se bada|bada program",
      "paging|page",
      "address space",
      "protection|isolation|alag",
      "extension|badhana",
    ],
  },

  // ---------------- DBMS ----------------
  {
    id: "dbms-1",
    subject: "DBMS",
    question: "Normalization kya hota hai? Database me ye kyun karte hain?",
    modelAnswerPoints: [
      "Normalization data ko tables me aise organize karna hai ki duplicate/redundant data kam ho",
      "Isse data inconsistency aur update/insert/delete anomalies khatm hote hain",
      "Data ko chhote, well-structured tables me todke foreign keys se joda jata hai",
      "Iske levels hote hain — 1NF, 2NF, 3NF, BCNF (normal forms)",
    ],
    keyTerms: [
      "redundan|duplicate|dohra",
      "anomal|inconsisten|galat data",
      "table",
      "foreign key",
      "1nf|2nf|3nf|normal form|bcnf",
      "organize|structure",
    ],
  },
  {
    id: "dbms-2",
    subject: "DBMS",
    question: "Primary key aur foreign key me kya difference hai?",
    modelAnswerPoints: [
      "Primary key har row ko uniquely identify karti hai — duplicate aur NULL nahi ho sakta",
      "Ek table me sirf ek primary key hoti hai",
      "Foreign key ek table ka woh column hai jo dusre table ki primary key ko refer karta hai",
      "Foreign key tables ke beech relationship banati hai aur referential integrity maintain karti hai",
      "Foreign key me duplicate values ho sakti hain",
    ],
    keyTerms: [
      "unique|alag pehchan|uniquely identify",
      "null nahi|not null",
      "refer|dusre table",
      "relationship|rishta|jodta",
      "referential integrity|integrity",
      "duplicate ho sakta|duplicate allowed",
    ],
  },
  {
    id: "dbms-3",
    subject: "DBMS",
    question: "ACID properties kya hoti hain? Ek-ek karke samjhao.",
    modelAnswerPoints: [
      "Atomicity: transaction ya toh pura hoga ya bilkul nahi — aadha transaction nahi hota",
      "Consistency: transaction ke baad database hamesha valid/consistent state me rehta hai",
      "Isolation: parallel transactions ek dusre ko disturb nahi karte, jaise ek-ek karke chale hon",
      "Durability: commit ke baad data permanent hai — system crash ho jaye toh bhi data safe rehta hai",
    ],
    keyTerms: [
      "atomicity|pura ya kuch nahi|all or nothing",
      "consistency|consistent|valid state",
      "isolation|alag|disturb nahi|parallel",
      "durability|permanent|crash",
      "transaction",
      "commit",
    ],
  },

  // ---------------- Computer Networks ----------------
  {
    id: "cn-1",
    subject: "CN",
    question: "TCP aur UDP me kya difference hai? Kab konsa use karoge?",
    modelAnswerPoints: [
      "TCP connection-oriented hai (pehle handshake/connection banta hai), UDP connectionless hai",
      "TCP reliable hai — data guaranteed, sahi order me pahunchta hai, lost packet dobara bheja jata hai",
      "UDP unreliable lekin fast hai — koi guarantee, koi retransmission nahi",
      "TCP use hota hai jahan correctness zaroori hai: web (HTTP), email, file transfer",
      "UDP use hota hai jahan speed zaroori hai: live streaming, video call, online games, DNS",
    ],
    keyTerms: [
      "connection-oriented|connection banta|handshake",
      "connectionless|bina connection",
      "reliable|bharosa|guarantee",
      "order|sequence|sahi kram",
      "retransmi|dobara bhej|lost packet",
      "fast|tez|speed",
      "streaming|video call|gaming|live",
    ],
  },
  {
    id: "cn-2",
    subject: "CN",
    question: "OSI model ki 7 layers konsi hain? Har layer ka ek kaam batao.",
    modelAnswerPoints: [
      "Physical layer: raw bits ko wire/signal par bhejna",
      "Data Link layer: frames, MAC address, ek hop ka error-free transfer (switch)",
      "Network layer: IP addressing aur routing (router)",
      "Transport layer: end-to-end delivery — TCP/UDP, port numbers",
      "Session layer: connection/session ko banana, maintain aur band karna",
      "Presentation layer: data ka format, encryption, compression",
      "Application layer: user ke sabse paas — HTTP, FTP, DNS jaise protocols",
    ],
    keyTerms: [
      "physical",
      "data link|mac",
      "network|routing|ip address",
      "transport|tcp|port",
      "session",
      "presentation|encryption|format",
      "application|http",
    ],
  },
  {
    id: "cn-3",
    subject: "CN",
    question: "DNS kaam kaise karta hai? Jab browser me website ka naam type karte ho toh kya hota hai?",
    modelAnswerPoints: [
      "DNS (Domain Name System) website ke naam (domain) ko IP address me badalta hai — internet ki phonebook",
      "Browser pehle cache check karta hai, phir resolver (ISP) se puchta hai",
      "Resolver root server → TLD server (.com) → authoritative server se asli IP leta hai",
      "IP milne ke baad browser us server se TCP connection banake website mangta hai",
    ],
    keyTerms: [
      "ip address",
      "domain|naam",
      "phonebook|phone book|directory",
      "cache",
      "resolver|isp",
      "root server|tld|authoritative",
      "translate|badalta|convert",
    ],
  },

  // ---------------- DSA ----------------
  {
    id: "dsa-1",
    subject: "DSA",
    question: "Array aur linked list me kya difference hai?",
    modelAnswerPoints: [
      "Array me elements memory me ek saath (contiguous) rehte hain; linked list me nodes alag-alag jagah hote hain, pointers se jude",
      "Array me index se direct access O(1) hai; linked list me access O(n) — shuru se traverse karna padta hai",
      "Array ka size fixed hota hai (static); linked list ka size dynamic — badh-ghat sakta hai",
      "Linked list me beech me insert/delete easy hai; array me shift karna padta hai",
    ],
    keyTerms: [
      "contiguous|ek saath|lagatar memory",
      "pointer|node",
      "o(1)|direct access|index",
      "o(n)|traverse",
      "fixed size|size fix",
      "dynamic|badh|ghat",
      "insert|delete|shift",
    ],
  },
  {
    id: "dsa-2",
    subject: "DSA",
    question: "Stack aur queue me kya difference hai?",
    modelAnswerPoints: [
      "Stack LIFO hai — Last In First Out; jo sabse last me gaya wahi sabse pehle bahar aata hai",
      "Queue FIFO hai — First In First Out; jo pehle aaya wahi pehle bahar",
      "Stack me push/pop sirf ek end (top) se hote hain",
      "Queue me insert rear se aur delete front se hota hai",
      "Example: stack = plates ka dher / browser back button; queue = ticket counter ki line",
    ],
    keyTerms: [
      "lifo|last in first out",
      "fifo|first in first out",
      "push|pop",
      "top",
      "rear|front",
      "ek hi end|ek end",
      "line|queue example|plates",
    ],
  },
  {
    id: "dsa-3",
    subject: "DSA",
    question: "Binary search kab fail ho sakta hai? Iski condition aur complexity batao.",
    modelAnswerPoints: [
      "Binary search sirf sorted array par kaam karta hai — array sorted na ho toh fail/galat answer dega",
      "Har step me middle element se compare karke search space aadha ho jata hai",
      "Time complexity O(log n) hai",
      "Random access zaroori hai — linked list par binary search efficient nahi hota",
      "Element exist hi na kare toh search end ho jata hai bina mile (low > high)",
    ],
    keyTerms: [
      "sorted|sort hona",
      "middle|beech|aadha|half",
      "o(log n)|log n",
      "random access|index",
      "fail|galat",
      "complexity",
    ],
  },
];

export function getQuestionsBySubject(subject: Subject): Question[] {
  return QUESTIONS.filter((q) => q.subject === subject);
}

/** Model answer ko ek bolne layak paragraph me badlo (TTS / "Sahi answer suno" ke liye). */
export function modelAnswerText(question: Question): string {
  return question.modelAnswerPoints.join(". ") + ".";
}
