import { useState } from "react";
import Swal from "sweetalert2";
import {Link, useNavigate} from "react-router-dom";
import "./style.css";

export default function VerifyOtp() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const navigate = useNavigate(); // Hook for navigation

    // Handle form submission for verifying OTP
    const handleSubmitVerifyOtp = async (e) => {
        e.preventDefault();

        if (!email || !otp) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Vui lòng nhập email và mã OTP!",
            });
        } else {
            try {
                // Prepare form data
                const formData = new FormData();
                formData.append("email", email);
                formData.append("otp", otp);

                // Send request using fetch
                const response = await fetch("https://localhost:8080/verify_otp_forgot_password", {
                    method: "POST",
                    body: formData, // Send FormData directly
                });

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "OTP hợp lệ!",
                        text: "Mã OTP hợp lệ. Bạn có thể thay đổi mật khẩu.",
                    }).then(() => {
                        // Redirect to login page
                        navigate("/updatepass");
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Lỗi",
                        text: "Mã OTP không hợp lệ hoặc hết hạn. Vui lòng thử lại.",
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
                            <h3 className="text-center fw-bold mb-5 text-black">Xác nhận OTP</h3>
                            <form onSubmit={handleSubmitVerifyOtp}>
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

                                {/* OTP Input */}
                                <div className="form-group mb-4">
                                    <label htmlFor="otp" className="form-label">Mã OTP</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        className="form-control"
                                        placeholder="Nhập mã OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="mb-4">
                                    <button type="submit" className="btn btn-primary w-100">
                                        Xác nhận OTP
                                    </button>
                                </div>
                            </form>

                            <p className="text-center mb-0">
                                Quay lại{" "}
                                <Link to="/forgotpassword" className="text-primary">
                                    Quên mật khẩu
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
