import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, Save, User, Phone, MapPin, Heart, AlertTriangle,
  UserPlus, QrCode, Printer, Check, Building2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { useCreatePatient, useUpdatePatient, Patient } from '@/hooks/usePatients';
import { usePartnerCompanies, useActiveConventions } from '@/hooks/useConventions';
import { WebcamCapture } from '@/components/patient/WebcamCapture';
import { PatientCardPreview } from '@/components/patient/PatientCardPreview';

const NewPatient = () => {
  const navigate = useNavigate();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const { data: companies } = usePartnerCompanies();
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCardPreview, setShowCardPreview] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const { data: activeConventions } = useActiveConventions(selectedCompanyId || undefined);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  const handlePhotoCapture = useCallback((blob: Blob) => {
    setPhotoBlob(blob);
    setPhotoPreviewUrl(URL.createObjectURL(blob));
  }, []);

  const handlePhotoClear = useCallback(() => {
    setPhotoBlob(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoPreviewUrl(null);
  }, [photoPreviewUrl]);

  const uploadPhoto = async (patientId: string): Promise<string | null> => {
    if (!photoBlob) return null;
    const filePath = `${patientId}.jpg`;
    const { error } = await supabase.storage
      .from('patient-photos')
      .upload(filePath, photoBlob, { contentType: 'image/jpeg', upsert: true });
    if (error) { console.error('Photo upload error:', error); return null; }
    const { data } = supabase.storage.from('patient-photos').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    bloodType: '',
    allergies: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    employeeId: '',
    conventionId: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = (value: string) => {
    setSelectedCompanyId(value === 'none' ? '' : value);
    setFormData(prev => ({ ...prev, conventionId: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender || !formData.phone) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!photoBlob) {
      toast.error('La photo du patient est obligatoire. Veuillez prendre une photo avec la webcam.');
      return;
    }

    try {
      const allergiesArray = formData.allergies 
        ? formData.allergies.split(',').map(a => a.trim()).filter(a => a)
        : null;

      const patient = await createPatient.mutateAsync({
        first_name: formData.firstName,
        last_name: formData.lastName,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address || null,
        blood_type: formData.bloodType || null,
        allergies: allergiesArray,
        emergency_contact_name: formData.emergencyName || null,
        emergency_contact_phone: formData.emergencyPhone || null,
        emergency_contact_relationship: formData.emergencyRelationship || null,
        company_id: selectedCompanyId || null,
        convention_id: formData.conventionId || null,
        employee_id: formData.employeeId || null,
      } as any);

      // Upload photo if captured
      let finalPatient = patient;
      if (photoBlob) {
        const photoUrl = await uploadPhoto(patient.id);
        if (photoUrl) {
          await updatePatient.mutateAsync({ id: patient.id, photo_url: photoUrl } as any);
          finalPatient = { ...patient, photo_url: photoUrl } as any;
        }
      }

      setCreatedPatient(finalPatient);
      setShowQRDialog(true);
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-semibold">Patient enregistré avec succès!</span>
          <span className="text-sm text-muted-foreground">Code: {patient.code}</span>
        </div>
      );
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Erreur lors de l\'enregistrement du patient');
    }
  };

  const handlePrintCard = () => {
    setShowQRDialog(false);
    setShowCardPreview(true);
  };
  const handleCloseDialog = () => { setShowQRDialog(false); navigate('/patients'); };
  const handleCardPreviewClose = (open: boolean) => {
    setShowCardPreview(open);
    if (!open) navigate('/patients');
  };

  const selectedConvention = activeConventions?.find(c => c.id === formData.conventionId);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/patients"><ArrowLeft className="mr-2 h-4 w-4" />Retour à la liste</Link>
          </Button>
          <PageHeader title="Nouveau Patient" description="Enregistrer un nouveau patient et générer sa carte QR" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Informations personnelles</CardTitle>
              </div>
              <CardDescription>Données d'identification du patient</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 flex flex-col items-center gap-1 pb-2">
                <WebcamCapture onCapture={handlePhotoCapture} capturedUrl={photoPreviewUrl} onClear={handlePhotoClear} autoStart />
                <p className="text-xs text-destructive font-medium">Photo obligatoire *</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input id="lastName" placeholder="Ex: Mahamat" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input id="firstName" placeholder="Ex: Fatima" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Genre *</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger id="gender"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Prise en charge / Convention */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Prise en charge</CardTitle>
              </div>
              <CardDescription>Rattacher le patient à une société et une convention (optionnel)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Société</Label>
                <Select value={selectedCompanyId || 'none'} onValueChange={handleCompanyChange}>
                  <SelectTrigger><SelectValue placeholder="Aucune société" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucune (patient particulier)</SelectItem>
                    {companies?.filter(c => c.is_active).map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedCompanyId && (
                <>
                  <div className="space-y-2">
                    <Label>Convention</Label>
                    <Select value={formData.conventionId || 'none'} onValueChange={v => handleChange('conventionId', v === 'none' ? '' : v)}>
                      <SelectTrigger><SelectValue placeholder="Choisir une convention" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Aucune convention</SelectItem>
                        {activeConventions?.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — Patient: {c.patient_coverage_percent}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Matricule employé</Label>
                    <Input id="employeeId" placeholder="N° matricule dans la société" value={formData.employeeId} onChange={(e) => handleChange('employeeId', e.target.value)} />
                  </div>
                </>
              )}
              {selectedConvention && (
                <div className="sm:col-span-2 p-3 rounded-lg bg-muted/50 border">
                  <p className="text-sm font-medium mb-1">Répartition de la prise en charge :</p>
                  <div className="flex gap-4 text-sm">
                    <span>Société: <strong>{selectedConvention.company_coverage_percent}%</strong></span>
                    {selectedConvention.insurance && (
                      <span>Assurance ({selectedConvention.insurance.name}): <strong>{selectedConvention.insurance_coverage_percent}%</strong></span>
                    )}
                    <span>Patient: <strong>{selectedConvention.patient_coverage_percent}%</strong></span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input id="phone" type="tel" placeholder="+235 66 XX XX XX" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea id="address" placeholder="Quartier, ville..." className="pl-10 min-h-[80px]" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations médicales */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Informations médicales</CardTitle>
              </div>
              <CardDescription>Données médicales importantes</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bloodType">Groupe sanguin</Label>
                <Select value={formData.bloodType} onValueChange={(v) => handleChange('bloodType', v)}>
                  <SelectTrigger id="bloodType"><SelectValue placeholder="Non renseigné" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="allergies">
                  <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" />Allergies connues</div>
                </Label>
                <Textarea id="allergies" placeholder="Ex: Pénicilline, Aspirine... (séparées par des virgules)" value={formData.allergies} onChange={(e) => handleChange('allergies', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Contact d'urgence */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-info" />
                <CardTitle className="text-lg">Contact d'urgence</CardTitle>
              </div>
              <CardDescription>Personne à contacter en cas d'urgence</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="emergencyName">Nom complet</Label>
                <Input id="emergencyName" placeholder="Ex: Ibrahim Mahamat" value={formData.emergencyName} onChange={(e) => handleChange('emergencyName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyPhone">Téléphone</Label>
                <Input id="emergencyPhone" type="tel" placeholder="+235 66 XX XX XX" value={formData.emergencyPhone} onChange={(e) => handleChange('emergencyPhone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyRelationship">Lien de parenté</Label>
                <Select value={formData.emergencyRelationship} onValueChange={(v) => handleChange('emergencyRelationship', v)}>
                  <SelectTrigger id="emergencyRelationship"><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epoux">Époux/Épouse</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="enfant">Enfant</SelectItem>
                    <SelectItem value="frere_soeur">Frère/Sœur</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild><Link to="/patients">Annuler</Link></Button>
            <Button type="submit" disabled={createPatient.isPending} className="gap-2">
              {createPatient.isPending ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />Enregistrement...</>
              ) : (
                <><Save className="h-4 w-4" />Enregistrer et générer la carte</>
              )}
            </Button>
          </div>
        </form>

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Check className="h-5 w-5 text-success" />Patient enregistré avec succès</DialogTitle>
              <DialogDescription>La carte patient avec QR code a été générée</DialogDescription>
            </DialogHeader>
            {createdPatient && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-full max-w-[300px] p-4 border-2 border-dashed rounded-xl bg-card">
                  <div className="text-center mb-4">
                    <h4 className="font-bold text-lg">ATSanté</h4>
                    <p className="text-xs text-muted-foreground">Carte Patient</p>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    {(createdPatient as any).photo_url ? (
                      <img src={(createdPatient as any).photo_url} alt="Photo patient" className="h-20 w-20 rounded-full object-cover border-2 border-primary flex-shrink-0" />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 flex-shrink-0">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-1 bg-white rounded-lg">
                      <QRCodeSVG value={createdPatient.code} size={80} level="H" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-mono text-lg font-bold text-primary">{createdPatient.code}</p>
                    <p className="font-semibold mt-2">{createdPatient.first_name} {createdPatient.last_name}</p>
                    <p className="text-sm text-muted-foreground">{createdPatient.gender === 'F' ? 'Féminin' : 'Masculin'} • {createdPatient.blood_type || 'Groupe non renseigné'}</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" className="flex-1 gap-2" onClick={handlePrintCard}><Printer className="h-4 w-4" />Imprimer</Button>
                  <Button className="flex-1" onClick={handleCloseDialog}>Terminer</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default NewPatient;
