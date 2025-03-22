import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
} from 'recharts';
import { Card, Statistic, Row, Col, Spin } from 'antd'; // Import Ant Design components
import Swal from 'sweetalert2';
import { HomeOutlined, LogoutOutlined } from "@ant-design/icons";
import * as DarkReader from "darkreader";
import { Button } from 'antd';
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import {Header} from "antd/es/layout/layout";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']; // Colors for pie chart segments

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode(prev => !prev);
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
        <Button
            icon={isDarkMode ? <SunOutlined style={{color: 'yellow'}}/> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{ backgroundColor: "transparent", border: "none", fontSize: "24px", cursor: "pointer" }}
        />
    );
};

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [roomStats, setRoomStats] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = localStorage.getItem("authToken");

            if (!token) {
                Swal.fire("Error", "Bạn chưa đăng nhập", "error");
                setLoading(false);
                return;
            }
            try {
                const url = `https://localhost:8080/phong-may-thong-ke?token=${token}`; //Use the correct URL
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setRoomStats(data);
                setError(null); // Clear any previous errors

            } catch (err) {
                setError(err.message);
                setRoomStats([]); // Clear data on error
                Swal.fire("Error", "Failed to fetch statistics: " + err.message, "error");

            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }


    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5; // Place label in the middle of slice
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {(percent * 100).toFixed(0)}%
            </text>
        );
    };

    // Transform data for bar chart
    const barChartData = roomStats.map((room) => ({
        name: room.tenPhong,
        'Đang hoạt động': room.soMayDangHoatDong,
        'Đã hỏng': room.soMayDaHong,
    }));

    // Calculate total counts and percentages
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
        <div>
            <Header className="lab-management-header" style={{ display: "flex", justifyContent: "space-between",alignItems: "center", backgroundColor: "#fff", padding: "0 24px" }}>
                <div style={{fontSize: "1.5rem", fontWeight: "bold", color: "#000"}}>
                    Thống kê
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center" }}>
                    <DarkModeToggle />
                    <Button icon={<LogoutOutlined />} type="text" >
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Admin Dashboard</h1>
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số máy hoạt động" value={totalWorking} />
                        <Statistic title="Tỉ lệ hoạt động" value={`${workingPercentage}%`} precision={2}  />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số máy hỏng" value={totalBroken} />
                        <Statistic title="Tỉ lệ hỏng" value={`${brokenPercentage}%`}  precision={2}  />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic title="Tổng số máy" value={totalComputers}/>
                    </Card>
                </Col>
            </Row>

            <div style={{ width: '100%', height: 400, marginTop: '24px'  }}>
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
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="name"/>
                        <YAxis/>
                        <Tooltip/>
                        <Legend/>
                        <Bar dataKey="Đang hoạt động" fill="#82ca9d"/>
                        <Bar dataKey="Đã hỏng" fill="#8884d8"/>
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

        </div>
    );
};

export default AdminDashboard;