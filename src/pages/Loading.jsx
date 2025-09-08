import React from "react";
import "./Styles/Loading.css";

const Loader = () => {
  return (
    <div className="loader-container">
      <div className="loader-content">
        {/* Glowing moon */}
        <div className="moon-container">
          <div className="moon"></div>
          {/* Aura ring */}
          <div className="aura-ring"></div>
        </div>

        {/* Brand name */}
        <h2 className="brand-name">
          Luneverse
        </h2>

        {/* Loading message */}
        <p className="loading-message">
          Gathering your thoughts...
        </p>

        {/* Floating sparkles */}
        <div className="sparkles-container">
          {[0, 1, 2].map((i) => (
            <div key={i} className="sparkle"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Loader;
