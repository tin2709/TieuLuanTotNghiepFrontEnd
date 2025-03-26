// src/components/Home/Home.js
import React from 'react';
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
    ContactsOutlined
} from '@ant-design/icons';
import ScrollOverPack from 'rc-scroll-anim/lib/ScrollOverPack';
// Removed TweenOne import as it's no longer used for #about and #contact
import QueueAnim from 'rc-queue-anim';
import './homepage.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Link } = Anchor;

const HomePage = () => {
    const navigate = useNavigate();
    const username = localStorage.getItem("username") || "Người dùng";
    const [form] = Form.useForm();

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        navigate('/login');
        message.success('Đã đăng xuất!');
    };

    const managementMenu = (
        <Menu onClick={({ key }) => navigate(key)}>
            <Menu.Item key="/phongmay" icon={<DesktopOutlined />}>
                Quản lý Phòng máy
            </Menu.Item>
            <Menu.Item key="/tang" icon={<ApartmentOutlined />}>
                Quản lý Tầng
            </Menu.Item>
            <Menu.Item key="/maytinh" icon={<ClusterOutlined />}>
                Quản lý Máy tính
            </Menu.Item>
        </Menu>
    );

    // Animation config is kept for the Services section if needed later, but not applied to #about/#contact
    // const animConfig = { y: '+=30', opacity: 0, type: 'from', ease: 'easeOutQuad', duration: 500 };
    // const animConfigSlow = { y: '+=50', opacity: 0, type: 'from', ease: 'easeOutQuad', duration: 800 };

    const onFinishContact = (values) => {
        console.log('Contact form submitted: ', values);
        // Simulate API call delay (optional)
        setTimeout(() => {
            message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm.');
            form.resetFields();
        }, 500);
    };

    // Example online image URL for About Us section
    const aboutUsImageUrl = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"; // Replace with your desired image URL

    return (
        <Layout className="layout home-layout">
            <Header className="home-header">
                <div className="logo">QL Phòng Máy</div>
                <div className="header-nav">
                    <Anchor targetOffset={80} affix={false} className="anchor-nav">
                        {/* Adjusted href to match the IDs of the divs */}
                        <Link href="#about" title="Giới Thiệu" />
                        <Link href="#services" title="Dịch Vụ" />
                        <Link href="#contact" title="Liên Hệ" />
                    </Anchor>
                    <Dropdown overlay={managementMenu} trigger={['hover']} className="management-dropdown">
                        <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                            <Space>
                                Quản Lý <DownOutlined />
                            </Space>
                        </a>
                    </Dropdown>
                    <Text className="user-greeting">Chào, {username}</Text>
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        className="logout-button"
                        title="Đăng xuất"
                    />
                </div>
            </Header>

            <Content className="home-content">
                {/* --- Hero Section (No changes needed here) --- */}
                <div className="hero-section content-section">
                    <div className="section-content">
                        <Title level={1} style={{ marginBottom: '20px', color: '#001529' }}>Hệ Thống Quản Lý Phòng Máy Thông Minh</Title>
                        <Paragraph style={{ fontSize: '1.2em', maxWidth: '800px', margin: '0 auto' }}>
                            Giải pháp hiện đại giúp đơn giản hóa việc theo dõi, bảo trì và tối ưu hóa hoạt động phòng máy tính của bạn.
                        </Paragraph>
                        <Button type="primary" size="large" href="#about" style={{ marginTop: '30px' }}>Tìm Hiểu Thêm</Button>
                    </div>
                </div>

                {/* --- About Section ---
                    Removed ScrollOverPack and TweenOne wrappers to ensure visibility
                    Added id="about" and classes directly to the div
                --- */}
                <div id="about" className="content-section bg-light">
                    <div className="section-content">
                        <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}><InfoCircleOutlined /> Giới Thiệu Hệ Thống</Title>
                        <Row gutter={[32, 32]} align="middle">
                            <Col xs={24} md={12}>
                                {/* Use the online image URL */}
                                <img src={aboutUsImageUrl} alt="Giới thiệu hệ thống - Nhóm làm việc" style={{ width: '100%', maxWidth: '450px', display: 'block', margin: '0 auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                            </Col>
                            <Col xs={24} md={12}>
                                <Paragraph style={{ fontSize: '1.1em' }}>
                                    Hệ thống Quản lý Phòng Máy được xây dựng để giải quyết những thách thức trong việc vận hành các phòng máy tính quy mô lớn hoặc nhỏ.
                                    Chúng tôi cung cấp công cụ trực quan để quản lý thiết bị (máy tính, tầng, phòng), theo dõi tình trạng hoạt động,
                                    ghi nhận và xử lý sự cố nhanh chóng, đồng thời cung cấp các báo cáo hữu ích.
                                </Paragraph>
                                <Paragraph style={{ fontSize: '1.1em', marginTop: '15px' }}>
                                    Mục tiêu của hệ thống là nâng cao hiệu quả quản lý, giảm thiểu thời gian chết của thiết bị và cung cấp trải nghiệm tốt hơn cho người dùng cuối.
                                </Paragraph>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* --- Services/Features Section ---
                    Kept ScrollOverPack and QueueAnim for demonstration
                --- */}
                <ScrollOverPack id="services" className="content-section" playScale={0.2}>
                    {/* Added a key to QueueAnim parent div if needed by ScrollOverPack internals */}
                    <div key="services-content" className="section-content">
                        <QueueAnim key="services-anim" type={['bottom', 'top']} leaveReverse >
                            <Title level={2} key="title" style={{ textAlign: 'center', marginBottom: '50px' }}><CustomerServiceOutlined /> Tính Năng & Dịch Vụ</Title>
                            <Row gutter={[24, 24]} key="cards">
                                <Col xs={24} sm={12} lg={8}>
                                    <Card title="Quản Lý Thiết Bị" bordered={false} hoverable>
                                        <DesktopOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '10px'}}/>
                                        <p>Theo dõi thông tin chi tiết, cấu hình, trạng thái của từng máy tính, phòng máy và tầng.</p>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card title="Báo Cáo Sự Cố" bordered={false} hoverable>
                                        {/* Using a different relevant icon */}
                                        <InfoCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '10px'}}/>
                                        <p>Cho phép người dùng dễ dàng báo cáo lỗi, quản trị viên tiếp nhận và cập nhật tiến độ xử lý.</p>
                                    </Card>
                                </Col>
                                <Col xs={24} sm={12} lg={8}>
                                    <Card title="Thống Kê & Báo Cáo" bordered={false} hoverable>
                                        <ClusterOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '10px'}}/>
                                        <p>Cung cấp báo cáo trực quan về tình trạng sử dụng, hiệu suất hoạt động và lịch sử sự cố.</p>
                                    </Card>
                                </Col>
                            </Row>
                        </QueueAnim>
                    </div>
                </ScrollOverPack>

                {/* --- Contact Section ---
                    Removed ScrollOverPack and TweenOne wrappers to ensure visibility
                    Added id="contact" and classes directly to the div
                --- */}
                <div id="contact" className="content-section bg-light">
                    <div className="section-content contact-form-container"> {/* Keep contact-form-container for specific form styling */}
                        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}><ContactsOutlined /> Liên Hệ Hỗ Trợ</Title>
                        <Paragraph style={{ textAlign: 'center', marginBottom: '40px' }}>
                            Bạn có câu hỏi, góp ý hoặc cần hỗ trợ kỹ thuật? Xin vui lòng gửi thông tin qua biểu mẫu dưới đây.
                        </Paragraph>
                        <Form
                            form={form}
                            name="contact"
                            onFinish={onFinishContact}
                            layout="vertical"
                            style={{ maxWidth: '600px', margin: '0 auto' }}
                        >
                            <Row gutter={16}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="name"
                                        label="Họ và Tên"
                                        rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                                    >
                                        <Input prefix={<UserOutlined />} placeholder="Tên của bạn" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        name="email"
                                        label="Địa chỉ Email"
                                        rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}
                                    >
                                        <Input prefix={<MailOutlined />} placeholder="Email liên hệ" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item
                                name="message"
                                label="Nội dung"
                                rules={[{ required: true, message: 'Vui lòng nhập nội dung!' }]}
                            >
                                <TextArea rows={5} placeholder="Nội dung tin nhắn của bạn..." />
                            </Form.Item>
                            <Form.Item style={{ textAlign: 'center', marginTop: '20px' }}>
                                <Button type="primary" htmlType="submit" size="large">
                                    Gửi Liên Hệ
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </div>
            </Content>

            <Footer style={{ textAlign: 'center' }} className="home-footer">
                Hệ Thống Quản Lý Phòng Máy ©{new Date().getFullYear()}
            </Footer>
        </Layout>
    );
};

export default HomePage;