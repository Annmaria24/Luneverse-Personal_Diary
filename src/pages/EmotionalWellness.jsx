import { useState } from "react";
import DiaryPage from "./DiaryPage";
import MoodTrackerPage from "./MoodTrackerPage";
import "./Styles/Dashboard.css";

function EmotionalWellness() {
  const [activeTab, setActiveTab] = useState("diary");

  return (
    <div className="dashboard">
      <div className="dashboard-background">
        <div className="floating-element element-1">🌙</div>
        <div className="floating-element element-2">✨</div>
        <div className="floating-element element-3">🌸</div>
        <div className="floating-element element-4">💜</div>
        <div className="floating-element element-5">🦋</div>
        <div className="floating-element element-6">🌺</div>
      </div>
      <main className="dashboard-main">
        <section className="features-section">
          <div className="features-grid">
            <div
              className={`feature-card diary-card ${activeTab === "diary" ? "active" : ""}`}
              onClick={() => setActiveTab("diary")}
            >
              <div className="feature-header">
                <div className="feature-icon">📝</div>
                <h3>Digital Diary</h3>
              </div>
              <p>Capture your thoughts, feelings, and daily reflections in your private digital space.</p>
            </div>

            <div
              className={`feature-card mood-card ${activeTab === "mood" ? "active" : ""}`}
              onClick={() => setActiveTab("mood")}
            >
              <div className="feature-header">
                <div className="feature-icon">📊</div>
                <h3>Mood Tracker</h3>
              </div>
              <p>Monitor your emotional patterns and discover insights about your mental wellness.</p>
            </div>
          </div>
        </section>

        <section>
          {activeTab === "diary" && <DiaryPage />}
          {activeTab === "mood" && <MoodTrackerPage />}
        </section>
      </main>
    </div>
  );
}

export default EmotionalWellness;
