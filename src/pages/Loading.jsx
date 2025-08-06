import React from "react";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="text-center animate-fade-in-scale">
        {/* Glowing moon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-tr from-white to-purple-200 rounded-full shadow-2xl animate-pulse-slow mx-auto"></div>

          {/* Aura ring */}
          <div className="absolute inset-0 w-24 h-24 border-2 border-purple-300 rounded-full animate-aura mx-auto opacity-30"></div>
        </div>

        {/* Brand name */}
        <h2 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 drop-shadow-md">
          Luneverse
        </h2>

        {/* Loading message */}
        <p className="text-purple-700 font-medium animate-pulse text-lg">
          Gathering your thoughts...
        </p>

        {/* Floating sparkles */}
        <div className="flex justify-center space-x-2 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: "1.2s"
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loader;
