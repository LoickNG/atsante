import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, vitalSigns, patientInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!symptoms || typeof symptoms !== "string" || symptoms.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Veuillez décrire les symptômes (min 3 caractères)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Tu es un assistant médical IA spécialisé dans l'aide au diagnostic. Tu assistes les médecins dans leur réflexion clinique.

IMPORTANT:
- Tu ne poses PAS de diagnostic définitif. Tu proposes des pistes diagnostiques à explorer.
- Tu dois toujours rappeler que le diagnostic final revient au médecin.
- Réponds en français.
- Sois concis et structuré.

Format de réponse:
1. **Hypothèses diagnostiques** (classées par probabilité)
2. **Examens complémentaires suggérés** (analyses, imagerie)
3. **Points d'attention** (signes d'alerte, diagnostics différentiels à ne pas manquer)`;

    let userMessage = `Symptômes rapportés: ${symptoms}`;
    
    if (vitalSigns) {
      const vitals = [];
      if (vitalSigns.temperature) vitals.push(`Température: ${vitalSigns.temperature}°C`);
      if (vitalSigns.bloodPressure) vitals.push(`Tension: ${vitalSigns.bloodPressure} mmHg`);
      if (vitalSigns.heartRate) vitals.push(`Pouls: ${vitalSigns.heartRate} bpm`);
      if (vitalSigns.weight) vitals.push(`Poids: ${vitalSigns.weight} kg`);
      if (vitalSigns.height) vitals.push(`Taille: ${vitalSigns.height} cm`);
      if (vitals.length > 0) userMessage += `\n\nSignes vitaux:\n${vitals.join("\n")}`;
    }

    if (patientInfo) {
      const info = [];
      if (patientInfo.age) info.push(`Âge: ${patientInfo.age} ans`);
      if (patientInfo.gender) info.push(`Sexe: ${patientInfo.gender === "M" ? "Masculin" : "Féminin"}`);
      if (patientInfo.bloodType) info.push(`Groupe sanguin: ${patientInfo.bloodType}`);
      if (patientInfo.allergies?.length) info.push(`Allergies: ${patientInfo.allergies.join(", ")}`);
      if (info.length > 0) userMessage += `\n\nInformations patient:\n${info.join("\n")}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("diagnostic-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
