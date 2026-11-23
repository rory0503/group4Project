// The model families shown by default. Add or remove a line to change what is shown.
// Each entry is matched against the model's name, ignoring upper/lower case.
const SHOWN_FAMILIES = [/claude/i, /gpt/i, /gemini/i];

// True when the model's name belongs to one of the families above (old versions included)
export const isPopular = (model) => SHOWN_FAMILIES.some((family) => family.test(model.name));
