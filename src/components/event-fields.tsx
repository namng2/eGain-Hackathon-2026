import { Field, inputClass } from "./ui";

export type EventFormDefaults = {
  name?: string;
  companyName?: string;
  date?: string;
  location?: string;
  budget?: number;
  stealLimit?: number;
  rules?: string;
};

/** The event inputs, shared by the create form and the organizer's edit form. */
export function EventFields({ defaults = {} }: { defaults?: EventFormDefaults }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Event name">
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={defaults.name}
          placeholder="Holiday White Elephant 2026"
          className={inputClass}
        />
      </Field>
      <Field label="Company">
        <input
          name="companyName"
          required
          maxLength={120}
          defaultValue={defaults.companyName}
          placeholder="eGain"
          className={inputClass}
        />
      </Field>
      <Field label="Date and time">
        <input
          name="date"
          type="datetime-local"
          required
          defaultValue={defaults.date}
          className={inputClass}
        />
      </Field>
      <Field label="Location or Link">
        <input
          name="location"
          required
          maxLength={300}
          defaultValue={defaults.location}
          placeholder="Break room 2, or a Zoom link"
          className={inputClass}
        />
      </Field>
      <Field label="Gift budget (USD)" hint="The most people should spend on a gift.">
        <input
          name="budget"
          type="number"
          required
          min={1}
          max={10000}
          step={1}
          defaultValue={defaults.budget}
          placeholder="25"
          className={inputClass}
        />
      </Field>
      <Field label="Steal limit" hint="How many times one gift can be stolen.">
        <input
          name="stealLimit"
          type="number"
          required
          min={1}
          max={10}
          step={1}
          defaultValue={defaults.stealLimit}
          placeholder="3"
          className={inputClass}
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Rules (optional)">
          <textarea
            name="rules"
            rows={3}
            maxLength={2000}
            defaultValue={defaults.rules}
            placeholder="For example: wrapped gifts only, no electronics."
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}

/** Reads the EventFields inputs from a submitted form. Values are validated on the server. */
export function eventFromForm(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "");
  return {
    name: text("name"),
    companyName: text("companyName"),
    date: text("date"),
    location: text("location"),
    budget: text("budget"),
    stealLimit: text("stealLimit"),
    rules: text("rules"),
  };
}
