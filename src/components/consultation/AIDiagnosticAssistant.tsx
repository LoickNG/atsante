import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Sparkles, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface AIDiagnosticAssistantProps {
  symptoms: string;
  vitalSigns: {
    temperature: string;
    bloodPressure: string;
    heartRate: string;
    weight: string;
    height: string;
  };
  patientInfo: {
    age: number;
    gender: string;
    bloodType?: string;
    allergies?: string[];
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostic-assistant`;

export const AIDiagnosticAssistant = ({ symptoms, vitalSigns, patientInfo }: AIDiagnosticAssistantProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  const requestDiagnosis = useCallback(async () => {
    if (!symptoms.trim() || symptoms.trim().length < 3) {
      toast.error('Veuillez d\'abord décrire les symptômes du patient (min 3 caractères).');
      return;
    }

    setIsLoading(true);
    setResult('');
    setIsVisible(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ symptoms, vitalSigns, patientInfo }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Erreur inconnue' }));
        toast.error(err.error || 'Erreur du service IA');
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let accumulated = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              accumulated += content;
              setResult(accumulated);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error('AI diagnostic error:', e);
      toast.error('Impossible de contacter l\'assistant IA');
    } finally {
      setIsLoading(false);
    }
  }, [symptoms, vitalSigns, patientInfo]);

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={requestDiagnosis}
        disabled={isLoading}
        className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {isLoading ? 'Analyse en cours...' : 'Aide au diagnostic IA'}
      </Button>

      {isVisible && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Assistant IA
              <Badge variant="outline" className="text-[10px] font-normal">
                Aide à la décision
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => { setIsVisible(false); setResult(''); }}
            >
              <X className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading && !result && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyse des symptômes...
              </div>
            )}
            {result && (
              <div className="prose prose-sm max-w-none text-sm dark:prose-invert [&_strong]:text-foreground [&_li]:text-foreground/90 [&_p]:text-foreground/90">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              ⚠️ Cet outil est une aide à la décision. Le diagnostic final relève de la responsabilité du médecin.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
