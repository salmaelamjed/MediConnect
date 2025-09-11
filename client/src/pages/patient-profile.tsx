"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CalendarDays,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  User,
  Shield,
  Edit3,
  Save,
  X,
  Activity,
  FileText
} from "lucide-react"

interface PatientData {
  name: string
  email: string
  date_of_birth: string
  gender: string
  address: string
  city: string
  code_postal: string
  medical_history: string
  allergies: string
}

const PatientProfile = () => {
  const [patientData, setPatientData] = useState<PatientData>({
    name: "Salma El amjed",
    email: "elamjedsalma@gmail.com",
    date_of_birth: "2000-12-03",
    gender: "Femme",
    address: "settar, hay kassam rue karballaa",
    city: "SETTAT",
    code_postal: "26000",
    medical_history:
      "Hypertension artérielle diagnostiquée en 2020. Antécédents familiaux de diabète type 2. Chirurgie appendicectomie en 2010.",
    allergies: "Pénicilline, Pollen de bouleau",
  })

  const [editData, setEditData] = useState<PatientData>(patientData)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const handleSave = () => {
    setPatientData(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData(patientData)
    setIsEditing(false)
  }

  const handleChange = (field: keyof PatientData, value: string) => {
    setEditData({ ...editData, [field]: value })
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="w-full min-h-screen p-6 ">
      <div className="w-full mx-auto space-y-8">
        <div className="flex items-end justify-end">
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} className="gap-2">
                  <X className="w-4 h-4" />
                  Annuler
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Modifier le profil
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="overflow-hidden border-0 shadow-lg lg:col-span-1 bg-card/80 backdrop-blur-sm">
            <div className="h-20 ">
              <img src="https://i.pinimg.com/1200x/29/9b/c3/299bc31cb5379fffaad0fa9bd7f0b453.jpg" alt="" />
            </div>
            <CardHeader className="relative pb-6 -mt-16 text-center">
              <div className="relative">
                <Avatar className="w-32 h-32 mx-auto mb-6 shadow-xl ring-4 ring-white ">
                  <AvatarImage src="/professional-medical-portrait.png" />
                  <AvatarFallback className="text-2xl font-bold text-white bg-primary">
                    {getInitials(patientData.name)}
                  </AvatarFallback>
                </Avatar>
                
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="p-2 text-blue-600 bg-blue-100 rounded-full dark:text-blue-400">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Date de naissance</p>
                    <p className="text-sm text-muted-foreground">{formatDate(patientData.date_of_birth)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="p-2 text-blue-600 bg-blue-100 rounded-full dark:text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Email</p>
                    <p className="text-sm break-all text-muted-foreground">{patientData.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="p-2 text-blue-600 bg-blue-100 rounded-full dark:text-blue-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {patientData.address}
                      <br />
                      {patientData.code_postal} {patientData.city}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full h-12 grid-cols-3 lg:grid-cols-5">
                <TabsTrigger value="overview" className="flex gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Aperçu</span>
                </TabsTrigger>
                <TabsTrigger value="medical" className="flex gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Médical</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">

                {/* Quick Stats */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="border-0 shadow-lg ">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-3 mb-3 rounded-full ">
                        <User className="w-6 h-6 text-black " />
                      </div>
                      <p className="text-3xl font-bold text-black ">{calculateAge(patientData.date_of_birth)}</p>
                      <p className="text-sm font-medium text-muted-foreground">Âge</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg ">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-3 mb-3 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="text-3xl font-bold">
                        {patientData.allergies.split(",").length}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg ">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-3 mb-3 ">
                        <Shield className="w-6 h-6 " />
                      </div>
                      <p className="text-3xl font-bold ">Actif</p>
                      <p className="text-sm font-medium text-muted-foreground">Statut du dossier</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-6">
                {/* Medical History */}
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardHeader className="">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full">
                        <Heart className="w-6 h-6 text-red-600 " />
                      </div>
                      Historique Médical
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditing ? (
                      <Textarea
                        value={editData.medical_history}
                        onChange={(e) => handleChange("medical_history", e.target.value)}
                        className="min-h-[120px]"
                      />
                    ) : (
                      <div className="prose-sm prose max-w-none">
                        <p className="p-4 leading-relaxed whitespace-pre-line border-l-4 rounded-lg text-foreground bg-muted/20 border-primary">
                          {patientData.medical_history}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Allergies */}
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r ">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full ">
                        <AlertTriangle className="w-6 h-6 " />
                      </div>
                      Allergies Connues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditing ? (
                      <Input
                        value={editData.allergies}
                        onChange={(e) => handleChange("allergies", e.target.value)}
                        placeholder="Saisir les allergies, séparées par des virgules"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {patientData.allergies.split(",").map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="px-4 py-2 text-sm font-medium shadow-sm">
                            <AlertTriangle className="w-3 h-3 mr-2" />
                            {allergy.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

               
              </TabsContent>

              <TabsContent value="documents">
                <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle>Documents médicaux</CardTitle>
                    <CardDescription>Consultez les documents associés à ce patient</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <div className="p-6 rounded-lg bg-muted/30">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium text-muted-foreground">Aucun document disponible</h3>
                      <p className="text-sm text-muted-foreground">Les documents apparaîtront ici une fois uploadés</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientProfile