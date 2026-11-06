export interface Product {
  id: string;
  title: string;
  description: string;
  image: string;
  priceCents: number;
  category: string;
  available: boolean;
  published: boolean;
  paymentInstructions: string;
}
export type OrderStatus =
  | "requested"
  | "confirmed"
  | "awaiting_verification"
  | "paid"
  | "rejected"
  | "fulfilled"
  | "cancelled";
export interface StoreOrder {
  id: string;
  createdAt?: { toMillis: () => number };
  ownerId: string;
  productId: string;
  productTitle: string;
  quantity: number;
  totalCents: number;
  unitCents: number;
  customerName: string;
  contact: string;
  note: string;
  status: OrderStatus;
  receiptPath: string;
  reviewNote: string;
  reviewedBy: string;
  location: { latitude: number; longitude: number } | null;
}
export const money = (cents: number) =>
  new Intl.NumberFormat("en-PG", { style: "currency", currency: "PGK" }).format(
    cents / 100,
  );
export function bookingTotal(price: number, quantity: number) {
  if (
    !Number.isInteger(price) ||
    price < 0 ||
    price > 10000000 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 25
  )
    throw new Error("Choose a valid product and a quantity between 1 and 25.");
  return price * quantity;
}
export const statusLabel = (status: string) => status.replaceAll("_", " ");

export function reservationExpires(order: StoreOrder) {
  return order.createdAt?.toMillis()
    ? order.createdAt.toMillis() + 24 * 60 * 60 * 1000
    : null;
}
export function reservationExpired(order: StoreOrder, now = Date.now()) {
  const end = reservationExpires(order);
  return (
    end !== null &&
    now >= end &&
    ["requested", "confirmed", "rejected"].includes(order.status)
  );
}
