import { useId, useState } from "react";
import { Search } from "lucide-react";
import Avatar from "./Avatar";

export default function ModelPicker({
  models,
  value,
  onChange,
  label = "Model",
  placeholder = "Search models",
  exclude = [],
}) {
  const uid = useId();
  const selected = models.find((m) => m.id === value);

  const [text, setText] = useState(null); // null = not typing, so show the chosen model's name
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = (text ?? "").trim().toLowerCase();
  const options = models.filter(
    (m) =>
      !exclude.includes(m.id) &&
      (!query || m.name.includes(query) || m.company.toLowerCase().includes(query))
  );

  function choose(id) {
    onChange(id);
    setText(null);
    setOpen(false);
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (options.length === 0) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (a + step + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && options[active]) choose(options[active].id);
    } else if (e.key === "Escape") {
      setText(null);
      setOpen(false);
    }
  }

  return (
    <div className="picker">
      <div className="input-wrap">
        <input
          className="input"
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          aria-activedescendant={open && options.length ? `${uid}-o${active}` : undefined}
          aria-label={label}
          placeholder={placeholder}
          value={text ?? selected?.name ?? ""}
          onFocus={(e) => {
            e.target.select();
            setActive(Math.max(0, options.findIndex((m) => m.id === value)));
            setOpen(true);
          }}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setText(null);
            setOpen(false);
          }}
        />
        <span className="input-icon"><Search className="icon icon-sm" /></span>
      </div>

      <ul className="picker-list" id={`${uid}-list`} role="listbox" hidden={!open}>
        {options.length === 0 && (
          <li className="picker-empty">No models match “{text}”</li>
        )}
        {options.map((m, i) => (
          <li
            key={m.id}
            id={`${uid}-o${i}`}
            className={`picker-option${m.id === value ? " current" : ""}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => {
              e.preventDefault(); // keep focus so the list doesn't close before the click lands
              choose(m.id);
            }}
          >
            <Avatar company={m.company} />
            <span>
              <span>{m.name}</span>
              <small>{m.company}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}