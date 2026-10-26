import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../services/firebase";

export function useLiveCollection<T extends { id: string }>(
  name: string,
  publishedOnly = true,
  ownerId = "",
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const constraints = publishedOnly ? [where("published", "==", true)] : [];
    if (ownerId) constraints.push(where("ownerId", "==", ownerId));
    return onSnapshot(
      query(collection(db, name), ...constraints),
      (snapshot) => {
        setItems(
          snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as T),
        );
        setError("");
        setLoading(false);
      },
      () => {
        setError(
          "This information is temporarily unavailable. Please try again later.",
        );
        setLoading(false);
        setItems([]);
      },
    );
  }, [name, publishedOnly, ownerId]);
  return { items, loading, error };
}
