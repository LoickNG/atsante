import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://atsante.lovable.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith(".lovableproject.com") ||
    origin.endsWith(".lovable.app");

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRole } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).single();
    if (callerRole?.role !== "super_admin") {
      return new Response(JSON.stringify({ error: "Accès réservé au super administrateur" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, license_key } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find the user
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const user = existingUsers?.users?.find(u => u.email === email.trim());
    if (!user) {
      return new Response(JSON.stringify({ error: "Utilisateur introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appUrl = "https://atsante.lovable.app";
    let redirectUrl = `${appUrl}/auth`;

    if (license_key) {
      const { data: license } = await adminClient.from("licenses").select("clinic_name").eq("license_key", license_key).single();
      if (license) {
        redirectUrl = `${appUrl}/auth?license_key=${encodeURIComponent(license_key)}&clinic_name=${encodeURIComponent(license.clinic_name)}`;
      }
    }

    // Ensure the user metadata has must_change_password
    await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, must_change_password: true },
    });

    // Ensure the user's profile and role exist
    if (license_key) {
      const { data: license } = await adminClient.from("licenses").select("*").eq("license_key", license_key).single();
      if (license) {
        // Ensure clinic_settings exists
        let clinicId: string | null = null;
        const { data: existingClinic } = await adminClient.from("clinic_settings")
          .select("id")
          .eq("activated_license_key", license_key)
          .single();

        if (existingClinic) {
          clinicId = existingClinic.id;
        } else {
          const { data: newClinic } = await adminClient.from("clinic_settings")
            .insert({ name: license.clinic_name, activated_license_key: license_key })
            .select("id")
            .single();
          if (newClinic) clinicId = newClinic.id;
        }

        if (clinicId) {
          // Ensure profile exists
          const { data: existingProfile } = await adminClient.from("profiles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (existingProfile) {
            await adminClient.from("profiles").update({ clinic_id: clinicId }).eq("user_id", user.id);
          } else {
            await adminClient.from("profiles").insert({
              user_id: user.id,
              email: email.trim(),
              full_name: user.user_metadata?.full_name || email.trim(),
              clinic_id: clinicId,
            });
          }

          // Ensure role exists
          const { data: existingRole } = await adminClient.from("user_roles")
            .select("id")
            .eq("user_id", user.id)
            .single();

          if (existingRole) {
            await adminClient.from("user_roles").update({ role: "admin", clinic_id: clinicId }).eq("user_id", user.id);
          } else {
            await adminClient.from("user_roles").insert({
              user_id: user.id,
              role: "admin",
              clinic_id: clinicId,
            });
          }
        }
      }
    }

    // Try invite first, fall back to recovery
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
      data: { ...user.user_metadata, must_change_password: true },
      redirectTo: redirectUrl,
    });

    if (inviteError) {
      // User already confirmed, send password recovery
      await adminClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Email d'invitation renvoyé à ${email}. L'administrateur recevra un lien pour accéder à l'application et définir son mot de passe.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Erreur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
