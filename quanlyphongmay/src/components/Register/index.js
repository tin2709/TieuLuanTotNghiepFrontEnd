import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ava from "../../img/addAvatar.png";
import { useDispatch } from "react-redux";
import { saveUserAccount } from "../../redux/reducers/userReducer"; // Import Redux action
import Swal from "sweetalert2"; // Import SweetAlert
import "./style.css";



export default function Register() {
  const [ckbRemeber, setCkbRemeber] = useState(true);
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate(); // Hook for navigation

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
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if all required fields are filled
    const { username, email, password } = formData;

    if (!username || !email || !password) {
      Swal.fire({
        icon: "error",
        title: "Đăng ký thất bại",
        text: "Vui lòng điền đầy đủ thông tin!",
      });
    } else {
      try {
        // Prepare user data (added maQuyen as 1 by default)
        const student = {
          tenDangNhap: username,
          matKhau: password,
          maQuyen: 1, // Default role
          email: email,
        };

        // Create a FormData object for the avatar image and other data
        const formDataToSend = new FormData();
        formDataToSend.append("tenDangNhap", student.tenDangNhap);
        formDataToSend.append("matKhau", student.matKhau);
        formDataToSend.append("maQuyen", student.maQuyen);
        formDataToSend.append("email", student.email);

        // If avatar file is uploaded, add it to the formData
        if (avatar.file) {
          formDataToSend.append("imageFile", avatar.file);
        }
        for (let pair of formDataToSend.entries()) {
          console.log(pair[0] + ": " + pair[1]);
        }

        // Send request using fetch
        const response = await fetch("https://localhost:8080/luutaikhoan", {
          method: "POST",

          body: formDataToSend, // Send FormData directly
        });

        if (response.ok) {
          // Success alert
          Swal.fire({
            icon: "success",
            title: "Đăng ký thành công!",
            text: "Tài khoản đã được lưu. Bạn sẽ được chuyển hướng đến trang đăng nhập.",
          }).then(() => {
            // Redirect to login page
            navigate("/login");
          });
        } else {
          // Error alert in case of failure
          Swal.fire({
            icon: "error",
            title: "Đăng ký thất bại",
            text: "Có lỗi xảy ra. Vui lòng thử lại sau!",
          });
        }
      } catch (error) {
        // Error alert in case of failure
        Swal.fire({
          icon: "error",
          title: "Đăng ký thất bại",
          text: error.response ? error.response.data : "Có lỗi xảy ra. Vui lòng thử lại sau!",
        });
        console.error(error);
      }
    }
  };

  return (
      <div className="container">
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

                  {/* Password */}

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
