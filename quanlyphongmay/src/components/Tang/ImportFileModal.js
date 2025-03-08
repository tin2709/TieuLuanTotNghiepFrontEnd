import React, { useState } from 'react';
import { Modal, Button, Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import axios from 'axios';

const { Dragger } = Upload;

const ImportFileModal = ({ visible, onCancel, loading, onImport }) => {
    const [fileList, setFileList] = useState([]);

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

    return (
        <Modal
            title="Import Danh Sách Tầng Từ File"
            visible={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancel
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
    );
};

export default ImportFileModal;
