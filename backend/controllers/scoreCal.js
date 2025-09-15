export default function simpleComputeScore(events = [], base = 100) {
  const ITEM_PENALTIES = {
    phone: 10,
    book: 6,
    device: 8,
  };

  let score = base;

  for (const ev of events) {
    if (!ev || !ev.eventType) continue;
    const t = ev.eventType;

    if (t === "looking_away") {
      score -= 2;
      continue;
    }
    if (t === "no_face" || t === "no_look") {
      score -= 5;
      continue;
    }
    if (t === "multiple_faces") {
      score -= 15;
      continue;
    }
    if (t === "item_detected") {
      const lbl = (ev.details || "").toLowerCase();

      // simple keyword matching
      if (lbl.includes("phone") || lbl.includes("cell") || lbl.includes("mobile")) {
        score -= ITEM_PENALTIES.phone;
      } else if (lbl.includes("book") || lbl.includes("paper") || lbl.includes("note")) {
        score -= ITEM_PENALTIES.book;
      } else if (lbl.includes("laptop") || lbl.includes("tablet") || lbl.includes("keyboard") || lbl.includes("mouse")) {
        score -= ITEM_PENALTIES.device;
      } else {
        score -= ITEM_PENALTIES.device;
      }
      continue;
    }
  }

  return score;
}
