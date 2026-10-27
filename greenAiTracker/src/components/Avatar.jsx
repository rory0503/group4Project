import { companyColors } from "../data/models";

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