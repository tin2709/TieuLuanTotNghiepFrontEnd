import { useState } from "react";
import Swal from "sweetalert2";
import {Link, useNavigate} from "react-router-dom";
import "./style.css";

export default function UpdatePassword() {
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const navigate = useNavigate(); // Hook for navigation

    // Handle form submission for updating password
    const handleSubmitUpdatePassword = async (e) => {
        e.preventDefault();

        if (!email || !newPassword) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Vui lòng nhập email và mật khẩu mới!",
            });
        } else {
            try {
                // Prepare form data
                const formData = new FormData();
                formData.append("email", email);
                formData.append("password", newPassword);

                // Send request using fetch
                const response = await fetch("https://localhost:8080/update_password", {
                    method: "POST",
                    body: formData, // Send FormData directly
                });

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Cập nhật mật khẩu thành công!",
                        text: "Mật khẩu của bạn đã được thay đổi. Bạn sẽ được chuyển hướng đến trang đăng nhập.",
                    }).then(() => {
                        // Redirect to login page
                        navigate("/login");
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Lỗi",
                        text: "Có lỗi xảy ra. Vui lòng thử lại sau.",
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối với máy chủ. Vui lòng thử lại sau.",
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
                            <h3 className="text-center fw-bold mb-5 text-black">Cập nhật mật khẩu</h3>
                            <form onSubmit={handleSubmitUpdatePassword}>
                                {/* Email Input */}
                                <div className="form-group mb-4">
                                    <label htmlFor="email" className="form-label">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="form-control"
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* New Password Input */}
                                <div className="form-group mb-4">
                                    <label htmlFor="newPassword" className="form-label">Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        className="form-control"
                                        placeholder="Nhập mật khẩu mới"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="mb-4">
                                    <button type="submit" className="btn btn-primary w-100">
                                        Cập nhật mật khẩu
                                    </button>
                                </div>
                            </form>

                            <p className="text-center mb-0">
                                Quay lại{" "}
                                <Link to="/login" className="text-primary">
                                    Đăng nhập
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
