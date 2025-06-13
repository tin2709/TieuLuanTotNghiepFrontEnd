// src/components/AdminDashboard.js (Phiên bản sửa lỗi TypeError)

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
    Layout, Card, Statistic, Row, Col, Spin, Button as AntButton, Popover, Typography, Empty, Tooltip as AntTooltip
} from 'antd';
import {
    SettingOutlined, SunOutlined, MoonOutlined, ApartmentOutlined, BuildOutlined, DesktopOutlined, ClusterOutlined, SyncOutlined
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import * as DarkReader from 'darkreader';
import { Tree, TreeNode } from 'react-organizational-chart';
import styled from 'styled-components';
import SidebarAdmin from './Sidebar/SidebarAdmin';

const { Header, Content } = Layout;
const { Title } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

// --- Dark Mode Toggle ---
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

    useEffect(() => {
        const preferDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem('darkMode');
        const initialMode = savedMode !== null ? JSON.parse(savedMode) : preferDark;
        setIsDarkMode(initialMode);
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        try {
            if (isDarkMode) {
                if (!DarkReader.isEnabled()) DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
            } else {
                if (DarkReader.isEnabled()) DarkReader.disable();
            }
        } catch (error) {
            console.error("DarkReader error:", error);
        }
    }, [isDarkMode]);

    return (
        <AntTooltip title={isDarkMode ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}>
            <AntButton
                icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
                onClick={toggleDarkMode}
                style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            />
        </AntTooltip>
    );
};

// --- Styled Component cho Node Cây ---
const StyledNode = styled.div`
  padding: 8px 12px; display: inline-block; border-radius: 6px; border: 1px solid #ccc;
  background-color: #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center;
  min-width: 120px; transition: all 0.3s ease;
  ${({ nodeType }) => nodeType === 'root' && `border-color: #1890ff; background-color: #e6f7ff;`}
  ${({ nodeType }) => nodeType === 'building' && `border-color: #52c41a; background-color: #f6ffed;`}
  ${({ nodeType }) => nodeType === 'floor' && `border-color: #faad14; background-color: #fffbe6;`}
  ${({ nodeType }) => nodeType === 'room' && `border-color: #722ed1; background-color: #f9f0ff;`}
  .node-icon { font-size: 18px; margin-bottom: 4px; display: block; color: #555;
    ${({ nodeType }) => nodeType === 'root' && `color: #1890ff;`}
    ${({ nodeType }) => nodeType === 'building' && `color: #52c41a;`}
    ${({ nodeType }) => nodeType === 'floor' && `color: #faad14;`}
    ${({ nodeType }) => nodeType === 'room' && `color: #722ed1;`}
  }
  .node-name { font-weight: 600; font-size: 13px; color: #333; margin-bottom: 3px; }
  .node-details { font-size: 11px; color: #666; line-height: 1.3; }
`;

// --- Tooltip Content Generator ---
const getNodeTooltipContent = (node) => {
    if (!node || !node.attributes) return null;
    const { attributes, name } = node;
    return (
        <div style={{ maxWidth: '250px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '3px' }}>{name}</p>
            {attributes.type === 'room' && (
                <>
                    <p style={{ margin: '1px 0' }}>Tổng máy: {attributes.totalComputers ?? 'N/A'}</p>
                    <p style={{ margin: '1px 0' }}>GV: {attributes.gvCount ?? 'N/A'} | HS/SV: {attributes.hsCount ?? 'N/A'} | Khác: {attributes.otherCount ?? 'N/A'}</p>
                    <p style={{ margin: '1px 0' }}>Trạng thái: {attributes.trangThai || 'N/A'}</p>
                    {attributes.moTa && <p style={{ margin: '1px 0' }}>Mô tả: {attributes.moTa}</p>}
                </>
            )}
            {attributes.type === 'floor' && <p style={{ margin: '1px 0' }}>{/* Thông tin tầng nếu có */}</p>}
            {attributes.type === 'building' && <p style={{ margin: '1px 0' }}>{/* Thông tin tòa nhà nếu có */}</p>}
        </div>
    );
};

// --- Main Component ---
const AdminDashboard = () => {
    const loaderResult = useLoaderData();
    const navigate = useNavigate();

    // --- State ---
    const [isLoading, setIsLoading] = useState(true);
    // REMOVED: Loại bỏ state 'error' để không chặn render toàn màn hình
    // const [error, setError] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [roomStats, setRoomStats] = useState([]);
    const [timeSeriesData, setTimeSeriesData] = useState([]);
    const [buildingsData, setBuildingsData] = useState([]);
    const [floorsData, setFloorsData] = useState([]);
    const [roomsData, setRoomsData] = useState([]);
    const [collapsed, setCollapsed] = useState(false);

    // --- useEffect Hook để xử lý dữ liệu từ Loader ---
    useEffect(() => {
        const logPrefix = `[EFFECT LOADER DATA][${new Date().toISOString()}]`;
        console.log(`${logPrefix} Processing loader result:`, loaderResult);
        setIsLoading(true);
        // REMOVED: Bỏ reset error
        // setError(null);
        setAuthError(null);
        // Đảm bảo các state được reset hoặc khởi tạo với mảng rỗng để UI không bị "lỗi data"
        setRoomStats([]);
        setTimeSeriesData([]);
        setBuildingsData([]);
        setFloorsData([]);
        setRoomsData([]);

        if (loaderResult?.error) {
            console.error(`${logPrefix} Loader error:`, loaderResult.message);
            if (loaderResult.type === 'auth') {
                setAuthError(loaderResult.message);
                setTimeout(() => {
                    Swal.fire({ title: 'Lỗi Xác Thực', text: loaderResult.message, icon: 'error', confirmButtonText: 'Đăng nhập', allowOutsideClick: false })
                        .then(() => navigate('/login'));
                }, 100);
            } else {
                // Thay vì đặt lỗi toàn màn hình, chỉ log và cố gắng hiển thị partial data nếu có
                // REMOVED: Bỏ setError
                // setError(loaderResult.message);
                if (loaderResult.data) { // Xử lý partial data
                    console.warn(`${logPrefix} Processing partial data due to error.`);
                    const data = loaderResult.data;
                    setRoomStats(Array.isArray(data.roomStats) ? data.roomStats : []);
                    const rawTsData = Array.isArray(data.timeSeriesData) ? data.timeSeriesData : [];
                    const formattedTs = rawTsData
                        .filter(item => item && typeof item.time !== 'undefined')
                        .map(item => {
                            const timeMs = new Date(item.time).getTime();
                            if (isNaN(timeMs)) return null;
                            return { time: timeMs, 'Đang hoạt động': Number(item['Dang hoạt động'] || 0), 'Đã hỏng': Number(item['Đã hỏng'] || 0), 'Không hoạt động': Number(item['Không hoạt động'] || 0) };
                        })
                        .filter(item => item !== null).sort((a, b) => a.time - b.time);
                    setTimeSeriesData(formattedTs);
                    setBuildingsData(Array.isArray(data.buildings) ? data.buildings : []);
                    setFloorsData(Array.isArray(data.floors) ? data.floors : []);
                    setRoomsData(Array.isArray(data.rooms) ? data.rooms : []);
                } else {
                    console.warn(`${logPrefix} No partial data available. UI will show empty states for affected sections.`);
                    // Các state đã được reset về mảng rỗng ở đầu useEffect
                }
            }
        } else if (loaderResult?.data) { // Thành công
            console.log(`${logPrefix} Loader success, setting all data.`);
            const data = loaderResult.data;
            setRoomStats(Array.isArray(data.roomStats) ? data.roomStats : []);
            const rawTsData = Array.isArray(data.timeSeriesData) ? data.timeSeriesData : [];
            const formattedTs = rawTsData
                .filter(item => item && typeof item.time !== 'undefined')
                .map(item => {
                    const timeMs = new Date(item.time).getTime();
                    if (isNaN(timeMs)) return null;
                    return { time: timeMs, 'Đang hoạt động': Number(item['Dang hoạt động'] || 0), 'Đã hỏng': Number(item['Đã hỏng'] || 0), 'Không hoạt động': Number(item['Không hoạt động'] || 0) };
                })
                .filter(item => item !== null).sort((a, b) => a.time - b.time);
            setTimeSeriesData(formattedTs);
            setBuildingsData(Array.isArray(data.buildings) ? data.buildings : []);
            setFloorsData(Array.isArray(data.floors) ? data.floors : []);
            setRoomsData(Array.isArray(data.rooms) ? data.rooms : []);
        } else { // Trường hợp không mong muốn (loaderResult là null/undefined hoặc không có data/error)
            console.warn(`${logPrefix} Invalid or empty loader result. UI will show empty states.`);
            // Các state đã được reset về mảng rỗng ở đầu useEffect
        }
        setIsLoading(false); // Hoàn tất xử lý, dù có lỗi hay không, UI vẫn sẽ render
    }, [loaderResult, navigate]); // Thêm navigate vào dependencies

    // --- Memoized Data Processing ---
    const basicStats = useMemo(() => {
        // Đảm bảo roomStats là mảng trước khi reduce
        if (!Array.isArray(roomStats)) {
            return { totalWorking: 0, totalBroken: 0, totalComputers: 0 };
        }
        const totalWorking = roomStats.reduce((sum, room) => sum + (room.soMayDangHoatDong || 0), 0);
        const totalBroken = roomStats.reduce((sum, room) => sum + (room.soMayDaHong || 0), 0);
        const totalComputers = totalWorking + totalBroken;
        return { totalWorking, totalBroken, totalComputers };
    }, [roomStats]);

    const derivedStats = useMemo(() => {
        const defaultResult = { workingPercentage: '0.0', brokenPercentage: '0.0', pieChartData: [] };
        if (!basicStats || typeof basicStats.totalComputers === 'undefined') {
            return defaultResult;
        }
        try {
            const { totalWorking, totalBroken, totalComputers } = basicStats;
            const workingPercentage = totalComputers > 0 ? ((totalWorking / totalComputers) * 100).toFixed(1) : '0.0';
            const brokenPercentage = totalComputers > 0 ? ((totalBroken / totalComputers) * 100).toFixed(1) : '0.0';
            const pieData = [
                { name: 'Đang hoạt động', value: totalWorking },
                { name: 'Đã hỏng', value: totalBroken }
            ].filter(d => d && typeof d.value === 'number' && d.value > 0);
            return { workingPercentage, brokenPercentage, pieChartData: pieData };
        } catch (e) {
            console.error("Error calculating derivedStats:", e);
            return defaultResult;
        }
    }, [basicStats]);

    const { totalWorking, totalBroken, totalComputers } = basicStats || { totalWorking: 0, totalBroken: 0, totalComputers: 0 };
    const { workingPercentage, brokenPercentage, pieChartData } = derivedStats || { workingPercentage: '0.0', brokenPercentage: '0.0', pieChartData: [] };

    const barChartData = useMemo(() => {
        if (!Array.isArray(roomStats)) return [];
        return roomStats.map((room) => ({ name: room.tenPhong || `Phòng ${room.maPhong || 'N/A'}`, 'Đang hoạt động': room.soMayDangHoatDong || 0, 'Đã hỏng': room.soMayDaHong || 0 }));
    }, [roomStats]);

    const chartDataSource = useMemo(() => {
        console.log("[Memo ChartData] Processing data for organizational chart...");
        // Không cần kiểm tra loaderHasError nữa vì UI không bị chặn hoàn toàn

        if (!Array.isArray(buildingsData) || !Array.isArray(floorsData) || !Array.isArray(roomsData)) {
            // Đây là trường hợp dữ liệu được set về rỗng hoặc null do lỗi không xác định
            return { name: 'Hệ thống (Không có dữ liệu)', attributes: { type: 'root', empty: true }, children: [] };
        }

        if (buildingsData.length === 0 && floorsData.length === 0 && roomsData.length === 0) {
            // Trường hợp không có dữ liệu thật sự, có thể do lỗi API hoặc không có dữ liệu trong DB
            return { name: 'Hệ thống (Không có dữ liệu)', attributes: { type: 'root', empty: true }, children: [] };
        }

        try {
            const buildingNodes = buildingsData.map(building => {
                const buildingFloors = floorsData.filter(floor => floor.toaNha?.maToaNha === building.maToaNha);
                return {
                    name: building.tenToaNha || `Tòa nhà ${building.maToaNha || 'N/A'}`,
                    attributes: { type: 'building', id: building.maToaNha },
                    children: buildingFloors.map(floor => {
                        const floorRooms = roomsData.filter(room => room.tang?.maTang === floor.maTang);
                        return {
                            name: floor.tenTang || `Tầng ${floor.maTang || 'N/A'}`,
                            attributes: { type: 'floor', id: floor.maTang },
                            children: floorRooms.map(room => {
                                let gvCount = 0, hsCount = 0, otherCount = 0;
                                if (room.mayTinhs && Array.isArray(room.mayTinhs)) {
                                    room.mayTinhs.forEach(c => { const m = c.moTa?.toLowerCase(); if (m === 'gv') gvCount++; else if (m === 'hs' || m === 'sv') hsCount++; });
                                    const totalReported = room.soMay || (gvCount + hsCount); otherCount = Math.max(0, totalReported - gvCount - hsCount);
                                } else { otherCount = room.soMay || 0; }
                                const totalComputersInRoom = room.soMay ?? (gvCount + hsCount + otherCount);
                                return { name: room.tenPhong || `Phòng ${room.maPhong || 'N/A'}`, attributes: { type: 'room', id: room.maPhong, gvCount, hsCount, otherCount, totalComputers: totalComputersInRoom, trangThai: room.trangThai || 'N/A', moTa: room.moTa || '' } };
                            })
                        };
                    })
                };
            });
            if (buildingNodes.length === 0 && (buildingsData.length > 0 || floorsData.length > 0 || roomsData.length > 0)) {
                console.warn("[Memo ChartData] Input data exists, but result tree is empty. Likely data mismatch.");
                return { name: 'Hệ thống (Không thể tạo cây)', attributes: { type: 'root', empty: true }, children: [] };
            } else if (buildingNodes.length === 0) {
                return { name: 'Hệ thống (Không có tòa nhà)', attributes: { type: 'root', empty: true }, children: [] };
            }
            return { name: 'Hệ thống Phòng máy', attributes: { type: 'root' }, children: buildingNodes };
        } catch (processingError) {
            console.error("[Memo ChartData] Error processing chart data:", processingError);
            return { name: 'Lỗi Xử Lý Cấu Trúc', attributes: { type: 'root', error: true, message: processingError.message }, children: [] };
        }
    }, [buildingsData, floorsData, roomsData]); // Đã bỏ 'loaderResult?.error', 'loaderResult?.type' khỏi dependencies vì không phụ thuộc vào trạng thái lỗi của loader nữa.

    // --- Chart Renderers ---
    const renderCustomizedLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (!percent || percent < 0.03) return null;
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize="11px" fontWeight="bold">
                {(percent * 100).toFixed(0)}%
            </text>
        );
    }, []);

    const renderOrgChartNodes = useCallback((node) => {
        if (!node) return null;
        const nodeType = node.attributes?.type || 'unknown';
        const nodeLabelContent = (
            <StyledNode nodeType={nodeType}>
                {nodeType === 'root' && <ClusterOutlined className="node-icon" />}
                {nodeType === 'building' && <ApartmentOutlined className="node-icon" />}
                {nodeType === 'floor' && <BuildOutlined className="node-icon" />}
                {nodeType === 'room' && <DesktopOutlined className="node-icon" />}
                <span className="node-name">{node.name}</span>
                {nodeType === 'room' && node.attributes && (
                    <div className='node-details'>
                        <span>Tổng: {node.attributes.totalComputers ?? '?'} | </span>
                        <span>GV: {node.attributes.gvCount ?? '?'} | </span>
                        <span>HS: {node.attributes.hsCount ?? '?'}</span>
                        {node.attributes.otherCount > 0 && <span> | Khác: {node.attributes.otherCount}</span>}
                        <br/>
                        <span>{node.attributes.trangThai || 'N/A'}</span>
                    </div>
                )}
            </StyledNode>
        );

        return (
            <TreeNode
                key={node.attributes?.id || node.name}
                label={<AntTooltip title={getNodeTooltipContent(node)} placement="bottom" mouseEnterDelay={0.3}>{nodeLabelContent}</AntTooltip>}
            >
                {Array.isArray(node.children) && node.children.map(childNode => renderOrgChartNodes(childNode))}
            </TreeNode>
        );
    }, []);

    // --- Render Logic ---
    const renderContent = () => {
        // Chỉ xử lý lỗi xác thực, các lỗi khác sẽ không chặn render UI chính
        if (authError) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}><Spin size="large" tip={authError} /></div>;

        // `isLoading` chỉ áp dụng cho lần load đầu.
        // Sau khi load xong (dù thành công hay lỗi API), isLoading sẽ là false và UI sẽ render.
        // Các biểu đồ sẽ tự động hiển thị Empty nếu không có dữ liệu.
        if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 150px)' }}><Spin size="large" tip="Đang tải dữ liệu..." /></div>;

        // Các biến kiểm tra dữ liệu để hiển thị Empty component
        const hasRoomStatsData = Array.isArray(roomStats) && roomStats.length > 0;
        const hasTimeSeriesData = Array.isArray(timeSeriesData) && timeSeriesData.length > 0;
        const hasPieData = Array.isArray(pieChartData) && pieChartData.length > 0;
        const chartDataIsError = chartDataSource?.attributes?.error; // Lỗi khi tự tạo cây
        const chartDataIsEmpty = chartDataSource?.attributes?.empty; // Dữ liệu rỗng hoặc không thể tạo cây
        const hasValidChartData = chartDataSource && !chartDataIsError && !chartDataIsEmpty && Array.isArray(chartDataSource.children) && chartDataSource.children.length > 0;

        return (
            <>
                <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Bảng điều khiển Quản trị</Title>
                {/* Statistics Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
                    <Col xs={24} sm={12} lg={8}> <Card bordered={false} hoverable><Statistic title="Máy hoạt động" value={totalWorking} /> <Statistic title="Tỉ lệ HĐ" value={parseFloat(workingPercentage)} precision={1} suffix="%" valueStyle={{ color: '#3f8600', fontSize: '14px' }} /> </Card> </Col>
                    <Col xs={24} sm={12} lg={8}> <Card bordered={false} hoverable><Statistic title="Máy hỏng" value={totalBroken} /> <Statistic title="Tỉ lệ hỏng" value={parseFloat(brokenPercentage)} precision={1} suffix="%" valueStyle={{ color: '#cf1322', fontSize: '14px' }} /> </Card> </Col>
                    <Col xs={24} sm={12} lg={8}> <Card bordered={false} hoverable><Statistic title="Tổng máy (Working + Broken)" value={totalComputers} /> </Card> </Col>
                </Row>

                {/* Organizational Chart */}
                <div style={{ marginBottom: '32px' }}>
                    <Title level={3} style={{ marginBottom: '16px' }}>Sơ đồ cấu trúc Phòng máy</Title>
                    <Card bordered={false}>
                        <div style={{ overflowX: 'auto', padding: '20px', background: '#f9f9f9', borderRadius: '4px', minHeight: '250px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            {chartDataIsError ? <Empty description={<span style={{color: 'red'}}>{chartDataSource?.attributes?.message || 'Lỗi xử lý dữ liệu cấu trúc.'}</span>}/>
                                : chartDataIsEmpty ? <Empty description="Chưa có dữ liệu cấu trúc."/>
                                    : hasValidChartData ? <Tree lineWidth={'2px'} lineColor={'#bbc'} lineBorderRadius={'10px'} label={ <AntTooltip title={getNodeTooltipContent(chartDataSource)}><StyledNode nodeType='root'><ClusterOutlined className="node-icon" /><span className="node-name">{chartDataSource.name}</span></StyledNode></AntTooltip> } >{chartDataSource.children.map(node => renderOrgChartNodes(node))}</Tree>
                                        : <Empty description="Không có dữ liệu cấu trúc để hiển thị."/>}
                        </div>
                    </Card>
                </div>

                {/* Bar, Pie, Line Charts */}
                <Row gutter={[16, 32]} style={{ marginBottom: '32px' }}>
                    {/* Bar Chart */}
                    <Col xs={24} lg={12}>
                        <Title level={4} style={{ marginBottom: '16px' }}>Trạng thái máy (theo Phòng)</Title>
                        <Card bordered={false}>
                            {hasRoomStatsData ? <ResponsiveContainer width="100%" height={350}><BarChart data={barChartData} margin={{ top: 5, right: 5, left: -15, bottom: 60 }} barGap={5} barSize={20}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={10} height={70} tick={{ fill: '#666' }}/><YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#666' }}/><RechartsTooltip cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}/><Legend verticalAlign="top" height={36}/><Bar dataKey="Đang hoạt động" fill="#82ca9d" stackId="a"/><Bar dataKey="Đã hỏng" fill="#ff7373" stackId="a" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer>
                                : <Empty description="Không có dữ liệu trạng thái phòng." style={{height: '350px', display:'flex', alignItems:'center', justifyContent:'center'}}/>}
                        </Card>
                    </Col>
                    {/* Pie Chart */}
                    <Col xs={24} lg={12}>
                        <Title level={4} style={{ marginBottom: '16px' }}>Tỉ lệ trạng thái (Tổng thể)</Title>
                        <Card bordered={false}>
                            {hasPieData ? <ResponsiveContainer width="100%" height={350}><PieChart><Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} label={renderCustomizedLabel} outerRadius={110} innerRadius={40} fill="#8884d8" dataKey="value" paddingAngle={2}>{pieChartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#fff" style={{transition: 'opacity 0.2s'}}/> ))}</Pie><RechartsTooltip formatter={(value, name) => [`${value} máy (${totalComputers > 0 ? ((value / totalComputers) * 100).toFixed(1) : 0}%)`, name]}/><Legend verticalAlign="bottom" height={36} iconType="circle"/></PieChart></ResponsiveContainer>
                                : <Empty description="Không có dữ liệu tỉ lệ trạng thái." style={{height: '350px', display:'flex', alignItems:'center', justifyContent:'center'}}/>}
                        </Card>
                    </Col>
                </Row>
                {/* Time-Series Chart */}
                <div style={{ marginBottom: '24px' }}>
                    <Title level={4} style={{ marginBottom: '16px' }}>Biến động trạng thái theo thời gian</Title>
                    <Card bordered={false}>
                        {hasTimeSeriesData ? <ResponsiveContainer width="100%" height={400}><LineChart data={timeSeriesData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" type="number" scale="time" domain={['auto', 'auto']} tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()} name="Thời gian" tick={{ fontSize: 11, fill: '#666' }}/><YAxis allowDecimals={false} name="Số lượng máy" tick={{ fontSize: 11, fill: '#666' }}/><RechartsTooltip labelFormatter={(value) => new Date(value).toLocaleString()} /><Legend verticalAlign="top" height={36}/>{timeSeriesData.some(d => d['Đang hoạt động'] > 0) && <Line type="monotone" dataKey="Đang hoạt động" stroke="#82ca9d" strokeWidth={2} activeDot={{ r: 6 }} dot={false}/>}{timeSeriesData.some(d => d['Đã hỏng'] > 0) && <Line type="monotone" dataKey="Đã hỏng" stroke="#FF0000" strokeWidth={2} activeDot={{ r: 6 }} dot={false}/>}{timeSeriesData.some(d => d['Không hoạt động'] > 0) && <Line type="monotone" dataKey="Không hoạt động" stroke="#FFA500" strokeWidth={2} activeDot={{ r: 6 }} dot={false}/>}</LineChart></ResponsiveContainer>
                            : <Empty description="Không có dữ liệu thống kê theo thời gian." style={{height: '400px', display:'flex', alignItems:'center', justifyContent:'center'}}/>}
                    </Card>
                </div>
            </>
        );
    };

    // --- Component Return ---
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout className="site-layout">
                <Header className="site-layout-background" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    backgroundColor: '#fff', padding: '0 24px',
                    borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10,
                }} >
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Popover content={<div>Xem thống kê tổng quan</div>} trigger="hover">
                            <SettingOutlined style={{ marginRight: 12, cursor: 'pointer', fontSize: '1.5rem', color: '#555' }} />
                        </Popover>
                        <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                            Bảng điều khiển Thống kê
                        </Title>
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <DarkModeToggle />
                        <AntTooltip title="Làm mới dữ liệu">
                            <AntButton
                                icon={<SyncOutlined />}
                                onClick={() => navigate('.', { replace: true })}
                                loading={isLoading} // Sử dụng isLoading để hiển thị trạng thái loading của nút refresh
                            />
                        </AntTooltip>
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px', padding: 0, overflow: 'initial' }}>
                    <div style={{ padding: 24, background: '#f9f9f9', minHeight: 'calc(100vh - 64px - 48px)' }}>
                        {renderContent()}
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminDashboard;