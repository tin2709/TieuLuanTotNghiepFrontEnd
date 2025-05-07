// src/components/Home/Home.js
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Typography, Row, Col, Card, Space, Button, Form, Input, message, Anchor, Spin } from 'antd'; // Added Spin
import {
    DownOutlined,
    LogoutOutlined,
    DesktopOutlined,
    ApartmentOutlined,
    ClusterOutlined,
    MailOutlined,
    UserOutlined,
    InfoCircleOutlined,
    CustomerServiceOutlined,
    ContactsOutlined,
    ScheduleOutlined,
    LoadingOutlined // Added LoadingOutlined for smaller loading indicators
} from '@ant-design/icons';

import { OverPack } from 'rc-scroll-anim';
import QueueAnim from 'rc-queue-anim';

import './homepage.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Link } = Anchor;

const API_BASE_URL = "https://localhost:8080"; // Define API base URL

const HomePage = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem("username") || "Người dùng";
    const rawUserRole = localStorage.getItem("userRole"); // Get role string from localStorage
    const maTK = localStorage.getItem("maTK"); // Get maTK from localStorage
    const authToken = localStorage.getItem("authToken"); // Get authToken from localStorage

    const [form] = Form.useForm();

    const [renderBelowFold, setRenderBelowFold] = useState(false); // For delayed rendering
    const [userPermissions, setUserPermissions] = useState({}); // Stores fetched permissions { RESOURCE: { ACTION: true/false } }
    const [permissionsLoading, setPermissionsLoading] = useState(true); // Loading state for permissions

    // Effect for delayed rendering
    useEffect(() => {
        const timer = setTimeout(() => {
            setRenderBelowFold(true);
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // --- Effect to fetch user permissions on component mount ---
    useEffect(() => {
        // Check if required info exists for fetching permissions
        if (!maTK || !authToken) {
            console.error("Missing maTK or authToken in localStorage. Redirecting to login.");
            message.error("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
            navigate('/login');
            return; // Stop the effect if login info is missing
        }

        // Role "1" (Admin) bypasses specific permissions checks for menu visibility
        if (rawUserRole === "1") {
            console.log("Admin user detected, showing all management menu items.");
            setPermissionsLoading(false); // Admin permissions are instantly "loaded"
            // No need to fetch for Admin, just show all items
            return; // Stop the effect for Admin
        }

        // For non-Admin users, fetch permissions
        const fetchUserPermissions = async () => {
            setPermissionsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/getUserPermissionsByUserId?userId=${maTK}&token=${authToken}`);

                if (!response.ok) {
                    // Attempt to parse error message from backend
                    const errorData = await response.json().catch(() => ({ message: "Phản hồi không hợp lệ từ máy chủ khi tải quyền người dùng." }));
                    console.error("Failed to fetch user permissions:", response.status, errorData);
                    if (response.status === 401) {
                        message.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
                        navigate('/login');
                    } else {
                        message.error(errorData.message || 'Không thể tải quyền người dùng.');
                    }
                    setUserPermissions({}); // Clear permissions state on error
                    return; // Stop execution
                }

                const result = await response.json();
                console.log("Fetched user permissions:", result.permissions);

                // Transform the flat list into a nested object for easier lookup
                const formattedPermissions = {};
                if (Array.isArray(result.permissions)) {
                    result.permissions.forEach(perm => {
                        const resource = perm.resource; // e.g., "COMPUTER"
                        const action = perm.action; // e.g., "VIEW"

                        if (!formattedPermissions[resource]) {
                            formattedPermissions[resource] = {};
                        }
                        formattedPermissions[resource][action] = true; // Set the permission flag to true
                    });
                }
                setUserPermissions(formattedPermissions); // Update state with formatted permissions

            } catch (error) {
                console.error("Error fetching user permissions:", error);
                message.error(`Lỗi kết nối khi tải quyền: ${error.message}`);
                setUserPermissions({}); // Clear permissions state on error
            } finally {
                setPermissionsLoading(false); // Set loading to false regardless of success/failure
            }
        };

        fetchUserPermissions();

    }, [maTK, authToken, rawUserRole, navigate]); // Dependencies: re-run if these change

    // Logic xác định lời chào dựa trên role
    let greetingMessage = `Chào, ${username}`;
    if (rawUserRole === "2") {
        greetingMessage = `Chào giáo viên ${username}`;
    } else if (rawUserRole === "3") {
        greetingMessage = `Chào nhân viên ${username}`;
    } else if (rawUserRole === "1") {
        greetingMessage = `Chào Admin ${username}`;
    }


    // Logic đăng xuất
    const handleLogout = () => {
        // Clear all relevant items from localStorage
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('maTK');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginSuccessTimestamp');
        localStorage.removeItem('expireAt');

        message.success('Đã đăng xuất!');
        navigate('/login'); // Use navigate for SPA behavior
    };

    // Define ALL potential menu items with their required resource and action (if any)
    const rawMenuItems = [
        {
            key: '/phongmay',
            icon: <DesktopOutlined />, // Icon
            label: 'Quản lý Phòng máy',
            resource: 'ROOM', // Backend resource name
            requiredAction: 'VIEW', // Required backend action for visibility
        },
        {
            key: '/tang',
            icon: <ApartmentOutlined />,
            label: 'Quản lý Tầng',
            resource: 'FLOOR', // Backend resource name
            requiredAction: 'VIEW', // Required backend action for visibility
        },
        {
            key: '/maytinh',
            icon: <ClusterOutlined />,
            label: 'Quản lý Máy tính',
            resource: 'COMPUTER', // Backend resource name
            requiredAction: 'VIEW', // Required backend action for visibility
        },
        {
            key: '/cathuchanh',
            icon: <ScheduleOutlined />,
            label: 'Quản lý Ca thực hành',
            // No resource/requiredAction defined here means this item is NOT filtered
            // based on the userPermissions state fetched by getUserPermissionsByUserId.
            // If managing practice sessions requires a specific permission (e.g., for a
            // 'PRACTICE_SESSION' resource), you would add 'resource' and 'requiredAction' properties here.
        },
        // Add other potential management links here
    ];

    // Filter the menu items based on fetched permissions or Admin role
    const filteredMenuItems = rawMenuItems.filter(item => {
        // If the user is Admin, show all management items
        if (rawUserRole === "1") {
            return true;
        }

        // If the item doesn't require a specific permission check (like 'Ca thực hành' in this example), show it
        if (!item.resource || !item.requiredAction) {
            return true;
        }

        // For other roles, check if the userPermissions state indicates the required permission
        // userPermissions[item.resource] might be undefined if the user has no permissions for that resource at all
        // userPermissions[item.resource]?.[item.requiredAction] checks if the resource exists AND the action exists and is true
        return userPermissions[item.resource]?.[item.requiredAction] === true;
    }).map(item => ({ // Map to the format required by Ant Design Dropdown items
        key: item.key,
        icon: item.icon,
        label: item.label,
        onClick: () => navigate(item.key), // Use navigate here
    }));


    // Combine filtered items with Logout item for the dropdown menu structure (antd v5+)
    const dropdownMenuStructure = [
        ...filteredMenuItems,
        {
            type: 'divider', // Optional: adds a separator
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            danger: true, // Style as danger
            onClick: handleLogout,
        },
    ];


    // Handle contact form submission
    const onFinishContact = (values) => {
        console.log('Contact form submitted: ', values);
        // Simulate API call success
        setTimeout(() => {
            message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.');
            form.resetFields();
        }, 500);
        // TODO: Implement actual API call to your backend contact endpoint if available
    };

    // Image dimensions for layout shift prevention
    const aboutUsImageUrl = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";
    const imageWidth = 450;
    const imageHeight = 300;


    // Determine if the management dropdown should be disabled
    // It should be disabled while permissions are loading, but *not* for Admins
    const isManagementDropdownDisabled = permissionsLoading && rawUserRole !== "1";


    return (
        <Layout className="layout home-layout">
            <style>{` body { font-display: swap !important; } `}</style> {/* Keep font-display */}

            {/* --- Header --- */}
            <Header className="home-header">
                <div className="logo">QL Phòng Máy</div>
                <div className="header-nav">
                    <Anchor targetOffset={80} affix={false} className="anchor-nav">
                        <Link href="#about" title="Giới Thiệu" />
                        <Link href="#services" title="Dịch Vụ" />
                        <Link href="#contact" title="Liên Hệ" />
                    </Anchor>

                    {/* Management Dropdown */}
                    <Dropdown menu={{ items: dropdownMenuStructure }} trigger={['hover']} className="management-dropdown">
                        {/* Use Space to align icon and text */}
                        <a className="ant-dropdown-link" onClick={e => e.preventDefault()} disabled={isManagementDropdownDisabled}>
                            <Space>
                                Quản Lý
                                {isManagementDropdownDisabled ? <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} /> : <DownOutlined />}
                            </Space>
                        </a>
                    </Dropdown>

                    <Text className="user-greeting">{greetingMessage}</Text>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} className="logout-button" title="Đăng xuất"/>
                </div>
            </Header>

            {/* --- Content --- */}
            <Content className="home-content">
                {/* --- Hero Section (Render immediately) --- */}
                <div className="hero-section content-section">
                    <div className="section-content">
                        <Title level={1} style={{ marginBottom: '20px', color: '#001529' }}>Hệ Thống Quản Lý Phòng Máy Thông Minh</Title>
                        <Paragraph style={{ fontSize: '1.2em', maxWidth: '800px', margin: '0 auto' }}>
                            Giải pháp hiện đại giúp đơn giản hóa việc theo dõi, bảo trì và tối ưu hóa hoạt động phòng máy tính của bạn.
                        </Paragraph>
                        <Button type="primary" size="large" href="#about" style={{ marginTop: '30px' }}>Tìm Hiểu Thêm</Button>
                    </div>
                </div>

                {/* --- Render below-the-fold content or placeholders --- */}
                {renderBelowFold ? (
                    <>
                        {/* --- About Section --- */}
                        <div id="about" className="content-section bg-light">
                            <div className="section-content">
                                <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}><InfoCircleOutlined /> Giới Thiệu Hệ Thống</Title>
                                <Row gutter={[32, 32]} align="middle">
                                    <Col xs={24} md={12}>
                                        <img
                                            src={aboutUsImageUrl}
                                            alt="Giới thiệu hệ thống - Nhóm làm việc"
                                            style={{ width: '100%', maxWidth: '450px', display: 'block', margin: '0 auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                            width={imageWidth}
                                            height={imageHeight}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        <Paragraph style={{ fontSize: '1.1em' }}>
                                            Hệ thống Quản lý Phòng Máy được xây dựng để giải quyết những thách thức trong việc vận hành các phòng máy tính quy mô lớn hoặc nhỏ...
                                        </Paragraph>
                                        <Paragraph style={{ fontSize: '1.1em', marginTop: '15px' }}>
                                            Mục tiêu của hệ thống là nâng cao hiệu quả quản lý giảm thiểu thời gian chết của thiết bị và cung cấp trải nghiệm tốt hơn cho người dùng cuối.
                                        </Paragraph>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        {/* --- Services/Features Section --- */}
                        <OverPack id="services" className="content-section" playScale={0.2}>
                            <div key="services-content" className="section-content">
                                <QueueAnim key="services-anim" type={['bottom', 'top']} leaveReverse >
                                    <Title level={2} key="title" style={{ textAlign: 'center', marginBottom: '50px' }}><CustomerServiceOutlined /> Tính Năng & Dịch Vụ</Title>
                                    <Row gutter={[24, 24]} key="cards">
                                        <Col xs={24} sm={12} lg={8}> <Card title="Quản Lý Thiết Bị" bordered={false} hoverable> <DesktopOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '10px'}}/> <p>Theo dõi thông tin chi tiết, cấu hình, trạng thái của từng máy tính, phòng máy và tầng.</p> </Card> </Col>
                                        <Col xs={24} sm={12} lg={8}> <Card title="Báo Cáo Sự Cố" bordered={false} hoverable> <InfoCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '10px'}}/> <p>Cho phép người dùng dễ dàng báo cáo lỗi, quản trị viên tiếp nhận và cập nhật tiến độ xử lý.</p> </Card> </Col>
                                        <Col xs={24} sm={12} lg={8}> <Card title="Thống Kê & Báo Cáo" bordered={false} hoverable> <ClusterOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '10px'}}/> <p>Cung cấp báo cáo trực quan về tình trạng sử dụng, hiệu suất hoạt động và lịch sử sự cố.</p></Card> </Col>
                                    </Row>
                                </QueueAnim>
                            </div>
                        </OverPack>

                        {/* --- Contact Section --- */}
                        <div id="contact" className="content-section bg-light">
                            <div className="section-content contact-form-container">
                                <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}><ContactsOutlined /> Liên Hệ Hỗ Trợ</Title>
                                <Paragraph style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    Bạn có câu hỏi, góp ý hoặc cần hỗ trợ kỹ thuật? Xin vui lòng gửi thông tin qua biểu mẫu dưới đây.
                                </Paragraph>
                                <Form form={form} name="contact" onFinish={onFinishContact} layout="vertical" style={{ maxWidth: '600px', margin: '0 auto' }}>
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12}> <Form.Item name="name" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}> <Input prefix={<UserOutlined />} placeholder="Tên của bạn" /> </Form.Item> </Col>
                                        <Col xs={24} sm={12}> <Form.Item name="email" label="Địa chỉ Email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}> <Input prefix={<MailOutlined />} placeholder="Email liên hệ" /> </Form.Item> </Col>
                                    </Row>
                                    <Form.Item name="message" label="Nội dung" rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}>
                                        <TextArea rows={5} placeholder="Nội dung tin nhắn của bạn..." />
                                    </Form.Item>
                                    <Form.Item style={{ textAlign: 'center', marginTop: '20px' }}>
                                        <Button type="primary" htmlType="submit" size="large"> Gửi Liên Hệ </Button>
                                    </Form.Item>
                                </Form>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* --- Placeholders --- */}
                        {/* Consider adding a spinner to indicate initial loading */}
                        {/* Or simple colored blocks as placeholders */}
                        <div className="placeholder-section" style={{ minHeight: '450px', background: '#f0f2f5' }}></div>
                        <div className="placeholder-section" style={{ minHeight: '400px', background: '#fafafa' }}></div>
                        <div className="placeholder-section" style={{ minHeight: '500px', background: '#f0f2f5' }}></div>
                    </>
                )}
            </Content>

            {/* --- Footer --- */}
            <Footer style={{ textAlign: 'center' }} className="home-footer">
                Hệ Thống Quản Lý Phòng Máy ©{new Date().getFullYear()}
            </Footer>
        </Layout>
    );
};

export default HomePage;