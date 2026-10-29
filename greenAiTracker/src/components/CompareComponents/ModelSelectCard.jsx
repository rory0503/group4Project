import { X, Plus } from "lucide-react";
import ModelPicker from "../ModelPicker";
import { byId } from "../../lib/helpers";
import { companyColors } from "../../data/models";

// Used for the "add a ___ model"
const ORDINAL = ["first", "second", "third"];

// One of the three "pick a model" slots at the top of the Compare page.
export default function ModelSelectCard({ slot, models, value, onChange, exclude }) {
  const model = byId(models, value);
  // --c drives the coloured top border and dot (green / blue / orange)
  const slotColor = { "--c": `var(--slot-${slot})` };

  // Empty slot: dashed card with a plus icon
  if (!model) {
    return (
      <article className="card slot slot-empty" style={slotColor}>
        <span className="slot-add-icon" aria-hidden="true">
          <Plus className="icon" />
        </span>
        {/* add a first/scond/third model text */}
        <div>
          <div className="name">Add a {ORDINAL[slot - 1]} model</div>
          <p className="card-sub">Compare up to 3 models at once</p>
        </div>
        {/*search box to choose a model, 'exclude' hides models already picked*/}
        <div className="field" style={{ width: "100%" }}>
          <ModelPicker
            models={models}
            value={null}
            onChange={onChange}
            label={`Add model ${slot}`}
            placeholder="Search models"
            exclude={exclude}
          />
        </div>
      </article>
    );
  }

  // Filled slot
  //Letter shown in the coloured square logo
  const initial = model.company === "Mistral AI" ? "Mi" : model.company.charAt(0);

  return (
    <article className="card slot" style={slotColor}>
      {/* Top row: "Model 1/2/3" label and a remove (X) button */}
      <div className="slot-top">
        <span className="slot-label">
          <span className="slot-dot" />
          Model {slot}
        </span>
        <button
          className="slot-remove"
          type="button"
          aria-label={`Remove ${model.name}`}
          onClick={() => onChange(null)}
        >
          <X className="icon icon-sm" />
        </button>
      </div>

      {/* Company square, model name, company and rank */}
      <div className="model-cell slot-model">
        <span
          className="avatar avatar-lg"
          style={{ "--c": companyColors[model.company] || "#1f6b50" }}
          aria-hidden="true"
        >
          {initial}
        </span>
        <div>
          <div className="name">{model.name}</div>
          <div className="company">
            {model.company} · Rank #{model.rank}
          </div>
        </div>
      </div>

      {/* Search box to swap this slot for a different model */}
      <div className="field">
        <span className="label">Change model</span>
        <ModelPicker
          models={models}
          value={value}
          onChange={onChange}
          label={`Change model ${slot}`}
          placeholder="Search models"
          exclude={exclude}
        />
      </div>
    </article>
  );
}