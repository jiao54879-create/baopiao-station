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

// 模板风格定义
const TEMPLATES = [
  { 
    key: 'card', 
    name: '简约卡片', 
    icon: '🎨',
    description: '浅色背景 + 彩色装饰线',
    hasBgColor: true,
    hasAccentColor: true,
    hasHighlightColor: true,
  },
  { 
    key: 'memo', 
    name: '备忘录', 
    icon: '📋',
    description: 'iPhone备忘录外观',
    hasBgColor: false,
    hasAccentColor: false,
    hasHighlightColor: false,
  },
  { 
    key: 'book', 
    name: '书籍阅读', 
    icon: '📖',
    description: '仿古籍/书页排版风格',
    hasBgColor: false,
    hasAccentColor: false,
    hasHighlightColor: false,
  },
  { 
    key: 'magazine', 
    name: '杂志排版', 
    icon: '🎯',
    description: '杂志封面/内页风格',
    hasBgColor: true,
    hasAccentColor: true,
    hasHighlightColor: false,
  },
  { 
    key: 'chat', 
    name: '对话气泡', 
    icon: '💬',
    description: '左右交替对话形式',
    hasBgColor: true,
    hasAccentColor: false,
    hasHighlightColor: true,
  },
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

// 模板选择卡片组件
function TemplateSelector({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (key: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="text-sm text-gray-600 mb-3">模板风格</div>
      <div className="grid grid-cols-5 gap-3">
        {TEMPLATES.map(template => (
          <div
            key={template.key}
            onClick={() => onChange(template.key)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
              value === template.key 
                ? 'border-blue-500 bg-blue-50 shadow-md' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-1">{template.icon}</div>
            <div className="text-sm font-medium text-gray-800">{template.name}</div>
            <div className="text-xs text-gray-500 mt-1 leading-tight">{template.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 去除标记语法的纯文本
const stripMarkup = (text: string): string => {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').replace(/__(.+?)__/g, '$1');
};

// 辅助函数：测量带标记文字的换行（保留标记语法进行换行）
const wrapTextWithMarkup = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const lines: string[] = [];
  let currentLine = '';
  let i = 0;
  
  while (i < text.length) {
    // 检查是否是标记开始
    if (text.slice(i, i + 2) === '**') {
      // 高亮标记，查找结束标记
      const endIdx = text.indexOf('**', i + 2);
      if (endIdx !== -1) {
        const marker = text.slice(i, endIdx + 2);
        const testLine = currentLine + marker;
        const cleanTestLine = stripMarkup(testLine);
        if (ctx.measureText(cleanTestLine).width <= maxWidth) {
          currentLine = testLine;
          i = endIdx + 2;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = marker;
          i = endIdx + 2;
        }
        continue;
      }
    } else if (text[i] === '*' && (i === 0 || text[i-1] !== '*')) {
      // 换色标记
      const endIdx = text.indexOf('*', i + 1);
      if (endIdx !== -1 && text[endIdx-1] !== '*') {
        const marker = text.slice(i, endIdx + 1);
        const testLine = currentLine + marker;
        const cleanTestLine = stripMarkup(testLine);
        if (ctx.measureText(cleanTestLine).width <= maxWidth) {
          currentLine = testLine;
          i = endIdx + 1;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = marker;
          i = endIdx + 1;
        }
        continue;
      }
    } else if (text.slice(i, i + 2) === '__') {
      // 下划线标记
      const endIdx = text.indexOf('__', i + 2);
      if (endIdx !== -1) {
        const marker = text.slice(i, endIdx + 2);
        const testLine = currentLine + marker;
        const cleanTestLine = stripMarkup(testLine);
        if (ctx.measureText(cleanTestLine).width <= maxWidth) {
          currentLine = testLine;
          i = endIdx + 2;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = marker;
          i = endIdx + 2;
        }
        continue;
      }
    }
    
    // 普通字符
    const testLine = currentLine + text[i];
    const cleanTestLine = stripMarkup(testLine);
    if (ctx.measureText(cleanTestLine).width <= maxWidth) {
      currentLine = testLine;
      i++;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = text[i];
      i++;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
};

// Canvas绘制文字辅助：支持标记语法渲染
const drawTextWithMarkup = (
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
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
  
  // 设置文字垂直对齐方式
  ctx.textBaseline = 'top';
  
  // 逐段绘制
  let currentX = x;
  for (const seg of segments) {
    ctx.save();
    if (seg.style === 'highlight') {
      const w = ctx.measureText(seg.text).width + 16;
      ctx.fillStyle = highlightColor;
      ctx.fillRect(currentX - 6, currentY - lineHeight * 0.75, w, lineHeight * 0.9);
      ctx.fillStyle = '#333';
      ctx.font = `bold ${lineHeight * 0.9}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
    } else if (seg.style === 'color') {
      ctx.fillStyle = accentColor;
      ctx.font = `bold ${lineHeight * 0.9}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
    } else if (seg.style === 'underline') {
      ctx.fillStyle = '#333';
      const w = ctx.measureText(seg.text).width;
      ctx.fillRect(currentX, currentY + lineHeight * 0.15, w, 4);
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

// ==================== 简约卡片风格 ====================

// 生成封面图（简约卡片）- 修复标记语法
const generateCoverCard = (
  title: string,
  bgColor: string,
  accentColor: string,
  highlightColor: string,
  titleFontSize: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  
  const decorLineWidth = Math.max(120, titleFontSize * 1.2);
  const decorLineHeight = 12;
  const decorMargin = 80;
  
  ctx.fillStyle = accentColor;
  ctx.fillRect(decorMargin, decorMargin, decorLineWidth, decorLineHeight);
  ctx.fillRect(W - decorMargin - decorLineWidth, H - decorMargin - decorLineHeight, decorLineWidth, decorLineHeight);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${titleFontSize}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
  
  const maxTextWidth = W - 200;
  
  // 用保留标记的方式换行
  const titleLines = wrapTextWithMarkup(ctx, title, maxTextWidth);
  
  const lineHeight = Math.round(titleFontSize * 1.3);
  const totalHeight = titleLines.length * lineHeight;
  const centerY = H / 2;
  let titleStartY;
  
  if (titleLines.length === 1) {
    titleStartY = centerY;
  } else {
    titleStartY = centerY - (totalHeight - lineHeight) / 2;
  }
  
  // 绘制标题（保留标记语法）
  const hasMarkup = title.includes('**') || title.includes('*') || title.includes('__');
  
  if (hasMarkup) {
    ctx.textAlign = 'left';
    const textStartX = W / 2 - maxTextWidth / 2;
    let currentY = titleStartY;
    for (const titleLine of titleLines) {
      currentY = drawTextWithMarkup(ctx, titleLine, textStartX, currentY, titleFontSize, accentColor, highlightColor);
    }
  } else {
    titleLines.forEach((l, i) => {
      const lineY = titleStartY + i * lineHeight;
      ctx.textAlign = 'center';
      ctx.fillText(l, W / 2, lineY);
    });
  }
  
  const watermarkSize = Math.round(titleFontSize * 0.33);
  ctx.textAlign = 'center';
  ctx.font = `${watermarkSize}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
  ctx.fillStyle = '#999';
  ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 60);
  
  return canvas.toDataURL('image/png');
};

// 生成内容图（简约卡片）- 无标题栏，无每行卡片
const generateContentCard = (
  lines: string[],
  bgColor: string,
  accentColor: string,
  highlightColor: string,
  contentFontSize: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  
  // 顶部装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(80, 60, 120, 8);
  ctx.fillRect(W - 200, 60, 120, 8);
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const contentPadding = 80;
  const contentWidth = W - contentPadding * 2;
  const lineHeight = Math.round(contentFontSize * 1.6);
  
  let currentY = 100;
  
  for (const pageLine of lines) {
    const hasMarkup = pageLine.includes('**') || pageLine.includes('*') || pageLine.includes('__');
    
    if (hasMarkup) {
      currentY = drawTextWithMarkup(ctx, pageLine, contentPadding, currentY, contentFontSize, accentColor, highlightColor);
    } else {
      ctx.font = `${contentFontSize}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
      ctx.fillStyle = '#333';
      
      // 纯文本换行
      let tempLine = '';
      for (const char of pageLine) {
        const testLine = tempLine + char;
        if (ctx.measureText(testLine).width > contentWidth) {
          ctx.fillText(tempLine, contentPadding, currentY);
          currentY += lineHeight;
          tempLine = char;
        } else {
          tempLine = testLine;
        }
      }
      if (tempLine) {
        ctx.fillText(tempLine, contentPadding, currentY);
        currentY += lineHeight;
      }
    }
    currentY += contentFontSize * 0.3;
  }
  
  // 底部装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(80, H - 80, 120, 8);
  ctx.fillRect(W - 200, H - 80, 120, 8);
  
  // 水印
  const watermarkSize = Math.round(contentFontSize * 0.65);
  ctx.font = `${watermarkSize}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 40);
  
  return canvas.toDataURL('image/png');
};

// ==================== 备忘录风格 ====================

const MEMO_COLORS = {
  background: '#FFF9E6',
  highlight: '#FFF3B0',
  titleBar: '#F5F5F5',
  divider: '#E0E0E0',
  text: '#333333',
  subtext: '#666666',
  accent: '#FF6B6B',
  statusBar: '#1C1C1E',
};

const drawMemoStatusBar = (ctx: CanvasRenderingContext2D, W: number) => {
  const statusBarHeight = 44;
  
  ctx.fillStyle = MEMO_COLORS.statusBar;
  ctx.fillRect(0, 0, W, statusBarHeight);
  
  ctx.font = 'bold 15px -apple-system, SF Pro Text, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('9:41', 30, statusBarHeight / 2);
  
  const rightX = W - 30;
  
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightX - 25, 16, 22, 10);
  ctx.fillStyle = 'white';
  ctx.fillRect(rightX - 3, 19, 3, 4);
  ctx.fillStyle = '#4CD964';
  ctx.fillRect(rightX - 23, 18, 18, 8);
  
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(rightX - 42, 24, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(rightX - 42, 24, 6, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rightX - 42, 24, 9, -Math.PI * 0.75, -Math.PI * 0.25);
  ctx.stroke();
  
  const signalX = rightX - 60;
  ctx.fillStyle = 'white';
  for (let i = 0; i < 4; i++) {
    const h = 4 + i * 2;
    ctx.fillRect(signalX + i * 4, 30 - h, 2, h);
  }
};

const drawMemoNavBar = (ctx: CanvasRenderingContext2D, W: number, pageIndex?: number, totalPages?: number) => {
  const navBarHeight = 56;
  const navY = 44;
  
  ctx.fillStyle = MEMO_COLORS.titleBar;
  ctx.fillRect(0, navY, W, navBarHeight);
  
  ctx.strokeStyle = MEMO_COLORS.divider;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, navY + navBarHeight);
  ctx.lineTo(W, navY + navBarHeight);
  ctx.stroke();
  
  ctx.fillStyle = MEMO_COLORS.accent;
  ctx.font = 'bold 17px -apple-system, PingFang SC, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('<', 20, navY + navBarHeight / 2);
  
  ctx.fillStyle = MEMO_COLORS.text;
  ctx.fillText(' 备忘录', 36, navY + navBarHeight / 2);
  
  ctx.fillStyle = MEMO_COLORS.subtext;
  ctx.font = '14px -apple-system, PingFang SC, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('导出 · 更多', W - 20, navY + navBarHeight / 2);
  
  if (pageIndex !== undefined && totalPages !== undefined) {
    ctx.fillStyle = MEMO_COLORS.subtext;
    ctx.font = '12px -apple-system, PingFang SC, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${pageIndex}/${totalPages}`, W / 2, navY + navBarHeight / 2);
  }
};

const drawMemoToolbar = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
  const toolbarHeight = 80;
  const toolbarY = H - toolbarHeight;
  
  ctx.fillStyle = MEMO_COLORS.titleBar;
  ctx.fillRect(0, toolbarY, W, toolbarHeight);
  
  ctx.strokeStyle = MEMO_COLORS.divider;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, toolbarY);
  ctx.lineTo(W, toolbarY);
  ctx.stroke();
  
  const iconY = toolbarY + toolbarHeight / 2;
  const icons = [
    { x: W * 0.2, label: '📝' },
    { x: W * 0.4, label: '📷' },
    { x: W * 0.6, label: '✏️' },
    { x: W * 0.8, label: '📤' },
  ];
  
  ctx.font = '22px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const icon of icons) {
    ctx.fillText(icon.label, icon.x, iconY);
  }
};

// 生成备忘录封面图 - 修复标记语法
const generateCoverMemo = (
  title: string,
  content: string,
  titleFontSize: number,
  contentFontSize: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = MEMO_COLORS.background;
  ctx.fillRect(0, 0, W, H);
  
  drawMemoStatusBar(ctx, W);
  drawMemoNavBar(ctx, W);
  drawMemoToolbar(ctx, W, H);
  
  const statusBarHeight = 44;
  const navBarHeight = 56;
  const toolbarHeight = 80;
  const contentPadding = 40;
  const contentStartY = statusBarHeight + navBarHeight + contentPadding;
  const contentWidth = W - contentPadding * 2;
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.font = `bold ${titleFontSize}px -apple-system, PingFang SC, Microsoft YaHei, sans-serif`;
  
  const hasMarkup = title.includes('**') || title.includes('*') || title.includes('__');
  
  if (hasMarkup) {
    const titleLines = wrapTextWithMarkup(ctx, title, contentWidth);
    let currentY = contentStartY;
    for (const titleLine of titleLines) {
      currentY = drawTextWithMarkup(ctx, titleLine, contentPadding, currentY, titleFontSize, MEMO_COLORS.accent, MEMO_COLORS.highlight);
    }
    
    if (content.trim()) {
      currentY += titleFontSize * 0.5;
      // 绘制正文内容
      const contentLines = content.split('\n').filter(l => l.trim());
      for (const line of contentLines) {
        const lineHasMarkup = line.includes('**') || line.includes('*') || line.includes('__');
        if (lineHasMarkup) {
          currentY = drawTextWithMarkup(ctx, line, contentPadding, currentY, contentFontSize, MEMO_COLORS.accent, MEMO_COLORS.highlight);
        } else {
          ctx.font = `${contentFontSize}px -apple-system, PingFang SC, sans-serif`;
          ctx.fillStyle = MEMO_COLORS.text;
          ctx.fillText(line, contentPadding, currentY);
          currentY += contentFontSize * 1.3;
        }
      }
    }
  } else {
    ctx.fillStyle = MEMO_COLORS.text;
    
    let currentY = contentStartY;
    let line = '';
    for (const char of title) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > contentWidth) {
        ctx.fillText(line, contentPadding, currentY);
        currentY += titleFontSize * 1.3;
        line = char;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, contentPadding, currentY);
    currentY += titleFontSize * 1.5;
    
    if (content.trim()) {
      ctx.font = `${contentFontSize}px -apple-system, PingFang SC, sans-serif`;
      const contentLines = content.split('\n').filter(l => l.trim());
      for (const line of contentLines) {
        ctx.fillText(line, contentPadding, currentY);
        currentY += contentFontSize * 1.3;
      }
    }
  }
  
  return canvas.toDataURL('image/png');
};

// 生成备忘录内容图 - 无标题栏，无每行高亮背景
const generateContentMemo = (
  lines: string[],
  contentFontSize: number,
  pageIndex: number,
  totalPages: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = MEMO_COLORS.background;
  ctx.fillRect(0, 0, W, H);
  
  drawMemoStatusBar(ctx, W);
  drawMemoNavBar(ctx, W, pageIndex, totalPages);
  drawMemoToolbar(ctx, W, H);
  
  const statusBarHeight = 44;
  const navBarHeight = 56;
  const toolbarHeight = 80;
  const contentPadding = 40;
  const contentStartY = statusBarHeight + navBarHeight + contentPadding;
  const contentWidth = W - contentPadding * 2;
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  let currentY = contentStartY;
  const lineHeight = Math.round(contentFontSize * 1.5);
  
  for (const line of lines) {
    // 检查是否超出底部边界
    if (currentY > H - toolbarHeight - contentPadding - 30) {
      break; // 超出边界，停止绘制
    }
    
    const hasMarkup = line.includes('**') || line.includes('*') || line.includes('__');
    
    if (hasMarkup) {
      currentY = drawTextWithMarkup(ctx, line, contentPadding, currentY, contentFontSize, MEMO_COLORS.accent, MEMO_COLORS.highlight);
    } else {
      ctx.font = `${contentFontSize}px -apple-system, PingFang SC, sans-serif`;
      ctx.fillStyle = MEMO_COLORS.text;
      
      let tempLine = '';
      for (const char of line) {
        const testLine = tempLine + char;
        if (ctx.measureText(testLine).width > contentWidth) {
          ctx.fillText(tempLine, contentPadding, currentY);
          currentY += lineHeight;
          tempLine = char;
        } else {
          tempLine = testLine;
        }
      }
      if (tempLine) {
        ctx.fillText(tempLine, contentPadding, currentY);
        currentY += lineHeight;
      }
    }
    currentY += contentFontSize * 0.3;
  }
  
  return canvas.toDataURL('image/png');
};

// 拆分备忘录内容
const splitMemoContent = (lines: string[]): string[][] => {
  const MAX_LINES_PER_PAGE = 12;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += MAX_LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + MAX_LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
};

// ==================== 书籍阅读风格 ====================

const BOOK_COLORS = {
  background: '#F5E6C8',
  text: '#4A3728',
  accent: '#8B4513',
  gold: '#B8860B',
  page: '#FDF5E6',
};

// 生成书籍封面图 - 修复标记语法
const generateCoverBook = (
  title: string,
  titleFontSize: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = BOOK_COLORS.background;
  ctx.fillRect(0, 0, W, H);
  
  // 纸张纹理效果
  ctx.fillStyle = 'rgba(139, 69, 19, 0.05)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillRect(x, y, Math.random() * 3, Math.random() * 3);
  }
  
  // 外边框
  ctx.strokeStyle = BOOK_COLORS.accent;
  ctx.lineWidth = 4;
  const borderMargin = 60;
  ctx.strokeRect(borderMargin, borderMargin, W - borderMargin * 2, H - borderMargin * 2);
  
  // 内边框
  ctx.strokeStyle = BOOK_COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(borderMargin + 20, borderMargin + 20, W - (borderMargin + 20) * 2, H - (borderMargin + 20) * 2);
  
  // 顶部装饰线
  ctx.fillStyle = BOOK_COLORS.accent;
  ctx.fillRect(W / 2 - 150, 160, 300, 3);
  ctx.fillRect(W / 2 - 100, 170, 200, 2);
  
  // 标题
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${titleFontSize}px "SimSun", "宋体", serif`;
  ctx.fillStyle = BOOK_COLORS.text;
  
  const maxTextWidth = W - 300;
  const hasMarkup = title.includes('**') || title.includes('*') || title.includes('__');
  
  if (hasMarkup) {
    const titleLines = wrapTextWithMarkup(ctx, title, maxTextWidth);
    const lineHeight = Math.round(titleFontSize * 1.4);
    const totalHeight = titleLines.length * lineHeight;
    let currentY = H / 2 - totalHeight / 2;
    
    for (const titleLine of titleLines) {
      drawTextWithMarkup(ctx, titleLine, W / 2 - maxTextWidth / 2, currentY, titleFontSize, BOOK_COLORS.accent, BOOK_COLORS.gold);
      currentY += lineHeight;
    }
  } else {
    const titleLines: string[] = [];
    let line = '';
    for (const char of title) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxTextWidth) {
        titleLines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    titleLines.push(line);
    
    const lineHeight = Math.round(titleFontSize * 1.4);
    const totalHeight = titleLines.length * lineHeight;
    let currentY = H / 2 - totalHeight / 2;
    
    for (const l of titleLines) {
      ctx.fillText(l, W / 2, currentY);
      currentY += lineHeight;
    }
  }
  
  // 底部装饰线
  ctx.fillStyle = BOOK_COLORS.accent;
  ctx.fillRect(W / 2 - 150, H - 200, 300, 3);
  ctx.fillRect(W / 2 - 100, H - 190, 200, 2);
  
  // 底部信息
  ctx.font = `28px "SimSun", "宋体", serif`;
  ctx.fillStyle = BOOK_COLORS.accent;
  ctx.fillText('保险干货集', W / 2, H - 140);
  
  // 书脊装饰
  ctx.fillStyle = BOOK_COLORS.background;
  ctx.fillRect(borderMargin - 30, 100, 40, H - 200);
  ctx.strokeStyle = BOOK_COLORS.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(borderMargin - 30, 100, 40, H - 200);
  
  return canvas.toDataURL('image/png');
};

// 生成书籍内容图 - 无标题栏，无每行卡片
const generateContentBook = (
  lines: string[],
  contentFontSize: number,
  pageIndex: number,
  totalPages: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = BOOK_COLORS.page;
  ctx.fillRect(0, 0, W, H);
  
  // 纸张纹理
  ctx.fillStyle = 'rgba(139, 69, 19, 0.03)';
  for (let i = 0; i < 30; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 2, Math.random() * 2);
  }
  
  // 页边装饰
  ctx.strokeStyle = BOOK_COLORS.accent;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(100, 60);
  ctx.lineTo(W - 100, 60);
  ctx.stroke();
  ctx.setLineDash([]);
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const contentPaddingLeft = 120;
  const contentPaddingRight = 80;
  const contentWidth = W - contentPaddingLeft - contentPaddingRight;
  const lineHeight = Math.round(contentFontSize * 1.8);
  
  let currentY = 90;
  
  for (const pageLine of lines) {
    const hasMarkup = pageLine.includes('**') || pageLine.includes('*') || pageLine.includes('__');
    
    if (hasMarkup) {
      currentY = drawTextWithMarkup(ctx, pageLine, contentPaddingLeft, currentY, contentFontSize, BOOK_COLORS.accent, BOOK_COLORS.gold);
    } else {
      ctx.font = `${contentFontSize}px "SimSun", "宋体", serif`;
      ctx.fillStyle = BOOK_COLORS.text;
      
      let tempLine = '';
      for (const char of pageLine) {
        const testLine = tempLine + char;
        if (ctx.measureText(testLine).width > contentWidth) {
          ctx.fillText(tempLine, contentPaddingLeft, currentY);
          currentY += lineHeight;
          tempLine = char;
        } else {
          tempLine = testLine;
        }
      }
      if (tempLine) {
        ctx.fillText(tempLine, contentPaddingLeft, currentY);
        currentY += lineHeight;
      }
    }
    currentY += contentFontSize * 0.4;
  }
  
  // 底部页边装饰
  ctx.strokeStyle = BOOK_COLORS.accent;
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(100, H - 60);
  ctx.lineTo(W - 100, H - 60);
  ctx.stroke();
  ctx.setLineDash([]);
  
  // 页码
  ctx.font = `24px "SimSun", "宋体", serif`;
  ctx.fillStyle = BOOK_COLORS.accent;
  ctx.textAlign = 'center';
  ctx.fillText(`${pageIndex}`, W / 2, H - 40);
  
  return canvas.toDataURL('image/png');
};

// 拆分书籍内容
const splitBookContent = (lines: string[]): string[][] => {
  const MAX_LINES_PER_PAGE = 8;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += MAX_LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + MAX_LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
};

// ==================== 杂志排版风格 ====================

const MAGAZINE_COLORS = {
  white: '#FFFFFF',
  gray: '#A0A0A0',
};

// 生成杂志封面图 - 修复标记语法
const generateCoverMagazine = (
  title: string,
  bgColor: string,
  accentColor: string,
  titleFontSize: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, bgColor);
  gradient.addColorStop(1, '#000000');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
  
  // 顶部装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, W, 8);
  
  // 杂志标题
  ctx.font = 'bold 32px -apple-system, sans-serif';
  ctx.fillStyle = MAGAZINE_COLORS.white;
  ctx.textAlign = 'left';
  ctx.fillText('INSURANCE TRENDS', 60, 60);
  
  ctx.font = '20px -apple-system, sans-serif';
  ctx.fillStyle = MAGAZINE_COLORS.gray;
  ctx.fillText('保险趋势 · 年度特刊', 60, 95);
  
  // 主标题阴影效果
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  
  ctx.font = `bold ${titleFontSize}px -apple-system, PingFang SC, sans-serif`;
  ctx.fillStyle = MAGAZINE_COLORS.white;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const maxTextWidth = W - 160;
  const hasMarkup = title.includes('**') || title.includes('*') || title.includes('__');
  
  if (hasMarkup) {
    const titleLines = wrapTextWithMarkup(ctx, title, maxTextWidth);
    const lineHeight = Math.round(titleFontSize * 1.2);
    const totalHeight = titleLines.length * lineHeight;
    let currentY = H / 2 - totalHeight / 2;
    
    for (const titleLine of titleLines) {
      drawTextWithMarkup(ctx, titleLine, W / 2 - maxTextWidth / 2, currentY, titleFontSize, accentColor, '#FFE66D');
      currentY += lineHeight;
    }
  } else {
    const titleLines: string[] = [];
    let line = '';
    for (const char of title) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxTextWidth) {
        titleLines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    titleLines.push(line);
    
    const lineHeight = Math.round(titleFontSize * 1.2);
    const totalHeight = titleLines.length * lineHeight;
    let currentY = H / 2 - totalHeight / 2;
    
    for (const l of titleLines) {
      ctx.fillText(l, W / 2, currentY);
      currentY += lineHeight;
    }
  }
  
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 底部粗装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(60, H - 200, W - 120, 8);
  
  // 日期/期号
  ctx.font = '24px -apple-system, sans-serif';
  ctx.fillStyle = MAGAZINE_COLORS.gray;
  ctx.textAlign = 'center';
  ctx.fillText('2024 VOL.12', W / 2, H - 140);
  
  return canvas.toDataURL('image/png');
};

// 生成杂志内容图 - 无标题栏，无每行卡片
const generateContentMagazine = (
  lines: string[],
  bgColor: string,
  accentColor: string,
  contentFontSize: number,
  pageIndex: number,
  totalPages: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  
  // 页眉
  ctx.font = 'bold 20px -apple-system, sans-serif';
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'left';
  ctx.fillText('INSURANCE TRENDS', 40, 40);
  
  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillStyle = '#666';
  ctx.textAlign = 'right';
  ctx.fillText(`P.${pageIndex}/${totalPages}`, W - 40, 40);
  
  // 左侧标题装饰条
  ctx.fillStyle = accentColor;
  ctx.fillRect(40, 80, 6, 60);
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const contentPadding = 80;
  const contentWidth = W - contentPadding * 2;
  const lineHeight = Math.round(contentFontSize * 1.5);
  
  let currentY = 100;
  
  for (const pageLine of lines) {
    const hasMarkup = pageLine.includes('**') || pageLine.includes('*') || pageLine.includes('__');
    
    if (hasMarkup) {
      currentY = drawTextWithMarkup(ctx, pageLine, contentPadding, currentY, contentFontSize, accentColor, '#FFE66D');
    } else {
      ctx.font = `${contentFontSize}px -apple-system, PingFang SC, sans-serif`;
      ctx.fillStyle = '#333';
      
      let tempLine = '';
      for (const char of pageLine) {
        const testLine = tempLine + char;
        if (ctx.measureText(testLine).width > contentWidth) {
          ctx.fillText(tempLine, contentPadding, currentY);
          currentY += lineHeight;
          tempLine = char;
        } else {
          tempLine = testLine;
        }
      }
      if (tempLine) {
        ctx.fillText(tempLine, contentPadding, currentY);
        currentY += lineHeight;
      }
    }
    currentY += contentFontSize * 0.3;
  }
  
  // 底部粗装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(40, H - 100, W - 80, 6);
  
  // 页脚
  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 50);
  
  return canvas.toDataURL('image/png');
};

// 拆分杂志内容
const splitMagazineContent = (lines: string[]): string[][] => {
  const MAX_LINES_PER_PAGE = 10;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += MAX_LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + MAX_LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
};

// ==================== 对话气泡风格 ====================

const CHAT_COLORS = {
  questionBg: '#E3F2FD',
  answerBg: '#E8F5E9',
  questionBorder: '#2196F3',
  answerBorder: '#4CAF50',
  text: '#333333',
  subtext: '#666666',
};

// 生成对话封面图 - 修复标记语法
const generateCoverChat = (
  title: string,
  bgColor: string,
  highlightColor: string,
  titleFontSize: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  
  // 标题
  ctx.font = `bold ${titleFontSize}px -apple-system, PingFang SC, sans-serif`;
  ctx.fillStyle = CHAT_COLORS.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const maxTextWidth = W - 200;
  const hasMarkup = title.includes('**') || title.includes('*') || title.includes('__');
  
  if (hasMarkup) {
    const titleLines = wrapTextWithMarkup(ctx, title, maxTextWidth);
    const lineHeight = Math.round(titleFontSize * 1.3);
    let currentY = 100;
    for (const titleLine of titleLines) {
      drawTextWithMarkup(ctx, titleLine, W / 2 - maxTextWidth / 2, currentY, titleFontSize, CHAT_COLORS.questionBorder, highlightColor);
      currentY += lineHeight;
    }
  } else {
    const titleLines: string[] = [];
    let line = '';
    for (const char of title) {
      const testLine = line + char;
      if (ctx.measureText(testLine).width > maxTextWidth) {
        titleLines.push(line);
        line = char;
      } else {
        line = testLine;
      }
    }
    titleLines.push(line);
    
    const lineHeight = Math.round(titleFontSize * 1.3);
    let currentY = 100;
    for (const l of titleLines) {
      ctx.fillText(l, W / 2, currentY);
      currentY += lineHeight;
    }
  }
  
  // 对话气泡
  const bubbleY = 380;
  const bubbleHeight = 160;
  const bubbleWidth = 500;
  const bubbleRadius = 24;
  
  // 左侧问气泡
  const leftBubbleX = 80;
  const leftBubbleY = bubbleY;
  
  ctx.fillStyle = CHAT_COLORS.questionBg;
  ctx.beginPath();
  ctx.moveTo(leftBubbleX + bubbleRadius, leftBubbleY);
  ctx.lineTo(leftBubbleX + bubbleWidth - bubbleRadius, leftBubbleY);
  ctx.quadraticCurveTo(leftBubbleX + bubbleWidth, leftBubbleY, leftBubbleX + bubbleWidth, leftBubbleY + bubbleRadius);
  ctx.lineTo(leftBubbleX + bubbleWidth, leftBubbleY + bubbleHeight - bubbleRadius);
  ctx.quadraticCurveTo(leftBubbleX + bubbleWidth, leftBubbleY + bubbleHeight, leftBubbleX + bubbleWidth - bubbleRadius, leftBubbleY + bubbleHeight);
  ctx.lineTo(leftBubbleX + bubbleRadius + 20, leftBubbleY + bubbleHeight);
  ctx.lineTo(leftBubbleX, leftBubbleY + bubbleHeight + 15);
  ctx.lineTo(leftBubbleX + bubbleRadius, leftBubbleY + bubbleHeight);
  ctx.lineTo(leftBubbleX + bubbleRadius, leftBubbleY + bubbleHeight - bubbleRadius);
  ctx.quadraticCurveTo(leftBubbleX, leftBubbleY + bubbleHeight - bubbleRadius, leftBubbleX, leftBubbleY + bubbleHeight - bubbleRadius - 15);
  ctx.lineTo(leftBubbleX, leftBubbleY + bubbleRadius);
  ctx.quadraticCurveTo(leftBubbleX, leftBubbleY, leftBubbleX + bubbleRadius, leftBubbleY);
  ctx.fill();
  
  ctx.strokeStyle = CHAT_COLORS.questionBorder;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Q头像
  ctx.fillStyle = CHAT_COLORS.questionBorder;
  ctx.beginPath();
  ctx.arc(leftBubbleX - 30, leftBubbleY + bubbleHeight / 2, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 36px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Q', leftBubbleX - 30, leftBubbleY + bubbleHeight / 2);
  
  // 问气泡文字
  ctx.font = `${Math.round(titleFontSize * 0.6)}px -apple-system, sans-serif`;
  ctx.fillStyle = CHAT_COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText('保险问题咨询', leftBubbleX + bubbleWidth / 2, leftBubbleY + bubbleHeight / 2);
  
  // 右侧答气泡
  const rightBubbleX = W - 80 - bubbleWidth;
  const rightBubbleY = bubbleY + bubbleHeight + 40;
  
  ctx.fillStyle = CHAT_COLORS.answerBg;
  ctx.beginPath();
  ctx.moveTo(rightBubbleX + bubbleRadius, rightBubbleY);
  ctx.lineTo(rightBubbleX + bubbleWidth - bubbleRadius, rightBubbleY);
  ctx.quadraticCurveTo(rightBubbleX + bubbleWidth, rightBubbleY, rightBubbleX + bubbleWidth, rightBubbleY + bubbleRadius);
  ctx.lineTo(rightBubbleX + bubbleWidth, rightBubbleY + bubbleHeight - bubbleRadius);
  ctx.quadraticCurveTo(rightBubbleX + bubbleWidth, rightBubbleY + bubbleHeight, rightBubbleX + bubbleWidth - bubbleRadius, rightBubbleY + bubbleHeight);
  ctx.lineTo(rightBubbleX + bubbleRadius - 20, rightBubbleY + bubbleHeight);
  ctx.lineTo(rightBubbleX + bubbleWidth, rightBubbleY + bubbleHeight + 15);
  ctx.lineTo(rightBubbleX + bubbleRadius, rightBubbleY + bubbleHeight);
  ctx.lineTo(rightBubbleX + bubbleRadius, rightBubbleY + bubbleHeight - bubbleRadius);
  ctx.quadraticCurveTo(rightBubbleX, rightBubbleY + bubbleHeight - bubbleRadius, rightBubbleX, rightBubbleY + bubbleHeight - bubbleRadius - 15);
  ctx.lineTo(rightBubbleX, rightBubbleY + bubbleRadius);
  ctx.quadraticCurveTo(rightBubbleX, rightBubbleY, rightBubbleX + bubbleRadius, rightBubbleY);
  ctx.fill();
  
  ctx.strokeStyle = CHAT_COLORS.answerBorder;
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // A头像
  ctx.fillStyle = CHAT_COLORS.answerBorder;
  ctx.beginPath();
  ctx.arc(rightBubbleX + bubbleWidth + 30, rightBubbleY + bubbleHeight / 2, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 36px -apple-system, sans-serif';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', rightBubbleX + bubbleWidth + 30, rightBubbleY + bubbleHeight / 2);
  
  // 答气泡文字
  ctx.font = `${Math.round(titleFontSize * 0.6)}px -apple-system, sans-serif`;
  ctx.fillStyle = CHAT_COLORS.text;
  ctx.textAlign = 'center';
  ctx.fillText('专业保险解答', rightBubbleX + bubbleWidth / 2, rightBubbleY + bubbleHeight / 2);
  
  // 底部总结
  const summaryY = rightBubbleY + bubbleHeight + 80;
  ctx.font = `bold ${Math.round(titleFontSize * 0.5)}px -apple-system, sans-serif`;
  ctx.fillStyle = CHAT_COLORS.subtext;
  ctx.textAlign = 'center';
  ctx.fillText('💡 点击查看详细内容', W / 2, summaryY);
  
  return canvas.toDataURL('image/png');
};

// 生成对话内容图 - 多轮对话，只有标记语法才高亮
const generateContentChat = (
  lines: string[],
  bgColor: string,
  highlightColor: string,
  contentFontSize: number,
  pageIndex: number,
  totalPages: number
): string => {
  const W = 1080, H = 1440;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  
  // 页码
  ctx.font = '16px -apple-system, sans-serif';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText(`第 ${pageIndex} 页 / 共 ${totalPages} 页`, W / 2, 30);
  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const contentPadding = 60;
  const bubbleWidth = W - contentPadding * 2 - 100;
  const bubbleHeight = Math.round(contentFontSize * 2.2);
  const bubbleRadius = 20;
  const bubbleGap = 30;
  
  let currentY = 60;
  let isQuestion = true;
  
  for (const pageLine of lines) {
    const bubbleX = isQuestion ? contentPadding : W - contentPadding - bubbleWidth;
    const bubbleBgColor = isQuestion ? CHAT_COLORS.questionBg : CHAT_COLORS.answerBg;
    const borderColor = isQuestion ? CHAT_COLORS.questionBorder : CHAT_COLORS.answerBorder;
    
    // 气泡背景
    ctx.fillStyle = bubbleBgColor;
    ctx.beginPath();
    ctx.moveTo(bubbleX + bubbleRadius, currentY);
    ctx.lineTo(bubbleX + bubbleWidth - bubbleRadius, currentY);
    ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY, bubbleX + bubbleWidth, currentY + bubbleRadius);
    ctx.lineTo(bubbleX + bubbleWidth, currentY + bubbleHeight - bubbleRadius);
    ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY + bubbleHeight, bubbleX + bubbleWidth - bubbleRadius, currentY + bubbleHeight);
    ctx.lineTo(bubbleX + bubbleRadius, currentY + bubbleHeight);
    ctx.quadraticCurveTo(bubbleX, currentY + bubbleHeight, bubbleX, currentY + bubbleHeight - bubbleRadius);
    ctx.lineTo(bubbleX, currentY + bubbleRadius);
    ctx.quadraticCurveTo(bubbleX, currentY, bubbleX + bubbleRadius, currentY);
    ctx.fill();
    
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 小三角
    ctx.fillStyle = bubbleBgColor;
    ctx.beginPath();
    if (isQuestion) {
      ctx.moveTo(bubbleX + bubbleWidth, currentY + bubbleHeight - 10);
      ctx.lineTo(bubbleX + bubbleWidth + 15, currentY + bubbleHeight + 10);
      ctx.lineTo(bubbleX + bubbleWidth - 10, currentY + bubbleHeight);
    } else {
      ctx.moveTo(bubbleX, currentY + bubbleHeight - 10);
      ctx.lineTo(bubbleX - 15, currentY + bubbleHeight + 10);
      ctx.lineTo(bubbleX + 10, currentY + bubbleHeight);
    }
    ctx.fill();
    ctx.stroke();
    
    // 气泡文字
    const textX = bubbleX + 25;
    const textY = currentY + bubbleHeight / 2;
    
    const hasMarkup = pageLine.includes('**') || pageLine.includes('*') || pageLine.includes('__');
    
    if (hasMarkup) {
      ctx.textAlign = 'left';
      drawTextWithMarkup(ctx, pageLine, textX, textY - contentFontSize / 2, contentFontSize, borderColor, highlightColor);
    } else {
      ctx.font = `${contentFontSize}px -apple-system, PingFang SC, sans-serif`;
      ctx.fillStyle = CHAT_COLORS.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      let displayText = pageLine;
      const maxTextWidth = bubbleWidth - 50;
      while (ctx.measureText(displayText).width > maxTextWidth && displayText.length > 0) {
        displayText = displayText.slice(0, -1);
      }
      if (displayText.length < pageLine.length) {
        displayText += '…';
      }
      ctx.fillText(displayText, textX, textY);
    }
    
    currentY += bubbleHeight + bubbleGap;
    isQuestion = !isQuestion;
    
    if (currentY > H - 100) break;
  }
  
  // 水印
  ctx.font = '14px -apple-system, sans-serif';
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  ctx.fillText('保险干货 | 关注不迷路', W / 2, H - 30);
  
  return canvas.toDataURL('image/png');
};

// 拆分对话内容
const splitChatContent = (lines: string[]): string[][] => {
  const LINES_PER_PAGE = 6;
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
    pages.push(lines.slice(i, i + LINES_PER_PAGE));
  }
  return pages.length > 0 ? pages : [[]];
};

// ==================== 首图生成组件 ====================

function CoverTab() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [bgColor, setBgColor] = useState('#FFF5F5');
  const [accentColor, setAccentColor] = useState('#FF4757');
  const [highlightColor, setHighlightColor] = useState('#FFE66D');
  const [titleFontSize, setTitleFontSize] = useState(80);
  const [contentFontSize, setContentFontSize] = useState(42);
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('card');
  
  const handleGenerate = async () => {
    if (!title.trim()) {
      message.warning('请输入标题');
      return;
    }
    setLoading(true);
    try {
      let generatedImage: string;
      
      switch (template) {
        case 'card':
          generatedImage = generateCoverCard(title, bgColor, accentColor, highlightColor, titleFontSize);
          break;
        case 'memo':
          generatedImage = generateCoverMemo(title, content, titleFontSize, contentFontSize);
          break;
        case 'book':
          generatedImage = generateCoverBook(title, titleFontSize);
          break;
        case 'magazine':
          generatedImage = generateCoverMagazine(title, bgColor, accentColor, titleFontSize);
          break;
        case 'chat':
          generatedImage = generateCoverChat(title, bgColor, highlightColor, titleFontSize);
          break;
        default:
          generatedImage = generateCoverCard(title, bgColor, accentColor, highlightColor, titleFontSize);
      }
      
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
  
  const currentTemplate = TEMPLATES.find(t => t.key === template);
  
  return (
    <div className="flex gap-6">
      <div className="w-1/2">
        <TemplateSelector value={template} onChange={setTemplate} />
        
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
        
        {(template === 'memo' || template === 'book') && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">摘要内容（可选）</div>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder='输入摘要内容，将显示在标题下方'
              rows={4}
              style={{ fontSize: 15 }}
            />
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-500">
          <BulbOutlined className="mr-1" />
          <span className="font-medium">标记语法：</span>
          <code className="bg-yellow-100 px-1 rounded">**文字**</code> 高亮 
          <code className="bg-pink-100 px-1 rounded ml-2">*文字*</code> 换色 
          <code className="bg-blue-100 px-1 rounded ml-2">__文字__</code> 下划线
        </div>
        
        {currentTemplate?.hasBgColor && (
          <ColorSelector label="背景色" presets={BG_PRESETS} value={bgColor} onChange={setBgColor} />
        )}
        {currentTemplate?.hasAccentColor && (
          <ColorSelector label="强调色" presets={ACCENT_COLORS} value={accentColor} onChange={setAccentColor} />
        )}
        {currentTemplate?.hasHighlightColor && (
          <ColorSelector label="高亮色" presets={HIGHLIGHT_COLORS} value={highlightColor} onChange={setHighlightColor} />
        )}
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">标题字号</div>
            <div className="text-sm text-gray-500">{titleFontSize}px</div>
          </div>
          <input
            type="range"
            min={60}
            max={150}
            value={titleFontSize}
            onChange={(e) => setTitleFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        {template === 'memo' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">正文字号</div>
              <div className="text-sm text-gray-500">{contentFontSize}px</div>
            </div>
            <input
              type="range"
              min={28}
              max={60}
              value={contentFontSize}
              onChange={(e) => setContentFontSize(Number(e.target.value))}
              className="w-full"
            />
          </div>
        )}
        
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

// ==================== 内容图生成组件 ====================

function ContentTab() {
  const [title, setTitle] = useState('');
  const [fullText, setFullText] = useState('');
  const [bgColor, setBgColor] = useState('#FFF5F5');
  const [accentColor, setAccentColor] = useState('#FF4757');
  const [highlightColor, setHighlightColor] = useState('#FFE66D');
  const [contentFontSize, setContentFontSize] = useState(46);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [template, setTemplate] = useState('card');
  
  const splitTextToLines = (text: string): string[] => {
    let lines = text.split(/\n/);
    lines = lines.filter(line => line.trim().length > 0);
    if (lines.length > 40) {
      lines = lines.slice(0, 40);
    }
    return lines;
  };
  
  const estimatedImages = () => {
    const lines = splitTextToLines(fullText);
    if (lines.length === 0) return 1;
    
    switch (template) {
      case 'card': return Math.max(1, Math.ceil(lines.length / 8));
      case 'memo': return Math.max(1, Math.ceil(lines.length / 12));
      case 'book': return Math.max(1, Math.ceil(lines.length / 8));
      case 'magazine': return Math.max(1, Math.ceil(lines.length / 10));
      case 'chat': return Math.max(1, Math.ceil(lines.length / 6));
      default: return Math.max(1, Math.ceil(lines.length / 8));
    }
  };
  
  const handleGenerate = async () => {
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
      let generatedImages: string[];
      
      switch (template) {
        case 'card': {
          const groupSize = 8;
          const pages: string[][] = [];
          for (let i = 0; i < validLines.length; i += groupSize) {
            pages.push(validLines.slice(i, i + groupSize));
          }
          generatedImages = pages.map(pageLines => 
            generateContentCard(pageLines, bgColor, accentColor, highlightColor, contentFontSize)
          );
          break;
        }
        case 'memo': {
          const pages = splitMemoContent(validLines);
          const total = pages.length;
          generatedImages = pages.map((pageLines, index) => 
            generateContentMemo(pageLines, contentFontSize, index + 1, total)
          );
          break;
        }
        case 'book': {
          const pages = splitBookContent(validLines);
          const total = pages.length;
          generatedImages = pages.map((pageLines, index) => 
            generateContentBook(pageLines, contentFontSize, index + 1, total)
          );
          break;
        }
        case 'magazine': {
          const pages = splitMagazineContent(validLines);
          const total = pages.length;
          generatedImages = pages.map((pageLines, index) => 
            generateContentMagazine(pageLines, bgColor, accentColor, contentFontSize, index + 1, total)
          );
          break;
        }
        case 'chat': {
          const pages = splitChatContent(validLines);
          const total = pages.length;
          generatedImages = pages.map((pageLines, index) => 
            generateContentChat(pageLines, bgColor, highlightColor, contentFontSize, index + 1, total)
          );
          break;
        }
        default:
          generatedImages = [];
      }
      
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
  
  const handleDownloadAll = () => {
    images.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img;
        link.download = `content-${index + 1}-${Date.now()}.png`;
        link.click();
      }, index * 300);
    });
    message.success(`开始下载 ${images.length} 张图片`);
  };
  
  const currentTemplate = TEMPLATES.find(t => t.key === template);
  
  return (
    <div className="flex gap-6">
      <div className="w-1/2">
        <TemplateSelector value={template} onChange={setTemplate} />
        
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
            placeholder={`粘贴笔记全文，支持多段落\n\n示例：\n第一段内容...\n第二段内容...\n第三段内容...`}
            rows={10}
            style={{ fontSize: 15 }}
          />
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm text-gray-500">
          <BulbOutlined className="mr-1" />
          <span className="font-medium">标记语法：</span>
          <code className="bg-yellow-100 px-1 rounded">**文字**</code> 高亮 
          <code className="bg-pink-100 px-1 rounded ml-2">*文字*</code> 换色 
          <code className="bg-blue-100 px-1 rounded ml-2">__文字__</code> 下划线
        </div>
        
        {currentTemplate?.hasBgColor && (
          <ColorSelector label="背景色" presets={BG_PRESETS} value={bgColor} onChange={setBgColor} />
        )}
        {currentTemplate?.hasAccentColor && (
          <ColorSelector label="强调色" presets={ACCENT_COLORS} value={accentColor} onChange={setAccentColor} />
        )}
        {currentTemplate?.hasHighlightColor && (
          <ColorSelector label="高亮色" presets={HIGHLIGHT_COLORS} value={highlightColor} onChange={setHighlightColor} />
        )}
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">正文字号</div>
            <div className="text-sm text-gray-500">{contentFontSize}px</div>
          </div>
          <input
            type="range"
            min={28}
            max={60}
            value={contentFontSize}
            onChange={(e) => setContentFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
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

// ==================== 主页面组件 ====================

export default function ImageGen() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">小红书配图生成</h2>
        <p className="text-gray-500 mt-1">生成小红书风格的封面图和内容图，支持5种风格和重点文字标记</p>
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
