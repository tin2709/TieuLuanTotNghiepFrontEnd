// src/pages/QuanLyMonHoc.js
import React, { useCallback, useMemo } from 'react';
import {
    Table,
    Layout,
    Popover,
    Button as AntButton,
    Tooltip,
    DatePicker,
    Form,
    Select,
    Input,
    InputNumber,
    Row,
    Col,
    Space,
} from 'antd';
import {
    BookOutlined,
    SunOutlined,
    MoonOutlined,
    ClearOutlined,
    PlusCircleFilled,
    EditFilled,
    DeleteFilled,
    SaveOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    DeleteOutlined as DeleteBulkOutlined,
} from '@ant-design/icons';
import { Header, Content } from "antd/es/layout/layout";
import * as DarkReader from "darkreader"; // Still used directly here for dark mode toggle
import SidebarAdmin from '../Sidebar/SidebarAdmin';
import dayjs from 'dayjs'; // Still used for display formatting

// Import the custom hook
import useMonHocManager from './useQuanLyMonHocLogic';

const { Option } = Select;
const { RangePicker } = DatePicker;

// DarkModeToggle can stay here as it's a small self-contained component for the UI
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(false); // Use React.useState
    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
    React.useEffect(() => { // Use React.useEffect
        if (isDarkMode) DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
        else DarkReader.disable();
    }, [isDarkMode]);
    return <AntButton icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />} onClick={toggleDarkMode} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }} />;
};

// EditableCell component remains here as it's a render prop for Ant Design Table
const EditableCell = ({ editing, dataIndex, title, inputType, children, form, ...restProps }) => {
    let inputNode;
    if (inputType === 'number') {
        inputNode = <InputNumber style={{ width: '100%' }} />;
    } else if (inputType === 'date') {
        inputNode = <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />;
    } else {
        inputNode = <Input style={{ width: '100%' }} />;
    }
    const safeTitle = title || '';
    let rules = [{ required: true, message: `Vui lòng nhập ${safeTitle.toLowerCase()}!` }];
    if (dataIndex === 'soBuoi') rules.push({ type: 'number', min: 1, message: 'Số buổi phải lớn hơn 0' });
    if (dataIndex === 'ngayKetThuc') {
        rules.push(({ getFieldValue }) => ({
            validator(_, value) {
                const ngayBatDau = getFieldValue('ngayBatDau');
                if (!value || !ngayBatDau) return Promise.resolve();
                if (dayjs(value).isAfter(ngayBatDau)) return Promise.resolve();
                return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu!'));
            },
        }));
    }
    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item name={dataIndex} style={{ margin: 0 }} rules={rules}>
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const QuanLyMonHoc = () => {
    // Destructure all the necessary state and functions from the custom hook
    const {
        monHocData,
        loading,
        pagination,
        selectedRowKeys,
        editingKey,
        hoveredRowKey,
        setHoveredRowKey,
        isEditing,
        edit,
        cancel,
        save,
        handleDelete,
        handleAddBelow,
        handleGlobalAddNew,
        handleDeleteSelected,
        searchFieldValue,
        searchOperatorValue,
        searchInput,
        searchDateValue,
        searchDateRangeValue,
        handleFieldChange,
        handleOperatorChange,
        handleValueChange,
        handleClearSearch,
        searchFieldsOptions,
        getFilteredOperators,
        selectedFieldType,
        operatorRequiresValue,
        isDateRangeOperator,
        isListOperator,
        form,
        tableRef,
        handleTableChange,
        onSelectChange,
        hasSelected,
        showGlobalAddButton,
    } = useMonHocManager();

    // The render function for the dynamic search input, based on hook's states
    const renderValueInputComponent = useCallback(() => {
        if (searchOperatorValue && !operatorRequiresValue) {
            return <Input disabled placeholder="Không cần giá trị" />;
        }
        if (selectedFieldType === 'date') {
            return isDateRangeOperator ? (
                <RangePicker
                    style={{ width: '100%' }}
                    placeholder={["Từ ngày", "Đến ngày"]}
                    value={searchDateRangeValue}
                    onChange={handleValueChange}
                    format="DD/MM/YYYY"
                    allowClear
                />
            ) : (
                <DatePicker
                    style={{ width: '100%' }}
                    placeholder="Chọn ngày"
                    value={searchDateValue}
                    onChange={handleValueChange}
                    format="DD/MM/YYYY"
                    allowClear
                />
            );
        }
        if (selectedFieldType === 'number' && !isListOperator) {
            return (
                <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Nhập giá trị số"
                    value={searchInput === '' ? null : Number(searchInput)}
                    onChange={(num) => handleValueChange(num)}
                    min={0}
                    allowClear
                />
            );
        }
        return (
            <Input
                style={{ width: '100%' }}
                placeholder={isListOperator ? "Giá trị 1,Giá trị 2,..." : "Nhập giá trị..."}
                value={searchInput}
                onChange={(e) => handleValueChange(e.target.value)}
                allowClear
            />
        );
    }, [
        searchOperatorValue, operatorRequiresValue, selectedFieldType, isDateRangeOperator, isListOperator,
        searchDateRangeValue, searchDateValue, searchInput, handleValueChange
    ]);

    // Define columns using useMemo to optimize re-renders
    const columns = useMemo(() => [
        {
            title: 'STT', dataIndex: 'stt', key: 'stt', width: 80, align: 'center',
            render: (text, record) => {
                const editableRow = isEditing(record);
                if (editableRow) {
                    return (
                        <Space style={{ justifyContent: 'center', width: '100%' }}>
                            <Tooltip title="Lưu"><AntButton type="link" shape="circle" icon={<SaveOutlined style={{color: 'green'}}/>} onClick={() => save(record.key)} /></Tooltip>
                            <Tooltip title="Hủy"><AntButton type="link" shape="circle" icon={<CloseCircleOutlined style={{color: 'red'}}/>} onClick={() => cancel(record.key)} /></Tooltip>
                        </Space>
                    );
                }
                if (hoveredRowKey === record.key) {
                    return (
                        <Space style={{ justifyContent: 'center', width: '100%', position: 'relative', bottom: '-8px' }}>
                            <Tooltip title="Thêm dòng mới bên dưới"><PlusCircleFilled style={{ color: '#1890ff', cursor: 'pointer', fontSize: '16px' }} onClick={() => handleAddBelow(record.key)} /></Tooltip>
                            <Tooltip title="Sửa dòng này"><EditFilled style={{ color: '#faad14', cursor: 'pointer', fontSize: '16px' }} onClick={() => edit(record)} /></Tooltip>
                            <Tooltip title="Xóa dòng này"><DeleteFilled style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }} onClick={() => handleDelete(record.key)} /></Tooltip>
                        </Space>
                    );
                }
                return text;
            }
        },
        { title: 'Mã Môn', dataIndex: 'maMon', key: 'maMon', width: 100, editable: (record) => record?.isNew, render: (text) => text || '(Tự động)' },
        { title: 'Tên Môn', dataIndex: 'tenMon', key: 'tenMon', width: 250, editable: true },
        { title: 'Ngày Bắt Đầu', dataIndex: 'ngayBatDau', key: 'ngayBatDau', width: 150, editable: true, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Ngày Kết Thúc', dataIndex: 'ngayKetThuc', key: 'ngayKetThuc', width: 150, editable: true, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Số Buổi', dataIndex: 'soBuoi', key: 'soBuoi', width: 100, align: 'center', editable: true },
    ], [isEditing, hoveredRowKey, save, cancel, handleAddBelow, edit, handleDelete]);

    const mergedColumns = useMemo(() => columns.map((col) => {
        if (col.key === 'stt') return col;
        const isActuallyEditable = (record) => typeof col.editable === 'function' ? (record ? col.editable(record) : false) : !!col.editable;
        if (!isActuallyEditable(undefined)) return col; // If col.editable is false or undefined, return as is
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'soBuoi' || (col.dataIndex === 'maMon' && record.isNew) ? 'number' : (col.dataIndex === 'ngayBatDau' || col.dataIndex === 'ngayKetThuc' ? 'date' : 'text'),
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isActuallyEditable(record) && isEditing(record),
                form: form,
            }),
        };
    }), [columns, isEditing, form]); // Dependencies for useMemo

    const rowSelection = { selectedRowKeys, onChange: onSelectChange, getCheckboxProps: (record) => ({ disabled: record.isNew }) };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={false} onCollapse={() => {}} /> {/* Collapsed state managed internally by Sidebar, or passed from higher up */}
            <Layout>
                <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                        <Popover content={<div>Quản lý danh sách các môn học</div>} trigger="hover"><BookOutlined style={{ marginRight: 8, cursor: 'pointer' }} /></Popover>
                        Quản Lý Môn Học
                    </div>
                    <Space>
                        {showGlobalAddButton && (<AntButton type="primary" icon={<PlusOutlined />} onClick={handleGlobalAddNew}>Tạo mới</AntButton>)}
                        <DarkModeToggle />
                    </Space>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360, borderRadius: '8px' }}>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="bottom">
                            <Col xs={24} sm={18} md={9} lg={8} xl={8}>
                                <Form.Item label="Giá trị tìm kiếm" style={{ marginBottom: 0 }}>
                                    {renderValueInputComponent()} {/* Use the dynamic input component */}
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                                <Form.Item label="Thuộc tính" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn thuộc tính"
                                        value={searchFieldValue}
                                        onChange={handleFieldChange}
                                        style={{ width: '100%' }}
                                        allowClear
                                    >
                                        {searchFieldsOptions.map(item => (<Option key={item.value} value={item.value}>{item.label}</Option>))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                                <Form.Item label="Phép toán" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn phép toán"
                                        value={searchOperatorValue}
                                        onChange={handleOperatorChange}
                                        style={{ width: '100%' }}
                                        disabled={!searchFieldValue}
                                        allowClear
                                    >
                                        {getFilteredOperators().map(item => (<Option key={item.value} value={item.value}>{item.label}</Option>))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={6} md={3} lg={2} xl={2}>
                                <AntButton icon={<ClearOutlined />} onClick={handleClearSearch} style={{ width: '100%' }} danger>
                                    Xóa lọc
                                </AntButton>
                            </Col>
                        </Row>

                        <Form form={form} component={false}>
                            <div ref={tableRef}>
                                <Table
                                    rowSelection={rowSelection}
                                    components={{ body: { cell: EditableCell } }}
                                    bordered
                                    dataSource={monHocData}
                                    columns={mergedColumns}
                                    rowKey="key"
                                    rowClassName={(record) => `editable-row ${hoveredRowKey === record.key && !isEditing(record) ? 'row-hover-actions' : ''}`}
                                    loading={loading}
                                    pagination={{ ...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} mục`}}
                                    onChange={handleTableChange}
                                    scroll={{ x: 1000 }}
                                    size="small"
                                    onRow={(record) => ({
                                        onMouseEnter: () => { if (!editingKey) setHoveredRowKey(record.key); },
                                        onMouseLeave: () => { if (!editingKey) setHoveredRowKey(''); }
                                    })}
                                />
                            </div>
                        </Form>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {!showGlobalAddButton && monHocData.length < pagination.pageSize && monHocData.length > 0 && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Môn Học</AntButton>
                            )}
                            {monHocData.length === 0 && !loading && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Môn Học đầu tiên</AntButton>
                            )}
                            {hasSelected && (
                                <AntButton type="danger" icon={<DeleteBulkOutlined />} onClick={handleDeleteSelected} style={{ width: '100%' }} disabled={loading}>
                                    Xóa {selectedRowKeys.length} dòng đã chọn
                                </AntButton>
                            )}
                        </div>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};
export default QuanLyMonHoc;