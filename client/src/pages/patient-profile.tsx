"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText,
  Calendar,
} from "lucide-react";
import axios from "axios";
import Loader from "@/components/ui/Loader";
import FileUpload from "@/components/shared/file-upload";

interface Reservation {
  id: number;
  reservation_date: string;
  reservation_time: string;
  status: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientDetails {
  name: string;
  profile: string | null;
  allergies: string;
  medical_history: string;
  date_of_birth: string;
  gender: string;
  address: string;
  city: string;
  code_postal: string;
  reservations: Reservation[];
}

interface UserData {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
  patient_details?: PatientDetails;
}

const PatientProfile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [editData, setEditData] = useState<Partial<PatientDetails>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from the API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setUserData(response.data.data);
        if (response.data.data.patient_details) {
          setEditData(response.data.data.patient_details);
        }
      } catch (err) {
        setError(err.response?.data?.message || "An error occurred while fetching user data.");
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    if (!userData?.patient_details) return;

    try {
      await axios.put(
        "http://localhost:8000/api/user",
        {
          email: userData.email,
          profile_image: userData.profile_image,
          // Add patient-specific fields if the API supports updating them
          // Note: The current UserController only updates email, password, and profile_image
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setUserData((prev) => ({
        ...prev!,
        patient_details: { ...prev!.patient_details!, ...editData },
      }));
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred while saving.");
    }
  };

  const handleCancel = () => {
    setEditData(userData?.patient_details || {});
    setIsEditing(false);
  };

  const handleChange = (field: keyof PatientDetails, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (error) return <div className="text-red-500">{error}</div>;
  if (!userData) return <div className="flex items-center justify-center w-full min-h-screen "><Loader /></div>;
  if (userData.role !== "patient") {
    return <div className="text-red-500">This profile is only available for patients.</div>;
  }

  const patient = userData.patient_details!;

  return (
    <div className="w-full min-h-screen p-6">
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
          <Card className="overflow-hidden border-0 shadow-sm lg:col-span-1 bg-card/80 backdrop-blur-sm">
            <div className="h-20">
              <img
                src="https://i.pinimg.com/1200x/29/9b/c3/299bc31cb5379fffaad0fa9bd7f0b453.jpg"
                alt="Profile banner"
              />
            </div>
            <CardHeader className="relative pb-6 -mt-16 text-center">
              <div className="relative">
                <Avatar className="w-32 h-32 mx-auto mb-6 shadow-xl ring-4 ring-white">
                  <AvatarImage src={userData.profile_image || "/professional-medical-portrait.png"} />
                  <AvatarFallback className="text-2xl font-bold text-white bg-primary">
                    {getInitials(patient.name)}
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
                    <p className="text-sm text-muted-foreground">{formatDate(patient.date_of_birth)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="p-2 text-blue-600 bg-blue-100 rounded-full dark:text-blue-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Email</p>
                    <p className="text-sm break-all text-muted-foreground">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="p-2 text-blue-600 bg-blue-100 rounded-full dark:text-blue-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Adresse</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {patient.address}
                      <br />
                      {patient.code_postal} {patient.city}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="space-y-8 lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full h-12 grid-cols-4 lg:grid-cols-4">
                <TabsTrigger value="overview" className="flex gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Aperçu</span>
                </TabsTrigger>
                <TabsTrigger value="medical" className="flex gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="hidden sm:inline">Médical</span>
                </TabsTrigger>
                <TabsTrigger value="reservations" className="flex gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Réservations</span>
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <Card className="border-0 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-3 mb-3 rounded-full">
                        <User className="w-6 h-6 text-black" />
                      </div>
                      <p className="text-3xl font-bold text-black">{calculateAge(patient.date_of_birth)}</p>
                      <p className="text-sm font-medium text-muted-foreground">Âge</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-3 mb-3 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <p className="text-3xl font-bold">
                        {patient.allergies === "no allergies" ? 0 : patient.allergies.split(",").length}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="p-3 mb-3">
                        <Shield className="w-6 h-6" />
                      </div>
                      <p className="text-3xl font-bold">{userData.is_active ? "Actif" : "Inactif"}</p>
                      <p className="text-sm font-medium text-muted-foreground">Statut du dossier</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="medical" className="space-y-6">
                <Card className="border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full">
                        <Heart className="w-6 h-6 text-red-600" />
                      </div>
                      Historique Médical
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditing ? (
                      <Textarea
                        value={editData.medical_history || ""}
                        onChange={(e) => handleChange("medical_history", e.target.value)}
                        className="min-h-[120px]"
                      />
                    ) : (
                      <div className="prose-sm prose max-w-none">
                        <p className="p-4 leading-relaxed whitespace-pre-line border-l-4 rounded-lg text-foreground bg-muted/20 border-primary">
                          {patient.medical_history}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      Allergies Connues
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isEditing ? (
                      <Input
                        value={editData.allergies || ""}
                        onChange={(e) => handleChange("allergies", e.target.value)}
                        placeholder="Saisir les allergies, séparées par des virgules"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {patient.allergies === "no allergies" ? (
                            <span className="text-gray-400">Aucune allergie</span>
                         
                        ) : (
                          patient.allergies.split(",").map((allergy, index) => (
                            <Badge
                              key={index}
                              variant="destructive"
                              className="px-4 py-2 text-sm font-medium shadow-sm"
                            >
                              <AlertTriangle className="w-3 h-3 mr-2" />
                              {allergy.trim()}
                            </Badge>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reservations" className="space-y-6">
                <Card className="border-0 bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Calendar className="w-6 h-6" />
                      Historique des Réservations
                    </CardTitle>
                    <CardDescription>Consultez l'historique de vos rendez-vous</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {patient.reservations.length > 0 ? (
                      <div className="space-y-4">
                        {patient.reservations.map((reservation) => (
                          <Card key={reservation.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">
                                  {formatDate(reservation.reservation_date)} à {reservation.reservation_time}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Raison: {reservation.reason || "N/A"}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  reservation.status === "confirmed"
                                    ? "confirmed"
                                    : reservation.status === "pending"
                                    ? "pending"
                                    : reservation.status === "cancelled"
                                    ? "cancel"
                                    : "outline"
                                }
                              >
                                {reservation.status}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center rounded-lg bg-muted/30">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-medium text-muted-foreground">Aucune réservation</h3>
                        <p className="text-sm text-muted-foreground">
                          Vos réservations apparaîtront ici une fois créées.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="border-0 shadow-sm bg-card/80 backdrop-blur-sm">
                  <CardHeader>
                  </CardHeader>
                  <CardContent className="p-6 text-center">
                    <FileUpload/>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;