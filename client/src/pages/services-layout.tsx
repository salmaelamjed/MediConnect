import { Link } from "react-router-dom";
import {Brain, Bone, Baby,ArrowRight} from 'lucide-react'
const ServicesLayout = () => {
  return (
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
            <Link to={'/services'} className="w-full sm:w-auto inline-flex items-center justify-center px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-blue-500 transition-all border border-blue-500 rounded-full group hover:bg-primary hover:text-white">
              Explore All Services
              <ArrowRight className="w-4 h-4 ml-2 transition-transform sm:w-5 sm:h-5 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
  )
}

export default ServicesLayout
