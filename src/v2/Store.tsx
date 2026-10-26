import { useState } from "react";
import type { FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useSession } from "./sessionState";
import type { Product, StoreOrder } from "./storeModel";
import { bookingTotal, money, statusLabel } from "./storeModel";

function CustomerSignIn() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const action = register
        ? createUserWithEmailAndPassword
        : signInWithEmailAndPassword;
      await action(
        auth,
        String(data.get("email")).trim(),
        String(data.get("password")),
      );
    } catch {
      setError(
        "Unable to sign in. Check your details or try creating an account.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="store-account">
      <div>
        <p className="frontier-kicker">YOUR SYMPOSIUM ACCOUNT</p>
        <h3>
          Keep your bookings
          <br />
          in one place.
        </h3>
        <p>Sign in to book merchandise and privately submit payment proof.</p>
      </div>
      <form onSubmit={submit}>
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </label>
        <button disabled={busy} className="frontier-button">
          {busy
            ? "Please wait…"
            : register
              ? "Create account ↗"
              : "Sign in ↗"}
        </button>
        <button
          type="button"
          className="frontier-text-button"
          onClick={() => setRegister(!register)}
        >
          {register
            ? "Already registered? Sign in"
            : "New here? Create an account"}
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
    </div>
  );
}
function MyOrders({
  ownerId,
  products,
}: {
  ownerId: string;
  products: Product[];
}) {
  const { items, error, loading } = useLiveCollection<StoreOrder>(
    "storeOrders",
    false,
    ownerId,
  );
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  async function upload(order: StoreOrder, file: File | undefined) {
    if (!file || !auth.currentUser) return;
    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessage("Choose a JPEG, PNG, or PDF smaller than 5 MB.");
      return;
    }
    setBusy(order.id);
    setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch(
        `/api/receipts/${encodeURIComponent(order.id)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
          },
          body,
        },
      );
      if (!response.ok) throw Error("Receipt upload failed. Please try again.");
      const result = (await response.json()) as { path: string };
      await updateDoc(doc(db, "storeOrders", order.id), {
        receiptPath: result.path,
        status: "awaiting_verification",
        updatedAt: serverTimestamp(),
      });
      setMessage(
        "Payment proof submitted privately. Staff will verify the payment.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Unable to submit payment proof.",
      );
    } finally {
      setBusy("");
    }
  }
  async function download(order: StoreOrder) {
    if (!auth.currentUser) return;
    setBusy(order.id);
    try {
      const response = await fetch(
        `/api/receipts/${encodeURIComponent(order.id)}`,
        {
          headers: {
            Authorization: `Bearer ${await auth.currentUser.getIdToken()}`,
          },
        },
      );
      if (!response.ok) throw Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `payment-proof-${order.id}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setMessage("Your private payment proof could not be downloaded.");
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="store-orders">
      <h3>Your bookings</h3>
      <p>
        Wait for staff to confirm availability before making payment. Uploading
        a receipt does not mark an order paid.
      </p>
      {loading && <p>Loading bookings…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !items.length && <p>No bookings yet.</p>}
      {message && <p role="status">{message}</p>}
      {items.map((order) => (
        <article key={order.id} className="store-order">
          <div>
            <small>BOOKING {order.id.slice(0, 8).toUpperCase()}</small>
            <h4>{order.productTitle}</h4>
            <p>
              {order.quantity} × {money(order.unitCents)} ·{" "}
              {money(order.totalCents)}
            </p>
            <span className="store-status">{statusLabel(order.status)}</span>
            {order.reviewNote && <p>{order.reviewNote}</p>}
            {["confirmed", "rejected"].includes(order.status) && (
              <p>
                {products.find((product) => product.id === order.productId)
                  ?.paymentInstructions ||
                  "Contact staff for payment instructions."}
              </p>
            )}
          </div>
          {order.receiptPath && (
            <button
              type="button"
              className="frontier-text-button"
              disabled={busy === order.id}
              onClick={() => {
                void download(order);
              }}
            >
              Download your private proof
            </button>
          )}
          {["confirmed", "rejected"].includes(order.status) && (
            <label className="receipt-label">
              {busy === order.id ? "Uploading…" : "Upload payment proof"}
              <input
                aria-label={`Payment proof for ${order.productTitle}`}
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                disabled={busy === order.id}
                onChange={(event) => {
                  void upload(order, event.target.files?.[0]);
                }}
              />
            </label>
          )}
        </article>
      ))}
    </div>
  );
}
export default function Store() {
  const { items, loading, error } = useLiveCollection<Product>("merchandise");
  const { user } = useSession();
  const [selected, setSelected] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState("All");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selected) return;
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const totalCents = bookingTotal(selected.priceCents, quantity);
      await addDoc(collection(db, "storeOrders"), {
        ownerId: user.uid,
        productId: selected.id,
        productTitle: selected.title,
        unitCents: selected.priceCents,
        quantity,
        totalCents,
        customerName: String(data.get("name")).trim(),
        contact: String(data.get("contact")).trim(),
        note: String(data.get("note")).trim(),
        location,
        status: "requested",
        receiptPath: "",
        reviewNote: "",
        reviewedBy: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setMessage(
        "Booking requested. Staff will confirm availability before you pay.",
      );
      setSelected(null);
      setLocation(null);
    } catch {
      setMessage(
        "Booking could not be submitted. The item or price may have changed; refresh the selection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  const categories = [
    "All",
    ...new Set(items.map((p) => p.category).filter(Boolean)),
  ];
  return (
    <section id="store" className="frontier-store">
      <div className="section-container">
        <div className="section-heading">
          <span className="frontier-kicker">
            THE SYMPOSIUM STORE / MERCHANDISE & BOOKINGS
          </span>
          <h2>
            MAKE IT
            <br />
            <em>YOURS.</em>
          </h2>
          <p>Carry a piece of the symposium with you.</p>
        </div>
        <div className="store-toolbar">
          <div role="group" aria-label="Merchandise categories">
            {categories.map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={category === value}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <span className="store-live">
            <i /> LIVE CATALOGUE
          </span>
        </div>
        {loading && <p>Loading merchandise…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && !items.length && (
          <div className="store-empty">
            <span aria-hidden="true">↗</span>
            <h3>The next drop starts here.</h3>
            <p>Merchandise will appear when the symposium team publishes it.</p>
          </div>
        )}
        <div className="store-grid">
          {items
            .filter((p) => category === "All" || p.category === category)
            .map((product) => (
              <article className="store-product" key={product.id}>
                <div className="store-product-image">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      loading="lazy"
                    />
                  ) : (
                    <span aria-hidden="true">
                      MCS
                      <br />
                      EDITION.
                    </span>
                  )}
                  <span>{product.category || "SYMPOSIUM"}</span>
                </div>
                <div className="store-product-copy">
                  <h3>{product.title}</h3>
                  <p>{product.description}</p>
                  <div>
                    <strong>{money(product.priceCents)}</strong>
                    <button
                      type="button"
                      disabled={!product.available}
                      onClick={() => {
                        setSelected(product);
                        setQuantity(1);
                        setMessage("");
                      }}
                    >
                      {product.available ? "Book now ↗" : "Unavailable"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
        </div>
        {message && (
          <p role="status" className="store-feedback">
            {message}
          </p>
        )}
        {selected && (
          <div className="store-booking">
            <div>
              <small>YOUR SELECTION</small>
              <h3>{selected.title}</h3>
              <p>{money(selected.priceCents)} each</p>
              {!user && <p>Sign in below to continue your booking.</p>}
            </div>
            {user && (
              <form onSubmit={book}>
                <label>
                  Name
                  <input name="name" required maxLength={100} />
                </label>
                <label>
                  Phone or email
                  <input name="contact" required maxLength={254} />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Number(event.target.value))
                    }
                    required
                  />
                </label>
                <label>
                  Booking notes
                  <textarea
                    name="note"
                    maxLength={1000}
                    placeholder="Size, collection preferences, or a question"
                  />
                </label>
                <div className="store-location">
                  <button
                    type="button"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        setLocationMessage(
                          "Location is unavailable. You can continue without it.",
                        );
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                          });
                          setLocationMessage(
                            "Location attached to this booking.",
                          );
                        },
                        () =>
                          setLocationMessage(
                            "Location was not shared. You can continue without it.",
                          ),
                        { enableHighAccuracy: false, timeout: 10000 },
                      );
                    }}
                  >
                    Share location (optional)
                  </button>
                  {location && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocation(null);
                        setLocationMessage("Location removed.");
                      }}
                    >
                      Remove location
                    </button>
                  )}
                  <p role="status">{locationMessage}</p>
                </div>
                <p>
                  Booking total:{" "}
                  {Number.isInteger(quantity) && quantity >= 1 && quantity <= 25
                    ? money(selected.priceCents * quantity)
                    : "Choose a quantity"}
                </p>
                <button className="frontier-button" disabled={busy}>
                  {busy ? "Submitting…" : "Request booking ↗"}
                </button>
              </form>
            )}
            <button
              type="button"
              className="frontier-text-button"
              onClick={() => setSelected(null)}
            >
              Cancel selection
            </button>
          </div>
        )}
        {user ? (
          <>
            <div className="store-signed-in">
              <span>Signed in as {user.email}</span>
              <button
                type="button"
                onClick={() => {
                  void signOut(auth);
                }}
              >
                Sign out
              </button>
            </div>
            <MyOrders key={user.uid} ownerId={user.uid} products={items} />
          </>
        ) : (
          <CustomerSignIn />
        )}
      </div>
    </section>
  );
}
