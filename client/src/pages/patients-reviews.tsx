import { Star, Quote } from "lucide-react";

const PatientsReviews = () => {

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
  
  return (
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
  )
}

export default PatientsReviews
