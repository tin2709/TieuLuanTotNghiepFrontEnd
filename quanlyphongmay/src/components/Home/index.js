import { Link } from "react-router-dom";
import './home.css'; // Import the CSS file

export default function Home() {
  return (
      // Apply the container class for background and layout
      <div className="container1">
        {/* Content container with animation class */}
        <div className="content">
          {/* Apply specific classes for styling */}
          <h1 className="title">
            Hệ thống quản lý thiết bị phòng máy
          </h1>
          <p className="subtitle">
            Giúp quản lý phòng máy và hỗ trợ giảng dạy hiệu quả
          </p>
          {/* Apply the button class */}
          <Link to="/register" className="start-btn">
            Bắt đầu ngay!
          </Link>
        </div>
      </div>
  );
}