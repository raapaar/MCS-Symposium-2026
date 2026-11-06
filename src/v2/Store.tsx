import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  writeBatch,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useLiveCollection } from "../hooks/useLiveCollection";
import { useSession } from "./sessionState";
import type { Product, StoreOrder } from "./storeModel";
import {
  bookingTotal,
  money,
  statusLabel,
  reservationExpired,
  reservationExpires,
} from "./storeModel";

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
  const [now, tick] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => tick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  async function upload(order: StoreOrder, file: File | undefined) {
    if (!file || !auth.currentUser) return;
    if (reservationExpired(order)) {
      setMessage("This reservation has expired. Please place a new booking.");
      return;
    }
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
            <span className="store-status">
              {reservationExpired(order, now)
                ? "Reservation expired"
                : statusLabel(order.status)}
            </span>
            {reservationExpires(order) &&
              ["requested", "confirmed", "rejected"].includes(order.status) && (
                <p>
                  Reservation deadline:{" "}
                  {new Date(reservationExpires(order)!).toLocaleString(
                    "en-GB",
                    { timeZone: "Pacific/Port_Moresby" },
                  )}{" "}
                  PNG time.
                </p>
              )}
            {order.reviewNote && <p>{order.reviewNote}</p>}
            {!reservationExpired(order, now) &&
              ["confirmed", "rejected"].includes(order.status) && (
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
          {!reservationExpired(order, now) &&
            ["confirmed", "rejected"].includes(order.status) && (
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

interface CartLine {
  id: string;
  quantity: number;
}
const cartKey = "mcs-store-cart-v1";
function readCart(): CartLine[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(cartKey) || "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (v): v is CartLine =>
              !!v &&
              typeof v.id === "string" &&
              /^[A-Za-z0-9_-]{1,128}$/.test(v.id) &&
              Number.isInteger(v.quantity) &&
              v.quantity > 0 &&
              v.quantity <= 25,
          )
          .slice(0, 10)
      : [];
  } catch {
    return [];
  }
}
function ProductCards({
  products,
  add,
}: {
  products: Product[];
  add?: (product: Product) => void;
}) {
  return (
    <div className="store-grid">
      {products.map((p) => (
        <article className="store-product" key={p.id}>
          <div className="store-product-image">
            {p.image ? (
              <img src={p.image} alt={p.title} loading="lazy" />
            ) : (
              <span>
                MCS
                <br />
                EDITION.
              </span>
            )}
            <span>{p.category || "SYMPOSIUM"}</span>
          </div>
          <div className="store-product-copy">
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <div>
              <strong>{money(p.priceCents)}</strong>
              {add ? (
                <button disabled={!p.available} onClick={() => add(p)}>
                  {p.available ? "Add to cart ↗" : "Unavailable"}
                </button>
              ) : (
                <a href="/store">Explore store ↗</a>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
export default function Store() {
  const { items, loading, error } = useLiveCollection<Product>("merchandise");
  return (
    <section id="store" className="frontier-store">
      <div className="section-container">
        <p className="frontier-kicker">
          A LITTLE OF THE SYMPOSIUM / TAKE IT WITH YOU
        </p>
        <h2>
          MAKE IT
          <br />
          <em>YOURS.</em>
        </h2>
        <p>A selection from the symposium store.</p>
        {loading && <p>Loading merchandise…</p>}
        {error && <p role="alert">{error}</p>}
        <ProductCards products={items.slice(0, 3)} />
        {!loading && !items.length && !error && (
          <p>The next merchandise drop will appear here when published.</p>
        )}
        <a className="frontier-button" href="/store">
          Visit the store ↗
        </a>
      </div>
    </section>
  );
}
export function StorePage() {
  const { items, loading, error } = useLiveCollection<Product>("merchandise");
  const { user, loading: sessionLoading } = useSession();
  const [cart, setCart] = useState(readCart),
    [category, setCategory] = useState("All"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const page = window.location.pathname.split("/")[2] || "browse";
  function change(lines: CartLine[]) {
    setCart(lines);
    localStorage.setItem(cartKey, JSON.stringify(lines));
  }
  const lines = cart.map((line) => ({
    ...line,
    product: items.find((p) => p.id === line.id),
  }));
  const invalid = lines.some((l) => !l.product?.available);
  const total = lines.reduce(
    (sum, l) =>
      sum + (l.product ? bookingTotal(l.product.priceCents, l.quantity) : 0),
    0,
  );
  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || busy || invalid || !lines.length || loading || error) return;
    setBusy(true);
    setMessage("");
    try {
      const data = new FormData(event.currentTarget),
        batch = writeBatch(db);
      for (const line of lines) {
        const p = line.product!;
        batch.set(doc(collection(db, "storeOrders")), {
          ownerId: user.uid,
          productId: p.id,
          productTitle: p.title,
          unitCents: p.priceCents,
          quantity: line.quantity,
          totalCents: bookingTotal(p.priceCents, line.quantity),
          customerName: String(data.get("name")).trim(),
          contact: String(data.get("contact")).trim(),
          note: String(data.get("note")).trim(),
          location: null,
          status: "requested",
          receiptPath: "",
          reviewNote: "",
          reviewedBy: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      change([]);
      window.location.assign("/store/orders");
    } catch {
      setMessage(
        "Unable to place this booking. Availability or prices may have changed. Review your cart and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="frontier-store store-page">
      <div className="section-container">
        <p className="frontier-kicker">THE SYMPOSIUM STORE</p>
        <h1>
          {(
            {
              browse: "Find your next favourite.",
              cart: "Your cart.",
              checkout: "Reserve & checkout.",
              orders: "Bookings & payment.",
              login: "Your account.",
              policies: "How the store works.",
            } as Record<string, string>
          )[page] || "Store"}
        </h1>
        <nav className="store-page-nav" aria-label="Store pages">
          {[
            ["", "Browse"],
            ["cart", `Cart (${cart.reduce((n, l) => n + l.quantity, 0)})`],
            ["checkout", "Checkout"],
            ["orders", "Bookings & payment"],
            ["login", "Account"],
            ["policies", "Store policy"],
          ].map(([path, label]) => (
            <a
              key={path}
              aria-current={page === (path || "browse") ? "page" : undefined}
              href={`/store${path ? `/${path}` : ""}`}
            >
              {label}
            </a>
          ))}
        </nav>
        {message && <p role="status">{message}</p>}
        {loading && <p>Loading merchandise…</p>}
        {error && <p role="alert">{error}</p>}
        {page === "browse" && (
          <>
            <div
              className="store-toolbar"
              role="group"
              aria-label="Product categories"
            >
              {[
                "All",
                ...new Set(items.map((i) => i.category).filter(Boolean)),
              ].map((c) => (
                <button
                  key={c}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <ProductCards
              products={items.filter(
                (p) => category === "All" || p.category === category,
              )}
              add={(p) => {
                const existing = cart.find((l) => l.id === p.id);
                if (
                  existing?.quantity === 25 ||
                  (!existing && cart.length >= 10)
                ) {
                  setMessage("Your cart has reached its item limit.");
                  return;
                }
                change(
                  existing
                    ? cart.map((l) =>
                        l.id === p.id ? { ...l, quantity: l.quantity + 1 } : l,
                      )
                    : [...cart, { id: p.id, quantity: 1 }],
                );
                setMessage(`${p.title} added to cart.`);
              }}
            />
            {!loading && !error && !items.length && (
              <p>No merchandise is published yet.</p>
            )}
          </>
        )}
        {["cart", "checkout"].includes(page) && (
          <>
            {!cart.length ? (
              <p>
                Your cart is empty. <a href="/store">Browse items ↗</a>
              </p>
            ) : (
              <>
                <div className="cart-lines">
                  {lines.map((l) => (
                    <article key={l.id}>
                      <h3>
                        {l.product?.title ||
                          (loading
                            ? "Loading item…"
                            : "Item no longer available")}
                      </h3>
                      <label>
                        Quantity
                        <input
                          aria-label={`Quantity for ${l.product?.title || "item"}`}
                          type="number"
                          min={1}
                          max={25}
                          value={l.quantity}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            if (Number.isInteger(n) && n >= 1 && n <= 25)
                              change(
                                cart.map((c) =>
                                  c.id === l.id ? { ...c, quantity: n } : c,
                                ),
                              );
                          }}
                        />
                      </label>
                      <span>
                        {l.product
                          ? money(l.product.priceCents * l.quantity)
                          : "Unavailable"}
                      </span>
                      <button
                        onClick={() =>
                          change(cart.filter((c) => c.id !== l.id))
                        }
                      >
                        Remove
                      </button>
                    </article>
                  ))}
                </div>
                <p className="cart-total">Total: {money(total)}</p>
                {invalid && !loading && (
                  <p role="alert">Remove unavailable items before checkout.</p>
                )}
                {page === "cart" && (
                  <a className="frontier-button" href="/store/checkout">
                    Continue to checkout ↗
                  </a>
                )}
                {page === "checkout" &&
                  (sessionLoading ? (
                    <p>Checking your account…</p>
                  ) : !user ? (
                    <>
                      <p>
                        Sign in before reserving your items. Your cart will stay
                        here.
                      </p>
                      <a href="/store/login">Sign in / create account ↗</a>
                    </>
                  ) : (
                    <form className="checkout-form" onSubmit={checkout}>
                      <label>
                        Name
                        <input name="name" required maxLength={100} />
                      </label>
                      <label>
                        Phone or email
                        <input
                          name="contact"
                          required
                          maxLength={254}
                          defaultValue={user.email || ""}
                        />
                      </label>
                      <label>
                        Size / collection notes
                        <textarea name="note" maxLength={1000} />
                      </label>
                      <p>
                        Reservations last 24 hours from submission. Wait for
                        staff confirmation before paying. Timely payment proof
                        stays pending review after the deadline. Unpaid
                        reservations expire automatically.
                      </p>
                      <button
                        className="frontier-button"
                        disabled={busy || invalid || loading || !!error}
                      >
                        {busy ? "Submitting…" : "Reserve items for 24 hours ↗"}
                      </button>
                    </form>
                  ))}
              </>
            )}
          </>
        )}
        {page === "login" &&
          (user ? (
            <div className="store-signed-in">
              <span>Signed in as {user.email}</span>
              <a href="/store/checkout">Continue to checkout ↗</a>
              <button onClick={() => void signOut(auth)}>Sign out</button>
            </div>
          ) : (
            <CustomerSignIn />
          ))}
        {page === "orders" &&
          (sessionLoading ? (
            <p>Checking your account…</p>
          ) : user ? (
            <MyOrders key={user.uid} ownerId={user.uid} products={items} />
          ) : (
            <>
              <p>Sign in to view your private bookings and payment proofs.</p>
              <a href="/store/login">Sign in ↗</a>
            </>
          ))}
        {page === "policies" && (
          <div className="store-policy">
            <h2>Booking & payment</h2>
            <p>
              A booking requests availability. Staff must confirm your items
              before you transfer payment using the published item instructions.
              You can upload a private JPEG, PNG or PDF receipt from your
              bookings page. A receipt is reviewed against bank records before
              payment is verified.
            </p>
            <h3>24-hour reservations</h3>
            <p>
              The window starts when the booking is submitted. Unpaid bookings
              expire at the deadline. Payment proofs submitted within that
              window remain awaiting verification; rejected proofs can only be
              resubmitted before the original deadline. Place a new booking if
              your reservation expires.
            </p>
            <h3>Collection, delivery & returns</h3>
            <p>
              Arrange collection and confirm any delivery or returns terms with
              the symposium store team before payment. Follow the staff note
              attached to your booking.
            </p>
            <h3>Payment methods</h3>
            <p>
              Use the bank/payment instructions attached to a confirmed item.
              Online card checkout is unavailable until an approved gateway is
              configured. This website does not collect card details or banking
              PINs.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
