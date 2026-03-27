import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
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

    // Get license info for redirect URL
    const origin = req.headers.get("Origin") || "https://atsante.lovable.app";
    let redirectUrl = `${origin}/auth`;
    
    if (license_key) {
      // Get license details
      const { data: license } = await adminClient.from("licenses").select("clinic_name").eq("license_key", license_key).single();
      if (license) {
        redirectUrl = `${origin}/auth?license_key=${encodeURIComponent(license_key)}&clinic_name=${encodeURIComponent(license.clinic_name)}`;
      }
    }

    // Resend invite by generating a new invite link
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email.trim(), {
      data: user.user_metadata || {},
      redirectTo: redirectUrl,
    });

    // If invite fails because user already confirmed, send password recovery instead
    if (inviteError) {
      await adminClient.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Email d'invitation renvoyé à ${email}.`,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Erreur interne" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
