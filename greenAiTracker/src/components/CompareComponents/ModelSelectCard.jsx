import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import ModelPicker from "../ModelPicker";
import { byId } from "../../lib/helpers";
import { companyColors } from "../../data/models";
import { T, useTranslation } from "../../context/TranslationContext";

const ORDINAL = ["first", "second", "third"];

export default function ModelSelectCard({ slot, models, value, onChange, exclude }) {
  const model = byId(models, value);
  const slotColor = { "--c": `var(--slot-${slot})` };
  const { lang, translateTexts } = useTranslation();

  const [labels, setLabels] = useState({
    remove: "Remove",
    addModel: "Add model",
    changeModel: "Change model",
    searchModels: "Search models",
  });

  useEffect(() => {
    let active = true;

    const originalTexts = [
      "Remove",
      "Add model",
      "Change model",
      "Search models",
    ];

    translateTexts(originalTexts).then((translated) => {
      if (!active || !Array.isArray(translated)) return;

      setLabels({
        remove: translated[0] || originalTexts[0],
        addModel: translated[1] || originalTexts[1],
        changeModel: translated[2] || originalTexts[2],
        searchModels: translated[3] || originalTexts[3],
      });
    });

    return () => {
      active = false;
    };
  }, [lang, translateTexts]);

  if (!model) {
    return (
      <article className="card slot slot-empty" style={slotColor}>
        <span className="slot-add-icon" aria-hidden="true">
          <Plus className="icon" />
        </span>

        <div>
          <div className="name">
            <T>{`Add a ${ORDINAL[slot - 1]} model`}</T>
          </div>
          <p className="card-sub">
            <T>Compare up to 3 models at once</T>
          </p>
        </div>

        <div className="field" style={{ width: "100%" }}>
          <ModelPicker
            models={models}
            value={null}
            onChange={onChange}
            label={`${labels.addModel} ${slot}`}
            placeholder={labels.searchModels}
            exclude={exclude}
          />
        </div>
      </article>
    );
  }

  const initial = model.company === "Mistral AI" ? "Mi" : model.company.charAt(0);

  return (
    <article className="card slot" style={slotColor}>
      <div className="slot-top">
        <span className="slot-label">
          <span className="slot-dot" />
          <T>{`Model ${slot}`}</T>
        </span>

        <button
          className="slot-remove"
          type="button"
          aria-label={`${labels.remove} ${model.name}`}
          onClick={() => onChange(null)}
        >
          <X className="icon icon-sm" />
        </button>
      </div>

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
            {model.company} · <T>Rank</T> #{model.rank}
          </div>
        </div>
      </div>

      <div className="field">
        <span className="label">
          <T>Change model</T>
        </span>

        <ModelPicker
          models={models}
          value={value}
          onChange={onChange}
          label={`${labels.changeModel} ${slot}`}
          placeholder={labels.searchModels}
          exclude={exclude}
        />
      </div>
    </article>
  );
}