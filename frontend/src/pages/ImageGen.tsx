import { useState } from 'react';
import { Tabs, Input, Button, ColorPicker, message, Spin, Tooltip } from 'antd';
import { DownloadOutlined, CopyOutlined, BulbOutlined, DownloadOutlined as ZipOutlined } from '@ant-design/icons';
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
// Canvas绘制文字辅助：自动换行（支持标记语法）- 字体加大
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
      const w = ctx.measureText(seg.text).width + 16;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(currentX - 6, currentY - lineHeight + 8, w, lineHeight);
      ctx.fillStyle = '#333';
      ctx.font = `bold ${lineHeight * 0.9}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
    } else if (seg.style === 'color') {
      ctx.fillStyle = accentColor;
      ctx.font = `bold ${lineHeight * 0.9}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
    } else if (seg.style === 'underline') {
      ctx.fillStyle = '#333';
      const w = ctx.measureText(seg.text).width;
      ctx.fillRect(currentX, currentY + 6, w, 4);
      ctx.font = `${lineHeight * 0.9}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
    } else {
      ctx.fillStyle = '#333';
      ctx.font = `${lineHeight * 0.9}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
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
// 生成封面图（前端Canvas绘制）- 字体加大
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
  
  // 左上角装饰线 - 加粗
  ctx.fillStyle = accentColor;
  ctx.fillRect(80, 80, 160, 12);
  
  // 右下角装饰线 - 加粗
  ctx.fillRect(W - 240, H - 92, 160, 12);
  
  // 标题居中（支持自动换行和标记语法）
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const cleanTitle = stripMarkup(title);
  ctx.font = 'bold 110px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
  ctx.fillStyle = '#333';
  
  // 简单换行
  const titleLines: string[] = [];
  let line = '';
  for (const char of cleanTitle) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > 880) {
      titleLines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  }
  titleLines.push(line);
  
  // 每行高度120px，确保标题占图片的1/2到2/3
  const totalHeight = titleLines.length * 120;
  const titleStartY = (H - totalHeight) / 2 + 60;
  
  // 如果有标记语法，用带样式的绘制
  if (title.includes('**') || title.includes('*') || title.includes('__')) {
    ctx.textAlign = 'left';
    let currentY = titleStartY;
    for (const titleLine of titleLines) {
      currentY = wrapText(ctx, titleLine, W / 2 - 440, currentY, 880, 110, accentColor, highlightColor);
    }
  } else {
    titleLines.forEach((l, i) => {
      ctx.fillText(l, W / 2, titleStartY + i * 120);
    });
  }
  
  // 水印 - 加大
  ctx.textAlign = 'center';
  ctx.font = '36px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
  ctx.fillStyle = '#999';
  ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 80);
  
  return canvas.toDataURL('image/png');
};
// 生成内容图（前端Canvas绘制）- 字体加大
const generateContentImages = (
  title: string,
  lines: string[],
  bgColor: string,
  accentColor: string,
  highlightColor: string
): string[] => {
  const W = 1080, H = 1440;
  // 调整：每页6行（原8行），字体加大后需要更多空间
  const LINES_PER_PAGE = 6;
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
    
    // 顶部标题栏 - 加高（原120→160）
    const HEADER_HEIGHT = 160;
    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 0, W, HEADER_HEIGHT);
    ctx.font = 'bold 56px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(stripMarkup(title), W / 2, 105);
    
    // 内容区域
    ctx.textAlign = 'left';
    let currentY = HEADER_HEIGHT + 60;
    
    // 卡片高度加大（原70→95）
    const CARD_HEIGHT = 95;
    const LINE_SPACING = 25;
    
    for (const pageLine of pageLines) {
      // 白色卡片背景
      ctx.fillStyle = 'white';
      const cardY = currentY - 55;
      const radius = 20;
      
      // 圆角矩形
      ctx.beginPath();
      ctx.moveTo(80 + radius, cardY);
      ctx.lineTo(W - 80 - radius, cardY);
      ctx.quadraticCurveTo(W - 80, cardY, W - 80, cardY + radius);
      ctx.lineTo(W - 80, cardY + CARD_HEIGHT - radius);
      ctx.quadraticCurveTo(W - 80, cardY + CARD_HEIGHT, W - 80 - radius, cardY + CARD_HEIGHT);
      ctx.lineTo(80 + radius, cardY + CARD_HEIGHT);
      ctx.quadraticCurveTo(80, cardY + CARD_HEIGHT, 80, cardY + CARD_HEIGHT - radius);
      ctx.lineTo(80, cardY + radius);
      ctx.quadraticCurveTo(80, cardY, 80 + radius, cardY);
      ctx.fill();
      
      // 绘制文字（支持标记语法）- 字体加大（原32→46）
      const hasMarkup = pageLine.includes('**') || pageLine.includes('*') || pageLine.includes('__');
      
      if (hasMarkup) {
        wrapText(ctx, pageLine, 100, currentY, W - 200, 60, accentColor, highlightColor);
      } else {
        ctx.font = '46px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
        ctx.fillStyle = '#333';
        
        // 截断超长文字
        let displayText = stripMarkup(pageLine);
        while (ctx.measureText(displayText).width > W - 200 && displayText.length > 0) {
          displayText = displayText.slice(0, -1);
        }
        if (displayText.length < stripMarkup(pageLine).length) displayText += '...';
        ctx.fillText(displayText, 100, currentY);
      }
      
      currentY += CARD_HEIGHT + LINE_SPACING;
    }
    
    // 水印 - 加大
    ctx.font = '30px -apple-system, PingFang SC, Microsoft YaHei, sans-serif';
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 50);
    
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
// 内容图生成组件 - 全文自动生成模式
function ContentTab() {
  const [title, setTitle] = useState('');
  const [fullText, setFullText] = useState('');
  const [bgColor, setBgColor] = useState('#FFF5F5');
  const [accentColor, setAccentColor] = useState('#FF4757');
  const [highlightColor, setHighlightColor] = useState('#FFE66D');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 智能拆分文本
  const splitTextToLines = (text: string): string[] => {
    // 按换行符分割
    let lines = text.split(/\n/);
    // 过滤空行和只含空白字符的行
    lines = lines.filter(line => line.trim().length > 0);
    // 限制最多40行，确保3-5张图（每页6行）
    if (lines.length > 40) {
      lines = lines.slice(0, 40);
    }
    return lines;
  };
  
  // 计算预计生成图片数量
  const estimatedImages = () => {
    const lines = splitTextToLines(fullText);
    return Math.max(1, Math.ceil(lines.length / 6));
  };
  
  const handleGenerate = async () => {
    if (!title.trim()) {
      message.warning('请输入标题');
      return;
    }
    if (!fullText.trim()) {
      message.warning('请输入笔记全文内容');
      return;
    }
    
    const validLines = splitTextToLines(fullText);
    if (validLines.length === 0) {
      message.warning('请输入有效的内容');
      return;
    }
    
    setLoading(true);
    try {
      // 调用已有的 generateContentImages 函数
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
  
  // 下载全部图片
  const handleDownloadAll = () => {
    images.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img;
        link.download = `content-${index + 1}-${Date.now()}.png`;
        link.click();
      }, index * 300); // 间隔300ms避免浏览器拦截
    });
    message.success(`开始下载 ${images.length} 张图片`);
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
            <div className="text-sm text-gray-600">
              全文内容（粘贴笔记正文，自动拆分为多张图）
            </div>
            {fullText.trim() && (
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                预计 {estimatedImages()} 张图
              </span>
            )}
          </div>
          <TextArea
            value={fullText}
            onChange={(e) => setFullText(e.target.value)}
            placeholder={`粘贴笔记全文，支持多段落&#10;&#10;示例：&#10;第一段内容...&#10;第二段内容...&#10;第三段内容...`}
            rows={10}
            style={{ fontSize: 15 }}
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
          生成内容图
        </Button>
      </div>
      
      {/* 右侧预览 */}
      <div className="w-1/2 flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-2">
          <div className="text-sm text-gray-600">
            预览{images.length > 0 ? `（${images.length} 张）` : ''}
          </div>
          {images.length > 0 && (
            <Button 
              size="small" 
              icon={<ZipOutlined />} 
              onClick={handleDownloadAll}
            >
              全部下载
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Spin size="large" tip="生成中..." />
          </div>
        ) : images.length > 0 ? (
          <div className="flex flex-col gap-4 w-full overflow-y-auto" style={{ maxHeight: 700 }}>
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
