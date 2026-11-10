// BolViva question bank — v1 (12 questions, 3 per subject).
// Every question carries model answer points and key terms — the scoring
// engine (lib/scoring.ts) evaluates the student's answer against these.
//
// keyTerms format: each entry is one concept. If a concept has several
// common ways of being said (English + Hinglish variants), they are kept
// in a single entry separated by "|" — any one variant found counts the
// concept as "found". Example: "shared memory|memory share|share karta hai"

export type Subject = "OS" | "DBMS" | "CN" | "DSA";

export interface Question {
  id: string;
  subject: Subject;
  /** The question — viva style. */
  question: string;
  /** Main points of the model answer (short, one per line). */
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
    question: "What is the difference between a process and a thread?",
    modelAnswerPoints: [
      "A process is a program in execution; a thread is a unit of execution inside a process",
      "Every process has its own separate memory (address space)",
      "All threads of a process share the memory of that process",
      "Process creation is heavy and slow; thread creation is light and fast",
      "If one process crashes, other processes stay safe; one crashing thread can bring down the whole process",
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
    question: "What is a deadlock? Explain with an example.",
    modelAnswerPoints: [
      "Deadlock is a situation where two or more processes wait for each other's resources and none of them can move forward",
      "Each process holds one resource and waits for another resource (circular wait)",
      "The 4 conditions of deadlock: mutual exclusion, hold and wait, no preemption, circular wait",
      "Example: Process A holds the printer and waits for the scanner, while Process B holds the scanner and waits for the printer",
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
    question: "Why do we use virtual memory? What are its benefits?",
    modelAnswerPoints: [
      "Virtual memory lets programs larger than RAM run — it uses disk (swap/page file) as an extension of RAM",
      "Pages that are not in use stay on disk and are loaded into RAM when needed (paging)",
      "Every process gets its own virtual address space — memory protection and isolation",
      "RAM is used better because only the active pages stay in memory",
    ],
    keyTerms: [
      "disk|swap|page file|hard disk",
      "ram se bada|bada program|larger than ram|bigger than ram",
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
    question: "What is normalization? Why do we do it in a database?",
    modelAnswerPoints: [
      "Normalization is organizing data into tables in such a way that duplicate/redundant data is reduced",
      "It removes data inconsistency and update/insert/delete anomalies",
      "Data is split into smaller, well-structured tables that are joined by foreign keys",
      "It has levels called normal forms — 1NF, 2NF, 3NF, BCNF",
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
    question: "What is the difference between a primary key and a foreign key?",
    modelAnswerPoints: [
      "A primary key uniquely identifies every row — it cannot be duplicate or NULL",
      "A table has only one primary key",
      "A foreign key is a column in one table that refers to the primary key of another table",
      "A foreign key creates relationships between tables and maintains referential integrity",
      "A foreign key can have duplicate values",
    ],
    keyTerms: [
      "unique|alag pehchan|uniquely identify",
      "null nahi|not null",
      "refer|dusre table|another table|other table",
      "relationship|rishta|jodta",
      "referential integrity|integrity",
      "duplicate ho sakta|duplicate allowed|duplicates allowed",
    ],
  },
  {
    id: "dbms-3",
    subject: "DBMS",
    question: "What are the ACID properties? Explain each one.",
    modelAnswerPoints: [
      "Atomicity: a transaction happens fully or not at all — there is no half-done transaction",
      "Consistency: after a transaction, the database always stays in a valid, consistent state",
      "Isolation: parallel transactions do not disturb each other, as if they ran one by one",
      "Durability: after commit, the data is permanent — it stays safe even if the system crashes",
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
    question: "What is the difference between TCP and UDP? When would you use each?",
    modelAnswerPoints: [
      "TCP is connection-oriented (a connection/handshake is set up first); UDP is connectionless",
      "TCP is reliable — data is guaranteed to arrive, in the correct order, and lost packets are resent",
      "UDP is unreliable but fast — no guarantee and no retransmission",
      "TCP is used where correctness matters: web (HTTP), email, file transfer",
      "UDP is used where speed matters: live streaming, video calls, online games, DNS",
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
    question: "What are the 7 layers of the OSI model? Give one function of each layer.",
    modelAnswerPoints: [
      "Physical layer: sending raw bits over the wire/signal",
      "Data Link layer: frames, MAC addresses, error-free transfer over one hop (switch)",
      "Network layer: IP addressing and routing (router)",
      "Transport layer: end-to-end delivery — TCP/UDP, port numbers",
      "Session layer: creating, maintaining and closing connections/sessions",
      "Presentation layer: data format, encryption, compression",
      "Application layer: closest to the user — protocols like HTTP, FTP, DNS",
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
    question: "How does DNS work? What happens when you type a website name in the browser?",
    modelAnswerPoints: [
      "DNS (Domain Name System) converts a website name (domain) into an IP address — it is the phonebook of the internet",
      "The browser first checks its cache, then asks a resolver (ISP)",
      "The resolver asks the root server, then the TLD server (.com), then the authoritative server, to get the real IP",
      "Once the IP is found, the browser opens a TCP connection to that server and requests the website",
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
    question: "What is the difference between an array and a linked list?",
    modelAnswerPoints: [
      "Array elements sit together in memory (contiguous); linked list nodes are scattered in memory and joined by pointers",
      "Access by index in an array is O(1); access in a linked list is O(n) — you must traverse from the start",
      "An array's size is fixed (static); a linked list's size is dynamic — it can grow or shrink",
      "Insert/delete in the middle is easy in a linked list; in an array, elements have to be shifted",
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
    question: "What is the difference between a stack and a queue?",
    modelAnswerPoints: [
      "A stack is LIFO — Last In First Out; the element that went in last comes out first",
      "A queue is FIFO — First In First Out; the element that came in first goes out first",
      "In a stack, push and pop happen at only one end (the top)",
      "In a queue, insertion happens at the rear and deletion at the front",
      "Example: stack = a pile of plates / the browser back button; queue = a line at a ticket counter",
    ],
    keyTerms: [
      "lifo|last in first out",
      "fifo|first in first out",
      "push|pop",
      "top",
      "rear|front",
      "ek hi end|ek end|one end|single end",
      "line|queue example|plates",
    ],
  },
  {
    id: "dsa-3",
    subject: "DSA",
    question: "When can binary search fail? State its condition and complexity.",
    modelAnswerPoints: [
      "Binary search works only on a sorted array — if the array is not sorted, it fails or gives a wrong answer",
      "At every step it compares with the middle element and the search space becomes half",
      "Its time complexity is O(log n)",
      "Random access is required — binary search is not efficient on a linked list",
      "If the element does not exist, the search ends without finding it (low > high)",
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

/** Turn the model answer into one speakable paragraph (for TTS / "Hear the model answer"). */
export function modelAnswerText(question: Question): string {
  return question.modelAnswerPoints.join(". ") + ".";
}
