import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Loader2, CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useActiveLicense } from '@/hooks/useLicense';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { differenceInDays, parseISO, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ALL_MODULES } from '@/hooks/useLicenses';

export function LicenseActivation() {
  const queryClient = useQueryClient();
  const { data: license, isLoading } = useActiveLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      toast.error('Veuillez entrer une clé de licence');
      return;
    }

    setActivating(true);
    try {
      // Verify the key exists and is valid
      const { data: licData, error: licError } = await supabase
        .from('licenses')
        .select('*')
        .eq('license_key', licenseKey.trim())
        .single();

      if (licError || !licData) {
        toast.error('Clé de licence invalide ou introuvable');
        return;
      }

      if (!licData.is_active) {
        toast.error('Cette licence a été désactivée');
        return;
      }

      if (new Date(licData.expiry_date) < new Date()) {
        toast.error('Cette licence est expirée');
        return;
      }

      // Save the key to clinic_settings
      const { data: settings } = await supabase
        .from('clinic_settings')
        .select('id')
        .limit(1)
        .single();

      if (settings) {
        await supabase
          .from('clinic_settings')
          .update({ activated_license_key: licenseKey.trim() } as any)
          .eq('id', settings.id);
      } else {
        await supabase
          .from('clinic_settings')
          .insert({ activated_license_key: licenseKey.trim() } as any);
      }

      queryClient.invalidateQueries({ queryKey: ['active_license'] });
      toast.success('Licence activée avec succès !');
      setLicenseKey('');
    } catch (err: any) {
      toast.error('Erreur: ' + err.message);
    } finally {
      setActivating(false);
    }
  };

  const getStatusInfo = () => {
    if (!license) return { icon: XCircle, label: 'Non activée', color: 'text-muted-foreground', variant: 'outline' as const };
    if (!license.is_active) return { icon: XCircle, label: 'Suspendue', color: 'text-destructive', variant: 'destructive' as const };
    const days = differenceInDays(parseISO(license.expiry_date), new Date());
    if (days < 0) return { icon: XCircle, label: 'Expirée', color: 'text-destructive', variant: 'destructive' as const };
    if (days < 30) return { icon: AlertTriangle, label: `${days} jours restants`, color: 'text-orange-500', variant: 'outline' as const };
    return { icon: CheckCircle, label: 'Active', color: 'text-green-500', variant: 'default' as const };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Current License Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Licence du logiciel
          </CardTitle>
          <CardDescription>
            État de votre licence ATSanté
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : license ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <StatusIcon className={`h-8 w-8 ${status.color}`} />
                  <div>
                    <p className="font-semibold text-lg">{license.clinic_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Clé: <code className="bg-muted px-2 py-0.5 rounded text-xs">{license.license_key}</code>
                    </p>
                  </div>
                </div>
                <Badge variant={status.variant} className="text-sm">{status.label}</Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  <p className="text-2xl font-bold">{license.current_users} / {license.max_users}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Début</p>
                  <p className="text-lg font-semibold">{format(parseISO(license.start_date), 'dd MMM yyyy', { locale: fr })}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-muted-foreground">Expiration</p>
                  <p className="text-lg font-semibold">{format(parseISO(license.expiry_date), 'dd MMM yyyy', { locale: fr })}</p>
                </Card>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Modules activés</p>
                <div className="flex flex-wrap gap-2">
                  {license.enabled_modules.map(mod => {
                    const modInfo = ALL_MODULES.find(m => m.value === mod);
                    return (
                      <Badge key={mod} variant="secondary">{modInfo?.label || mod}</Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-lg font-medium text-muted-foreground">Aucune licence activée</p>
              <p className="text-sm text-muted-foreground">Entrez votre clé de licence ci-dessous pour activer le logiciel</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activate License */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {license ? 'Changer la licence' : 'Activer une licence'}
          </CardTitle>
          <CardDescription>
            Entrez la clé de licence fournie par votre fournisseur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="sr-only">Clé de licence</Label>
              <Input
                placeholder="LIC-XXXXXXXX-XXXX"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <Button onClick={handleActivate} disabled={activating || !licenseKey.trim()} className="gap-2">
              {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
              Activer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
