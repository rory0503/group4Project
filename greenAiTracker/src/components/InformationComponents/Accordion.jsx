import { useState } from "react";
import { Plus } from "lucide-react";
import { T } from "../../context/TranslationContext";

// A click-to-open panel built on the browser's <details> element.
// Works on its own, or controlled from outside with `open` + `onOpenChange`.

export default function Accordion({
  summary,
  children,
  defaultOpen = false,
  open,
  onOpenChange,
  className = "",
  ...rest
}) {
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;

  return (
    <details
      className={`accordion ${className}`.trim()}
      open={isOpen}
      onToggle={(e) => {
        setInnerOpen(e.currentTarget.open);
        onOpenChange?.(e.currentTarget.open);
      }}
      {...rest}
    >
      <summary>
        {typeof summary === "string" ? (
          <T>{summary}</T>
        ) : (
          summary
        )}

        <Plus className="icon" />
      </summary>

      <div className="acc-body">
        {children}
      </div>
    </details>
  );
}
