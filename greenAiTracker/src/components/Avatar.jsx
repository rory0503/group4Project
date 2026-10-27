import { companyColors } from "../data/models";

//Avatar is used to get the logo next to model name, takes first letter of company and puts it in a box with colour.
//possibly use actual company logo in later stage of implementation
export default function Avatar({ company, large = false }) {
  const initial = company === "Mistral AI" ? "Mi" : company.charAt(0);
  return (
    <span
      className={`avatar${large ? " avatar-lg" : ""}`}
      style={{ "--c": companyColors[company] ?? "#1f6b50" }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}