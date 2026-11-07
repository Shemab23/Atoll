import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    // A missing session means the visitor is not signed in.
    if (error.name === "AuthSessionMissingError") {
      return null;
    }

    throw error;
  }

  return user;
}
