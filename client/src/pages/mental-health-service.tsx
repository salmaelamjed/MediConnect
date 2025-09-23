import { ArrowRight } from "lucide-react"

const MentalHealthService = () => {
  return (
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
  )
}

export default MentalHealthService
