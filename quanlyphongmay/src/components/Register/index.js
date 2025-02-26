import { useState } from "react";
import { Link } from "react-router-dom";
import ava from "../../img/addAvatar.png";
import Swal from "sweetalert2";
import "./style.css";

export default function Home() {
  const [ckbRemeber, setCkbRemeber] = useState(true);
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });

  // Avatar upload handler
  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  // Checkbox handler for remember me
  const handleChangeCheckbox = (e) => {
    setCkbRemeber(e.target.checked);
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Form submit handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if all required fields are filled
    const { fullName, username, email, password } = formData;

    if (!fullName || !username || !email || !password) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Vui lòng điền đầy đủ thông tin!",
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công!",
        text: "Bạn đã đăng ký thành công!",
      });
      // Submit the form (you can add your form submission logic here)
    }
  };

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
            <div className="card custom-card">
              <div className="card-body p-4 p-md-5">
                <h3 className="text-center fw-bold mb-5 text-black">Đăng ký</h3>

                {/* Registration Form */}
                <form onSubmit={handleSubmit}>
                  {/* Full Name */}
                  <div className="form-group mb-4">
                    <label htmlFor="fullName" className="form-label">
                      Tên đầy đủ
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="form-control"
                        placeholder="Nhập tên đầy đủ"
                        value={formData.fullName}
                        onChange={handleInputChange}
                    />
                  </div>

                  {/* Username */}
                  <div className="form-group mb-4">
                    <label htmlFor="username" className="form-label">
                      Tài khoản
                    </label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        className="form-control"
                        placeholder="Nhập tài khoản"
                        value={formData.username}
                        onChange={handleInputChange}
                    />
                  </div>

                  {/* Email */}
                  <div className="form-group mb-4">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Nhập email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                  </div>

                  {/* Password */}
                  <div className="form-group mb-4">
                    <label htmlFor="password" className="form-label">
                      Mật khẩu
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        className="form-control"
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                  </div>

                  {/* Avatar Upload */}
                  <div className="form-group mb-4">
                    <input
                        type="file"
                        id="file"
                        style={{ display: "none" }}
                        onChange={handleAvatar}
                    />
                    <label htmlFor="file" className="upload-label">
                      <div className="img-cont">
                        <img
                            src={avatar.url || ava}
                            alt="Avatar"
                            className="user-img"
                        />
                      </div>
                      <span>Upload an image</span>
                    </label>
                  </div>



                  {/* Submit Button */}
                  <div className="mb-4">
                    <button className="btn btn-primary w-100">Đăng ký</button>
                  </div>
                </form>

                {/* Link to Login page */}
                <p className="text-center mb-0">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary">
                    Login here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
