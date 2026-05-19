import type { SupabaseClient, User } from "@supabase/supabase-js";

export type BusinessResult =
  | { businessId: string }
  | { error: string };

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 48) || "commerce";
}

function uniqueSlug(name: string): string {
  return `${slugify(name)}-${Date.now().toString(36)}`;
}

export async function ensureBusinessForUser(
  supabase: SupabaseClient,
  user: User
): Promise<BusinessResult> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError.message };
  }

  if (profile?.business_id) {
    return { businessId: profile.business_id };
  }

  const businessName =
    (user.user_metadata?.business_name as string | undefined)?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    "Mon commerce";

  const phone =
    (user.user_metadata?.phone as string | undefined)?.trim() || null;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: businessName,
      slug: uniqueSlug(businessName),
      phone,
    })
    .select("id")
    .single();

  if (businessError || !business) {
    return {
      error: businessError?.message ?? "Impossible de créer le commerce.",
    };
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined)?.trim() || null;

  const { error: profileUpsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      business_id: business.id,
      full_name: fullName,
      role: "owner",
    },
    { onConflict: "id" }
  );

  if (profileUpsertError) {
    return { error: profileUpsertError.message };
  }

  return { businessId: business.id };
}

export async function ensureCategoryForBusiness(
  supabase: SupabaseClient,
  businessId: string,
  categoryName: string,
  emoji = "🍽️"
): Promise<{ categoryId: string } | { error: string }> {
  const { data: existing, error: findError } = await supabase
    .from("categories")
    .select("id")
    .eq("business_id", businessId)
    .eq("name", categoryName)
    .maybeSingle();

  if (findError) {
    return { error: findError.message };
  }

  if (existing) {
    return { categoryId: existing.id };
  }

  const { data: created, error: createError } = await supabase
    .from("categories")
    .insert({
      business_id: businessId,
      name: categoryName,
      emoji,
      sort_order: 0,
    })
    .select("id")
    .single();

  if (createError || !created) {
    return {
      error: createError?.message ?? "Impossible de créer la catégorie.",
    };
  }

  return { categoryId: created.id };
}
