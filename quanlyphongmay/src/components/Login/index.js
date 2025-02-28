import { useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import "./style.css";
import ava from "../../img/addAvatar.png";

export default function Home() {
  const [ckbRemeber, setCkbRemeber] = useState(true);
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });

  // Checkbox handler for remember me
  const handleChangeCheckbox = (e) => {
    setCkbRemeber(e.target.checked);
  };

  // Handle form submission for login
  const handleSubmitLogin = (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    // Validate inputs
    if (!username || !password) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Vui lòng điền đầy đủ thông tin!",
      });
    } else {
      // Handle login submission (this part can be your login logic)
      Swal.fire({
        icon: "success",
        title: "Đăng nhập thành công!",
        text: "Bạn đã đăng nhập thành công!",
      });
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
                        className="form-control"
                        placeholder="Nhập tài khoản"
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
                        className="form-control"
                        placeholder="Nhập mật khẩu"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="mb-4">
                    <button type="submit" className="btn btn-primary w-100">
                      Đăng nhập
                    </button>
                  </div>
                </form>
                <br/>

                {/* Link to Register page */}

                  <Link to="/register" className="text-primary">
                    Register here
                  </Link>
               <br/><br/>

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
