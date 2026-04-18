import { supabase } from "./supabase";

export async function getUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Not authenticated");
  await supabase
    .from("user_profiles")
    .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
  return user.id;
}
