import  { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, ArrowLeft} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

 

  return (
    <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-400">
      {/* Éléments de fond animés */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Cercles flottants */}
        <div className="absolute w-64 h-64 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-xl animate-pulse top-1/4 left-1/4"></div>
        <div className="absolute transform translate-x-1/2 translate-y-1/2 rounded-full w-96 h-96 bg-white/5 blur-2xl animate-pulse top-3/4 right-1/4"></div>
        
        {/* Effet de parallaxe avec la souris */}
        <div 
          className="absolute w-32 h-32 transition-transform duration-300 ease-out rounded-full bg-white/20 blur-lg"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            top: '10%',
            left: '80%'
          }}
        ></div>
        <div 
          className="absolute w-20 h-20 transition-transform duration-500 ease-out rounded-full bg-cyan-300/30 blur-md"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            top: '60%',
            left: '10%'
          }}
        ></div>
      </div>

      {/* Contenu principal */}
      <Card className="relative z-10 w-full max-w-2xl shadow-2xl bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-8 space-y-8 text-center">
          {/* Numéro 404 animé */}
          <div className="relative">
            <h1 className="font-bold leading-none select-none text-9xl text-white/90">
              4
              <span className="inline-block mx-2 animate-bounce text-cyan-200">
                0
              </span>
              4
            </h1>
            <div className="absolute w-8 h-8 rounded-full -top-4 -right-4 bg-cyan-400 animate-ping"></div>
            <div className="absolute w-6 h-6 bg-blue-400 rounded-full -bottom-4 -left-4 animate-pulse"></div>
          </div>

          {/* Messages d'erreur */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-white">
              Oups ! Page non trouvée
            </h2>
            <p className="max-w-md mx-auto text-lg leading-relaxed text-white/80">
              Il semblerait que la page que vous cherchez ait décidé de prendre des vacances. 
              Ne vous inquiétez pas, nous allons vous aider à retrouver votre chemin !
            </p>
          </div>

          

          {/* Boutons d'action */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button 
              className="text-white transition-all duration-300 bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur-sm hover:scale-105 hover:shadow-lg group"
              variant="outline"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2 transition-transform group-hover:rotate-12" />
              <Link to={'/'}>Accueil</Link>
            </Button>
            
            <Button 
              className="text-white transition-all duration-300 bg-white/20 hover:bg-white/30 border-white/30 backdrop-blur-sm hover:scale-105 hover:shadow-lg group"
              variant="outline"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
              <Link to={'/'}>Retour</Link>
            </Button>
            
          </div>

        
        </CardContent>
      </Card>

      {/* Particules flottantes */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <style >{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        
        .absolute:nth-child(odd) {
          animation: float 4s ease-in-out infinite;
        }
        
        .absolute:nth-child(even) {
          animation: float 6s ease-in-out infinite reverse;
        }
      `}</style>
    </div>
  );
}