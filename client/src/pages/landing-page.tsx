import HeroSection from "./HeroSection"
import ContactSection from "./Contact-section";
import ServicesLayout from "./services-layout";
import OurFeatures from "./our-features";
import MentalHealthService from "./mental-health-service";
import ProffessionalDoctord from "./pro-doctors-layout";
import PatientsReviews from "./patients-reviews";
const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <HeroSection/>
       {/* Services Section */}
        <ServicesLayout/>
      {/* Our Features */}
      <OurFeatures/>

      {/* Mental Health Service */}
      <MentalHealthService/>
      

      {/* Patient Testimonials */}
        <PatientsReviews/>

      {/* Our Professional Doctors */}
        <ProffessionalDoctord/>
      {/*Get in Touch section*/}
      <ContactSection/>
    </div>
  )
}

export default LandingPage
