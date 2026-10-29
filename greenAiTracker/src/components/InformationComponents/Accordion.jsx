import { useState } from "react";
import { Plus } from "lucide-react";

// A click-to-open panel built on the browser's <details> element.
// Works on its own, or controlled from outside with `open` + `onOpenChange`.

// Again all made by Ai and may be subject to change if we decide its not needed o find another way to do this.
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
        {summary}
        <Plus className="icon" />
      </summary>
      <div className="acc-body">{children}</div>
    </details>
  );
}