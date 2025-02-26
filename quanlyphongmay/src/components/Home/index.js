import { Link } from "react-router-dom";
import './home.css';  // Import file CSS ở đây

export default function Home() {
  return (
      <div className="container">
        {/* Hero Section */}
        <main className="hero-section">
          <img
              src="https://i.pinimg.com/736x/1c/fb/ec/1cfbec7b6e28bc517fa5c9c3e66cf22e.jpg"
              alt="Computer Lab Background"
              className="hero-image"
          />
          <div className="content">
            <h1 className="title">
              Hệ thống quản lý thiết bị phòng máy
            </h1>
            <p className="subtitle">Giúp quản lý phòng máy và hỗ trợ giảng dạy hiệu quả</p>
            <Link to="/register" className="start-btn">
              Start Now!
            </Link>
          </div>
        </main>
      </div>
  );
}
