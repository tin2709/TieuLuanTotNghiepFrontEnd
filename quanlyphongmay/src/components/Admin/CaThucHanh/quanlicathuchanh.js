// src/pages/QuanLyCaThucHanh.js
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
    CalendarOutlined,
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
import * as DarkReader from "darkreader";
import SidebarAdmin from '../Sidebar/SidebarAdmin';
import dayjs from 'dayjs'; // Still used for display formatting

// Import the custom hook
import useCaThucHanhManager from './useCaThucHanhLogic';

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
const EditableCell = ({ editing, dataIndex, title, inputType, children, form, options = [], ...restProps }) => {
    let inputNode;
    const safeTitle = title || '';
    let rules = [{ required: true, message: `Vui lòng nhập ${safeTitle.toLowerCase()}!` }];

    if (inputType === 'number') {
        inputNode = <InputNumber style={{ width: '100%' }} min={ (dataIndex === 'tietBatDau' || dataIndex === 'tietKetThuc' || dataIndex === 'buoiSo') ? 1 : undefined } />;
        if (dataIndex === 'tietBatDau' || dataIndex === 'tietKetThuc' || dataIndex === 'buoiSo') {
            rules.push({ type: 'integer', min: 1, message: `${safeTitle} phải là số nguyên dương!` });
        }
    } else if (inputType === 'date') {
        inputNode = <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />;
    } else if (inputType === 'select') {
        inputNode = (
            <Select
                style={{ width: '100%' }}
                placeholder={`Chọn ${safeTitle.toLowerCase()}`}
                options={options}
                showSearch
                filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
            />
        );
    } else { // text
        inputNode = <Input style={{ width: '100%' }} />;
    }

    if (dataIndex === 'tietKetThuc') {
        rules.push(({ getFieldValue }) => ({
            validator(_, value) {
                const tietBatDau = getFieldValue('tietBatDau');
                if (!value || !tietBatDau || tietBatDau === '') return Promise.resolve();
                if (parseInt(value, 10) > parseInt(tietBatDau, 10)) return Promise.resolve();
                return Promise.reject(new Error('Tiết kết thúc phải sau tiết bắt đầu!'));
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


const QuanLyCaThucHanh = () => {
    // Destructure all the necessary state and functions from the custom hook
    const {
        caThucHanhData,
        loading,
        pagination,
        selectedRowKeys,
        giaoVienOptions,
        phongMayOptions,
        monHocOptions,
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
    } = useCaThucHanhManager();

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
                    min={0} // Can add more specific min/max if needed
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
        { title: 'Mã Ca', dataIndex: 'maCa', key: 'maCa', width: 100, render: (text) => text || '(Tự động)' },
        { title: 'Tên Ca', dataIndex: 'tenCa', key: 'tenCa', width: 180, editable: true },
        { title: 'Ngày Thực Hành', dataIndex: 'ngayThucHanh', key: 'ngayThucHanh', width: 130, editable: true, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Tiết BĐ', dataIndex: 'tietBatDau', key: 'tietBatDau', width: 90, align: 'center', editable: true },
        { title: 'Tiết KT', dataIndex: 'tietKetThuc', key: 'tietKetThuc', width: 90, align: 'center', editable: true },
        { title: 'Buổi Số', dataIndex: 'buoiSo', key: 'buoiSo', width: 90, align: 'center', editable: true },
        {
            title: 'Giáo Viên', dataIndex: 'maGiaoVien', key: 'maGiaoVien', width: 200, editable: true,
            render: (text, record) => {
                const selectedOption = giaoVienOptions.find(opt => opt.value === text);
                // Fallback to record.giaoVien?.hoTen if text (maGiaoVien) doesn't map to an option (e.g. initial load)
                return selectedOption ? selectedOption.label : (record.giaoVien?.hoTen || text || 'N/A');
            }
        },
        {
            title: 'Phòng Máy', dataIndex: 'maPhong', key: 'maPhong', width: 150, editable: true,
            render: (text, record) => {
                const selectedOption = phongMayOptions.find(opt => opt.value === text);
                return selectedOption ? selectedOption.label : (record.phongMay?.tenPhong || text || 'N/A');
            }
        },
        {
            title: 'Môn Học', dataIndex: 'maMon', key: 'maMon', width: 200, editable: true,
            render: (text, record) => {
                const selectedOption = monHocOptions.find(opt => opt.value === text);
                return selectedOption ? selectedOption.label : (record.monHoc?.tenMon || text || 'N/A');
            }
        },
    ], [isEditing, hoveredRowKey, save, cancel, handleAddBelow, edit, handleDelete, giaoVienOptions, phongMayOptions, monHocOptions]);

    const mergedColumns = useMemo(() => columns.map((col) => {
        if (col.key === 'stt' || !col.editable) return col; // If not editable, return as is
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'ngayThucHanh' ? 'date' :
                    (col.dataIndex === 'tietBatDau' || col.dataIndex === 'tietKetThuc' || col.dataIndex === 'buoiSo') ? 'number' :
                        (col.dataIndex === 'maGiaoVien' || col.dataIndex === 'maPhong' || col.dataIndex === 'maMon') ? 'select' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
                form: form,
                options: col.dataIndex === 'maGiaoVien' ? giaoVienOptions :
                    col.dataIndex === 'maPhong' ? phongMayOptions :
                        col.dataIndex === 'maMon' ? monHocOptions : [],
            }),
        };
    }), [columns, isEditing, form, giaoVienOptions, phongMayOptions, monHocOptions]); // Dependencies for useMemo

    const rowSelection = { selectedRowKeys, onChange: onSelectChange, getCheckboxProps: (record) => ({ disabled: record.isNew }) };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={false} onCollapse={() => {}} /> {/* Collapsed state managed internally by Sidebar, or passed from higher up */}
            <Layout>
                <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                        <Popover content={<div>Quản lý danh sách các ca thực hành</div>} trigger="hover"><CalendarOutlined style={{ marginRight: 8, cursor: 'pointer' }} /></Popover>
                        Quản Lý Ca Thực Hành
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
                                    dataSource={caThucHanhData}
                                    columns={mergedColumns}
                                    rowKey="key"
                                    rowClassName={(record) => `editable-row ${hoveredRowKey === record.key && !isEditing(record) ? 'row-hover-actions' : ''}`}
                                    loading={loading}
                                    pagination={{ ...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} mục`}}
                                    onChange={handleTableChange}
                                    scroll={{ x: 1300 }}
                                    size="small"
                                    onRow={(record) => ({
                                        onMouseEnter: () => { if (!editingKey) setHoveredRowKey(record.key); },
                                        onMouseLeave: () => { if (!editingKey) setHoveredRowKey(''); }
                                    })}
                                />
                            </div>
                        </Form>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {!showGlobalAddButton && caThucHanhData.length < pagination.pageSize && caThucHanhData.length > 0 && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Ca Thực Hành</AntButton>
                            )}
                            {caThucHanhData.length === 0 && !loading && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Ca Thực Hành đầu tiên</AntButton>
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
export default QuanLyCaThucHanh;