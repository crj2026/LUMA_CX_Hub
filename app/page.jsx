import { currentUser } from "@clerk/nextjs/server";
import { getRole, getDisplayName } from "../lib/auth";
import AppClient from "./AppClient";

export default async function HomePage() {
  const user = await currentUser();
  const role = getRole(user);
  const displayName = getDisplayName(user);
  const userId = user?.id ?? null;

  return <AppClient userId={userId} role={role} displayName={displayName} />;
}
