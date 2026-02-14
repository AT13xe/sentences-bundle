// Vercel API Routes 版本的 Hitokoto API
import fs from 'fs';
import path from 'path';

// 读取句子数据的函数
function loadSentences() {
  const sentences = {};
  const categories = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
  
  for (const category of categories) {
    try {
      const filePath = path.join(process.cwd(), 'sentences', `${category}.json`);
      const data = fs.readFileSync(filePath, 'utf8');
      sentences[category] = JSON.parse(data);
    } catch (error) {
      console.error(`无法加载 ${category}.json:`, error.message);
    }
  }
  
  return sentences;
}

// 获取随机句子的函数
function getRandomHitokoto(sentences, category = null, min = null, max = null) {
  let allSentences = [];
  
  if (category && sentences[category]) {
    allSentences = sentences[category];
  } else {
    // 合并所有类别的句子
    Object.values(sentences).forEach(categorySentences => {
      if (categorySentences) {
        allSentences = allSentences.concat(categorySentences);
      }
    });
  }
  
  // 根据长度过滤
  if (min !== null || max !== null) {
    allSentences = allSentences.filter(sentence => {
      const length = sentence.hitokoto ? sentence.hitokoto.length : 0;
      if (min !== null && length < min) return false;
      if (max !== null && length > max) return false;
      return true;
    });
  }
  
  if (allSentences.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * allSentences.length);
  return allSentences[randomIndex];
}

export default function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 读取句子数据
  const sentencesData = loadSentences();
  
  const { pathname, searchParams } = new URL(`http://localhost${req.url}`);
  
  if (pathname === '/api/ping') {
    // 健康检查
    res.status(200).json({ status: 'ok', message: 'pong' });
  } else if (pathname === '/api/status') {
    // 状态信息
    const categories = Object.keys(sentencesData).map(key => ({
      category: key,
      count: sentencesData[key] ? sentencesData[key].length : 0
    }));
    
    res.status(200).json({
      status: 'ok',
      totalCategories: categories.length,
      categories: categories,
      totalSentences: Object.values(sentencesData).reduce((sum, cat) => sum + (cat ? cat.length : 0), 0)
    });
  } else {
    // 主要的 hitokoto API
    const category = searchParams.get('c');
    const min = searchParams.get('min') ? parseInt(searchParams.get('min')) : null;
    const max = searchParams.get('max') ? parseInt(searchParams.get('max')) : null;
    
    const hitokoto = getRandomHitokoto(sentencesData, category, min, max);
    
    if (!hitokoto) {
      return res.status(404).json({ error: '没有找到符合条件的句子' });
    }
    
    res.status(200).json(hitokoto);
  }
}