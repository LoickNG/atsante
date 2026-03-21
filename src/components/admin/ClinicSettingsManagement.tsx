import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, Save, Upload, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ClinicSettingsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useClinicSettings();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [slogan, setSlogan] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#1e40af');

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setLogoUrl(settings.logo_url || '');
      setAddress(settings.address || '');
      setCity(settings.city || '');
      setCountry(settings.country || '');
      setPhone(settings.phone || '');
      setPhone2(settings.phone2 || '');
      setEmail(settings.email || '');
      setWebsite(settings.website || '');
      setTaxId(settings.tax_id || '');
      setLicenseNumber(settings.license_number || '');
      setSlogan(settings.slogan || '');
      setPrimaryColor(settings.primary_color || '#1e40af');
    }
  }, [settings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `clinic-logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('patient-photos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('patient-photos').getPublicUrl(filePath);
      setLogoUrl(urlData.publicUrl);
      toast({ title: 'Logo téléchargé' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!settings?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('clinic_settings').update({
        name,
        logo_url: logoUrl || null,
        address: address || null,
        city: city || null,
        country: country || null,
        phone: phone || null,
        phone2: phone2 || null,
        email: email || null,
        website: website || null,
        tax_id: taxId || null,
        license_number: licenseNumber || null,
        slogan: slogan || null,
        primary_color: primaryColor || null,
      }).eq('id', settings.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['clinic_settings'] });
      toast({ title: 'Paramètres enregistrés', description: 'Les informations de la clinique ont été mises à jour.' });
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informations de la clinique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 rounded-lg">
            <AvatarImage src={logoUrl} alt="Logo" className="object-contain" />
            <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xl font-bold">
              {name?.[0] || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Label>Logo de la clinique</Label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild disabled={uploading}>
                <label className="cursor-pointer">
                  {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  {uploading ? 'Envoi...' : 'Changer le logo'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
              </Button>
              {logoUrl && (
                <Button variant="ghost" size="icon" onClick={() => setLogoUrl('')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">PNG ou JPG, taille recommandée : 200x200px</p>
          </div>
        </div>

        {/* Identity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom de la clinique *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Centre Médical XYZ" />
          </div>
          <div className="space-y-2">
            <Label>Slogan / Sous-titre</Label>
            <Input value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Centre Médical Polyvalent" />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Téléphone principal</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+243 000 000 000" />
          </div>
          <div className="space-y-2">
            <Label>Téléphone secondaire</Label>
            <Input value={phone2} onChange={e => setPhone2(e.target.value)} placeholder="+243 000 000 000" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@clinique.com" />
          </div>
          <div className="space-y-2">
            <Label>Site web</Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.clinique.com" />
          </div>
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Adresse</Label>
            <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Avenue de la Santé" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Ville</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Kinshasa" />
          </div>
          <div className="space-y-2">
            <Label>Pays</Label>
            <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="RDC" />
          </div>
        </div>

        {/* Legal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>N° d'identification fiscale (NIF)</Label>
            <Input value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="NIF-000000" />
          </div>
          <div className="space-y-2">
            <Label>N° de licence / Agrément</Label>
            <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="LIC-000000" />
          </div>
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Couleur principale (en-têtes)</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
            <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-32" />
            <div className="h-10 flex-1 rounded" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer les modifications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
