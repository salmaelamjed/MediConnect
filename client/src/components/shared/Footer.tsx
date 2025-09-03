import {Link} from "react-router-dom"
import { Phone, Mail, Clock, Shield } from "lucide-react"
import logo from '@/assets/logo.svg'

export default function MedicalBookingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 ">
      {/* Main Footer Content */}
      <div className="container px-6 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
                {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
         <img src={logo} alt="MediConnect" className="h-26 w-44"/>
        </Link>
            </div>
            <p className="text-sm leading-relaxed text-gray-600">
              Plateforme de réservation de rendez-vous médicaux en ligne. Trouvez et réservez facilement vos
              consultations.
            </p>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" style={{ color: "#06B6D4" }} />
              <span className="text-sm text-gray-600">Données sécurisées et conformes RGPD</span>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Services</h4>
            <nav className="space-y-2">
              <Link to="/specialites" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Toutes les spécialités
              </Link>
              <Link to="/medecins" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Trouver un médecin
              </Link>
              <Link
                to="/teleconsultation"
                className="block text-sm text-gray-600 transition-colors hover:text-blue-600"
              >
                Téléconsultation
              </Link>
              <Link to="/urgences" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Consultations d'urgence
              </Link>
              <Link to="/rappels" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Rappels de RDV
              </Link>
            </nav>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Support</h4>
            <nav className="space-y-2">
              <Link to="/aide" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Centre d'aide
              </Link>
              <Link to="/faq" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Questions fréquentes
              </Link>
              <Link to="/contact" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Nous contacter
              </Link>
              <Link
                to="/professionnels"
                className="block text-sm text-gray-600 transition-colors hover:text-blue-600"
              >
                Espace professionnel
              </Link>
              <Link to="/partenaires" className="block text-sm text-gray-600 transition-colors hover:text-blue-600">
                Devenir partenaire
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4" style={{ color: "#06B6D4" }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">01 23 45 67 89</p>
                  <p className="text-xs text-gray-500">Support patient</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4" style={{ color: "#06B6D4" }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">contact@MediConnect.ma</p>
                  <p className="text-xs text-gray-500">Réponse sous 24h</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4" style={{ color: "#06B6D4" }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">7j/7 - 24h/24</p>
                  <p className="text-xs text-gray-500">Service disponible</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t" style={{ borderColor: "#E5E7EB" }}>
        <div className="container px-6 py-6 mx-auto">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            {/* Legal Links */}
            <div className="flex flex-wrap items-center space-x-6 text-sm text-gray-600">
              <Link to="/mentions-legales" className="transition-colors hover:text-blue-600">
                Mentions légales
              </Link>
              <Link to="/confidentialite" className="transition-colors hover:text-blue-600">
                Politique de confidentialité
              </Link>
              <Link to="/cgu" className="transition-colors hover:text-blue-600">
                CGU
              </Link>
              <Link to="/cookies" className="transition-colors hover:text-blue-600">
                Gestion des cookies
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-sm text-gray-500">© 2024 MediConnect. Tous droits réservés.</div>
          </div>

          {/* Trust Indicators */}
          <div className="pt-6 mt-6 border-t border-gray-100">
            <div className="flex flex-wrap items-center justify-center space-x-8 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#06B6D4" }}></div>
                <span>Certifié HDS</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#06B6D4" }}></div>
                <span>Conforme RGPD</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#06B6D4" }}></div>
                <span>SSL Sécurisé</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#06B6D4" }}></div>
                <span>+50,000 patients</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
