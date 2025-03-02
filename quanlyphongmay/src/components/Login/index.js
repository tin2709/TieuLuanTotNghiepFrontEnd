import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";

export default function Login() {
  const [ckbRemeber, setCkbRemeber] = useState(true);
  const navigate = useNavigate(); // Hook for navigation

  // Checkbox handler for remember me
  const handleChangeCheckbox = (e) => {
    setCkbRemeber(e.target.checked);
  };
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission for login
  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    const { username,password } = formData;



    // Validate inputs
    if (!username || !password) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Vui lòng điền đầy đủ thông tin!",
      });
    } else {
      try {
        const student = {
          username: username,
          password: password,

        };
        // Prepare the data to be sent to the backend
        const formData = new FormData();
        formData.append("username", student.username);
        formData.append("password", student.password);

        // Send login request using fetch
        const response = await fetch("https://localhost:8080/login", {
          method: "POST",
          body: formData, // Send FormData directly
        });

        if (response.ok) {
          const data = await response.json();
          const token = data.token;

          // Save the token (in localStorage or state)
          localStorage.setItem("authToken", token); // You could use a global state for this as well

          // Success alert
          Swal.fire({
            icon: "success",
            title: "Đăng nhập thành công!",
            text: "Bạn đã đăng nhập thành công!",
          }).then(() => {
            // Redirect to home page or dashboard
            navigate("/homepage");
          });
        } else if (response.status === 401) {
          // Unauthorized error (wrong username or password)
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: "Mật khẩu hoặc tài khoản không đúng!",
          });
        } else if (response.status === 404) {
          // Account not found error
          Swal.fire({
            icon: "error",
            title: "Đăng nhập thất bại",
            text: "Tài khoản không tồn tại!",
          });
        } else {
          // General error
          Swal.fire({
            icon: "error",
            title: "Có lỗi xảy ra",
            text: "Vui lòng thử lại sau!",
          });
        }
      } catch (error) {
        // Handle any errors that occur during the fetch
        Swal.fire({
          icon: "error",
          title: "Có lỗi xảy ra",
          text: error.message || "Vui lòng thử lại sau!",
        });
        console.error(error);
      }
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
                <h3 className="text-center fw-bold mb-5 text-black">Đăng nhập</h3>

                {/* Login Form */}
                <form onSubmit={handleSubmitLogin}>
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

                  {/* Submit Button */}
                  <div className="mb-4">
                    <button type="submit" className="btn btn-primary w-100">
                      Đăng nhập
                    </button>
                  </div>
                </form>
                <br />

                {/* Link to Register page */}
                <Link to="/register" className="text-primary">
                  Register here
                </Link>
                <br />
                <br />

                <Link to="/forgotpass" className="text-primary">
                  Quên mật khẩu
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
  );
}
