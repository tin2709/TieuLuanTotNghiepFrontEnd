// src/components/Home/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Typography, Row, Col, Card, Space, Button, Form, Input, message, Anchor } from 'antd';
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
    ScheduleOutlined, // Thêm icon ScheduleOutlined cho Ca thực hành
} from '@ant-design/icons';

// Import đúng cách cho OverPack và QueueAnim
import { OverPack } from 'rc-scroll-anim';
import QueueAnim from 'rc-queue-anim';

// Import CSS của bạn
import './homepage.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Link } = Anchor;

const HomePage = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem("username") || "Người dùng";
    const userRole = localStorage.getItem("userRole");
    const [form] = Form.useForm();

    // State để điều khiển việc render các section bị trì hoãn
    const [renderBelowFold, setRenderBelowFold] = useState(false);

    // useEffect để kích hoạt render các section sau một khoảng trễ ngắn
    useEffect(() => {
        const timer = setTimeout(() => {
            setRenderBelowFold(true);
        }, 150); // Trễ 150ms (có thể điều chỉnh)
        return () => clearTimeout(timer); // Cleanup
    }, []); // Chạy 1 lần sau khi mount

    // Logic xác định lời chào
    let greetingMessage = `Chào, ${username}`;
    if (userRole === "2") {
        greetingMessage = `Chào giáo viên ${username}`;
    } else if (userRole === "3") {
        greetingMessage = `Chào nhân viên ${username}`;
    }

    // Logic đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        navigate('/login');
        message.success('Đã đăng xuất!');
    };

    // Cấu trúc items cho Dropdown menu (antd v5+)
    const menuItems = [
        {
            key: '/phongmay',
            icon: <DesktopOutlined />,
            label: 'Quản lý Phòng máy',
            onClick: () => navigate('/phongmay'),
        },
        {
            key: '/tang',
            icon: <ApartmentOutlined />,
            label: 'Quản lý Tầng',
            onClick: () => navigate('/tang'),
        },
        {
            key: '/maytinh',
            icon: <ClusterOutlined />,
            label: 'Quản lý Máy tính',
            onClick: () => navigate('/maytinh'),
        },
        {
            key: '/cathuchanh', // Thêm key cho Ca thực hành
            icon: <ScheduleOutlined />, // Sử dụng ScheduleOutlined icon
            label: 'Quản lý Ca thực hành', // Label cho Ca thực hành
            onClick: () => navigate('/cathuchanh'), // Navigate tới /cathuchanh
        },
    ];

    // Xử lý form liên hệ
    const onFinishContact = (values) => {
        console.log('Contact form submitted: ', values);
        setTimeout(() => {
            message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.');
            form.resetFields();
        }, 500);
    };

    // URL và kích thước ảnh
    const aboutUsImageUrl = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";
    const imageWidth = 450; // Ước tính hoặc lấy từ kích thước gốc/style
    const imageHeight = 300; // Ước tính dựa trên tỷ lệ

    return (
        <Layout className="layout home-layout">
            {/* Style nội tuyến cho font-display và placeholder */}
            <style>{`
                body { font-display: swap !important; }
                .placeholder-section { width: 100%; /* background-color: #f0f0f0; */ }
             `}</style>

            {/* --- Header --- */}
            <Header className="home-header">
                <div className="logo">QL Phòng Máy</div>
                <div className="header-nav">
                    <Anchor targetOffset={80} affix={false} className="anchor-nav">
                        <Link href="#about" title="Giới Thiệu" />
                        <Link href="#services" title="Dịch Vụ" />
                        <Link href="#contact" title="Liên Hệ" />
                    </Anchor>
                    <Dropdown menu={{ items: menuItems }} trigger={['hover']} className="management-dropdown">
                        <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                            <Space> Quản Lý <DownOutlined /> </Space>
                        </a>
                    </Dropdown>
                    <Text className="user-greeting">{greetingMessage}</Text>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} className="logout-button" title="Đăng xuất"/>
                </div>
            </Header>

            {/* --- Content --- */}
            <Content className="home-content">
                {/* --- Hero Section (Render ngay) --- */}
                <div className="hero-section content-section">
                    <div className="section-content">
                        <Title level={1} style={{ marginBottom: '20px', color: '#001529' }}>Hệ Thống Quản Lý Phòng Máy Thông Minh</Title>
                        <Paragraph style={{ fontSize: '1.2em', maxWidth: '800px', margin: '0 auto' }}>
                            Giải pháp hiện đại giúp đơn giản hóa việc theo dõi, bảo trì và tối ưu hóa hoạt động phòng máy tính của bạn.
                        </Paragraph>
                        <Button type="primary" size="large" href="#about" style={{ marginTop: '30px' }}>Tìm Hiểu Thêm</Button>
                    </div>
                </div>

                {/* --- Render nội dung thật hoặc placeholder --- */}
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
                                            width={imageWidth}  // Thêm width
                                            height={imageHeight} // Thêm height
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
                        {/* Sử dụng component OverPack đã import đúng */}
                        <OverPack id="services" className="content-section" playScale={0.2}>
                            <div key="services-content" className="section-content">
                                <QueueAnim key="services-anim" type={['bottom', 'top']} leaveReverse >
                                    <Title level={2} key="title" style={{ textAlign: 'center', marginBottom: '50px' }}><CustomerServiceOutlined /> Tính Năng & Dịch Vụ</Title>
                                    <Row gutter={[24, 24]} key="cards">
                                        <Col xs={24} sm={12} lg={8}> <Card title="Quản Lý Thiết Bị" bordered={false} hoverable> <DesktopOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '10px'}}/> <p>Theo dõi thông tin chi tiết, cấu hình, trạng thái của từng máy tính, phòng máy và tầng.</p>
                                        </Card> </Col>
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
                        <div className="placeholder-section" style={{ minHeight: '450px' }}></div>
                        <div className="placeholder-section" style={{ minHeight: '400px' }}></div>
                        <div className="placeholder-section" style={{ minHeight: '500px' }}></div>
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