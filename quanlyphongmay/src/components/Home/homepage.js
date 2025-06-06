// src/components/Home/Home.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Menu, Dropdown, Typography, Row, Col, Card, Space, Button, Form, Input, message, Anchor, Spin } from 'antd';
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

import { useTranslation } from 'react-i18next'; // Import useTranslation

import './homepage.css'; // Assume this handles your basic layout/styling

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Link } = Anchor;

const API_BASE_URL = "https://localhost:8080"; // Define API base URL (Keep this)

// Language options for the switcher
const languageOptions = [
    { key: 'en', label: 'English', flag: '🇺🇸' },
    { key: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    // { key: 'zh', label: '中文', flag: '🇨🇳' },
    // { key: 'ko', label: '한국어', flag: '🇰🇷' },
    // { key: 'fr', label: 'Français', flag: '🇫🇷' },
];

const HomePage = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation(); // Initialize useTranslation hook

    const username = localStorage.getItem("username") || t('header.greeting.default', { name: 'Người dùng' }); // Use translation for default
    const rawUserRole = localStorage.getItem("userRole");
    const maTK = localStorage.getItem("maTK");
    const authToken = localStorage.getItem("authToken");

    const [form] = Form.useForm();

    const [renderBelowFold, setRenderBelowFold] = useState(false);
    const [userPermissions, setUserPermissions] = useState({});
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language); // State to track current language

    // Effect for delayed rendering
    useEffect(() => {
        const timer = setTimeout(() => {
            setRenderBelowFold(true);
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    // Effect to update current language state when i18n.language changes
    useEffect(() => {
        setCurrentLanguage(i18n.language);
    }, [i18n.language]);


    // --- Effect to fetch user permissions on component mount ---
    useEffect(() => {
        // Check if required info exists for fetching permissions
        if (!maTK || !authToken) {
            console.error("Missing maTK or authToken in localStorage. Redirecting to login.");
            message.error(t('auth.invalidSession')); // Use translation
            navigate('/login');
            return;
        }

        // Role "1" (Admin) bypasses specific permissions checks for menu visibility
        if (rawUserRole === "1") {
            console.log("Admin user detected, showing all management menu items.");
            setPermissionsLoading(false);
            return;
        }

        // For non-Admin users, fetch permissions
        const fetchUserPermissions = async () => {
            setPermissionsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/getUserPermissionsByUserId?userId=${maTK}&token=${authToken}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: t('permissions.loadFailed') })); // Use translation
                    console.error("Failed to fetch user permissions:", response.status, errorData);
                    if (response.status === 401) {
                        message.error(t('auth.sessionExpired')); // Use translation
                        navigate('/login');
                    } else {
                        message.error(errorData.message || t('permissions.loadFailed')); // Use translation
                    }
                    setUserPermissions({});
                    return;
                }

                const result = await response.json();
                console.log("Fetched user permissions:", result.permissions);

                const formattedPermissions = {};
                if (Array.isArray(result.permissions)) {
                    result.permissions.forEach(perm => {
                        const resource = perm.resource;
                        const action = perm.action;

                        if (!formattedPermissions[resource]) {
                            formattedPermissions[resource] = {};
                        }
                        formattedPermissions[resource][action] = true;
                    });
                }
                setUserPermissions(formattedPermissions);

            } catch (error) {
                console.error("Error fetching user permissions:", error);
                message.error(t('auth.connectionError', { message: error.message })); // Use translation with parameter
                setUserPermissions({});
            } finally {
                setPermissionsLoading(false);
            }
        };

        fetchUserPermissions();

    }, [maTK, authToken, rawUserRole, navigate, t]); // Add 't' as dependency

    // Logic xác định lời chào dựa trên role (using translation)
    let greetingMessage = t('header.greeting.default', { name: username });
    if (rawUserRole === "2") {
        greetingMessage = t('header.greeting.teacher', { name: username });
    } else if (rawUserRole === "3") {
        greetingMessage = t('header.greeting.staff', { name: username });
    } else if (rawUserRole === "1") {
        greetingMessage = t('header.greeting.admin', { name: username });
    }

    // Logic đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('maTK');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginSuccessTimestamp');
        localStorage.removeItem('expireAt');

        message.success(t('auth.logoutSuccess')); // Use translation
        window.location.href = "/login";
    };

    // --- Language Switcher Handler ---
    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        // Optionally save preference to localStorage
        // localStorage.setItem('selectedLanguage', lng);
    };

    // Menu items for the language switcher dropdown
    const languageMenu = {
        items: languageOptions.map(lang => ({
            key: lang.key,
            label: <Space>{lang.flag} {lang.label}</Space>,
            onClick: () => changeLanguage(lang.key),
        })),
    };

    // Define ALL potential menu items with their required resource and action (if any)
    // Use translation keys for labels
    const rawMenuItems = [
        {
            key: '/phongmay',
            icon: <DesktopOutlined />,
            labelKey: 'managementMenu.room', // Use key instead of hardcoded string
            resource: 'ROOM',
            requiredAction: 'VIEW',
        },
        {
            key: '/tang',
            icon: <ApartmentOutlined />,
            labelKey: 'managementMenu.floor', // Use key
            resource: 'FLOOR',
            requiredAction: 'VIEW',
        },
        {
            key: '/maytinh',
            icon: <ClusterOutlined />,
            labelKey: 'managementMenu.computer', // Use key
            resource: 'COMPUTER',
            requiredAction: 'VIEW',
        },
        {
            key: '/cathuchanh',
            icon: <ScheduleOutlined />,
            labelKey: 'managementMenu.practiceSession', // Use key
            // No resource/requiredAction defined means this item is NOT filtered by permissions.
        },
        // Add other potential management links here using labelKey
    ];

    // Filter the menu items based on fetched permissions or Admin role
    const filteredMenuItems = rawMenuItems.filter(item => {
        if (rawUserRole === "1") {
            return true;
        }
        if (!item.resource || !item.requiredAction) {
            return true;
        }
        return userPermissions[item.resource]?.[item.requiredAction] === true;
    }).map(item => ({ // Map to the format required by Ant Design Dropdown items
        key: item.key,
        icon: item.icon,
        label: t(item.labelKey), // Use translated label
        onClick: () => navigate(item.key),
    }));

    // Combine filtered items with Logout item for the dropdown menu structure
    const managementDropdownMenuStructure = [
        ...filteredMenuItems,
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: t('header.logout'), // Use translation
            danger: true,
            onClick: handleLogout,
        },
    ];

    // Handle contact form submission
    const onFinishContact = (values) => {
        console.log('Contact form submitted: ', values);
        // Simulate API call success
        setTimeout(() => {
            message.success(t('contactMessages.submitSuccess')); // Use translation
            form.resetFields();
        }, 500);
        // TODO: Implement actual API call to your backend contact endpoint if available
    };

    // Image dimensions (Keep this)
    const aboutUsImageUrl = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80";
    const imageWidth = 450;
    const imageHeight = 300;

    // Determine if the management dropdown should be disabled
    const isManagementDropdownDisabled = permissionsLoading && rawUserRole !== "1";

    // Find the current language's flag and label for the switcher button
    const currentLangOption = languageOptions.find(lang => lang.key === currentLanguage) || languageOptions[0];


    return (
        <Layout className="layout home-layout">
            <style>{` body { font-display: swap !important; } `}</style>

            {/* --- Header --- */}
            <Header className="home-header">
                {/* Use translation for logo text */}
                <div className="logo">{t('header.logo')}</div>
                <div className="header-nav">
                    <Anchor targetOffset={80} affix={false} className="anchor-nav">
                        {/* Use translation for link titles */}
                        <Link href="#about" title={t('header.nav.about')} />
                        <Link href="#services" title={t('header.nav.services')} />
                        <Link href="#contact" title={t('header.nav.contact')} />
                    </Anchor>

                    {/* Language Switcher Dropdown */}
                    <Dropdown menu={languageMenu} trigger={['click']} placement="bottomRight" className="language-switcher">
                        <Button type="text" icon={<Space>{currentLangOption.flag} <DownOutlined /></Space>}>
                            {currentLangOption.label}
                        </Button>
                    </Dropdown>


                    {/* Management Dropdown */}
                    <Dropdown menu={{ items: managementDropdownMenuStructure }} trigger={['hover']} className="management-dropdown">
                        <a className="ant-dropdown-link" onClick={e => e.preventDefault()} disabled={isManagementDropdownDisabled}>
                            <Space>
                                {t('header.managementDropdown.label')} {/* Use translation */}
                                {isManagementDropdownDisabled ? <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} spin />} /> : <DownOutlined />}
                            </Space>
                        </a>
                    </Dropdown>

                    <Text className="user-greeting">{greetingMessage}</Text>
                    <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} className="logout-button" title={t('header.logout')}/> {/* Use translation */}
                </div>
            </Header>

            {/* --- Content --- */}
            <Content className="home-content">
                {/* --- Hero Section (Render immediately) --- */}
                <div className="hero-section content-section">
                    <div className="section-content">
                        {/* Use translation for hero title */}
                        <Title level={1} style={{ marginBottom: '20px', color: '#001529' }}>{t('hero.title')}</Title>
                        {/* Use translation for hero paragraph */}
                        <Paragraph style={{ fontSize: '1.2em', maxWidth: '800px', margin: '0 auto' }}>
                            {t('hero.paragraph')}
                        </Paragraph>
                        {/* Use translation for hero button */}
                        <Button type="primary" size="large" href="#about" style={{ marginTop: '30px' }}>{t('hero.button')}</Button>
                    </div>
                </div>

                {/* --- Render below-the-fold content or placeholders --- */}
                {renderBelowFold ? (
                    <>
                        {/* --- About Section --- */}
                        <div id="about" className="content-section bg-light">
                            <div className="section-content">
                                {/* Use translation for about title */}
                                <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}><InfoCircleOutlined /> {t('about.title')}</Title>
                                <Row gutter={[32, 32]} align="middle">
                                    <Col xs={24} md={12}>
                                        <img
                                            src={aboutUsImageUrl}
                                            alt={t('about.imageAlt')}
                                            style={{ width: '100%', maxWidth: '450px', display: 'block', margin: '0 auto', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
                                            width={imageWidth}
                                            height={imageHeight}
                                        />
                                    </Col>
                                    <Col xs={24} md={12}>
                                        {/* Use translation for about paragraphs */}
                                        <Paragraph style={{ fontSize: '1.1em' }}>
                                            {t('about.paragraph1')}
                                        </Paragraph>
                                        <Paragraph style={{ fontSize: '1.1em', marginTop: '15px' }}>
                                            {t('about.paragraph2')}
                                        </Paragraph>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        {/* --- Services/Features Section --- */}
                        <OverPack id="services" className="content-section" playScale={0.2}>
                            <div key="services-content" className="section-content">
                                <QueueAnim key="services-anim" type={['bottom', 'top']} leaveReverse >
                                    {/* Use translation for services title */}
                                    <Title level={2} key="title" style={{ textAlign: 'center', marginBottom: '50px' }}><CustomerServiceOutlined /> {t('services.title')}</Title>
                                    <Row gutter={[24, 24]} key="cards">
                                        <Col xs={24} sm={12} lg={8}>
                                            {/* Use translation for card title and text */}
                                            <Card title={t('services.cards.manageEquipment.title')} bordered={false} hoverable>
                                                <DesktopOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '10px'}}/>
                                                <p>{t('services.cards.manageEquipment.text')}</p>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={8}>
                                            {/* Use translation for card title and text */}
                                            <Card title={t('services.cards.reportIssue.title')} bordered={false} hoverable>
                                                <InfoCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '10px'}}/>
                                                <p>{t('services.cards.reportIssue.text')}</p>
                                            </Card>
                                        </Col>
                                        <Col xs={24} sm={12} lg={8}>
                                            {/* Use translation for card title and text */}
                                            <Card title={t('services.cards.statistics.title')} bordered={false} hoverable>
                                                <ClusterOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '10px'}}/>
                                                <p>{t('services.cards.statistics.text')}</p>
                                            </Card>
                                        </Col>
                                    </Row>
                                </QueueAnim>
                            </div>
                        </OverPack>

                        {/* --- Contact Section --- */}
                        <div id="contact" className="content-section bg-light">
                            <div className="section-content contact-form-container">
                                {/* Use translation for contact title */}
                                <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}><ContactsOutlined /> {t('contact.title')}</Title>
                                {/* Use translation for contact intro */}
                                <Paragraph style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    {t('contact.intro')}
                                </Paragraph>
                                {/* Use translation for form labels and placeholders */}
                                <Form form={form} name="contact" onFinish={onFinishContact} layout="vertical" style={{ maxWidth: '600px', margin: '0 auto' }}>
                                    <Row gutter={16}>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="name"
                                                label={t('contact.form.name.label')}
                                                rules={[{ required: true, message: t('validation.requiredName') }]} // Use translation for validation message
                                            >
                                                <Input prefix={<UserOutlined />} placeholder={t('contact.form.name.placeholder')} />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="email"
                                                label={t('contact.form.email.label')}
                                                rules={[
                                                    { required: true, message: t('validation.requiredEmail') }, // Use translation
                                                    { type: 'email', message: t('validation.invalidEmail') } // Use translation
                                                ]}
                                            >
                                                <Input prefix={<MailOutlined />} placeholder={t('contact.form.email.placeholder')} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Form.Item
                                        name="message"
                                        label={t('contact.form.message.label')}
                                        rules={[{ required: true, message: t('validation.requiredMessage') }]} // Use translation
                                    >
                                        <TextArea rows={5} placeholder={t('contact.form.message.placeholder')} />
                                    </Form.Item>
                                    <Form.Item style={{ textAlign: 'center', marginTop: '20px' }}>
                                        {/* Use translation for submit button */}
                                        <Button type="primary" htmlType="submit" size="large"> {t('contact.form.submit')} </Button>
                                    </Form.Item>
                                </Form>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* --- Placeholders --- */}
                        <div className="placeholder-section" style={{ minHeight: '450px', background: '#f0f2f5' }}></div>
                        <div className="placeholder-section" style={{ minHeight: '400px', background: '#fafafa' }}></div>
                        <div className="placeholder-section" style={{ minHeight: '500px', background: '#f0f2f5' }}></div>
                    </>
                )}
            </Content>

            {/* --- Footer --- */}
            <Footer style={{ textAlign: 'center' }} className="home-footer">
                {/* Use translation for footer text with year parameter */}
                {t('footer.copyright', { year: new Date().getFullYear() })}
            </Footer>
        </Layout>
    );
};

export default HomePage;