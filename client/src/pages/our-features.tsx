import { ArrowRight, Check } from "lucide-react"

const OurFeatures = () => {
    
   const features = [
    "Symptom Checker",
    "Chronic Condition Monitoring",
    "Health Risk Assessment"
  ];
    
  return (
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
  )
}

export default OurFeatures
