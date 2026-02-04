import { useParams, Link } from 'react-router-dom';
import { AppLayout, PageHeader } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  Printer,
  Edit,
  Phone,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  Stethoscope,
  Pill,
  FlaskConical,
  FileText,
  Clock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { mockPatients, mockVisits } from '@/data/mockData';
import { cn } from '@/lib/utils';

const PatientDetail = () => {
  const { id } = useParams();
  const patient = mockPatients.find(p => p.id === id);
  const patientVisits = mockVisits.filter(v => v.patientId === id);

  if (!patient) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-semibold mb-2">Patient non trouvé</h2>
          <p className="text-muted-foreground mb-4">Le patient demandé n'existe pas.</p>
          <Button asChild>
            <Link to="/patients">Retour à la liste</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 no-print">
            <Link to="/patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la liste
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Patient Card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Info Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className={cn(
                      'text-2xl font-semibold',
                      patient.gender === 'F' 
                        ? 'bg-pink-100 text-pink-700' 
                        : 'bg-blue-100 text-blue-700'
                    )}>
                      {patient.firstName[0]}{patient.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-bold">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    {calculateAge(patient.dateOfBirth)} ans • {patient.gender === 'F' ? 'Féminin' : 'Masculin'}
                  </p>
                  <div className="flex gap-2 mb-4">
                    {patient.bloodType && (
                      <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                        {patient.bloodType}
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {patient.code}
                    </Badge>
                  </div>

                  {/* QR Code */}
                  <div className="qr-container border-2 border-dashed border-primary/30 rounded-xl p-4 mb-4">
                    <QRCodeSVG 
                      value={patient.code} 
                      size={140}
                      level="H"
                      includeMargin={false}
                    />
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {patient.code}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full no-print">
                    <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2">
                      <Edit className="h-4 w-4" />
                      Modifier
                    </Button>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.phone}</span>
                  </div>
                  {patient.address && (
                    <div className="flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{patient.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Né(e) le {formatDate(patient.dateOfBirth)}</span>
                  </div>
                </div>

                {/* Allergies */}
                {patient.allergies && patient.allergies.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Allergies</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Emergency Contact */}
                {patient.emergencyContact && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <p className="text-sm font-medium mb-2">Contact d'urgence</p>
                      <div className="text-sm text-muted-foreground">
                        <p>{patient.emergencyContact.name}</p>
                        <p>{patient.emergencyContact.phone}</p>
                        <p className="text-xs">{patient.emergencyContact.relationship}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="historique" className="w-full">
              <TabsList className="grid w-full grid-cols-4 no-print">
                <TabsTrigger value="historique" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Historique
                </TabsTrigger>
                <TabsTrigger value="consultations" className="gap-2">
                  <Stethoscope className="h-4 w-4" />
                  Consultations
                </TabsTrigger>
                <TabsTrigger value="prescriptions" className="gap-2">
                  <Pill className="h-4 w-4" />
                  Ordonnances
                </TabsTrigger>
                <TabsTrigger value="analyses" className="gap-2">
                  <FlaskConical className="h-4 w-4" />
                  Analyses
                </TabsTrigger>
              </TabsList>

              <TabsContent value="historique" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des visites</CardTitle>
                    <CardDescription>
                      {patientVisits.length} visite(s) enregistrée(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {patientVisits.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucune visite enregistrée
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {patientVisits.map((visit) => (
                          <div
                            key={visit.id}
                            className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30"
                          >
                            <div className={cn(
                              'h-10 w-10 rounded-full flex items-center justify-center',
                              visit.type === 'urgence' ? 'bg-destructive/10' : 'bg-primary/10'
                            )}>
                              <Stethoscope className={cn(
                                'h-5 w-5',
                                visit.type === 'urgence' ? 'text-destructive' : 'text-primary'
                              )} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium capitalize">{visit.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(visit.date)}
                              </p>
                            </div>
                            <Badge variant={
                              visit.status === 'termine' ? 'default' :
                              visit.status === 'en_cours' ? 'secondary' : 'outline'
                            }>
                              {visit.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="consultations" className="mt-6">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <div>
                      <CardTitle>Consultations</CardTitle>
                      <CardDescription>Dossier médical du patient</CardDescription>
                    </div>
                    <Button className="gap-2 no-print">
                      <Stethoscope className="h-4 w-4" />
                      Nouvelle consultation
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune consultation enregistrée
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ordonnances</CardTitle>
                    <CardDescription>Prescriptions médicales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune ordonnance enregistrée
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analyses" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Résultats d'analyses</CardTitle>
                    <CardDescription>Laboratoire et imagerie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun résultat disponible
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Print-only Patient Card */}
        <div className="print-only mt-8">
          <div className="patient-card-print mx-auto">
            <div className="flex items-start justify-between h-full">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-primary mb-1">SantéPro</h3>
                <p className="text-xs text-muted-foreground mb-3">Clinique Médicale</p>
                <div className="space-y-1">
                  <p className="font-semibold">{patient.firstName} {patient.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {calculateAge(patient.dateOfBirth)} ans • {patient.gender === 'F' ? 'F' : 'M'}
                    {patient.bloodType && ` • ${patient.bloodType}`}
                  </p>
                  <p className="text-xs font-mono mt-2">{patient.code}</p>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <QRCodeSVG 
                  value={patient.code} 
                  size={80}
                  level="H"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientDetail;
