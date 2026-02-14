"use client";

export default function ModelContextBar({ applianceType, modelNumber, onApplianceChange, onModelChange }) {
  return (
    <section className="context-bar">
      <div className="brand">
        <span className="brand-mark">PartSelect</span>
        <span className="brand-subtitle">Fridge & Dishwasher Assistant</span>
      </div>

      <div className="context-inputs">
        <label>
          Appliance
          <select
            data-testid="appliance-select"
            value={applianceType}
            onChange={(event) => onApplianceChange(event.target.value)}
          >
            <option value="">Select</option>
            <option value="refrigerator">Refrigerator</option>
            <option value="dishwasher">Dishwasher</option>
          </select>
        </label>

        <label>
          Model number
          <input
            data-testid="model-input"
            value={modelNumber}
            onChange={(event) => onModelChange(event.target.value.toUpperCase())}
            placeholder="e.g. WDT780SAEM1"
          />
        </label>
      </div>
    </section>
  );
}
