import { useState, useEffect } from 'react';
import { Tabs, Input, Button, ColorPicker, Space, message, Spin, Tooltip } from 'antd';
import { DownloadOutlined, CopyOutlined, BulbOutlined } from '@ant-design/icons';
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

// Canvas绘制文字辅助：自动换行（支持标记语法）
const wrapText = (
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  maxWidth: number, 
  lineHeight: number,
  accentColor: string,
  highlightColor: string
): number => {
  let currentY = y;
  const segments: {text: string; style: string}[] = [];
  let remaining = text;
  
  // 解析 **高亮** *换色* __下划线__
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    const colorMatch = remaining.match(/^\*(.+?)\*/);
    const underMatch = remaining.match(/^__(.+?)__/);
    
    if (boldMatch) {
      segments.push({text: boldMatch[1], style: 'highlight'});
      remaining = remaining.slice(boldMatch[0].length);
    } else if (colorMatch) {
      segments.push({text: colorMatch[1], style: 'color'});
      remaining = remaining.slice(colorMatch[0].length);
    } else if (underMatch) {
      segments.push({text: underMatch[1], style: 'underline'});
      remaining = remaining.slice(underMatch[0].length);
    } else {
      const nextSpecial = remaining.search(/(\*\*|\*|__)/);
      if (nextSpecial === -1) {
        segments.push({text: remaining, style: 'normal'});
        remaining = '';
      } else {
        segments.push({text: remaining.slice(0, nextSpecial), style: 'normal'});
        remaining = remaining.slice(nextSpecial);
      }
    }
  }
  
  // 逐段绘制
  let currentX = x;
  for (const seg of segments) {
    ctx.save();
    if (seg.style === 'highlight') {
      const w = ctx.measureText(seg.text).width + 12;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(currentX - 4, currentY - lineHeight + 6, w, lineHeight);
      ctx.fillStyle = '#333';
      ctx.font = 'bold 38px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    } else if (seg.style === 'color') {
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 38px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    } else if (seg.style === 'underline') {
      ctx.fillStyle = '#333';
      const w = ctx.measureText(seg.text).width;
      ctx.fillRect(currentX, currentY + 4, w, 3);
    } else {
      ctx.fillStyle = '#333';
      ctx.font = '38px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    }
    ctx.fillText(seg.text, currentX, currentY);
    currentX += ctx.measureText(seg.text).width;
    ctx.restore();
  }
  
  return currentY + lineHeight;
};

// 去除标记语法的纯文本
const stripMarkup = (text: string): string => {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/__(.+?)__/g, '$1');
};

// 生成封面图（前端Canvas绘制）
const generateCoverImage = (
  title: string,
  bgColor: string,
  accentColor: string,
  highlightColor: string
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  // 背景
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  
  // 左上角装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(60, 60, 120, 8);
  
  // 右下角装饰线
  ctx.fillRect(W - 180, H - 68, 120, 8);
  
  // 标题居中（支持自动换行和标记语法）
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const cleanTitle = stripMarkup(title);
  ctx.font = 'bold 72px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
  ctx.fillStyle = '#333';
  
  // 简单换行
  const titleLines: string[] = [];
  let line = '';
  for (const char of cleanTitle) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > 800) {
      titleLines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  titleLines.push(line);
  
  const titleStartY = H / 2 - (titleLines.length * 100) / 2;
  
  // 如果有标记语法，用带样式的绘制
  if (title.includes('**') || title.includes('*') || title.includes('__')) {
    ctx.textAlign = 'left';
    let currentY = titleStartY - ((titleLines.length - 1) * 100) / 2;
    for (const titleLine of titleLines) {
      currentY = wrapText(ctx, titleLine, W / 2 - 400, currentY, 800, 100, accentColor, highlightColor);
    }
  } else {
    titleLines.forEach((l, i) => {
      ctx.fillText(l, W / 2, titleStartY + i * 100);
    });
  }
  
  // 水印
  ctx.textAlign = 'center';
  ctx.font = '28px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
  ctx.fillStyle = '#999';
  ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 70);
  
  return canvas.toDataURL('image/png');
};

// 生成内容图（前端Canvas绘制）
const generateContentImages = (
  title: string,
  lines: string[],
  bgColor: string,
  accentColor: string,
  highlightColor: string
): string[] => {
  const W = 1080, H = 1440;
  const LINES_PER_PAGE = 8;
  const images: string[] = [];
  
  // 分页
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  
  for (const pageLines of pages) {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    
    // 背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, W, H);
    
    // 顶部标题栏
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, W, 120);
    ctx.font = 'bold 44px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(stripMarkup(title), W / 2, 78);
    
    // 内容行
    ctx.textAlign = 'left';
    let currentY = 180;
    
    for (const pageLine of pageLines) {
      // 白色卡片背景
      ctx.fillStyle = 'white';
      const cardH = 70;
      const radius = 16;
      const cardY = currentY - 40;
      
      // 圆角矩形
      ctx.beginPath();
      ctx.moveTo(60 + radius, cardY);
      ctx.lineTo(W - 60 - radius, cardY);
      ctx.quadraticCurveTo(W - 60, cardY, W - 60, cardY + radius);
      ctx.lineTo(W - 60, cardY + cardH - radius);
      ctx.quadraticCurveTo(W - 60, cardY + cardH, W - 60 - radius, cardY + cardH);
      ctx.lineTo(60 + radius, cardY + cardH);
      ctx.quadraticCurveTo(60, cardY + cardH, 60, cardY + cardH - radius);
      ctx.lineTo(60, cardY + radius);
      ctx.quadraticCurveTo(60, cardY, 60 + radius, cardY);
      ctx.fill();
      
      // 绘制文字（支持标记语法）
      const hasMarkup = pageLine.includes('**') || pageLine.includes('*') || pageLine.includes('__');
      
      if (hasMarkup) {
        wrapText(ctx, pageLine, 80, currentY, W - 160, 50, accentColor, highlightColor);
      } else {
        ctx.font = '32px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
        ctx.fillStyle = '#333';
        
        // 截断超长文字
        let displayText = stripMarkup(pageLine);
        while (ctx.measureText(displayText).width > W - 160 && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        if (displayText.length < stripMarkup(pageLine).length) displayText += '...';
        ctx.fillText(displayText, 80, currentY);
      }
      
      currentY += 85 + 20;
    }
    
    // 水印
    ctx.font = '24px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 40);
    
    images.push(canvas.toDataURL('image/png'));
  }
  
  return images;
};

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
      // 前端Canvas生成图片
      const generatedImage = generateCoverImage(title, bgColor, accentColor, highlightColor);
      setImage(generatedImage);
      message.success('首图生成成功');
    } catch (error: any) {
      message.error(error?.message || '生成失败');
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
  const [images, setImages] = useState<string[]>([]);
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
      // 前端Canvas生成图片
      const generatedImages = generateContentImages(title, validLines, bgColor, accentColor, highlightColor);
      setImages(generatedImages);
      message.success(`内容图生成成功，共 ${generatedImages.length} 张`);
    } catch (error: any) {
      message.error(error?.message || '生成失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (index: number) => {
    if (!images[index]) return;
    const link = document.createElement('a');
    link.href = images[index];
    link.download = `content-${index + 1}-${Date.now()}.png`;
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
        <div className="text-sm text-gray-600 mb-2">预览（{images.length > 0 ? `${images.length} 张` : ''}）</div>
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spin size="large" tip="生成中..." />
          </div>
        ) : images.length > 0 ? (
          <div className="flex flex-col gap-4 w-full overflow-y-auto" style={{ maxHeight: 600 }}>
            {images.map((img, index) => (
              <div key={index} className="relative">
                <img 
                  src={img} 
                  alt={`内容图 ${index + 1}`} 
                  className="max-w-full rounded-lg shadow-lg"
                />
                <div className="flex gap-2 mt-2 justify-center">
                  <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(index)}>
                    下载
                  </Button>
                  <Button 
                    size="small"
                    icon={<CopyOutlined />} 
                    onClick={() => {
                      fetch(img)
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
            ))}
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
