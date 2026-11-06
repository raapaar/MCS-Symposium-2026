import assert from "node:assert/strict";
import { programmeStatus } from "../src/v2/programme.ts";
import { answerEnquiry } from "../src/v2/enquiry.ts";
import { reservationExpired } from "../src/v2/storeModel.ts";
const item = {
  segment: 2,
  startsAt: "2026-11-06T09:00+10:00",
  endsAt: "2026-11-06T10:00+10:00",
};
assert.equal(
  programmeStatus(item, { mode: "auto" }, Date.parse("2026-11-06T08:59+10:00")),
  "upcoming",
);
assert.equal(
  programmeStatus(item, { mode: "auto" }, Date.parse(item.startsAt)),
  "active",
);
assert.equal(
  programmeStatus(item, { mode: "auto" }, Date.parse(item.endsAt)),
  "completed",
);
assert.equal(
  programmeStatus(item, { mode: "manual", activeSegment: 3 }, 0),
  "completed",
);
assert.equal(
  programmeStatus(item, { mode: "manual", activeSegment: 0 }, 0),
  "upcoming",
);
assert.equal(
  programmeStatus(item, { mode: "manual", activeSegment: 5 }, 0),
  "completed",
);
const order = { createdAt: { toMillis: () => 1000 }, status: "confirmed" };
assert.equal(reservationExpired(order, 86400999), false);
assert.equal(reservationExpired(order, 86401000), true);
assert.equal(
  reservationExpired({ ...order, status: "awaiting_verification" }, 86401000),
  false,
);
assert.equal(
  answerEnquiry("How do I pay?", [
    { id: "1", title: "Payment", text: "Payment proof", href: "/store" },
  ])[0].id,
  "1",
);
assert.equal(answerEnquiry("quantum potato", []).length, 0);
console.log(
  "PASS PNG timing, manual progression, exact reservation deadline, timely pending proof and enquiry source matching.",
);
