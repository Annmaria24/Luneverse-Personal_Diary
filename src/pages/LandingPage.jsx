import React from "react";
import { Link } from "react-router-dom";
import "./Styles/LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
<header className="landing-header">
  <div className="hero-header-content">
    <div className="hero-left">
      <h1>Welcome to My Luneverse</h1>
      <p>Your space to reflect, track, and grow</p>
    </div>
    <Link to="/login" className="login-btn">Login</Link>
  </div>
</header>


      {/* Feature Cards */}
      <main className="card-container">
        <div className="feature-card">
          <img src="/images/journal.jpg" alt="Journal" />
          <h3>Private Diary</h3>
          <p>Write your thoughts, every day — securely and freely.</p>
        </div>
        <div className="feature-card">
          <img src="/images/mood.webp" alt="Mood Tracker" />
          <h3>Mood Tracker</h3>
          <p>Keep track of how you feel. Understand your patterns better.</p>
        </div>
        <div className="feature-card">
          <img src="/images/cycle.png" alt="Cycle Tracker" />
          <h3>Cycle Tracker</h3>
          <p>Monitor your cycle, health, and well-being in one place.</p>
        </div>
      </main>

      
      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2>What Our Users Say</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Luneverse has completely changed how I understand my emotional patterns. The mood tracking feature is incredibly insightful!"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">S</div>
              <div className="author-info">
                <span className="author-name">Sarah M.</span>
                <span className="author-role">College Student</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"Finally, a private space where I can track everything that matters to me. The design is beautiful and so easy to use."</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">A</div>
              <div className="author-info">
                <span className="author-name">Aisha K.</span>
                <span className="author-role">Working Professional</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="testimonial-content">
              <p>"The cycle tracking combined with mood insights has helped me understand my body so much better. Highly recommend!"</p>
            </div>
            <div className="testimonial-author">
              <div className="author-avatar">M</div>
              <div className="author-info">
                <span className="author-name">Maya R.</span>
                <span className="author-role">Graduate Student</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <h2>Ready to start your journey?</h2>
        <p className="cta-subtitle">Join thousands of women who trust Luneverse with their wellness journey</p>
        <Link to="/signup">
          <button className="btn-primary large-btn">Create Your Free Account</button>
        </Link>
      </section>

      {/* <section className="overview-section">
  <h2>What You Can Do</h2>
  <div className="overview-grid">
    <div className="overview-card">
      <div className="emoji-icon">📝</div>
      <h3>Personal Diary</h3>
      <p>Capture your feelings, thoughts, and everyday memories.</p>
    </div>
    <div className="overview-card">
      <div className="emoji-icon">📊</div>
      <h3>Mood Tracker</h3>
      <p>Visualize emotional patterns and better understand yourself.</p>
    </div>
    <div className="overview-card">
      <div className="emoji-icon">🌸</div>
      <h3>Cycle Tracker</h3>
      <p>Stay informed and empowered about your menstrual health.</p>
    </div>
  </div>
</section> */}

      {/* About Section */}
      <section className="about-section">
  <div className="about-content">
    <h2>About Luneverse</h2>
    <p>
      Luneverse is your personal digital sanctuary. It combines journaling,
      mood tracking, and menstrual cycle insights — all in one private, secure
      space. Built for young women and students, the app helps you understand
      yourself better, emotionally and physically.
    </p>
    <p>
      With a minimalist design and intuitive tools, our mission is to empower
      self-awareness and promote mental and reproductive wellness.
    </p>
  </div>
</section>
<section className="why-choose-section">
  <h2>Why Choose Luneverse?</h2>
  <div className="benefits">
    <div className="benefit-card">🌙 100% Private and Secure</div>
    <div className="benefit-card">📈 Personal Insights Over Time</div>
    <div className="benefit-card">🧘 Simple, Elegant Design</div>
  </div>
</section>

<section className="footer-info-section">
  <div className="footer-info">
    <div className="contact-box">
      <h3>Contact Us</h3>
      <p><strong>Email:</strong> support@luneverseapp.com</p>
      <p><strong>Phone:</strong> +91 98765 43210</p>
      <p><strong>Location:</strong> Kochi, Kerala, India</p>
    </div>

    <div className="references-box">
      <h3>Credits</h3>
      <p><a href="https://www.flaticon.com/" target="_blank" rel="noreferrer">Flaticon</a> – icons</p>
      <p><a href="https://unsplash.com/" target="_blank" rel="noreferrer">Unsplash</a> – images</p>
      <p>React + Firebase</p>
    </div>
  </div>
</section>

      {/* Footer */}
      <footer className="footer">
        <p>Made with 💜 by Ann | My Wellness App © 2025</p>
      </footer>
    </div>
  );
}

export default LandingPage;
