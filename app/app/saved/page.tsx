import { redirect } from "next/navigation";

export default function LegacySaved() {
  redirect("/bookmarks");
}
