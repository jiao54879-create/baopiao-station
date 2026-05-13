import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Select, Input, Spin, Empty, Button, Modal, List, Tooltip, Alert, message, Upload, Space, Divider } from 'antd'
import { StarOutlined, SaveOutlined, ThunderboltOutlined, DownloadOutlined, WechatOutlined, CopyOutlined, UploadOutlined, EditOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import api from '../utils/api'

const { Search } = Input

// 5种仿写风格
const rewriteStyles = [
  { value: 'hearth', label: '走心唠嗑风', desc: '像闺蜜聊天，用真实故事打动人', icon: '💬' },
  { value: 'practical', label: '干货避坑风', desc: '专业+实用，列要点讲清楚', icon: '📋' },
  { value: 'twist', label: '反转打脸风', desc: '先抛常识→再颠覆→给方案', icon: '🎭' },
  { value: 'anxiety', label: '焦虑共鸣风', desc: '戳痛点→引发共鸣→提供出路', icon: '🔥' },
  { value: 'data', label: '数据震撼风', desc: '用数据说话，制造认知冲击', icon: '📊' },
]

const platformMap: Record<string, { label: string; color: string }> = {
  XHS: { label: '小红书', color: 'red' },
  WX: { label: '公众号', color: 'blue' },
  DOUYIN: { label: '抖音', color: 'cyan' },
  WEIBO: { label: '微博', color: 'orange' },
  ZHIHU: { label: '知乎', color: 'geekblue' }
}

const insuranceTypeMap: Record<string, string> = {
  medical: '医疗险',
  critical: '重疾险',
  annuity: '年金险',
  life: '寿险',
  accident: '意外险',
  child: '少儿险',
  pension: '养老险'
}

// 推荐订阅的公众号列表（说明如何获取真实RSS）
const recommendedAccounts = [
  { name: '深蓝保', bizId: 'gh_8b9c0d7a8f5c', description: '深蓝保官方公众号' },
  { name: '多保鱼', bizId: 'gh_7d5c9b3f6e4a', description: '多保鱼官方公众号' },
  { name: '小骆驼', bizId: 'gh_6a8b2c4e5d9f', description: '小骆驼教你保' },
  { name: '学霸说保险', bizId: 'gh_5f9a1b3c7e2d', description: '学霸说保险官方公众号' },
  { name: '奶爸保', bizId: 'gh_4e8a0c5f6b1d', description: '奶爸保官方公众号' },
  { name: '小雨伞', bizId: 'gh_3d7f9a2c5e8b', description: '小雨伞官方公众号' },
]

export default function Cases() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedInsuranceType, setSelectedInsuranceType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [collecting, setCollecting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [subscribeModalOpen, setSubscribeModalOpen] = useState(false)
  const [subscribeUrl, setSubscribeUrl] = useState('')
  const [subscribeWechatId, setSubscribeWechatId] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribedList, setSubscribedList] = useState<any[]>([])
  // 一键仿写相关状态
  const [rewriteModalOpen, setRewriteModalOpen] = useState(false)
  const [rewriteCase, setRewriteCase] = useState<any>(null)
  const [selectedStyle, setSelectedStyle] = useState<string>('')
  const [rewriting, setRewriting] = useState(false)
  const [rewriteResult, setRewriteResult] = useState<any>(null)

  // 打开仿写弹窗
  const handleRewrite = (caseItem: any) => {
    setRewriteCase(caseItem)
    setSelectedStyle('')
    setRewriteResult(null)
    setRewriteModalOpen(true)
  }

  // 执行仿写
  const executeRewrite = async () => {
    if (!selectedStyle) {
      message.warning('请选择仿写风格')
      return
    }
    setRewriting(true)
    setRewriteResult(null)
    try {
      const { data: res } = await api.post(`/cases/${rewriteCase.id}/rewrite`, {
        style: selectedStyle
      })
      setRewriteResult(res)
    } catch (error: any) {
      message.error(error.response?.data?.error || '仿写失败，请稍后重试')
    } finally {
      setRewriting(false)
    }
  }

  // 复制仿写结果
  const copyRewriteResult = async (type: 'title' | 'content' | 'all') => {
    if (!rewriteResult) return
    let text = ''
    if (type === 'title') {
      text = rewriteResult.title
    } else if (type === 'content') {
      text = rewriteResult.content
    } else {
      text = `标题：${rewriteResult.title}\n\n正文：\n${rewriteResult.content}\n\n标签：${rewriteResult.tags?.join(' ') || ''}`
    }
    try {
      await navigator.clipboard.writeText(text)
      message.success('已复制到剪贴板')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success('已复制到剪贴板')
    }
  }

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, limit: 20 }
      if (selectedPlatform) params.platform = selectedPlatform
      if (selectedInsuranceType) params.insuranceType = selectedInsuranceType
      if (keyword) params.keyword = keyword

      const { data: res } = await api.get('/cases', { params })
      setData(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedPlatform, selectedInsuranceType])

  const handleSave = async (caseId: number) => {
    try {
      await api.post(`/cases/${caseId}/save`)
      message.success('已收藏')
    } catch (error: any) {
      message.error(error.response?.data?.error || '收藏失败')
    }
  }

  const analyzeCase = async (caseItem: any) => {
    setSelectedCase(caseItem)
    setAnalyzing(true)
    try {
      const { data } = await api.post('/cases/analyze', {
        title: caseItem.title,
        content: caseItem.content || '',
        metrics: {
          likes: caseItem.likesCount,
          favorites: caseItem.favoritesCount,
          comments: caseItem.commentsCount
        }
      })
      setSelectedCase({ ...caseItem, analysis: data })
    } catch (error) {
      message.error('AI分析功能暂不可用，请稍后重试')
    } finally {
      setAnalyzing(false)
    }
  }

  // 采集爆款数据（真实小红书笔记，需要 Chrome 已登录 + autocli 扩展）
  const handleCollect = async () => {
    setCollecting(true)
    try {
      const { data: res } = await api.post('/collect/viral')
      if (res.success) {
        message.success(res.message || '采集完成')
        fetchData()
      } else {
        // 采集失败（未连接 Chrome 扩展等）
        Modal.warning({
          title: '采集失败',
          content: (
            <div>
              <p style={{ marginBottom: 8 }}>{res.message}</p>
              <p style={{ color: '#666', fontSize: 13 }}>采集小红书真实笔记需要：</p>
              <ol style={{ paddingLeft: 18, fontSize: 13, color: '#666' }}>
                <li>在 Chrome 中打开并登录小红书</li>
                <li>安装 autocli Chrome 扩展</li>
                <li>确保 autocli 已正常运行（在终端执行 <code>autocli doctor</code> 检查）</li>
              </ol>
            </div>
          )
        })
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.response?.data?.error || '采集失败，请检查 Chrome 是否已登录小红书并安装 autocli 扩展'
      Modal.error({
        title: '采集失败',
        content: (
          <div>
            <p>{errMsg}</p>
            <p style={{ color: '#666', fontSize: 13, marginTop: 8 }}>采集小红书真实笔记需要：</p>
            <ol style={{ paddingLeft: 18, fontSize: 13, color: '#666' }}>
              <li>在 Chrome 中打开并登录小红书</li>
              <li>安装 autocli Chrome 扩展并保持连接</li>
              <li>终端执行 <code>autocli doctor</code> 确认状态</li>
            </ol>
          </div>
        )
      })
    } finally {
      setCollecting(false)
    }
  }

  // 订阅公众号
  const handleSubscribe = async () => {
    // 如果有 wechatId，直接用 wechatId 订阅
    if (subscribeWechatId) {
      setSubscribing(true)
      try {
        await api.post('/subscribe/wechat', {
          wechatId: subscribeWechatId,
          wechatName: subscribeWechatId
        })
        message.success('订阅成功！')
        setSubscribeWechatId('')
        setSubscribeModalOpen(false)
      } catch (error: any) {
        message.error(error.response?.data?.error || '订阅失败')
      } finally {
        setSubscribing(false)
      }
      return
    }
    
    // 否则使用文章链接
    if (!subscribeUrl.trim()) {
      message.warning('请输入公众号文章链接或微信号')
      return
    }
    
    // 验证是否是微信文章链接
    if (!subscribeUrl.includes('mp.weixin.qq.com')) {
      message.error('请输入正确的微信公众号文章链接')
      return
    }

    setSubscribing(true)
    try {
      await api.post('/subscribe/wechat', {
        articleUrl: subscribeUrl
      })
      message.success('订阅成功！系统将自动采集该公众号的最新文章')
      setSubscribeUrl('')
      setSubscribeModalOpen(false)
    } catch (error: any) {
      message.error(error.response?.data?.error || '订阅失败')
    } finally {
      setSubscribing(false)
    }
  }

  // 快速订阅公众号
  const handleQuickSubscribe = async (bizId: string, name: string) => {
    setSubscribeWechatId(bizId)
    setSubscribing(true)
    try {
      await api.post('/subscribe/wechat', {
        wechatId: bizId,
        wechatName: name
      })
      message.success(`已订阅 ${name}！`)
    } catch (error: any) {
      message.error(error.response?.data?.error || '订阅失败')
    } finally {
      setSubscribing(false)
      setSubscribeWechatId('')
    }
  }

  // 导入本地采集的 JSON 文件
  const handleImportJSON: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file as File);

      // 先读取文件内容
      const text = await (file as File).text();
      const cases = JSON.parse(text);

      if (!Array.isArray(cases) || cases.length === 0) {
        throw new Error('JSON 文件内容为空或格式错误');
      }

      const { data: res } = await api.post('/import/xhs-json', { cases });
      if (res.success) {
        message.success(res.message || `成功导入 ${cases.length} 条数据`);
        fetchData();
      } else {
        throw new Error(res.error || '导入失败');
      }
      onSuccess?.(res);
    } catch (error: any) {
      const errMsg = error.message || error.response?.data?.error || '导入失败，请检查 JSON 格式是否正确';
      message.error(errMsg);
      onError?.(error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">🔥 爆款案例库</h2>
          <Tooltip title="采集小红书近15天点赞50+的保险获客类真实笔记（需Chrome已登录小红书+autocli扩展）">
            <Button 
              type="primary" 
              icon={<DownloadOutlined />} 
              loading={collecting}
              onClick={handleCollect}
              size="small"
            >
              采集小红书真实笔记
            </Button>
          </Tooltip>
          <Tooltip title="订阅公众号文章">
            <Button 
              icon={<WechatOutlined />} 
              onClick={() => setSubscribeModalOpen(true)}
              size="small"
            >
              订阅公众号
            </Button>
          </Tooltip>
          <Upload
            accept=".json"
            showUploadList={false}
            customRequest={handleImportJSON}
            disabled={importing}
          >
            <Tooltip title="导入本地采集的 JSON 文件（需先运行 collect-xhs-local.js 脚本）">
              <Button icon={<UploadOutlined />} loading={importing} size="small">
                导入JSON
              </Button>
            </Tooltip>
          </Upload>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            placeholder="选择平台"
            allowClear
            value={selectedPlatform || undefined}
            onChange={setSelectedPlatform}
            style={{ width: 100 }}
            options={Object.entries(platformMap).map(([value, { label }]) => ({ value, label }))}
          />
          <Select
            placeholder="选择险种"
            allowClear
            value={selectedInsuranceType || undefined}
            onChange={setSelectedInsuranceType}
            style={{ width: 100 }}
            options={Object.entries(insuranceTypeMap).map(([value, label]) => ({ value, label }))}
          />
          <Search
            placeholder="搜索案例..."
            onSearch={(v) => { setKeyword(v); fetchData() }}
            style={{ width: 200 }}
            allowClear
          />
        </div>
      </div>

      {/* 数据说明 */}
      <Alert
        message="数据来源说明"
        description={
          <div className="text-sm">
            当前数据为示例数据。如需真实数据，点击「订阅公众号」按钮，粘贴公众号文章链接即可订阅。
            小红书数据需要安装 AutoCLI Chrome 扩展。
          </div>
        }
        type="info"
        showIcon
      />

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {data.map((item) => (
            <Col key={item.id} span={12}>
              <Card
                hoverable
                className="hover-lift"
                actions={[
                  <Button key="save" type="text" icon={<SaveOutlined />} onClick={() => handleSave(item.id)}>
                    收藏
                  </Button>,
                  <Button key="analyze" type="text" icon={<ThunderboltOutlined />} onClick={() => analyzeCase(item)}>
                    AI分析
                  </Button>,
                  <Button key="rewrite" type="text" icon={<EditOutlined />} onClick={() => handleRewrite(item)}>
                    一键仿写
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div className="flex items-center gap-2 mb-2">
                      <Tag color={platformMap[item.platform]?.color}>
                        {platformMap[item.platform]?.label}
                      </Tag>
                      {item.insuranceType && (
                        <Tag color="purple">{insuranceTypeMap[item.insuranceType] || item.insuranceType}</Tag>
                      )}
                      <Tag color={item.viralScore && item.viralScore > 80 ? 'red' : 'default'}>
                        <StarOutlined /> {item.viralScore?.toFixed(1) || '?'}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <h3 className="font-medium text-base mb-2">{item.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>👍 {item.likesCount}</span>
                        <span>⭐ {item.favoritesCount}</span>
                        <span>💬 {item.commentsCount}</span>
                        {item.author && <span>作者：{item.author}</span>}
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>

        {data.length === 0 && !loading && (
          <Empty description="暂无爆款案例，点击「订阅公众号」开始采集" />
        )}
      </Spin>

      {/* AI 分析 Modal */}
      <Modal
        title="🔥 爆款分析"
        open={!!selectedCase}
        onCancel={() => setSelectedCase(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedCase(null)}>关闭</Button>,
          <Button key="save" type="primary" onClick={() => { handleSave(selectedCase.id); setSelectedCase(null); }}>
            收藏此案例
          </Button>
        ]}
        width={700}
      >
        {selectedCase && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">原文标题</h4>
              <p>{selectedCase.title}</p>
            </div>

            {analyzing ? (
              <div className="text-center py-8">
                <Spin tip="AI 正在分析中..." />
              </div>
            ) : selectedCase.analysis ? (
              <>
                <div>
                  <h4 className="font-medium text-primary">🔥 爆款因素</h4>
                  <ul className="list-disc pl-5">
                    {selectedCase.analysis.viralFactors?.map((f: string, i: number) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-secondary">📝 内容结构</h4>
                  <p><strong>开头：</strong>{selectedCase.analysis.contentStructure?.opening}</p>
                  <p><strong>中间：</strong>{selectedCase.analysis.contentStructure?.middle}</p>
                  <p><strong>结尾：</strong>{selectedCase.analysis.contentStructure?.ending}</p>
                </div>

                <div>
                  <h4 className="font-medium text-blue-500">💡 可复用公式</h4>
                  <p className="bg-blue-50 p-3 rounded">{selectedCase.analysis.reusableFormula}</p>
                </div>

                <div>
                  <h4 className="font-medium text-green-500">✨ 模仿建议</h4>
                  <ul className="list-disc pl-5">
                    {selectedCase.analysis.suggestions?.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <Alert
                message="AI分析功能说明"
                description="当前案例为示例数据，无法进行真实的AI分析。请订阅真实的公众号后，采集真实数据即可使用AI分析功能。"
                type="warning"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>

      {/* 订阅公众号 Modal */}
      <Modal
        title={<><WechatOutlined /> 订阅公众号</>}
        open={subscribeModalOpen}
        onCancel={() => { setSubscribeModalOpen(false); setSubscribeUrl(''); setSubscribeWechatId(''); }}
        footer={null}
        width={600}
      >
        <div className="space-y-4">
          <Alert
            message="一键订阅推荐公众号"
            description="点击下方按钮直接订阅，无需复制链接"
            type="info"
            showIcon
          />

          <div className="space-y-2">
            {recommendedAccounts.map((account) => (
              <div key={account.bizId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <WechatOutlined style={{ fontSize: 24, color: '#07C160' }} />
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-gray-500">{account.description}</div>
                  </div>
                </div>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => handleQuickSubscribe(account.bizId, account.name)}
                  loading={subscribing && subscribeWechatId === account.bizId}
                >
                  订阅
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">自定义订阅</h4>
            <div className="space-y-2">
              <Input
                placeholder="输入公众号文章链接（mp.weixin.qq.com/s/...）"
                value={subscribeUrl}
                onChange={(e) => setSubscribeUrl(e.target.value)}
                status={subscribeUrl && !subscribeUrl.includes('mp.weixin.qq.com') ? 'error' : undefined}
              />
              <Input
                placeholder="或输入公众号原始ID（如 gh_8b9c0d7a8f5c）"
                value={subscribeWechatId}
                onChange={(e) => setSubscribeWechatId(e.target.value)}
              />
              <Button 
                type="primary" 
                block 
                loading={subscribing} 
                onClick={handleSubscribe}
                disabled={!subscribeUrl.includes('mp.weixin.qq.com') && !subscribeWechatId}
              >
                确认订阅
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 一键仿写 Modal */}
      <Modal
        title={<><EditOutlined /> 一键仿写爆款</>}
        open={rewriteModalOpen}
        onCancel={() => { setRewriteModalOpen(false); setRewriteResult(null); }}
        footer={null}
        width={700}
      >
        {rewriteCase && (
          <div className="space-y-4">
            {/* 原案例信息 */}
            <Alert
              message="原爆款笔记"
              description={
                <div>
                  <div className="font-medium">{rewriteCase.title}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    👍 {rewriteCase.likesCount} ⭐ {rewriteCase.favoritesCount} 💬 {rewriteCase.commentsCount}
                    {rewriteCase.author && <span> | 作者：{rewriteCase.author}</span>}
                  </div>
                </div>
              }
              type="info"
              showIcon
            />

            {/* 风格选择 */}
            <div>
              <h4 className="font-medium mb-2">选择仿写风格</h4>
              <div className="grid grid-cols-1 gap-2">
                {rewriteStyles.map((style) => (
                  <div
                    key={style.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedStyle === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedStyle(style.value)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{style.icon}</span>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-xs text-gray-500">{style.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 执行按钮 */}
            <Button
              type="primary"
              block
              size="large"
              loading={rewriting}
              onClick={executeRewrite}
              disabled={!selectedStyle}
              icon={<EditOutlined />}
            >
              {rewriting ? 'AI 正在仿写中...' : '开始仿写'}
            </Button>

            {/* 仿写结果 */}
            {rewriteResult && (
              <div className="space-y-4 mt-4">
                <Divider>✨ 仿写结果</Divider>

                {/* 标题 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">📌 标题</h4>
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyRewriteResult('title')}>
                      复制
                    </Button>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-lg font-medium">
                    {rewriteResult.title}
                  </div>
                </div>

                {/* 正文 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">📝 正文</h4>
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyRewriteResult('content')}>
                      复制
                    </Button>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap text-sm leading-relaxed max-h-80 overflow-y-auto">
                    {rewriteResult.content}
                  </div>
                </div>

                {/* 标签 */}
                {rewriteResult.tags && rewriteResult.tags.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">🏷️ 推荐标签</h4>
                      <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => copyRewriteResult('all')}>
                        复制全部
                      </Button>
                    </div>
                    <Space wrap>
                      {rewriteResult.tags.map((tag: string, i: number) => (
                        <Tag key={i} color="blue">{tag}</Tag>
                      ))}
                    </Space>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button type="primary" block icon={<CopyOutlined />} onClick={() => copyRewriteResult('all')}>
                    一键复制全部内容
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
