import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://tetimiantest.lovable.app",
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
  };
}

const VALID_ROLES = ["admin", "accueil", "medecin", "infirmier", "caissier", "pharmacien", "laborantin", "imagerie"];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  accueil: "Accueil",
  medecin: "Médecin",
  infirmier: "Infirmier(e)",
  caissier: "Caissier(e)",
  pharmacien: "Pharmacien(ne)",
  laborantin: "Laborantin(e)",
  imagerie: "Imagerie",
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: callerRole } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).single();
    if (callerRole?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Accès réservé aux administrateurs" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { email, password, full_name, role, specialty } = body;

    // Server-side input validation
    if (!email || typeof email !== "string" || email.length > 255) {
      return new Response(JSON.stringify({ error: "Email invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Format d'email invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!password || typeof password !== "string" || password.length < 6 || password.length > 128) {
      return new Response(JSON.stringify({ error: "Mot de passe requis (6-128 caractères)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0 || full_name.length > 255) {
      return new Response(JSON.stringify({ error: "Nom complet requis (max 255 caractères)" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!role || !VALID_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: `Rôle invalide. Valeurs acceptées: ${VALID_ROLES.join(", ")}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create user with must_change_password flag
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: full_name.trim(),
        must_change_password: true,
      },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Create profile
    await adminClient.from("profiles").insert({
      user_id: newUser.user!.id,
      email: email.trim(),
      full_name: full_name.trim(),
    });

    // Assign role
    await adminClient.from("user_roles").insert({
      user_id: newUser.user!.id,
      role,
    });

    // Send password reset email so user can set their own password
    // This serves as the "welcome email" with a link to change password
    const origin = req.headers.get("Origin") || "https://atsante.lovable.app";
    await adminClient.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${origin}/auth?change_password=true`,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      user_id: newUser.user!.id,
      message: `Un email a été envoyé à ${email} pour définir son mot de passe.`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erreur interne du serveur" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
