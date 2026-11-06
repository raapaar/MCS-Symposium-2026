// Offline, synthetic data only. This module has no network implementation.
const image = "/src/assets/v2-frontier.webp";
const role = new URLSearchParams(location.search).get("qaRole");
const now = Date.now();
const records = {
  event: [
    {
      id: "event",
      published: true,
      title: "MCS Symposium 2026",
      university: "Divine Word University",
      department: "Mathematics and Computing Science",
      year: 2026,
      eventDate: "2020-11-06",
      eventStartTime: "09:00",
      venue: "Learning Hub",
      location: "DWU Madang",
      heroTagline: "Ideas beyond the expected.",
      aboutTitle: "Ideas into impact",
      aboutContent: "Synthetic preview content for visual review.",
      hodName: "Department representative",
      hodMessage: "Welcome to our symposium.",
    },
  ],
  presenters: ["keynote", "guest", "presenter"].flatMap((speakerType, i) =>
    [0, 1].map((j) => ({
      id: `${speakerType}${j}`,
      published: true,
      speakerType,
      name: j
        ? "A very long presenter name that should fit within a consistent card"
        : "Symposium Presenter",
      role: "Mathematics & Computing Science",
      topic: j
        ? "A longer research project title for checking the poster card layout under realistic content lengths"
        : "Beyond the frontier",
      imageUrl: image,
      biography: "Synthetic speaker biography for preview only.",
      projectDescription:
        "An exploration of mathematics and computing in Papua New Guinea.",
      projectLogoUrl: "/src/assets/MCS-logo2.png",
      screenshots: [{ url: image, path: "qa" }],
      linkedinUrl: "https://www.linkedin.com/",
      order: i * 2 + j,
    })),
  ),
  gallery: [0, 1, 2].map((i) => ({
    id: `gallery${i}`,
    published: true,
    title: `Symposium moment ${i + 1}`,
    description: "Synthetic image for slideshow inspection.",
    image,
    order: i,
  })),
  schedule: [1, 2, 3, 4].map((segment, i) => ({
    id: `segment${segment}`,
    published: true,
    segment,
    time: `${9 + i}:00`,
    title: [
      "Opening & keynotes",
      "Research presentations",
      "Student projects",
      "Closing & awards",
    ][i],
    type: "Programme",
    description: "Programme detail for preview.",
    location: "DWU Learning Hub",
    startsAt: new Date(now + (i - 1) * 3600000).toISOString(),
    endsAt: new Date(now + i * 3600000).toISOString(),
    order: i,
    status: "upcoming",
  })),
  merchandise: [0, 1, 2, 3].map((i) => ({
    id: `product${i}`,
    published: true,
    title: ["Symposium tee", "MCS notebook", "Event tote", "Campus cap"][i],
    description: "Synthetic merchandise. Preview only.",
    category: i % 2 ? "Accessories" : "Apparel",
    image,
    priceCents: 2500 + i * 1000,
    available: true,
    paymentInstructions: "QA only. No real payments.",
  })),
  enquiries: [
    {
      id: "access",
      published: true,
      question: "Who can attend?",
      answer: "The published programme welcomes the university community.",
    },
  ],
  announcements: [
    {
      id: "welcome",
      published: true,
      title: "Welcome to the symposium",
      content: "Explore the programme and projects.",
      category: "Event",
    },
  ],
  users: [],
  staff: [],
  sponsors: [],
  documents: [],
  storeOrders: [],
};
export const initializeApp = () => ({ options: {} }),
  deleteApp = async () => {},
  getStorage = () => ({}),
  getFirestore = () => ({});
export const getAuth = () => ({
  currentUser: role
    ? { uid: "qa", email: "qa@example.invalid", getIdToken: async () => "qa" }
    : null,
});
export const onAuthStateChanged = (auth, cb) => {
  queueMicrotask(() => cb(auth.currentUser));
  return () => {};
};
export const signOut = async () => {},
  signInWithEmailAndPassword = async () => {
    throw Error("Offline QA: sign-in disabled");
  },
  createUserWithEmailAndPassword = signInWithEmailAndPassword;
export const collection = (db, path) => ({ path }),
  doc = (db, path, id) => ({ path: `${path}/${id || "qa-id"}` }),
  where = (field, op, value) => ({ field, value }),
  orderBy = () => ({}),
  limit = () => ({}),
  query = (ref, ...filters) => ({ ...ref, filters });
function snapshot(ref) {
  if (ref.path.startsWith("users/"))
    return {
      exists: () => !!role,
      data: () => ({
        role: role || "customer",
        active: true,
        permissions: ["gallery"],
      }),
    };
  if (ref.path === "siteSettings/appearance")
    return { exists: () => false, data: () => undefined };
  if (ref.path === "siteSettings/programme")
    return {
      exists: () => true,
      data: () => ({ mode: "auto", activeSegment: 0 }),
    };
  const docs = (records[ref.path] || [])
    .filter((d) =>
      (ref.filters || []).every((f) => !f.field || d[f.field] === f.value),
    )
    .map((d) => ({ id: d.id, data: () => d }));
  return { docs, empty: !docs.length };
}
export const getDocs = async (ref) => snapshot(ref),
  getDoc = getDocs,
  onSnapshot = (ref, cb) => {
    queueMicrotask(() => cb(snapshot(ref)));
    return () => {};
  };
export const addDoc = async () => {
    throw Error("Offline QA: writes disabled");
  },
  setDoc = addDoc,
  updateDoc = addDoc,
  deleteDoc = addDoc,
  serverTimestamp = () => ({ toMillis: () => Date.now() }),
  writeBatch = () => ({ set: () => {}, commit: addDoc });
