import PdfUploadForm from "@/app/components/PdfUploadForm";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start pt-12 sm:pt-20 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header Section */}
      <div className="w-full max-w-2xl text-center mb-12 relative z-10">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white">
          <span className="block">
            Klesch Contract Analyser
          </span>
        </h1>
        
        <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
          Select a PDF document you would like to analyse, and click &quot;Generate Summary&quot;. 
          <br />
          Please note this is an initial test version. Currently, the platform is limited to files no larger than 4MB.
          <br />
          For any issues and to report any errors please contact Aleks from the M&A team.
        </p>
      </div>

      {/* Main Form */}
      <div className="relative z-10 w-full flex justify-center">
        <PdfUploadForm />
      </div>
    </main>
  );
}
