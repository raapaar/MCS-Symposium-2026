export interface KnowledgeEntry {
  id: string;
  title: string;
  text: string;
  href: string;
}
const aliases: Record<string, string[]> = {
  when: ["date", "time", "schedule"],
  where: ["venue", "location"],
  cost: ["price", "payment", "store"],
  buy: ["store", "merchandise", "booking"],
  pay: ["payment", "receipt", "proof"],
  speaker: ["keynote", "guest", "presenter"],
  programme: ["schedule"],
  program: ["schedule"],
  reserve: ["reservation", "booking"],
  register: ["account", "login"],
  contact: ["enquiry", "help"],
};
export function answerEnquiry(question: string, entries: KnowledgeEntry[]) {
  const stop = new Set([
    "the",
    "a",
    "an",
    "is",
    "are",
    "do",
    "does",
    "i",
    "we",
    "it",
    "to",
    "of",
    "and",
    "can",
    "you",
    "please",
    "about",
    "what",
    "how",
    "for",
    "me",
    "my",
    "there",
    "will",
    "be",
  ]);
  const words = question.toLowerCase().match(/[a-z0-9]+/g) || [];
  const terms = [
    ...new Set(
      words
        .filter((w) => !stop.has(w))
        .flatMap((w) => [w, ...(aliases[w] || [])]),
    ),
  ];
  const ranked = entries
    .map((e) => ({
      ...e,
      score: terms.reduce(
        (sum, w) =>
          sum +
          (e.title.toLowerCase().includes(w) ? 3 : 0) +
          (e.text.toLowerCase().includes(w) ? 1 : 0),
        0,
      ),
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return ranked;
}
