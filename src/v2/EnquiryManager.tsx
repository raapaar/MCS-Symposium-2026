import { useState } from "react";
import type { FormEvent } from "react";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useLiveCollection } from "../hooks/useLiveCollection";
interface FAQ {
  id: string;
  question: string;
  answer: string;
  published: boolean;
}
export default function EnquiryManager() {
  const { items, error } = useLiveCollection<FAQ>("enquiries", false),
    [edit, setEdit] = useState<FAQ | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = new FormData(form);
    setBusy(true);
    try {
      const value = {
        question: String(data.get("question")).trim(),
        answer: String(data.get("answer")).trim(),
        published: data.has("published"),
      };
      if (edit) await updateDoc(doc(db, "enquiries", edit.id), value);
      else await addDoc(collection(db, "enquiries"), value);
      setEdit(null);
      form.reset();
      setMessage("Enquiry knowledge saved.");
    } catch {
      setMessage("Unable to save. Check your privileges.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h2>Symposium guide knowledge</h2>
      <p>
        The guide already reads published event details, programme, speakers,
        announcements, products, sponsors and documents. Add confirmed answers
        here for other questions. Draft answers stay private.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="control-list">
        {items.map((i) => (
          <button key={i.id} onClick={() => setEdit(i)}>
            {i.question} · {i.published ? "Published" : "Draft"}
          </button>
        ))}
      </div>
      <form key={edit?.id || "new"} className="control-form" onSubmit={save}>
        <label>
          Question
          <input
            name="question"
            required
            maxLength={200}
            defaultValue={edit?.question}
          />
        </label>
        <label>
          Confirmed answer
          <textarea
            name="answer"
            required
            maxLength={4000}
            defaultValue={edit?.answer}
          />
        </label>
        <label className="control-check">
          <input
            type="checkbox"
            name="published"
            defaultChecked={edit?.published}
          />
          Publish answer
        </label>
        <button disabled={busy}>
          {busy ? "Saving…" : edit ? "Save answer" : "Add answer"}
        </button>
        <button type="button" onClick={() => setEdit(null)}>
          New answer
        </button>
      </form>
      <p role="status">{message}</p>
    </>
  );
}
