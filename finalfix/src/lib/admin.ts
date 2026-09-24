import { supabase } from "./supabase";

export type AdminProfile = {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_active: boolean;
};

/**
 * Get the currently authenticated admin profile.
 *
 * Database schema:
 * admin_profiles
 * - id
 * - user_id
 * - full_name
 * - email
 * - role
 * - is_active
 * - created_at
 * - updated_at
 */
export async function getCurrentAdmin(): Promise<AdminProfile | null> {
  try {
    // Get the currently authenticated Supabase user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    // Find the admin profile using the Supabase Auth user UUID.
    //
    // IMPORTANT:
    // admin_profiles.id is the profile row UUID.
    // admin_profiles.user_id is the Supabase Auth user UUID.
    const { data, error: profileError } = await supabase
      .from("admin_profiles")
      .select("id,user_id,full_name,email,role,is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load admin profile:", profileError);
      return null;
    }

    if (!data) {
      return null;
    }

    // Make sure this profile belongs to the currently
    // authenticated Supabase user.
    if (data.user_id !== user.id) {
      return null;
    }

    // Current database constraint allows:
    // admin / editor
    //
    // The admin login page requires an active admin account.
    if (data.role !== "admin") {
      return null;
    }

    if (data.is_active !== true) {
      return null;
    }

    return data as AdminProfile;
  } catch (error) {
    console.error("Unexpected error while checking admin:", error);
    return null;
  }
}

/**
 * Require an authenticated active admin.
 *
 * Throws ADMIN_ACCESS_DENIED if the current user
 * is not an active admin.
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Error("ADMIN_ACCESS_DENIED");
  }

  return admin;
}

/**
 * Sign out the current admin.
 */
export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}