import { Facebook, Instagram, Twitter, Users, Clock } from "lucide-react"

const ProffessionalDoctord = () => {

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
  ];
  return (
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
  )
}

export default ProffessionalDoctord
