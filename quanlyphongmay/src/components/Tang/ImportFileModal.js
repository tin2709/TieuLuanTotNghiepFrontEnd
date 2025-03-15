import React, { useState } from 'react';
import { Modal, Button, Upload, Table } from 'antd';
import { InboxOutlined, EyeOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import axios from 'axios';

const { Dragger } = Upload;

const ImportFileModal = ({ visible, onCancel, loading, onImport }) => {
    const [fileList, setFileList] = useState([]);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewData, setPreviewData] = useState([]);
    const [previewColumns, setPreviewColumns] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);

    const uploadProps = {
        name: 'file',
        multiple: false,
        beforeUpload: (file) => {
            return true; // Allow all file types
        },
        onChange: (info) => {
            const { status } = info.file;
            if (status === 'done') {
                Swal.fire('Success', `${info.file.name} uploaded successfully.`, 'success');
            } else if (status === 'error') {
                Swal.fire('Success', `${info.file.name} uploaded successfully.`, 'success');
            }
            setFileList([info.file]); // Keep only the most recent file
        },
        onRemove: (file) => {
            setFileList((prev) => prev.filter((item) => item.uid !== file.uid)); // Remove file
            setPreviewData([]); // Clear preview data when file is removed
            setPreviewColumns([]);
        },
        fileList: fileList,
    };

    const handleImport = async () => {
        if (fileList.length > 0) {
            const formData = new FormData();
            formData.append('file', fileList[0].originFileObj);

            try {
                const token = localStorage.getItem("authToken");
                formData.append("token", token); // Append token to form data

                const response = await axios.post('https://localhost:8080/importTang', formData);

                Swal.fire('Success', response.data, 'success'); // Show success message
                onImport(fileList[0]); // Call onImport function
                onCancel(); // Close modal
            } catch (error) {
                if (error.response) {
                    Swal.fire('Error', error.response.data, 'error'); // Show error message from server
                } else {
                    Swal.fire('Error', 'An error occurred during the upload process.', 'error');
                }
            }
        } else {
            Swal.fire('Error', 'Please select a file to upload!', 'error');
        }
    };

    const handlePreview = async () => {
        if (fileList.length > 0) {
            const formData = new FormData();
            formData.append('file', fileList[0].originFileObj);
            const token = localStorage.getItem("authToken");
            formData.append("token", token);

            try {
                setPreviewLoading(true);
                const response = await axios.post('https://localhost:8080/previewCSV', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                const data = response.data;
                if (data && data.length > 0) {
                    // Giả sử dữ liệu trả về là một mảng 2D, với hàng đầu tiên là tiêu đề cột
                    const headers = data[0];  // Hàng đầu tiên là các tiêu đề cột
                    const columns = headers.map((header, index) => ({
                        title: header,  // Tên tiêu đề cột
                        dataIndex: index.toString(),  // Dùng index làm dataIndex cho bảng
                        key: index.toString(),  // Cần có key để Ant Design quản lý
                    }));

                    // Chuyển đổi các hàng dữ liệu còn lại vào dạng bảng Ant Design
                    const tableData = data.slice(1).map((row, rowIndex) => {
                        const rowData = { key: rowIndex.toString() };  // Tạo key cho mỗi hàng
                        row.forEach((cell, cellIndex) => {
                            rowData[cellIndex.toString()] = cell;  // Gán dữ liệu vào các cột
                        });
                        return rowData;
                    });

                    // Cập nhật các cột và dữ liệu vào state để hiển thị trong bảng
                    setPreviewColumns(columns);
                    setPreviewData(tableData);
                    setPreviewVisible(true);
                } else {
                    Swal.fire('Info', 'The file is empty or has no data to preview.', 'info');
                }
            } catch (error) {
                if (error.response) {
                    Swal.fire('Error', error.response.data || 'Error fetching preview data.', 'error');
                } else {
                    Swal.fire('Error', 'An error occurred while fetching preview data.', 'error');
                }
            } finally {
                setPreviewLoading(false);
            }
        } else {
            Swal.fire('Error', 'Please select a file to preview!', 'error');
        }
    };


    const closePreviewModal = () => {
        setPreviewVisible(false);
    }

    return (
        <>
            <Modal
                title="Import Danh Sách Tầng Từ File"
                visible={visible}
                onCancel={onCancel}
                footer={[
                    <Button key="cancel" onClick={onCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="preview"
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={handlePreview}
                        disabled={fileList.length === 0}
                    >
                        Preview
                    </Button>,
                    <Button key="submit" type="primary" loading={loading} onClick={handleImport}>
                        Import
                    </Button>,
                ]}
            >
                <Dragger {...uploadProps}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Click or drag a file here to upload</p>
                    <p className="ant-upload-hint">Accepts all file types</p>
                </Dragger>
            </Modal>

            <Modal
                title="Preview Data"
                visible={previewVisible}
                onCancel={closePreviewModal}
                width={1000}
                footer={[
                    <Button key="close" onClick={closePreviewModal}>
                        Close
                    </Button>
                ]}
            >
                <Table
                    columns={previewColumns}
                    dataSource={previewData}
                    loading={previewLoading}
                    scroll={{ x: 'max-content' }} // Enable horizontal scrolling for wide tables
                />
            </Modal>
        </>
    );
};

export default ImportFileModal;