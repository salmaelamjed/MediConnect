import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, MapPin, Calendar } from "lucide-react"

const ContactSection=()=> {
  return (
    <section className="py-8 bg-muted/30">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Side - Image */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/attachments/gen-images/public/medical-consultation-image-euXe1lvJY89hq22vFnGk3xO81kz58i.png"
                alt="Medical consultation"
                className="object-cover w-full h-full min-h-[500px]"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            </div>

            {/* Floating Contact Info */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="p-6 shadow-lg bg-white/95 backdrop-blur-sm rounded-xl">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Get in Touch</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>+212 718935460</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>contact@mediconnect.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>123 Medical Center Dr, City, State 12345</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex flex-col justify-center">
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm rounded-full font-sm bg-primary/10 text-primary">
                <Calendar className="w-2 h-2" />
                Book Appointment
              </div>
              <h2 className="mb-4 text-2xl font-medium lg:text-3xl text-foreground text-balance">Book an Appointment</h2>
            </div>

            <form className="space-y-6">
              {/* Full Name */}
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
                <div className="grid flex-1 gap-2">
                    <Label htmlFor="name"> Full Name *</Label>
                    <Input
                    id="name"
                    type="name"
                    placeholder="Full name "
                    required
                    />
                </div>
                
                <div className="grid flex-1 gap-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email "
                    required
                    />
                </div>
                </div>
              {/* Preferred Date */}
              <div>
                <label htmlFor="preferredDate" className="block mb-2 text-sm font-medium text-foreground">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  required
                  className="w-full px-4 py-3 transition-colors border rounded-lg border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block mb-2 text-sm font-medium text-foreground">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  className="w-full px-4 py-3 transition-colors border rounded-lg resize-none border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Tell us about your symptoms or reason for visit..."
                />
              </div>

              {/* Submit Button */}
          <button 
          type="submit"
          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium transition-colors rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
        Data Submit    
        </button>
              <p className="text-xs text-muted-foreground">
                * Required fields. We'll contact you within 24 hours to confirm your appointment.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
export default ContactSection;