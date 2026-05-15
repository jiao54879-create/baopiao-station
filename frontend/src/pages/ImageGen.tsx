import { useState, useEffect } from 'react';
import { Tabs, Input, Button, ColorPicker, Space, message, Spin, Tooltip } from 'antd';
import { DownloadOutlined, CopyOutlined, BulbOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { TextArea } = Input;

// 预设颜色
const BG_PRESETS = [
  { key: 'pink', label: '淡粉', value: '#FFF5F5' },
  { key: 'cream', label: '米白', value: '#FFF8F0' },
  { key: 'blue', label: '淡蓝', value: '#F0F5FF' },
  { key: 'green', label: '淡绿', value: '#F0FFF4' },
  { key: 'purple', label: '淡紫', value: '#F5F0FF' },
  { key: 'yellow', label: '淡黄', value: '#FFFFF0' },
];

const ACCENT_COLORS = [
  { key: 'red', label: '红色', value: '#FF4757' },
  { key: 'pink', label: '粉色', value: '#FF6B9D' },
  { key: 'orange', label: '橙色', value: '#FF9F43' },
  { key: 'blue', label: '蓝色', value: '#3498DB' },
  { key: 'green', label: '绿色', value: '#2ECC71' },
  { key: 'purple', label: '紫色', value: '#9B59B6' },
];

const HIGHLIGHT_COLORS = [
  { key: 'yellow', label: '黄色', value: '#FFE66D' },
  { key: 'green', label: '绿色', value: '#98FB98' },
  { key: 'pink', label: '粉色', value: '#FFB6C1' },
  { key: 'blue', label: '蓝色', value: '#87CEEB' },
  { key: 'orange', label: '橙色', value: '#FFD700' },
  { key: 'purple', label: '紫色', value: '#DDA0DD' },
];

// 颜色选择器组件
function ColorSelector({ 
  label, 
  presets, 
  value, 
  onChange 
}: { 
  label: string; 
  presets: { key: string; label: string; value: string }[]; 
  value: string; 
  onChange: (color: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="flex items-center gap-2 flex-wrap">
        {presets.map(preset => (
          <Tooltip key={preset.key} title={preset.label}>
            <div
              onClick={() => onChange(preset.value)}
              className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all ${
                value === preset.value ? 'border-gray-800 scale-110' : 'border-gray-200'
              }`}
              style={{ backgroundColor: preset.value }}
            />
          </Tooltip>
        ))}
        <ColorPicker
          value={value}
          onChange={(color) => onChange(color.toHexString())}
          size="small"
        />
      </div>
    </div>
  );
}

// 首图生成组件
function CoverTab() {
  const [title, setTitle] = useState('');
  const [bgColor, setBgColor] = useState('#FFF5F5');
  const [accentColor, setAccentColor] = useState('#FF4757');
  const [highlightColor, setHighlightColor] = useState('#FFE66D');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!title.trim()) {
      message.warning('请输入标题');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/images/cover', {
        title,
        bgColor,
        accentColor,
        highlightColor,
      });
      
      if (res.data.success) {
        setImage(res.data.image);
        message.success('首图生成成功');
      }
    } catch (error: any) {
      message.error(error?.data?.error || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `cover-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex gap-6">
      {/* 左侧输入 */}
      <div className="w-1/2">
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">标题（支持标记语法）</div>
          <TextArea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='输入标题，如：姐干保险**9年**，说点XHS上不流通的'
            rows={3}
            style={{ fontSize: 16 }}
          />
        </div>

        {/* 语法说明 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-500">
          <BulbOutlined className="mr-1" />
          <span className="font-medium">标记语法：</span>
          <code className="bg-yellow-100 px-1 rounded">**文字**</code> 高亮 
          <code className="bg-pink-100 px-1 rounded ml-2">*文字*</code> 换色 
          <code className="bg-blue-100 px-1 rounded ml-2">__文字__</code> 下划线
        </div>

        <ColorSelector label="背景色" presets={BG_PRESETS} value={bgColor} onChange={setBgColor} />
        <ColorSelector label="强调色" presets={ACCENT_COLORS} value={accentColor} onChange={setAccentColor} />
        <ColorSelector label="高亮色" presets={HIGHLIGHT_COLORS} value={highlightColor} onChange={setHighlightColor} />

        <Button 
          type="primary" 
          size="large" 
          onClick={handleGenerate}
          loading={loading}
          block
          className="mt-4"
        >
          生成首图
        </Button>
      </div>

      {/* 右侧预览 */}
      <div className="w-1/2 flex flex-col items-center">
        <div className="text-sm text-gray-600 mb-2">预览</div>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spin size="large" tip="生成中..." />
          </div>
        ) : image ? (
          <div className="relative">
            <img 
              src={image} 
              alt="首图预览" 
              className="max-w-full rounded-lg shadow-lg"
              style={{ maxHeight: 500 }}
            />
            <div className="flex gap-2 mt-4 justify-center">
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                下载
              </Button>
              <Button 
                icon={<CopyOutlined />} 
                onClick={() => {
                  // 复制图片到剪贴板
                  fetch(image)
                    .then(res => res.blob())
                    .then(blob => {
                      navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                      ]);
                      message.success('已复制到剪贴板');
                    });
                }}
              >
                复制
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg w-full">
            暂无预览
          </div>
        )}
      </div>
    </div>
  );
}

// 内容图生成组件
function ContentTab() {
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<string[]>(['']);
  const [bgColor, setBgColor] = useState('#FFF5F5');
  const [accentColor, setAccentColor] = useState('#FF4757');
  const [highlightColor, setHighlightColor] = useState('#FFE66D');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addLine = () => {
    setLines([...lines, '']);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const updateLine = (index: number, value: string) => {
    const newLines = [...lines];
    newLines[index] = value;
    setLines(newLines);
  };

  const handleGenerate = async () => {
    if (!title.trim()) {
      message.warning('请输入标题');
      return;
    }

    const validLines = lines.filter(l => l.trim());
    if (validLines.length === 0) {
      message.warning('请至少输入一条内容');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/images/content', {
        title,
        lines: validLines,
        bgColor,
        accentColor,
        highlightColor,
      });
      
      if (res.data.success) {
        setImage(res.data.image);
        message.success('内容图生成成功');
      }
    } catch (error: any) {
      message.error(error?.data?.error || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = image;
    link.download = `content-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex gap-6">
      {/* 左侧输入 */}
      <div className="w-1/2">
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">标题</div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入内容图标题"
            style={{ fontSize: 16 }}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">内容行（支持标记语法）</div>
            <Button size="small" onClick={addLine}>+ 添加行</Button>
          </div>
          
          {lines.map((line, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <Input
                value={line}
                onChange={(e) => updateLine(index, e.target.value)}
                placeholder={`内容行 ${index + 1}，如：⭕ 坑点：号称百万医疗，**免赔额1万**`}
                style={{ fontSize: 14 }}
              />
              {lines.length > 1 && (
                <Button 
                  type="text" 
                  danger 
                  onClick={() => removeLine(index)}
                  size="small"
                >
                  删除
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 语法说明 */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-500">
          <BulbOutlined className="mr-1" />
          <span className="font-medium">标记语法：</span>
          <code className="bg-yellow-100 px-1 rounded">**文字**</code> 高亮 
          <code className="bg-pink-100 px-1 rounded ml-2">*文字*</code> 换色 
          <code className="bg-blue-100 px-1 rounded ml-2">__文字__</code> 下划线
        </div>

        <ColorSelector label="背景色" presets={BG_PRESETS} value={bgColor} onChange={setBgColor} />
        <ColorSelector label="强调色" presets={ACCENT_COLORS} value={accentColor} onChange={setAccentColor} />
        <ColorSelector label="高亮色" presets={HIGHLIGHT_COLORS} value={highlightColor} onChange={setHighlightColor} />

        <Button 
          type="primary" 
          size="large" 
          onClick={handleGenerate}
          loading={loading}
          block
          className="mt-4"
        >
          生成内容图
        </Button>
      </div>

      {/* 右侧预览 */}
      <div className="w-1/2 flex flex-col items-center">
        <div className="text-sm text-gray-600 mb-2">预览</div>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spin size="large" tip="生成中..." />
          </div>
        ) : image ? (
          <div className="relative">
            <img 
              src={image} 
              alt="内容图预览" 
              className="max-w-full rounded-lg shadow-lg"
              style={{ maxHeight: 500 }}
            />
            <div className="flex gap-2 mt-4 justify-center">
              <Button icon={<DownloadOutlined />} onClick={handleDownload}>
                下载
              </Button>
              <Button 
                icon={<CopyOutlined />} 
                onClick={() => {
                  fetch(image)
                    .then(res => res.blob())
                    .then(blob => {
                      navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                      ]);
                      message.success('已复制到剪贴板');
                    });
                }}
              >
                复制
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg w-full">
            暂无预览
          </div>
        )}
      </div>
    </div>
  );
}

// 主页面组件
export default function ImageGen() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">小红书配图生成</h2>
        <p className="text-gray-500 mt-1">生成小红书风格的封面图和内容图，支持重点文字标记</p>
      </div>
      
      <Tabs
        defaultActiveKey="cover"
        items={[
          {
            key: 'cover',
            label: '首图（封面）',
            children: <CoverTab />,
          },
          {
            key: 'content',
            label: '内容图',
            children: <ContentTab />,
          },
        ]}
      />
    </div>
  );
}
