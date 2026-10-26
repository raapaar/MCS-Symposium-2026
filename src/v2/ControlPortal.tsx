import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import app, { auth, db } from "../services/firebase";
import storage from "../services/storageProvider";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useAppearance } from "./appearanceState";
import { useSession } from "./sessionState";
import { money, statusLabel } from "./storeModel";
import type { Product, StoreOrder, OrderStatus } from "./storeModel";
import "../styles/control.css";

const contentLinks = [
  ["event", "Event & welcome", "Hero, dates, venue and contact details"],
  [
    "presenters",
    "Speakers & presenters",
    "People, projects and keynote speakers",
  ],
  ["schedule", "Live programme", "Sessions, timings and live status"],
  ["announcements", "Announcements", "Publish updates for your audience"],
  ["gallery", "Gallery", "Images and event highlights"],
  ["documents", "Documents", "Programmes and downloads"],
  ["staff", "Department staff", "Lecturer and staff profiles"],
  ["sponsors", "Sponsors", "Partners, tiers and logos"],
];
function FormFeedback({ message }: { message: string }) {
  return message ? (
    <p className="control-feedback" role="status">
      {message}
    </p>
  ) : null;
}
function ProductManager() {
  const { items, loading, error } = useLiveCollection<Product>(
    "merchandise",
    false,
  );
  const [edit, setEdit] = useState<Product | null>(null);
  const [revision, setRevision] = useState(0);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setMessage("");
    try {
      const priceCents = Math.round(Number(data.get("price")) * 100);
      if (
        !Number.isInteger(priceCents) ||
        priceCents < 0 ||
        priceCents > 10000000
      )
        throw Error("Enter a valid price.");
      const file = data.get("imageFile");
      let image = edit?.image || "";
      if (file instanceof File && file.size)
        image = (await storage.uploadFile(file, "merchandise")).url;
      const product = {
        title: String(data.get("title")).trim(),
        description: String(data.get("description")).trim(),
        category: String(data.get("category")).trim(),
        image,
        priceCents,
        paymentInstructions: String(data.get("paymentInstructions")).trim(),
        available: data.has("available"),
        published: data.has("published"),
      };
      if (edit) await setDoc(doc(db, "merchandise", edit.id), product);
      else await addDoc(collection(db, "merchandise"), product);
      setEdit(null);
      setRevision((value) => value + 1);
      setMessage(
        "Merchandise saved. Published changes appear live in the store.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to save merchandise.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h2>Merchandise</h2>
      <p>Publish products, pause bookings and update payment instructions.</p>
      {loading && <p>Loading merchandise…</p>}
      {error && <p role="alert">{error}</p>}
      <div className="control-list">
        {items.map((product) => (
          <button
            key={product.id}
            onClick={() => {
              setEdit(product);
              setRevision((v) => v + 1);
            }}
          >
            {product.title}
            <span>
              {money(product.priceCents)} /{" "}
              {product.published ? "Published" : "Draft"}
            </span>
          </button>
        ))}
      </div>
      <form key={revision} onSubmit={save} className="control-form">
        <h3>{edit ? "Edit item" : "New item"}</h3>
        <label>
          Title
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={edit?.title}
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            required
            maxLength={2000}
            defaultValue={edit?.description}
          />
        </label>
        <div className="control-columns">
          <label>
            Price (PGK)
            <input
              name="price"
              type="number"
              min="0"
              max="100000"
              step="0.01"
              required
              defaultValue={edit ? edit.priceCents / 100 : undefined}
            />
          </label>
          <label>
            Category
            <input
              name="category"
              required
              maxLength={60}
              defaultValue={edit?.category}
            />
          </label>
        </div>
        <label>
          Product image (JPEG, PNG or WebP, up to 5 MB)
          <input
            name="imageFile"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
        </label>
        <label>
          Payment instructions
          <textarea
            name="paymentInstructions"
            maxLength={2000}
            defaultValue={edit?.paymentInstructions}
            placeholder="Staff-approved bank transfer or collection instructions"
          />
        </label>
        <label className="control-check">
          <input
            name="available"
            type="checkbox"
            defaultChecked={edit?.available ?? true}
          />
          Accept bookings
        </label>
        <label className="control-check">
          <input
            name="published"
            type="checkbox"
            defaultChecked={edit?.published ?? false}
          />
          Publish in store
        </label>
        <button disabled={busy}>{busy ? "Saving…" : "Save merchandise"}</button>
        {edit && (
          <button
            type="button"
            onClick={() => {
              setEdit(null);
              setRevision((v) => v + 1);
            }}
          >
            New item
          </button>
        )}
      </form>
      <FormFeedback message={message} />
    </>
  );
}
function OrderManager() {
  const { items, error } = useLiveCollection<StoreOrder>("storeOrders", false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const { user } = useSession();
  async function change(order: StoreOrder, status: OrderStatus, note: string) {
    setBusy(order.id);
    try {
      await updateDoc(doc(db, "storeOrders", order.id), {
        status,
        reviewNote: note,
        reviewedBy: user!.uid,
        updatedAt: serverTimestamp(),
      });
      setMessage("Booking updated.");
    } catch {
      setMessage(
        "The booking could not be updated. It may have changed; check the current status.",
      );
    } finally {
      setBusy("");
    }
  }
  async function receipt(order: StoreOrder) {
    setBusy(order.id);
    try {
      const response = await fetch(
        `/api/receipts/${encodeURIComponent(order.id)}`,
        { headers: { Authorization: `Bearer ${await user!.getIdToken()}` } },
      );
      if (!response.ok) throw Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-proof-${order.id}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setMessage("Private payment proof could not be downloaded.");
    } finally {
      setBusy("");
    }
  }
  const transitions: Partial<Record<OrderStatus, [OrderStatus, string][]>> = {
    requested: [
      ["confirmed", "Confirm availability"],
      ["cancelled", "Decline booking"],
    ],
    confirmed: [["cancelled", "Cancel booking"]],
    awaiting_verification: [
      ["paid", "Verify payment"],
      ["rejected", "Reject proof"],
    ],
    paid: [["fulfilled", "Mark collected / fulfilled"]],
  };
  return (
    <>
      <h2>Bookings & payment verification</h2>
      <p>
        Confirm availability before payment. Inspect the private receipt and
        verify the transaction against the bank record before marking it paid.
      </p>
      {error && <p role="alert">{error}</p>}
      <FormFeedback message={message} />
      {!items.length && !error && <p>No bookings yet.</p>}
      {items.map((order) => (
        <article className="control-order" key={order.id}>
          <small>
            {order.id} / {statusLabel(order.status)}
          </small>
          <h3>{order.productTitle}</h3>
          <p>
            {order.quantity} × {money(order.unitCents)} ={" "}
            {money(order.totalCents)}
          </p>
          <p>
            {order.customerName} · {order.contact}
          </p>
          {order.note && <p>{order.note}</p>}
          {order.location && (
            <p>
              Customer-shared location: {order.location.latitude.toFixed(4)},{" "}
              {order.location.longitude.toFixed(4)}
            </p>
          )}
          {order.receiptPath && (
            <button
              disabled={busy === order.id}
              onClick={() => {
                void receipt(order);
              }}
            >
              Download private proof
            </button>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const submitter = (event.nativeEvent as SubmitEvent)
                .submitter as HTMLButtonElement;
              const data = new FormData(event.currentTarget);
              void change(
                order,
                submitter.value as OrderStatus,
                String(data.get("reviewNote")).trim(),
              );
            }}
          >
            <label>
              Staff note
              <textarea
                name="reviewNote"
                maxLength={1000}
                defaultValue={order.reviewNote}
              />
            </label>
            {(order.status === "confirmed" && order.totalCents === 0
              ? ([["fulfilled", "Fulfil free booking"]] as [
                  OrderStatus,
                  string,
                ][])
              : transitions[order.status]
            )?.map(([status, label]) => (
              <button key={status} value={status} disabled={busy === order.id}>
                {label}
              </button>
            ))}
          </form>
        </article>
      ))}
    </>
  );
}
function AppearanceEditor() {
  const appearance = useAppearance();
  const [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await setDoc(doc(db, "siteSettings", "appearance"), {
        accent: String(data.get("accent")),
        surface: String(data.get("surface")),
        heroImageUrl: String(data.get("heroImageUrl")).trim(),
        heroWord: String(data.get("heroWord")).trim(),
        layout: String(data.get("layout")),
        rotationSeconds: Number(data.get("rotationSeconds")),
        motion: data.has("motion"),
        useGallery: data.has("useGallery"),
      });
      setMessage("Appearance updated. The public site updates live.");
    } catch {
      setMessage("Appearance could not be saved.");
    }
  }
  return (
    <>
      <h2>Visual direction</h2>
      <p>Control the graphical theme, imagery, spacing and animation.</p>
      <form
        className="control-form"
        key={JSON.stringify(appearance)}
        onSubmit={save}
      >
        <div className="control-columns">
          <label>
            Accent
            <input
              type="color"
              name="accent"
              defaultValue={appearance.accent}
            />
          </label>
          <label>
            Light surface
            <input
              type="color"
              name="surface"
              defaultValue={appearance.surface}
            />
          </label>
        </div>
        <label>
          Hero artwork URL
          <input
            name="heroImageUrl"
            type="url"
            pattern="https://.*"
            maxLength={2000}
            defaultValue={appearance.heroImageUrl}
            placeholder="Leave empty for the original frontier artwork"
          />
        </label>
        <label>
          Oversized graphical word
          <input
            name="heroWord"
            maxLength={16}
            defaultValue={appearance.heroWord}
          />
        </label>
        <label>
          Layout
          <select name="layout" defaultValue={appearance.layout}>
            <option value="spacious">Cinematic / spacious</option>
            <option value="compact">Compact</option>
          </select>
        </label>
        <label>
          Background rotation interval (seconds)
          <input
            name="rotationSeconds"
            type="number"
            min={6}
            max={30}
            defaultValue={appearance.rotationSeconds}
          />
        </label>
        <label className="control-check">
          <input
            name="motion"
            type="checkbox"
            defaultChecked={appearance.motion}
          />
          Enable animation and parallax (visitors' reduced-motion preference
          takes priority)
        </label>
        <label className="control-check">
          <input
            name="useGallery"
            type="checkbox"
            defaultChecked={appearance.useGallery}
          />
          Use published gallery images in the hero
        </label>
        <button>Save appearance</button>
      </form>
      <FormFeedback message={message} />
    </>
  );
}
interface Account {
  id: string;
  role: string;
  email?: string;
  active?: boolean;
}
function AccountManager() {
  const { items, error } = useLiveCollection<Account>("users", false);
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    let createdUid = "";
    const secondary = initializeApp(
      app.options,
      `staff-${crypto.randomUUID()}`,
    );
    try {
      const secondaryAuth = getAuth(secondary);
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        String(data.get("email")).trim(),
        String(data.get("password")),
      );
      createdUid = credential.user.uid;
      await setDoc(doc(db, "users", createdUid), {
        role: "staff",
        email: credential.user.email || "",
        active: true,
      });
      await signOut(secondaryAuth);
      form.reset();
      setMessage(
        "Staff account created. Provide the initial password through your approved private channel.",
      );
    } catch {
      setMessage(
        createdUid
          ? `Auth account ${createdUid} was created but its staff role was not saved. It has no staff privileges. Retry assigning that UID through your controlled account process.`
          : "Account could not be created. Check the email and password requirements.",
      );
    } finally {
      await deleteApp(secondary);
      setBusy(false);
    }
  }
  return (
    <>
      <h2>Staff accounts</h2>
      <p>
        Staff can edit content and manage bookings. Only superusers can change
        appearance, roles, service ownership and handover records.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="control-list">
        {items.map((account) => (
          <div key={account.id}>
            <strong>{account.email || account.id}</strong>
            <span>
              {account.role} /{" "}
              {account.active === false ? "Suspended" : "Active"}
            </span>
            {account.id !== user?.uid && account.role !== "superuser" && (
              <button
                onClick={() => {
                  void updateDoc(doc(db, "users", account.id), {
                    active: account.active === false,
                  }).catch(() =>
                    setMessage("Account access could not be changed."),
                  );
                }}
              >
                {account.active === false
                  ? "Restore access"
                  : "Suspend staff access"}
              </button>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={create} className="control-form">
        <h3>Create staff account</h3>
        <label>
          Email
          <input name="email" type="email" required maxLength={254} />
        </label>
        <label>
          Initial password
          <input
            name="password"
            type="password"
            minLength={12}
            required
            autoComplete="new-password"
          />
        </label>
        <button disabled={busy}>
          {busy ? "Creating…" : "Create staff account"}
        </button>
      </form>
      <FormFeedback message={message} />
      <p>
        Ownership transfer requires the department's authorization process; it
        is not an account-role dropdown.
      </p>
    </>
  );
}
interface RegisterEntry {
  id: string;
  title: string;
  provider: string;
  accountOwner: string;
  renewalDate: string;
  vaultReference: string;
  notes: string;
}
function OwnershipRegister({ handover = false }: { handover?: boolean }) {
  const name = handover ? "handoverRecords" : "serviceRegister";
  const { items, error } = useLiveCollection<RegisterEntry>(name, false);
  const [message, setMessage] = useState("");
  const [edit, setEdit] = useState<RegisterEntry | null>(null);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const record = Object.fromEntries(
      [
        "title",
        "provider",
        "accountOwner",
        "renewalDate",
        "vaultReference",
        "notes",
      ].map((key) => [key, String(data.get(key)).trim()]),
    );
    try {
      if (edit) await setDoc(doc(db, name, edit.id), record);
      else await addDoc(collection(db, name), record);
      setEdit(null);
      setMessage("Record saved.");
    } catch {
      setMessage("Record could not be saved.");
    }
  }
  return (
    <>
      <h2>{handover ? "Department handover" : "Domain & service ownership"}</h2>
      <p>
        {handover
          ? "Record authorization references, incoming and outgoing custodians, and the approved departmental handover process."
          : "Track domain renewal dates, providers and responsible account owners."}{" "}
        Store secure-vault references rather than passwords or API keys.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="control-list">
        {items.map((item) => (
          <button key={item.id} onClick={() => setEdit(item)}>
            {item.title}
            <span>
              {item.provider} / {item.renewalDate || "No renewal date"}
            </span>
          </button>
        ))}
      </div>
      <form className="control-form" key={edit?.id || "new"} onSubmit={save}>
        <label>
          {handover ? "Handover title" : "Domain / service"}
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={edit?.title}
          />
        </label>
        <label>
          {handover ? "Authorization reference / department" : "Provider"}
          <input
            name="provider"
            required
            maxLength={160}
            defaultValue={edit?.provider}
          />
        </label>
        <label>
          Responsible custodian
          <input
            name="accountOwner"
            required
            maxLength={254}
            defaultValue={edit?.accountOwner}
          />
        </label>
        <label>
          {handover ? "Handover date" : "Renewal date"}
          <input
            name="renewalDate"
            type="date"
            defaultValue={edit?.renewalDate}
          />
        </label>
        <label>
          Secure vault / document reference
          <input
            name="vaultReference"
            maxLength={500}
            defaultValue={edit?.vaultReference}
          />
        </label>
        <label>
          Notes
          <textarea name="notes" maxLength={4000} defaultValue={edit?.notes} />
        </label>
        <button>Save record</button>
        {edit && (
          <button type="button" onClick={() => setEdit(null)}>
            New record
          </button>
        )}
      </form>
      <FormFeedback message={message} />
    </>
  );
}
function Statistics() {
  const {
    items: orders,
    loading: ordersLoading,
    error: ordersError,
  } = useLiveCollection<StoreOrder>("storeOrders", false);
  const {
    items: products,
    loading: productsLoading,
    error: productsError,
  } = useLiveCollection<Product>("merchandise", false);
  const [metrics, setMetrics] = useState<{
    requests: number;
    visits: number;
    bytes: number;
  } | null>(null);
  const [message, setMessage] = useState("");
  if (ordersLoading || productsLoading) return <p>Loading statistics…</p>;
  if (ordersError || productsError)
    return <p role="alert">Statistics are unavailable. Please try again.</p>;
  return (
    <>
      <h2>Activity & statistics</h2>
      <div className="control-stats">
        <article>
          <small>BOOKINGS</small>
          <strong>{orders.length}</strong>
        </article>
        <article>
          <small>PRODUCTS</small>
          <strong>{products.length}</strong>
        </article>
        <article>
          <small>VERIFIED PAYMENTS</small>
          <strong>
            {money(
              orders
                .filter((order) => ["paid", "fulfilled"].includes(order.status))
                .reduce((sum, order) => sum + order.totalCents, 0),
            )}
          </strong>
        </article>
      </div>
      <h3>Website traffic / last seven days</h3>
      <p>
        Cloudflare traffic metrics are fetched on request. Visits are
        provider-estimated sessions rather than a count of individual people.
      </p>
      <button
        onClick={() => {
          void (async () => {
            try {
              const response = await fetch("/api/analytics", {
                headers: {
                  Authorization: `Bearer ${await auth.currentUser!.getIdToken()}`,
                },
              });
              if (!response.ok) throw Error();
              setMetrics(await response.json());
              setMessage("");
            } catch {
              setMessage(
                "Traffic analytics is not connected or is temporarily unavailable. Configure the restricted Cloudflare analytics integration before release.",
              );
            }
          })();
        }}
      >
        Load traffic metrics
      </button>
      {metrics && (
        <div className="control-stats">
          <article>
            Requests<strong>{metrics.requests}</strong>
          </article>
          <article>
            Visits<strong>{metrics.visits}</strong>
          </article>
          <article>
            Transferred bytes<strong>{metrics.bytes}</strong>
          </article>
        </div>
      )}
      <FormFeedback message={message} />
    </>
  );
}
export default function ControlPortal({ owner = false }: { owner?: boolean }) {
  const { user } = useSession();
  const [tab, setTab] = useState("content");
  const tabs = owner
    ? [
        ["content", "Content"],
        ["merchandise", "Merchandise"],
        ["orders", "Bookings & proof"],
        ["appearance", "Appearance"],
        ["accounts", "Staff accounts"],
        ["statistics", "Statistics"],
        ["services", "Domain & services"],
        ["handover", "Handover"],
      ]
    : [
        ["content", "Content"],
        ["merchandise", "Merchandise"],
        ["orders", "Bookings & proof"],
      ];
  const pages: Record<string, ReactNode> = {
    content: (
      <>
        <p className="control-eyebrow">YOUR WORKSPACE</p>
        <h2>Make the symposium happen.</h2>
        <p>
          Choose what you want to update. Published announcements, programme
          changes and merchandise appear live.
        </p>
        <div className="control-content-grid">
          {contentLinks.map(([path, title, description]) => (
            <a key={path} href={`/admin/${path}`}>
              <span>{title} ↗</span>
              <p>{description}</p>
            </a>
          ))}
        </div>
      </>
    ),
    merchandise: <ProductManager />,
    orders: <OrderManager />,
    ...(owner
      ? {
          appearance: <AppearanceEditor />,
          accounts: <AccountManager />,
          statistics: <Statistics />,
          services: <OwnershipRegister />,
          handover: <OwnershipRegister handover />,
        }
      : {}),
  };
  return (
    <div className="control-portal">
      <aside>
        <a className="control-logo" href="/">
          MCS<span>SYMPOSIUM / CONTROL ROOM</span>
        </a>
        <p>{owner ? "SUPERUSER" : "STAFF WORKSPACE"}</p>
        <nav aria-label="Workspace sections">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => setTab(id)}
            >
              {label}
              <span>↗</span>
            </button>
          ))}
        </nav>
        <div className="control-identity">
          <small>{user?.email}</small>
          <a href="/">View website ↗</a>
          <button
            onClick={() => {
              void signOut(auth);
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main key={tab}>
        <header>
          <span>{owner ? "OWNERSHIP / SYSTEM" : "SYMPOSIUM / OPERATIONS"}</span>
          <a href="/">Public site ↗</a>
        </header>
        <div className="control-workspace">{pages[tab]}</div>
      </main>
    </div>
  );
}
