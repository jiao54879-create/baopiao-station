// 保险产品中心页面
import { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Input, Select, Modal, Form,
  InputNumber, DatePicker, message, Statistic, Row, Col,
  Descriptions, Collapse, Empty, Alert, Upload, Spin
} from 'antd';
import {
  PlusOutlined, FireOutlined,
  ClockCircleOutlined, CheckCircleOutlined,
  UpCircleOutlined, DownCircleOutlined,
  SafetyOutlined, UploadOutlined
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import api from '../utils/api';

const { Search } = Input;
const { Panel } = Collapse;

// 状态映射
const statusMap: Record<string, { color: string; label: string; icon: any }> = {
  NEW: { color: 'green', label: '新上架', icon: <UpCircleOutlined /> },
  HOT: { color: 'red', label: '热门', icon: <FireOutlined /> },
  NORMAL: { color: 'blue', label: '在售', icon: <CheckCircleOutlined /> },
  OFFLINE: { color: 'default', label: '已下架', icon: <DownCircleOutlined /> }
};

// 险种映射
const typeMap: Record<string, { color: string; label: string }> = {
  CRITICAL_ILLNESS: { color: 'red', label: '重疾险' },
  MEDICAL: { color: 'blue', label: '医疗险' },
  TERM_LIFE: { color: 'purple', label: '定期寿险' },
  LIFE: { color: 'purple', label: '终身寿险' },
  ACCIDENT: { color: 'orange', label: '意外险' },
  ANNUITY: { color: 'gold', label: '年金险' },
  WHOLE_LIFE: { color: 'purple', label: '终身寿险' },
  INCREASING_LIFE: { color: 'volcano', label: '增额终身寿险' },
  CHILD: { color: 'magenta', label: '少儿保险' },
  GROUP: { color: 'cyan', label: '团体险' },
  CHILDREN_CRITICAL: { color: 'magenta', label: '少儿重疾险' },
  HEALTH: { color: 'cyan', label: '健康险' }
};

export default function Products() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  // 筛选条件
  const [status, setStatus] = useState<string>('');
  const [insuranceType, setInsuranceType] = useState<string>('');
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('hot');

  // 弹窗状态
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [form] = Form.useForm();

  // 上传解析弹窗状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);
  const [analyzeError, setAnalyzeError] = useState<string>('');

  // 处理文件上传和AI分析
  const handleAnalyzeUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    setAnalyzeError('');
    setAnalyzeResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file as any);

      const { data: res } = await api.post('/products/analyze-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 // 2分钟超时
      });

      if (res.success) {
        setAnalyzeResult(res.data);
        onSuccess?.(res.data);
        message.success('文档解析完成，请确认并编辑信息后提交');
      } else {
        setAnalyzeError(res.error || '解析失败');
        onError?.(new Error(res.error));
        message.error(res.error || '文档解析失败');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error || error.message || '上传失败';
      setAnalyzeError(errMsg);
      onError?.(new Error(errMsg));
      message.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  // 确认使用解析结果
  const handleConfirmAnalyze = () => {
    if (analyzeResult) {
      // 填充表单数据
      form.setFieldsValue({
        name: analyzeResult.name,
        company: analyzeResult.company,
        insuranceType: analyzeResult.insuranceType,
        priceAdult30: analyzeResult.priceAdult30,
        priceChild0: analyzeResult.priceChild0,
        highlightsSevere: analyzeResult.highlightsSevere,
        highlightsMild: analyzeResult.highlightsMild,
        highlightsWaiver: analyzeResult.highlightsWaiver,
        highlightsSpecial: analyzeResult.highlightsSpecial,
        highlightsValue: analyzeResult.highlightsValue,
        advantagesPrice: analyzeResult.advantagesPrice,
        advantagesCoverage: analyzeResult.advantagesCoverage,
        advantagesUW: analyzeResult.advantagesUW,
        advantagesService: analyzeResult.advantagesService,
        competitorComparison: analyzeResult.competitorComparison,
        drawbacks: analyzeResult.drawbacks,
        source: analyzeResult.source,
        notes: analyzeResult.notes
      });
      setUploadModalVisible(false);
      setModalVisible(true);
      setSelectedProduct(null); // 清除已选产品，确保是新增
    }
  };

  // 关闭上传弹窗时重置状态
  const handleCloseUploadModal = () => {
    setUploadModalVisible(false);
    setAnalyzeResult(null);
    setAnalyzeError('');
  };

  // 获取产品列表
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = { page: pagination.page, limit: pagination.limit };
      if (status) params.status = status;
      if (insuranceType) params.insuranceType = insuranceType;
      if (keyword) params.keyword = keyword;

      const { data: res } = await api.get('/products', { params });
      // 前端排序
      let sorted = [...res.data];
      const statusOrder: Record<string, number> = { HOT: 0, NEW: 1, NORMAL: 2 };
      if (sortBy === 'hot') {
        sorted.sort((a, b) => (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9));
      } else if (sortBy === 'new') {
        sorted.sort((a, b) => new Date(b.launchDate || 0).getTime() - new Date(a.launchDate || 0).getTime());
      } else if (sortBy === 'price') {
        sorted.sort((a, b) => Number(a.priceAdult30 || 99999) - Number(b.priceAdult30 || 99999));
      }
      setProducts(sorted);
      setPagination(prev => ({ ...prev, total: res.pagination.total }));
    } catch (error) {
      message.error('获取产品列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const { data: res } = await api.get('/products/stats/overview');
      setStats(res.data);
    } catch (error) {
      console.log('获取统计失败');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [pagination.page, status, insuranceType, sortBy]);

  // 搜索
  const handleSearch = (value: string) => {
    setKeyword(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 新增/编辑产品
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        priceAdult30: values.priceAdult30 || undefined,
        priceChild0: values.priceChild0 || undefined,
        launchDate: values.launchDate?.format('YYYY-MM-DD'),
        offlineDate: values.offlineDate?.format('YYYY-MM-DD'),
        estimatedOffline: values.estimatedOffline?.format('YYYY-MM-DD')
      };

      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/products', payload);
        message.success('添加成功');
      }

      setModalVisible(false);
      form.resetFields();
      fetchProducts();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失败');
    }
  };

  // 删除产品
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('删除成功');
      fetchProducts();
      fetchStats();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 查看详情
  const handleViewDetail = async (product: any) => {
    setSelectedProduct(product);
    setDetailVisible(true);
  };

  // 更新状态
  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/products/${id}/status`, { status: newStatus });
      message.success('状态更新成功');
      fetchProducts();
      fetchStats();
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: any) => (
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-gray-400">{record.company}</div>
        </div>
      )
    },
    {
      title: '险种',
      dataIndex: 'insuranceType',
      key: 'insuranceType',
      width: 90,
      render: (type: string) => (
        <Tag color={typeMap[type]?.color}>{typeMap[type]?.label || type}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color} icon={statusMap[status]?.icon}>
          {statusMap[status]?.label || status}
        </Tag>
      )
    },
    {
      title: '价格',
      key: 'price',
      width: 160,
      render: (_: any, record: any) => (
        <div className="text-sm">
          {record.priceAdult30 > 0 && (
            <div className="text-gray-600">
              成人：<span className="text-orange-500 font-medium">¥{Number(record.priceAdult30).toLocaleString()}/年</span>
            </div>
          )}
          {record.priceChild0 > 0 && (
            <div className="text-gray-600">
              儿童：<span className="text-green-500 font-medium">¥{Number(record.priceChild0).toLocaleString()}/年</span>
            </div>
          )}
          {!record.priceAdult30 && !record.priceChild0 && <span className="text-gray-400">-</span>}
        </div>
      )
    },
    {
      title: '上架时间',
      dataIndex: 'launchDate',
      key: 'launchDate',
      width: 100,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '预估下架',
      dataIndex: 'estimatedOffline',
      key: 'estimatedOffline',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const daysUntil = dayjs(date).diff(dayjs(), 'day');
        if (daysUntil < 0) return <Tag color="default">已过期</Tag>;
        if (daysUntil <= 30) return <Tag color="orange"><ClockCircleOutlined /> {daysUntil}天后</Tag>;
        return dayjs(date).format('YYYY-MM-DD');
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" onClick={() => {
            setSelectedProduct(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>编辑</Button>
          {record.status !== 'OFFLINE' ? (
            <Button type="link" danger onClick={() => handleUpdateStatus(record.id, 'OFFLINE')}>下架</Button>
          ) : (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'NORMAL')}>上架</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="产品总数" value={stats?.total || 0} prefix={<SafetyOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="新上架"
              value={stats?.newProducts || 0}
              prefix={<UpCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="热门产品"
              value={stats?.hotProducts || 0}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已下架"
              value={stats?.offlineProducts || 0}
              prefix={<DownCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选栏 */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <Space>
            <Search
              placeholder="搜索产品名称/公司"
              onSearch={handleSearch}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder="产品状态"
              allowClear
              value={status || undefined}
              onChange={(val) => { setStatus(val || ''); setPagination(prev => ({ ...prev, page: 1 })); }}
              style={{ width: 120 }}
            >
              {Object.entries(statusMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="险种类别"
              allowClear
              value={insuranceType || undefined}
              onChange={(val) => { setInsuranceType(val || ''); setPagination(prev => ({ ...prev, page: 1 })); }}
              style={{ width: 120 }}
            >
              {Object.entries(typeMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            setSelectedProduct(null);
            form.resetFields();
            setModalVisible(true);
          }}>
            添加产品
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => {
            setUploadModalVisible(true);
          }}>
            上传素材
          </Button>
        </div>
      </Card>

      {/* 产品列表 */}
      <Card>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page) => setPagination(prev => ({ ...prev, page })),
            showSizeChanger: false
          }}
        />
      </Card>

      {/* 添加/编辑弹窗 */}
      <Modal
        title={selectedProduct ? '编辑产品' : '添加产品'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="产品名称" rules={[{ required: true }]}>
                <Input placeholder="如：超级玛丽13号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="company" label="保险公司" rules={[{ required: true }]}>
                <Input placeholder="如：君龙人寿" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="insuranceType" label="险种类别" rules={[{ required: true }]}>
                <Select placeholder="选择险种">
                  {Object.entries(typeMap).map(([key, { label }]) => (
                    <Select.Option key={key} value={key}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="产品状态" initialValue="NEW">
                <Select>
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <Select.Option key={key} value={key}>{label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priceAdult30" label="成人年缴保费（30岁/30万/30年交）">
                <InputNumber prefix="¥" style={{ width: '100%' }} placeholder="3000" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priceChild0" label="儿童年缴保费（0岁/50万/30年交）">
                <InputNumber prefix="¥" style={{ width: '100%' }} placeholder="2500" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="launchDate" label="上架时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="offlineDate" label="实际下架时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="estimatedOffline" label="预估下架时间">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="sourceUrl" label="来源链接">
            <Input placeholder="产品资料来源URL" />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="产品备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 产品详情弹窗 */}
      <Modal
        title={selectedProduct?.name}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          <Button key="edit" type="primary" onClick={() => {
            setDetailVisible(false);
            form.setFieldsValue(selectedProduct);
            setModalVisible(true);
          }}>编辑</Button>
        ]}
        width={900}
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* 基本信息 */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="产品名称">{selectedProduct.name}</Descriptions.Item>
              <Descriptions.Item label="保险公司">{selectedProduct.company}</Descriptions.Item>
              <Descriptions.Item label="险种类别">
                <Tag color={typeMap[selectedProduct.insuranceType]?.color}>
                  {typeMap[selectedProduct.insuranceType]?.label || selectedProduct.insuranceType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="产品状态">
                <Tag color={statusMap[selectedProduct.status]?.color}>
                  {statusMap[selectedProduct.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="成人保费（30岁/30万）">
                {selectedProduct.priceAdult30 ? `¥${Number(selectedProduct.priceAdult30).toLocaleString()}/年` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="儿童保费（0岁/50万）">
                {selectedProduct.priceChild0 ? `¥${Number(selectedProduct.priceChild0).toLocaleString()}/年` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="上架时间">
                {selectedProduct.launchDate ? dayjs(selectedProduct.launchDate).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="预估下架">
                {selectedProduct.estimatedOffline ? dayjs(selectedProduct.estimatedOffline).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* 价格说明 */}
            <Alert
              message="价格计算标准"
              description={
                <ul className="text-sm m-0">
                  <li><strong>成人重疾险：</strong>30岁男性，30万保额，30年交，保终身</li>
                  <li><strong>儿童重疾险：</strong>0岁男宝，50万保额，30年交，保终身</li>
                </ul>
              }
              type="info"
              showIcon
            />

            {/* 产品亮点折叠 */}
            <Collapse defaultActiveKey={['highlights', 'advantages']}>
              <Panel header="📌 产品亮点" key="highlights">
                <div className="space-y-4">
                  {selectedProduct.highlightsSevere && JSON.parse(selectedProduct.highlightsSevere).length > 0 && (
                    <div>
                      <Tag color="red" className="mb-2">🩸 重疾亮点</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.highlightsSevere).map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.highlightsMild && JSON.parse(selectedProduct.highlightsMild).length > 0 && (
                    <div>
                      <Tag color="blue" className="mb-2">💧 轻中症亮点</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.highlightsMild).map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.highlightsWaiver && JSON.parse(selectedProduct.highlightsWaiver).length > 0 && (
                    <div>
                      <Tag color="green" className="mb-2">🛡️ 豁免亮点</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.highlightsWaiver).map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.highlightsSpecial && JSON.parse(selectedProduct.highlightsSpecial).length > 0 && (
                    <div>
                      <Tag color="purple" className="mb-2">✨ 特色亮点</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.highlightsSpecial).map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.highlightsValue && JSON.parse(selectedProduct.highlightsValue).length > 0 && (
                    <div>
                      <Tag color="orange" className="mb-2">💰 增值亮点</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.highlightsValue).map((h: string, i: number) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(!selectedProduct.highlightsSevere || JSON.parse(selectedProduct.highlightsSevere).length === 0) &&
                   (!selectedProduct.highlightsMild || JSON.parse(selectedProduct.highlightsMild).length === 0) &&
                   (!selectedProduct.highlightsWaiver || JSON.parse(selectedProduct.highlightsWaiver).length === 0) &&
                   (!selectedProduct.highlightsSpecial || JSON.parse(selectedProduct.highlightsSpecial).length === 0) &&
                   (!selectedProduct.highlightsValue || JSON.parse(selectedProduct.highlightsValue).length === 0) && (
                    <Empty description="暂无亮点数据" />
                  )}
                </div>
              </Panel>

              <Panel header="⭐ 核心优势" key="advantages">
                <div className="space-y-4">
                  {selectedProduct.advantagesPrice && JSON.parse(selectedProduct.advantagesPrice).length > 0 && (
                    <div>
                      <Tag color="green" className="mb-2">💰 价格优势</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.advantagesPrice).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.advantagesCoverage && JSON.parse(selectedProduct.advantagesCoverage).length > 0 && (
                    <div>
                      <Tag color="blue" className="mb-2">🛡️ 保障优势</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.advantagesCoverage).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.advantagesUW && JSON.parse(selectedProduct.advantagesUW).length > 0 && (
                    <div>
                      <Tag color="purple" className="mb-2">📋 核保优势</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.advantagesUW).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedProduct.advantagesService && JSON.parse(selectedProduct.advantagesService).length > 0 && (
                    <div>
                      <Tag color="orange" className="mb-2">🤝 服务优势</Tag>
                      <ul className="list-disc ml-6">
                        {JSON.parse(selectedProduct.advantagesService).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(!selectedProduct.advantagesPrice || JSON.parse(selectedProduct.advantagesPrice).length === 0) &&
                   (!selectedProduct.advantagesCoverage || JSON.parse(selectedProduct.advantagesCoverage).length === 0) &&
                   (!selectedProduct.advantagesUW || JSON.parse(selectedProduct.advantagesUW).length === 0) &&
                   (!selectedProduct.advantagesService || JSON.parse(selectedProduct.advantagesService).length === 0) && (
                    <Empty description="暂无优势数据" />
                  )}
                </div>
              </Panel>

              <Panel header="⚔️ 竞品对比" key="competitors">
                {selectedProduct.competitors && JSON.parse(selectedProduct.competitors).length > 0 ? (
                  JSON.parse(selectedProduct.competitors).map((c: any, i: number) => (
                    <div key={i} className="mb-4">
                      <div className="font-medium mb-2">vs {c.productName}</div>
                      <Table
                        size="small"
                        dataSource={c.dimensions}
                        rowKey="name"
                        pagination={false}
                        columns={[
                          { title: '维度', dataIndex: 'name' },
                          { title: '本产品', dataIndex: 'thisProduct', render: (v: string) => <span className="text-blue-600">{v}</span> },
                          { title: c.productName, dataIndex: 'competitor' },
                          { title: '优势', dataIndex: 'winner',
                            render: (w: string) => w === 'this' ? <Tag color="green">本产品胜</Tag> : w === 'competitor' ? <Tag color="red">竞品胜</Tag> : <Tag>持平</Tag>
                          }
                        ]}
                      />
                    </div>
                  ))
                ) : (
                  <Empty description="暂无竞品对比数据" />
                )}
              </Panel>

              <Panel header="⚠️ 注意事项" key="drawbacks">
                {selectedProduct.drawbacks && JSON.parse(selectedProduct.drawbacks).length > 0 ? (
                  <ul className="list-disc ml-6">
                    {JSON.parse(selectedProduct.drawbacks).map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <Empty description="暂无注意事项" />
                )}
              </Panel>
            </Collapse>

            {/* 备注 */}
            {selectedProduct.notes && (
              <div>
                <strong>备注：</strong>{selectedProduct.notes}
              </div>
            )}

            {/* 来源 */}
            {selectedProduct.sourceUrl && (
              <div>
                <strong>来源：</strong>
                <a href={selectedProduct.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {selectedProduct.sourceUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 上传素材AI解析弹窗 */}
      <Modal
        title="上传素材 - AI自动解析"
        open={uploadModalVisible}
        onCancel={handleCloseUploadModal}
        footer={[
          <Button key="cancel" onClick={handleCloseUploadModal}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={!analyzeResult}
            onClick={handleConfirmAnalyze}
          >
            确认并添加到表单
          </Button>
        ]}
        width={600}
      >
        <div className="py-4">
          {uploading && (
            <div className="text-center py-8">
              <Spin tip="AI正在解析文档，请稍候..." />
            </div>
          )}

          {!uploading && !analyzeResult && !analyzeError && (
            <div>
              <Upload.Dragger
                accept=".pdf,.docx,.doc,.txt"
                customRequest={handleAnalyzeUpload}
                showUploadList={true}
                maxCount={1}
                disabled={uploading}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽上传保险产品素材文档</p>
                <p className="ant-upload-hint">
                  支持 PDF、Word (.docx/.doc)、TXT 格式，文件大小不超过10MB
                </p>
              </Upload.Dragger>

              <Alert
                className="mt-4"
                message="提示"
                description="上传后，AI将自动分析文档内容，提取产品名称、保险公司、险种、保费、亮点等信息，并填充到产品表单中。"
                type="info"
                showIcon
              />
            </div>
          )}

          {analyzeError && (
            <div>
              <Alert
                message="解析失败"
                description={analyzeError}
                type="error"
                showIcon
                className="mb-4"
              />
              <Upload.Dragger
                accept=".pdf,.docx,.doc,.txt"
                customRequest={handleAnalyzeUpload}
                showUploadList={true}
                maxCount={1}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽重新上传</p>
              </Upload.Dragger>
            </div>
          )}

          {analyzeResult && (
            <div>
              <Alert
                message="解析完成"
                description="AI已成功解析文档内容，请确认以下信息是否正确，可手动修改后确认提交。"
                type="success"
                showIcon
                className="mb-4"
              />

              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="产品名称" span={2}>
                  {analyzeResult.name}
                </Descriptions.Item>
                <Descriptions.Item label="保险公司">
                  {analyzeResult.company}
                </Descriptions.Item>
                <Descriptions.Item label="险种">
                  <Tag color={typeMap[analyzeResult.insuranceType]?.color}>
                    {typeMap[analyzeResult.insuranceType]?.label || analyzeResult.insuranceType}
                  </Tag>
                </Descriptions.Item>
                {analyzeResult.priceAdult30 && (
                  <Descriptions.Item label="成人保费（30岁）">
                    ¥{Number(analyzeResult.priceAdult30).toLocaleString()}/年
                  </Descriptions.Item>
                )}
                {analyzeResult.priceChild0 && (
                  <Descriptions.Item label="儿童保费（0岁）">
                    ¥{Number(analyzeResult.priceChild0).toLocaleString()}/年
                  </Descriptions.Item>
                )}
              </Descriptions>

              {analyzeResult.highlightsSevere?.length > 0 && (
                <div className="mt-4">
                  <Tag color="red">🩸 重疾亮点</Tag>
                  <ul className="list-disc ml-6 mt-2">
                    {analyzeResult.highlightsSevere.map((h: string, i: number) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analyzeResult.advantagesPrice?.length > 0 && (
                <div className="mt-4">
                  <Tag color="green">💰 价格优势</Tag>
                  <ul className="list-disc ml-6 mt-2">
                    {analyzeResult.advantagesPrice.map((a: string, i: number) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analyzeResult.drawbacks?.length > 0 && (
                <div className="mt-4">
                  <Tag color="orange">⚠️ 注意事项</Tag>
                  <ul className="list-disc ml-6 mt-2">
                    {analyzeResult.drawbacks.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 text-center">
                <Button
                  type="link"
                  onClick={() => {
                    setAnalyzeResult(null);
                  }}
                >
                  重新上传
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
