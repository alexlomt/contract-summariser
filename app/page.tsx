"use client";
import PdfUploadForm from "@/app/components/PdfUploadForm";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start pt-12 sm:pt-20 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/20 via-purple-400/15 to-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/15 via-pink-400/20 to-purple-400/15 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-float-delayed"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-r from-pink-400/10 via-cyan-400/15 to-pink-400/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-float-slow"></div>
      </div>

      {/* Header Section */}
      <div className="w-full max-w-2xl text-center mb-12 relative z-10">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 relative">
          <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            Klesch Contract Analyser
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent blur-sm opacity-30 -z-10">
            Klesch Contract Analyser
          </div>
        </h1>
        
        <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed mb-6">
          Select a PDF document you would like to analyse, and click &quot;Generate Summary&quot;. 
        </p>
        
        <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 text-amber-200 text-base leading-relaxed">
          Please note this is an initial test version. Currently, the platform is limited to files no larger than 4MB.
          <br />
          For any issues and to report any errors please contact Aleks from the M&A team.
        </div>
      </div>

      {/* Main Form */}
      <div className="relative z-10 w-full flex justify-center">
        <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent rounded-2xl"></div>
          <div className="relative z-10">
            <PdfUploadForm />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          33% { 
            transform: translateY(-20px) rotate(2deg) scale(1.02);
          }
          66% { 
            transform: translateY(-10px) rotate(-1deg) scale(0.98);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          50% { 
            transform: translateY(-15px) rotate(-2deg) scale(1.01);
          }
        }
        
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          50% { 
            transform: translateY(-8px) rotate(1deg) scale(0.99);
          }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}