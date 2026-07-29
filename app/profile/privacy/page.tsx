import {
  redirect,
} from "next/navigation";

export default function LegacyProfilePrivacyPage() {
  redirect("/settings/privacy");
}