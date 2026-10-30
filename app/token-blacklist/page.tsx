import { redirect } from "next/navigation";

export default function RedirectOldTokenBlacklistPage() {
  redirect("/write/tokens-security");
}
