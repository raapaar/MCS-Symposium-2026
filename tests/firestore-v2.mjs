import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteField,
  serverTimestamp,
} from "firebase/firestore";
const env = await initializeTestEnvironment({
  projectId: "demo-mcs-v2",
  firestore: {
    host: "127.0.0.1",
    port: 8180,
    rules: await readFile("firestore.rules", "utf8"),
  },
});
const customer = env.authenticatedContext("buyer").firestore();
const other = env.authenticatedContext("other").firestore();
const staff = env.authenticatedContext("staff-user").firestore();
const owner = env.authenticatedContext("owner-user").firestore();
const guest = env.unauthenticatedContext().firestore();
const product = {
  title: "Test tee",
  description: "QA",
  category: "Apparel",
  image: "",
  priceCents: 5000,
  published: true,
  available: true,
  paymentInstructions: "Contact staff",
};
const order = (overrides) => ({
  ownerId: "buyer",
  productId: "tee",
  productTitle: "Test tee",
  unitCents: 5000,
  quantity: 2,
  totalCents: 10000,
  customerName: "Buyer",
  contact: "buyer@example.invalid",
  note: "",
  location: null,
  status: "requested",
  receiptPath: "",
  reviewNote: "",
  reviewedBy: "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...overrides,
});
const appearance = {
  accent: "#dfff00",
  surface: "#dfdff0",
  heroImageUrl: "",
  heroWord: "BEYOND.",
  motion: true,
  layout: "spacious",
  rotationSeconds: 8,
  useGallery: true,
};
try {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, "users", "staff-user"), {
        role: "staff",
        active: true,
        email: "staff@example.invalid",
      }),
      setDoc(doc(db, "users", "owner-user"), {
        role: "superuser",
        active: true,
      }),
      setDoc(doc(db, "users", "suspended-user"), {
        role: "staff",
        active: false,
      }),
      setDoc(doc(db, "merchandise", "tee"), product),
      setDoc(doc(db, "merchandise", "draft"), { ...product, published: false }),
    ]);
  });
  await assertSucceeds(
    getDocs(
      query(collection(guest, "merchandise"), where("published", "==", true)),
    ),
  );
  await assertFails(getDocs(collection(guest, "merchandise")));
  await assertFails(getDoc(doc(guest, "merchandise", "draft")));
  await assertSucceeds(
    setDoc(doc(customer, "storeOrders", "booking"), order({})),
  );
  for (const [id, changes] of Object.entries({
    owner: { ownerId: "other" },
    price: { unitCents: 1, totalCents: 2 },
    zero: { quantity: 0, totalCents: 0 },
    quantity: { quantity: 26, totalCents: 130000 },
    negative: { unitCents: -1, totalCents: -2 },
    contact: { contact: "x".repeat(255) },
    schema: { extra: true },
    paid: { status: "paid" },
    timestamp: { createdAt: new Date(0) },
    location: { location: { latitude: 100, longitude: 0 } },
  })) {
    await assertFails(setDoc(doc(customer, "storeOrders", id), order(changes)));
  }
  const missing = order({});
  delete missing.productTitle;
  await assertFails(setDoc(doc(customer, "storeOrders", "missing"), missing));
  await assertFails(getDoc(doc(other, "storeOrders", "booking")));
  await assertFails(getDocs(collection(customer, "storeOrders")));
  await assertSucceeds(
    getDocs(
      query(
        collection(customer, "storeOrders"),
        where("ownerId", "==", "buyer"),
      ),
    ),
  );
  await assertSucceeds(getDocs(collection(staff, "storeOrders")));
  await assertFails(
    updateDoc(doc(customer, "storeOrders", "booking"), {
      ownerId: "other",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(customer, "storeOrders", "booking"), {
      status: "paid",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(customer, "storeOrders", "booking"), {
      receiptPath:
        "receipts/buyer/booking/11111111-1111-4111-8111-111111111111",
      status: "awaiting_verification",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(staff, "storeOrders", "booking"), {
      status: "confirmed",
      reviewedBy: "staff-user",
      reviewNote: "Available",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(customer, "storeOrders", "booking"), {
      receiptPath:
        "receipts/other/booking/11111111-1111-4111-8111-111111111111",
      status: "awaiting_verification",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(customer, "storeOrders", "booking"), {
      receiptPath:
        "receipts/buyer/booking/11111111-1111-4111-8111-111111111111",
      status: "awaiting_verification",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(staff, "storeOrders", "booking"), {
      totalCents: 1,
      status: "paid",
      reviewedBy: "staff-user",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertSucceeds(
    updateDoc(doc(staff, "storeOrders", "booking"), {
      status: "paid",
      reviewedBy: "staff-user",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(customer, "storeOrders", "booking"), {
      status: "requested",
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(
    updateDoc(doc(staff, "storeOrders", "booking"), {
      note: deleteField(),
      updatedAt: serverTimestamp(),
    }),
  );
  await assertFails(setDoc(doc(customer, "merchandise", "evil"), product));
  await assertSucceeds(
    setDoc(doc(staff, "merchandise", "staff-product"), product),
  );
  await assertFails(
    updateDoc(doc(staff, "merchandise", "staff-product"), {
      description: "x".repeat(2001),
    }),
  );
  await assertFails(
    setDoc(doc(staff, "siteSettings", "appearance"), appearance),
  );
  await assertSucceeds(
    setDoc(doc(owner, "siteSettings", "appearance"), appearance),
  );
  await assertSucceeds(getDoc(doc(guest, "siteSettings", "appearance")));
  await assertFails(
    updateDoc(doc(owner, "siteSettings", "appearance"), { rotationSeconds: 1 }),
  );
  await assertFails(
    setDoc(doc(customer, "users", "buyer"), { role: "superuser" }),
  );
  await assertFails(setDoc(doc(staff, "users", "new-user"), { role: "staff" }));
  await assertSucceeds(
    setDoc(doc(owner, "users", "new-user"), {
      role: "staff",
      active: true,
      email: "new@example.invalid",
    }),
  );
  await assertFails(
    updateDoc(doc(owner, "users", "owner-user"), { active: false }),
  );
  await assertFails(getDoc(doc(customer, "users", "staff-user")));
  const register = {
    title: "Domain",
    provider: "Provider",
    accountOwner: "Department",
    renewalDate: "2027-01-01",
    vaultReference: "Vault reference only",
    notes: "QA",
  };
  await assertSucceeds(
    setDoc(doc(owner, "serviceRegister", "domain"), register),
  );
  await assertFails(getDoc(doc(staff, "serviceRegister", "domain")));
  await assertFails(getDoc(doc(guest, "serviceRegister", "domain")));
  await assertFails(
    updateDoc(doc(owner, "serviceRegister", "domain"), {
      notes: "x".repeat(4001),
    }),
  );
  await assertFails(
    getDocs(
      collection(
        env.authenticatedContext("suspended-user").firestore(),
        "storeOrders",
      ),
    ),
  );
  console.log(
    "PASS Firestore prototype: public/draft access, price/quantity bounds, owner isolation, immutable fields, confirmation/proof/paid transitions, role escalation, account suspension, appearance and private registers.",
  );
} finally {
  await env.cleanup();
}
