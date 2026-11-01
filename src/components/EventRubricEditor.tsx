import { useState } from "react";
import axios from "axios";
import { API_BASE } from "../lib/utils";
import { useAppStore } from "../lib/store";
type Criterion = {
  name: string;
  description?: string;
  minScore: number;
  maxScore: number;
  weight: number;
};
export function EventRubricEditor() {
  const { hackathons } = useAppStore();
  const [event, setEvent] = useState(""),
    [criteria, setCriteria] = useState<Criterion[]>([]),
    [decimals, setDecimals] = useState(2),
    [feedback, setFeedback] = useState(true),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const headers = () => ({
    Authorization: "Bearer " + localStorage.getItem("codesrijan_auth_token"),
  });
  async function load(id: string) {
    setEvent(id);
    setCriteria([]);
    setMessage("");
    if (!id) return;
    setBusy(true);
    try {
      const r = await axios.get(
        API_BASE + "/admin/hackathons/" + encodeURIComponent(id) + "/rubric",
        { headers: headers() },
      );
      setCriteria(r.data.criteria);
      setDecimals(r.data.roundingDecimals);
      setFeedback(r.data.mandatoryFeedback);
    } catch {
      setMessage("Unable to load rubric.");
    } finally {
      setBusy(false);
    }
  }
  function update(index: number, key: keyof Criterion, value: string | number) {
    setCriteria((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await axios.put(
        API_BASE + "/admin/hackathons/" + encodeURIComponent(event) + "/rubric",
        { criteria, roundingDecimals: decimals, mandatoryFeedback: feedback },
        { headers: headers() },
      );
      setMessage("Rubric saved.");
    } catch (e) {
      setMessage(
        axios.isAxiosError(e)
          ? e.response?.data?.message || "Unable to save rubric."
          : "Unable to save rubric.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="border-2 border-stark-black bg-white p-5 space-y-4">
      <h2 className="font-bold text-xl">Event evaluation rubric</h2>
      <p>Use the event’s approved criteria. Rubrics lock once an evaluation exists.</p>
      <label>
        Hackathon
        <select
          value={event}
          onChange={(e) => void load(e.target.value)}
          className="block border-2 p-2"
        >
          <option value="">Choose event</option>
          {hackathons.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </label>
      {message && <p role="status">{message}</p>}
      {event && (
        <form onSubmit={save} className="space-y-3">
          <fieldset disabled={busy}>
            <legend>Criteria</legend>
            {criteria.map((row, i) => (
              <div key={i} className="border-t py-3 flex flex-wrap gap-3">
                <label>
                  Name
                  <input
                    required
                    value={row.name}
                    onChange={(e) => update(i, "name", e.target.value)}
                    className="block border-2 p-2"
                  />
                </label>
                {(["minScore", "maxScore", "weight"] as const).map((key) => (
                  <label key={key}>
                    {key === "minScore" ? "Minimum" : key === "maxScore" ? "Maximum" : "Weight (%)"}
                    <input
                      type="number"
                      step="any"
                      required
                      value={row[key]}
                      onChange={(e) => update(i, key, Number(e.target.value))}
                      className="block border-2 p-2 w-24"
                    />
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setCriteria((rows) => rows.filter((_, n) => n !== i))}
                  className="underline"
                >
                  Remove criterion
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setCriteria((rows) => [...rows, { name: "", minScore: 0, maxScore: 10, weight: 0 }])
              }
              className="underline"
            >
              Add criterion
            </button>
            <p>Total weight: {criteria.reduce((n, row) => n + row.weight, 0)}% (must equal 100%)</p>
            <label>
              Decimal places
              <input
                type="number"
                min="0"
                max="4"
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value))}
                className="border-2 p-2 mx-2 w-20"
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={feedback}
                onChange={(e) => setFeedback(e.target.checked)}
              />{" "}
              Require feedback
            </label>
            <button
              disabled={!criteria.length}
              className="block border-2 p-2 bg-electric-blue text-white mt-3"
            >
              Save rubric
            </button>
          </fieldset>
        </form>
      )}
    </section>
  );
}
