import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer,
    LineChart, Line,
} from 'recharts';
import { Card, Statistic, Row, Col, Spin, Layout, Menu, Button as AntButton, Popover } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import * as DarkReader from 'darkreader';
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { Header } from "antd/es/layout/layout";
import { useNavigate } from 'react-router-dom';

const { Content, Sider } = Layout;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    useEffect(() => {
        if (isDarkMode) {
            DarkReader.enable({
                brightness: 100,
                contrast: 90,
                sepia: 10,
            });
        } else {
            DarkReader.disable();
        }
    }, [isDarkMode]);

    return (
        <AntButton
            icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        />
    );
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [roomStats, setRoomStats] = useState([]);
    const [error, setError] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    // State và dữ liệu cho Time-Series Chart (Recharts)
    const [timeSeriesLoading, setTimeSeriesLoading] = useState(false);
    const [timeSeriesError, setTimeSeriesError] = useState(null);
    const [timeSeriesData, setTimeSeriesData] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');

        if (!token) {
            Swal.fire('Error', 'Bạn chưa đăng nhập', 'error').then(() => {
                navigate('/login');
            });
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/phong-may-thong-ke?token=${token}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setRoomStats(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            setRoomStats([]);
            Swal.fire('Error', 'Failed to fetch statistics: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Hàm fetch dữ liệu Time-Series từ API backend
    const fetchTimeSeriesData = async () => {
        setTimeSeriesLoading(true);
        setTimeSeriesError(null);
        const token = localStorage.getItem('authToken');
        try {
            const timeSeriesUrl = `https://localhost:8080/thong-ke-may-tinh-theo-thoi-gian?token=${token}`; // API endpoint mới
            const response = await fetch(timeSeriesUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            // Format lại dữ liệu để Recharts có thể sử dụng
            const formattedData = data.map(item => ({
                time: new Date(item.time), // Chuyển đổi time thành Date object
                'Đang hoạt động': item['Dang hoạt động'] || 0, // Sử dụng key từ API response, default to 0 if missing
                'Đã hỏng': item['Đã hỏng'] || 0, // Sử dụng key từ API response, default to 0 if missing
                'Không hoạt động': item['Không hoạt động'] || 0, // Sử dụng key từ API response, default to 0 if missing
            }));
            setTimeSeriesData(formattedData);

        } catch (err) {
            setTimeSeriesError(err.message);
            setTimeSeriesData([]);
            console.error("Failed to fetch time-series data:", err);
        } finally {
            setTimeSeriesLoading(false);
        }
    };


    useEffect(() => {
        fetchData();
        fetchTimeSeriesData(); // Gọi hàm fetch dữ liệu Time-Series khi component mount
    }, []);

    const handleMenuClick = (e) => {
        if (e.key === 'userManagement') {
            navigate('/quanlitaikhoan');
        } else if (e.key === 'logout') {
            handleLogout();
        } else if (e.key === 'teacherManagement') {
            navigate('/quanligiaovien');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        Swal.fire({
            icon: 'success',
            title: 'Logged Out',
            text: 'You have been successfully logged out.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => {
            navigate('/login');
        });
    };

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {(percent * 100).toFixed(0)}%
            </text>
        );
    };

    const barChartData = roomStats.map((room) => ({
        name: room.tenPhong,
        'Đang hoạt động': room.soMayDangHoatDong,
        'Đã hỏng': room.soMayDaHong,
    }));

    const totalWorking = roomStats.reduce((sum, room) => sum + room.soMayDangHoatDong, 0);
    const totalBroken = roomStats.reduce((sum, room) => sum + room.soMayDaHong, 0);
    const totalComputers = totalWorking + totalBroken;

    const workingPercentage = totalComputers > 0 ? ((totalWorking / totalComputers) * 100).toFixed(2) : 0;
    const brokenPercentage = totalComputers > 0 ? ((totalBroken / totalComputers) * 100).toFixed(2) : 0;
    const pieChartData = [
        { name: 'Đang hoạt động', value: totalWorking },
        { name: 'Đã hỏng', value: totalBroken },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
                <Menu theme="dark" defaultSelectedKeys={['dashboard']} mode="inline" onClick={handleMenuClick}>
                    <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                        Thống kê
                    </Menu.Item>
                    <Menu.Item key="userManagement" icon={<UserOutlined />}>
                        Quản lý tài khoản
                    </Menu.Item>
                    <Menu.Item key="teacherManagement" icon={<UserOutlined />}>
                        Quản lý giáo viên
                    </Menu.Item>
                    <Menu.Item key="logout" icon={<LogoutOutlined />}>
                        Đăng xuất
                    </Menu.Item>
                </Menu>
            </Sider>
            <Layout>
                <Header
                    className="lab-management-header"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        padding: '0 24px',
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                        <Popover content={<div>Quản lí tài khoản</div>} trigger="hover">
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Thống kê
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                                <Spin size="large" />
                            </div>
                        ) : error ? (
                            <div>Error: {error}</div>
                        ) : (
                            <>
                                <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Admin Dashboard</h1>
                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Card>
                                            <Statistic title="Tổng số máy hoạt động" value={totalWorking} />
                                            <Statistic title="Tỉ lệ hoạt động" value={`${workingPercentage}%`} precision={2} />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card>
                                            <Statistic title="Tổng số máy hỏng" value={totalBroken} />
                                            <Statistic title="Tỉ lệ hỏng" value={`${brokenPercentage}%`} precision={2} />
                                        </Card>
                                    </Col>
                                    <Col span={8}>
                                        <Card>
                                            <Statistic title="Tổng số máy" value={totalComputers} />
                                        </Card>
                                    </Col>
                                </Row>

                                <div style={{ width: '100%', height: 400, marginTop: '24px' }}>
                                    <h2>Số lượng máy tính theo trạng thái (từng phòng)</h2>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={barChartData}
                                            margin={{
                                                top: 5,
                                                right: 30,
                                                left: 20,
                                                bottom: 5,
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="Đang hoạt động" fill="#82ca9d" />
                                            <Bar dataKey="Đã hỏng" fill="#8884d8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ width: '100%', height: 300, marginTop: '24px' }}>
                                    <h2>Tình trạng máy tính</h2>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={renderCustomizedLabel}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Time-Series Chart (Recharts) */}
                                <div style={{ width: '100%', height: 400, marginTop: '24px' }}>
                                    <h2>Thống kê trạng thái máy tính theo thời gian</h2>
                                    {timeSeriesLoading ? (
                                        <Spin />
                                    ) : timeSeriesError ? (
                                        <div>Error: {timeSeriesError}</div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={timeSeriesData}
                                                margin={{
                                                    top: 5, right: 30, left: 20, bottom: 5,
                                                }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="time" type="category" tickFormatter={(time) => time.toLocaleDateString()} />
                                                <YAxis />
                                                <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
                                                <Legend />
                                                <Line type="monotone" dataKey="Đang hoạt động" stroke="#82ca9d" activeDot={{ r: 8 }} />
                                                <Line type="monotone" dataKey="Đã hỏng" stroke="#FF0000" activeDot={{ r: 8 }} />
                                                <Line type="monotone" dataKey="Không hoạt động" stroke="#FFA500" activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;