import { redirect } from "next/navigation";

export default function RedirectOldProtocolAdminPage() {
  redirect("/write/governance");
}
