
import { useState } from "react"
import { Button, Input, Select, Checkbox, Form, Space } from "antd"
import { EditOutlined } from "@ant-design/icons"
import "./style.css"

const { Option } = Select
const { TextArea } = Input

export default function LabManagement() {
    const [editMode, setEditMode] = useState(true)
    const [formData, setFormData] = useState({
        tenPhong: "Lab H2.0.1",
        toaNha: "Tòa nhà H",
        tang: "Tầng 2",
        moTa: "Phòng máy H2.0.1",
        software: ["Eclipse", "Visual Studio Code", "My SQL"],
    })

    const handleEditClick = () => {
        setEditMode(true)
    }

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (value, name) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSoftwareChange = (checkedValues) => {
        setFormData({ ...formData, software: checkedValues })
    }

    const handleCancel = () => {
        setEditMode(false)
    }

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Quản Lý Phòng Máy</h1>
                <p>Thông tin chi tiết về phòng máy và cấu hình</p>
            </div>
            {!editMode ? (
                <Button icon={<EditOutlined />} onClick={handleEditClick}>
                    Chỉnh sửa
                </Button>
            ) : (
                <div className="edit-form">
                    <div className="form-title">
                        <h2>Thông Tin Phòng Máy</h2>
                    </div>
                    <Form layout="vertical">
                        <Form.Item
                            label={
                                <span>
                  Tên phòng <span className="required">*</span>
                </span>
                            }
                        >
                            <Input name="tenPhong" value={formData.tenPhong} onChange={handleInputChange} />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span>
                  Chọn tòa nhà <span className="required">*</span>
                </span>
                            }
                        >
                            <Select
                                value={formData.toaNha}
                                onChange={(value) => handleSelectChange(value, "toaNha")}
                                suffixIcon={<span className="select-arrow">▼</span>}
                            >
                                <Option value="Tòa nhà H">Tòa nhà H</Option>
                                <Option value="Tòa nhà A">Tòa nhà A</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label={
                                <span>
                  Chọn tầng <span className="required">*</span>
                </span>
                            }
                        >
                            <Select
                                value={formData.tang}
                                onChange={(value) => handleSelectChange(value, "tang")}
                                suffixIcon={<span className="select-arrow">▼</span>}
                            >
                                <Option value="Tầng 2">Tầng 2</Option>
                                <Option value="Tầng 1">Tầng 1</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Mô tả">
                            <TextArea name="moTa" value={formData.moTa} onChange={handleInputChange} rows={4} />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span>
                  Chọn ứng dụng phần mềm cho máy tính <span className="required">*</span>
                </span>
                            }
                            className="software-selection"
                        >
                            <Checkbox.Group
                                options={[
                                    { label: "Eclipse", value: "Eclipse" },
                                    { label: "IntelliJ IDEA", value: "IntelliJ IDEA" },
                                    { label: "Visual Studio Code", value: "Visual Studio Code" },
                                    { label: "My SQL", value: "My SQL" },
                                ]}
                                value={formData.software}
                                onChange={handleSoftwareChange}
                            />
                        </Form.Item>

                        <Form.Item className="action-buttons">
                            <Space>
                                <Button type="primary" className="save-button">
                                    Chỉnh sửa
                                </Button>
                                <Button danger className="cancel-button" onClick={handleCancel}>
                                    Khôi phục
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </div>
            )}
        </div>
    )
}

