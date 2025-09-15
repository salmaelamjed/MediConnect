"use client"
import { Brain, Bone, Baby, ArrowRight, Check } from "lucide-react"
import { Star, Quote } from "lucide-react";
import { Facebook, Instagram, Twitter, Users, Clock } from "lucide-react"
import  ContactSection from "./Contact-section";
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
// import { useState } from "react";
export default function HeroSection() {
  //  const [open, setOpen] = useState(false);

  // Toggle dialog open state
  // const toggleDialog = () => setOpen(!open);
const features = [
    "Symptom Checker",
    "Chronic Condition Monitoring", 
    "Health Risk Assessment"
  ];
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Patient depuis 2 ans",
      image: "https://i.pinimg.com/1200x/8e/54/a1/8e54a1d6cfdf0fa87e34aa842bd5907f.jpg",
      rating: 5,
      text: "L'équipe médicale est exceptionnelle. J'ai reçu des soins personnalisés et un suivi remarquable. Je recommande vivement leurs services."
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Patient depuis 3 ans",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Grâce à leur programme de suivi des maladies chroniques, ma santé s'est considérablement améliorée. Une approche vraiment professionnelle."
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Nouvelle patiente",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Le système de vérification des symptômes m'a aidé à comprendre mes problèmes de santé. L'équipe est à l'écoute et très compétente."
    }
  ];
 const doctors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "Cardiologist",
    description: "Specialized in heart disease prevention and treatment with over 15 years of experience.",
    image: "https://i.pinimg.com/1200x/6c/59/95/6c599523460f54ddeba81f3cd689ae04.jpg",
    experience: "15+ years",
    patients: "2000+",
    social: {
      facebook: "#",
      instagram: "#",
      twitter: "#",
    },
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Neurologist",
    description: "Expert in neurological disorders and brain health, committed to innovative treatments.",
    image: "https://i.pinimg.com/736x/82/bb/2a/82bb2af56b3312ddc19a9b42f88df93b.jpg",
    experience: "12+ years",
    patients: "1500+",
    social: {
      facebook: "#",
      instagram: "#",
      twitter: "#",
    },
  },
  {
    id: 3,
    name: "Dr. Emily Rodriguez",
    specialty: "Pediatrician",
    description: "Dedicated to children's health and wellness with a gentle, caring approach.",
    image: "https://i.pinimg.com/1200x/52/f8/4d/52f84d4410a27d10d74a75794ffb3ad7.jpg",
    experience: "10+ years",
    patients: "3000+",
    social: {
      facebook: "#",
      instagram: "#",
      twitter: "#",
    },
  },
]

  return (
    <div className="min-h-screen bg-white">
    
      {/* Hero Section */}
      <section className="relative bg-center bg-cover sm:py-12 md:py-16 lg:py:20 max-h-[600px] border-rounded-full"
  style={{
    backgroundImage: `url(https://i.pinimg.com/1200x/b5/1f/bd/b51fbd69a0123bae39b94cf7f12a4f2e.jpg)`,
    backgroundPosition: 'right',
  }}>
     {/* Overlay for better text readability */}
  <div className="absolute inset-0 opacity-50 bg-black/75"></div>

     

      {/* Main Content */}
      <div className="container relative z-10 flex flex-col items-center justify-center max-h-[500px] px-4 py-20 mx-auto text-center ">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-white md:text-6xl lg:text-7xl text-balance">
              Inspiring healthier{" "}
              <span className="inline-block px-4 py-2 ">
                Tomorrows, Today!
              </span>
            </h1>
          </div>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="flex flex-col gap-3 p-2 border bg-white/10 sm:flex-row backdrop-blur-sm rounded-xl border-white/20">
              <div className="relative flex-1">
                <Search className="absolute w-5 h-5 transform -translate-y-1/2 left-4 top-1/2 text-white/70" />
                <Input
                  type="text"
                  placeholder="Search for medical clinic , doctors , services ..."
                  className="h-12 pl-12 text-3xl font-medium text-white bg-white/20 border-white/30 placeholder:text-white/70"
                />
              </div>
              <Button
                size="lg"
                className="h-12 px-8 font-semibold text-white text-md bg-secondary hover:bg-secondary/90"
              >
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
      {/* Services Section */}
      <section className="py-8 bg-white sm:py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8 xl:px-12">
          {/* Section Header */}
          <div className="mb-8 text-center sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
              Comprehensive Medical
              <br className="hidden sm:block" />
              Services For You
            </h2>
          </div>

          {/* Services Layout */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:gap-6 md:gap-8 sm:mb-8 lg:grid-cols-3">
            {/* Main Neurology Card */}
            <div className="lg:col-span-2">
              <div className="h-full p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex flex-col items-center space-y-4 sm:space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6 xl:space-x-8">
                  <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 bg-green-500 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-2xl sm:rounded-3xl">
                    <Brain className="w-8 h-8 text-white sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16" />
                  </div>
                  <div className="space-y-2 text-center sm:space-y-3 md:space-y-4 lg:text-left">
                    <h3 className="text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl lg:text-4xl">Neurology</h3>
                    <p className="text-sm leading-relaxed text-gray-600 sm:text-base md:text-lg">
                      A specialized medical field that focuses on the study and treatment of disorders related to the
                      nervous system.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Orthopedic and Pediatric */}
            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              {/* Orthopedic Service */}
              <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg sm:w-12 sm:h-12 sm:rounded-xl">
                    <Bone className="w-5 h-5 text-white sm:w-6 sm:h-6" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Orthopedic</h3>
                    <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                      Focuses on the diagnosis, treatment, and prevention of disorders affecting the musculoskeletal
                      system.
                    </p>
                  </div>
                </div>
              </div>

              {/* Pediatric Service */}
              <div className="p-4 sm:p-5 md:p-6 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl sm:rounded-2xl">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-lg sm:w-12 sm:h-12 sm:rounded-xl bg-cyan-500">
                    <Baby className="w-5 h-5 text-white sm:w-6 sm:h-6" />
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <h3 className="text-lg font-bold text-gray-900 sm:text-xl">Pediatric</h3>
                    <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
                      Dedicated to the health, development, and well-being of infants, children, and adolescents.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Explore All Services Button */}
          <div className="text-center">
            <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-blue-500 transition-all border border-blue-500 rounded-full group hover:bg-primary hover:text-white">
              Explore All Services
              <ArrowRight className="w-4 h-4 ml-2 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Our Features */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8 xl:px-12">
          <div className="grid items-center grid-cols-1 gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 xl:gap-16">
            {/* Content Left */}
            <div className="order-2 space-y-4 lg:order-1 sm:space-y-6">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-foreground text-balance">
                We've Been Looking After You For Over 5+ Years
              </h1>
              
              {/* Features List */}
              <div className="space-y-3 sm:space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 bg-green-500 rounded-full sm:w-6 sm:h-6">
                      <Check className="w-3 h-3 text-white sm:w-4 sm:h-4" strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-medium text-gray-800 sm:text-base lg:text-lg">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
              
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white transition-all bg-blue-500 rounded-full group hover:bg-primary hover:text-white">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
              </button>
            </div>

            {/* Image Right */}
            <div className="flex justify-center order-1 lg:order-2">
              <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg">
                <img
                  src="https://i.pinimg.com/1200x/f4/26/f9/f426f963c7399cfac3f9936ed3fdf7de.jpg"
                  alt="Illustration moderne représentant notre solution"
                  className="object-cover w-full h-48 rounded-lg shadow-lg sm:h-64 md:h-80 lg:h-96"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mental Health Service */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8 xl:px-12">
          <div className="grid items-center grid-cols-1 gap-8 sm:gap-10 md:gap-12 lg:grid-cols-2 xl:gap-16">
            {/* Image Left */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg">
                <img
                  src="https://i.pinimg.com/1200x/35/f3/13/35f313ae216ae12b1e98fce89d8c4ae0.jpg"
                  alt="Illustration moderne représentant notre solution"
                  className="object-cover w-full h-48 rounded-lg shadow-lg sm:h-64 md:h-80 lg:h-96"
                />
              </div>
            </div>

            {/* Content Right */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-foreground text-balance">
                Mental Health And Counseling
              </h1>
              <p className="text-sm leading-relaxed sm:text-base">
                Your emotional well-being is crucial to your overall health. 
                Our mental health specialists offer counseling and support.
              </p>
              <button className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white transition-all bg-blue-500 rounded-full group hover:bg-primary hover:text-white">
                Learn More
                <ArrowRight className="w-4 h-4 ml-2 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Patient Testimonials */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-gray-50">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8 xl:px-12">
          {/* Header */}
          <div className="mb-8 text-center sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="mb-2 text-2xl font-bold sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl text-foreground">
              What Our Patients Have To Say
            </h2>
            <p className="max-w-2xl px-4 mx-auto text-sm sm:text-base lg:text-lg text-muted-foreground">
              Découvrez les témoignages de nos patients qui ont fait confiance à nos services de santé
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-4 transition-shadow bg-white shadow-lg sm:p-6 rounded-xl hover:shadow-xl">
                {/* Quote Icon */}
                <div className="flex justify-center mb-3 sm:mb-4">
                  <Quote className="w-6 h-6 text-blue-500 sm:w-8 sm:h-8" />
                </div>
                
                {/* Rating */}
                <div className="flex justify-center mb-3 sm:mb-4">
                  {[...Array(testimonial.rating)].map((_, index) => (
                    <Star key={index} className="w-4 h-4 text-yellow-400 fill-current sm:w-5 sm:h-5" />
                  ))}
                </div>
                
                {/* Testimonial Text */}
                <p className="mb-4 text-xs leading-relaxed text-center text-gray-700 sm:mb-6 sm:text-sm">
                  "{testimonial.text}"
                </p>
                
                {/* Patient Info */}
                <div className="flex flex-col items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="object-cover w-12 h-12 mb-2 rounded-full sm:w-16 sm:h-16 sm:mb-3"
                  />
                  <h4 className="text-sm font-semibold text-gray-900 sm:text-base">{testimonial.name}</h4>
                  <p className="text-xs text-gray-500 sm:text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Professional Doctors */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 bg-background">
        <div className="container px-4 mx-auto sm:px-6 lg:px-8 xl:px-12">
          {/* Enhanced Header */}
          <div className="mb-8 text-center sm:mb-10 md:mb-12 lg:mb-16">
            <h2 className="mb-2 text-2xl font-bold sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl text-foreground text-balance">
              Meet Our Professional Doctors
            </h2>
            <p className="max-w-2xl px-4 mx-auto text-sm sm:text-base lg:text-lg text-muted-foreground text-pretty">
              Our dedicated team of healthcare professionals is committed to providing exceptional medical care with
              compassion and expertise.
            </p>
          </div>

          {/* Enhanced Doctors Grid */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="relative overflow-hidden border shadow-sm group bg-card rounded-xl sm:rounded-2xl border-border"
              >
                {/* Doctor Image with Overlay */}
                <div className="relative overflow-hidden">
                  <img
                    src={doctor.image || "/placeholder.svg"}
                    alt={doctor.name}
                    className="object-contain w-full h-48 transition-transform duration-300 sm:h-64 md:h-72 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/20 to-transparent group-hover:opacity-100" />
                </div>

                {/* Doctor Info */}
                <div className="p-4 sm:p-6">
                  <div className="mb-3 sm:mb-4">
                    <h3 className="mb-1 text-lg font-bold sm:mb-2 sm:text-xl text-card-foreground">{doctor.name}</h3>
                    <p className="text-sm font-semibold sm:text-base text-primary">{doctor.specialty}</p>
                  </div>

                  <p className="mb-4 text-xs leading-relaxed sm:mb-6 sm:text-sm text-muted-foreground">{doctor.description}</p>

                  {/* Stats */}
                  <div className="flex flex-col items-start gap-2 mb-4 text-xs sm:flex-row sm:items-center sm:gap-4 sm:mb-6">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{doctor.experience}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{doctor.patients} patients</span>
                    </div>
                  </div>

                  {/* Social Links and Button */}
                  <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:gap-0">
                    <div className="flex gap-2 sm:gap-3">
                      <a
                        href={doctor.social.facebook}
                        className="flex items-center justify-center transition-colors rounded-full w-7 h-7 sm:w-8 sm:h-8 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Facebook className="w-3 h-3 sm:w-4 sm:h-4" />
                      </a>
                      <a
                        href={doctor.social.instagram}
                        className="flex items-center justify-center transition-colors rounded-full w-7 h-7 sm:w-8 sm:h-8 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Instagram className="w-3 h-3 sm:w-4 sm:h-4" />
                      </a>
                      <a
                        href={doctor.social.twitter}
                        className="flex items-center justify-center transition-colors rounded-full w-7 h-7 sm:w-8 sm:h-8 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Twitter className="w-3 h-3 sm:w-4 sm:h-4" />
                      </a>
                    </div>

                    <button className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-colors rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Book Appointment
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/*Get in Touch section*/}
      <ContactSection/>
    </div>
  )
}