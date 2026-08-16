import { redirect } from "next/navigation";

export default function LegacyResult() {
  redirect("/attempts");
}
