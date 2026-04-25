// AI标题优化页面 - 方案二
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { api } from '../lib/api';

interface TitleAnalysis {
  title: string;
  score: number;
  patterns: string[];
  keyword: string;
  category: string;
  suggestions: string[];
  viralPotential: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface OptimizationResult {
  originalTitle: string;
  optimizedTitle: string;
  improvement: number;
  techniques: string[];
  reason: string;
}

interface LearnedData {
  topKeywords: string[];
  topPatterns: string[];
  avgScore: number;
}

const PATTERN_LABELS: Record<string, { label: string; color: string }> = {
  NUMBER: { label: '数字体', color: 'bg-blue-100 text-blue-700' },
  QUESTION: { label: '疑问体', color: 'bg-purple-100 text-purple-700' },
  SHOCK: { label: '震惊体', color: 'bg-red-100 text-red-700' },
  EMOTION: { label: '情绪体', color: 'bg-pink-100 text-pink-700' },
  PRACTICAL: { label: '实用体', color: 'bg-green-100 text-green-700' },
  STORY: { label: '故事体', color: 'bg-yellow-100 text-yellow-700' },
  IDENTITY: { label: '身份标签', color: 'bg-indigo-100 text-indigo-700' },
  CONTRAST: { label: '对比体', color: 'bg-orange-100 text-orange-700' }
};

const VIRAL_LABELS = {
  HIGH: { label: '高潜力', color: 'text-green-600', bg: 'bg-green-50' },
  MEDIUM: { label: '中潜力', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LOW: { label: '低潜力', color: 'text-gray-600', bg: 'bg-gray-50' }
};

export default function TitleOptimizer() {
  const [activeTab, setActiveTab] = useState<'optimize' | 'analyze' | 'learn'>('optimize');
  const [title, setTitle] = useState('');
  const [titles, setTitles] = useState<string[]>([]);
  const [results, setResults] = useState<OptimizationResult[]>([]);
  const [analysis, setAnalysis] = useState<TitleAnalysis | null>(null);
  const [learned, setLearned] = useState<LearnedData | null>(null);
  const [hotTopic, setHotTopic] = useState('');
  const [hotTitles, setHotTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetAudience, setTargetAudience] = useState('保险消费者');
  const [hotTopicsInput, setHotTopicsInput] = useState('');

  // 加载学习数据
  useEffect(() => {
    loadLearnedData();
  }, []);

  const loadLearnedData = async () => {
    try {
      const res = await api.get('/title-optimization/learn');
      setLearned(res.data.learned);
    } catch (e) {
      console.log('加载学习数据失败');
    }
  };

  const handleAnalyze = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('/title-optimization/analyze', { title });
      setAnalysis(res.data.analysis);
    } catch (e) {
      console.log('分析失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('/title-optimization/optimize', {
        title,
        targetAudience,
        hotTopics: hotTopicsInput
      });
      setResults([res.data.result, ...results].slice(0, 20));
    } catch (e) {
      console.log('优化失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchOptimize = async () => {
    if (titles.length === 0) return;
    setLoading(true);

    try {
      const res = await api.post('/title-optimization/optimize/batch', {
        titles,
        targetAudience,
        hotTopics: hotTopicsInput
      });
      setResults(res.data.results);
    } catch (e) {
      console.log('批量优化失败');
    } finally {
      setLoading(false);
    }
  };

  const handleHotTopic = async () => {
    if (!hotTopic.trim()) return;
    setLoading(true);

    try {
      const res = await api.post('/title-optimization/hot-topic', {
        hotTopic,
        keywords: ['保险', '保障', '重疾险', '医疗险']
      });
      setHotTitles(res.data.titles);
    } catch (e) {
      console.log('热点借势失败');
    } finally {
      setLoading(false);
    }
  };

  const addTitle = () => {
    if (title.trim() && titles.length < 10) {
      setTitles([...titles, title]);
      setTitle('');
    }
  };

  const removeTitle = (index: number) => {
    setTitles(titles.filter((_, i) => i !== index));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">AI标题优化</h1>
          <p className="text-gray-600 mt-1">方案二：自动分析爆款特征 · 动态更新Prompt · 热点自动借势</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b">
          {[
            { key: 'optimize', label: '标题优化' },
            { key: 'analyze', label: '标题分析' },
            { key: 'learn', label: '爆款学习' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* 标题优化 Tab */}
          {activeTab === 'optimize' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Input */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">优化设置</h2>

                {/* Single Title Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    输入标题
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="输入需要优化的标题..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => e.key === 'Enter' && addTitle()}
                    />
                    <button
                      onClick={addTitle}
                      disabled={titles.length >= 10}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      添加
                    </button>
                  </div>
                </div>

                {/* Title List */}
                {titles.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      待优化标题 ({titles.length}/10)
                    </label>
                    <div className="space-y-2">
                      {titles.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                          <span className="flex-1 text-sm truncate">{t}</span>
                          <button
                            onClick={() => removeTitle(i)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      目标人群
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="保险消费者">保险消费者</option>
                      <option value="新手爸妈">新手爸妈</option>
                      <option value="职场人士">职场人士</option>
                      <option value="中老年人">中老年人</option>
                      <option value="高净值人群">高净值人群</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      借势热点（可选）
                    </label>
                    <input
                      type="text"
                      value={hotTopicsInput}
                      onChange={(e) => setHotTopicsInput(e.target.value)}
                      placeholder="如：延迟退休、医改"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleOptimize}
                    disabled={!title.trim() || loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '优化中...' : '优化标题'}
                  </button>
                  <button
                    onClick={handleBatchOptimize}
                    disabled={titles.length === 0 || loading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? '批量优化中...' : '批量优化'}
                  </button>
                </div>
              </div>

              {/* Right: Results */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">优化结果</h2>

                {results.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    暂无优化结果
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {results.map((result, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 line-through">{result.originalTitle}</p>
                            <p className="font-medium text-blue-600">{result.optimizedTitle}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(result.optimizedTitle)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            📋
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`${result.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.improvement >= 0 ? '+' : ''}{result.improvement}分
                          </span>
                          <span className="text-gray-400">|</span>
                          <div className="flex gap-1">
                            {result.techniques.map(t => (
                              <span
                                key={t}
                                className={`px-2 py-0.5 rounded text-xs ${PATTERN_LABELS[t]?.color || 'bg-gray-100'}`}
                              >
                                {PATTERN_LABELS[t]?.label || t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 标题分析 Tab */}
          {activeTab === 'analyze' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">标题分析</h2>
                <div className="mb-4">
                  <textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="输入标题进行深度分析..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 resize-none"
                  />
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!title.trim() || loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? '分析中...' : '开始分析'}
                </button>
              </div>

              {/* Analysis Result */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">分析结果</h2>

                {analysis ? (
                  <div className="space-y-4">
                    {/* Score */}
                    <div className="text-center py-4">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-3xl font-bold ${
                        analysis.viralPotential === 'HIGH'
                          ? 'bg-green-100 text-green-600'
                          : analysis.viralPotential === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {analysis.score}
                      </div>
                      <div className={`mt-2 text-lg font-medium ${VIRAL_LABELS[analysis.viralPotential].color}`}>
                        {VIRAL_LABELS[analysis.viralPotential].label}
                      </div>
                    </div>

                    {/* Patterns */}
                    {analysis.patterns.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">标题特征</h3>
                        <div className="flex flex-wrap gap-2">
                          {analysis.patterns.map(p => (
                            <span
                              key={p}
                              className={`px-3 py-1 rounded-full text-sm ${PATTERN_LABELS[p]?.color || 'bg-gray-100'}`}
                            >
                              {PATTERN_LABELS[p]?.label || p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Keyword */}
                    {analysis.keyword && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">匹配关键词</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          {analysis.keyword}
                        </span>
                      </div>
                    )}

                    {/* Suggestions */}
                    {analysis.suggestions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">优化建议</h3>
                        <ul className="space-y-1">
                          {analysis.suggestions.map((s, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    输入标题并点击分析
                  </div>
                )}
              </div>

              {/* Hot Topic Generator */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow p-6 lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">🔥 热点借势</h2>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text"
                    value={hotTopic}
                    onChange={(e) => setHotTopic(e.target.value)}
                    placeholder="输入热点话题，如：延迟退休、医改..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleHotTopic()}
                  />
                  <button
                    onClick={handleHotTopic}
                    disabled={!hotTopic.trim() || loading}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    生成借势标题
                  </button>
                </div>

                {hotTitles.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {hotTitles.map((t, i) => (
                      <div key={i} className="bg-white rounded-lg p-3 flex items-center gap-3">
                        <span className="text-gray-400 text-sm">{i + 1}</span>
                        <span className="flex-1">{t}</span>
                        <button
                          onClick={() => copyToClipboard(t)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          📋
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 爆款学习 Tab */}
          {activeTab === 'learn' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Learned Keywords */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">🔥 高频关键词</h2>
                {learned?.topKeywords ? (
                  <div className="space-y-2">
                    {learned.topKeywords.map((kw, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b">
                        <span className="font-medium">{kw}</span>
                        <span className="text-sm text-gray-500">#{i + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                )}
              </div>

              {/* Learned Patterns */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">📊 爆款模式</h2>
                {learned?.topPatterns ? (
                  <div className="space-y-3">
                    {learned.topPatterns.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <span className={`px-3 py-1 rounded-full ${
                          PATTERN_LABELS[p]?.color || 'bg-gray-100'
                        }`}>
                          {PATTERN_LABELS[p]?.label || p}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                )}
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">📈 平均分数</h2>
                <div className="text-center py-6">
                  <div className="text-5xl font-bold text-blue-600">
                    {learned?.avgScore || '--'}
                  </div>
                  <div className="text-gray-500 mt-2">爆款标题平均分</div>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">标题模式权重</h3>
                  <div className="space-y-2 text-sm">
                    {Object.entries(PATTERN_LABELS).map(([key, { label, color }]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded ${color}`}>{label}</span>
                        <span className="text-gray-500">
                          {key === 'NUMBER' ? '+4' :
                           key === 'EMOTION' || key === 'PRACTICAL' ? '+4' :
                           key === 'SHOCK' || key === 'QUESTION' || key === 'STORY' ? '+3' : '+2'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
