const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 读取句子数据
function loadSentences() {
  const sentences = {};
  const categories = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'];
  
  categories.forEach(category => {
    try {
      const filePath = path.join(__dirname, 'sentences', `${category}.json`);
      const data = fs.readFileSync(filePath, 'utf8');
      sentences[category] = JSON.parse(data);
    } catch (error) {
      console.error(`无法加载 ${category}.json:`, error.message);
    }
  });
  
  return sentences;
}

// 获取随机句子
function getRandomHitokoto(sentences, category = null, min = null, max = null) {
  let allSentences = [];
  
  if (category) {
    // 指定分类
    if (sentences[category]) {
      allSentences = sentences[category];
    }
  } else {
    // 所有分类
    Object.values(sentences).forEach(categorySentences => {
      allSentences = allSentences.concat(categorySentences);
    });
  }
  
  if (min || max) {
    allSentences = allSentences.filter(sentence => {
      const length = sentence.hitokoto ? sentence.hitokoto.length : 0;
      if (min && length < min) return false;
      if (max && length > max) return false;
      return true;
    });
  }
  
  if (allSentences.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * allSentences.length);
  return allSentences[randomIndex];
}

const sentencesData = loadSentences();

// API 路由
app.get('/', (req, res) => {
  const category = req.query.c || null;
  const min = req.query.min ? parseInt(req.query.min) : null;
  const max = req.query.max ? parseInt(req.query.max) : null;
  const encode = req.query.encode || 'json';
  const callback = req.query.callback || null;
  
  const hitokoto = getRandomHitokoto(sentencesData, category, min, max);
  
  if (!hitokoto) {
    return res.status(404).json({ error: '没有找到符合条件的句子' });
  }
  
  // 根据请求类型返回数据
  if (encode === 'jsonp' && callback) {
    res.jsonp(hitokoto);
  } else {
    res.json(hitokoto);
  }
});

// 静态文件服务
app.use('/sentences', express.static(path.join(__dirname, 'sentences')));

// 获取状态信息
app.get('/status', (req, res) => {
  const categories = Object.keys(sentencesData).map(key => ({
    category: key,
    count: sentencesData[key] ? sentencesData[key].length : 0
  }));
  
  res.json({
    status: 'ok',
    totalCategories: categories.length,
    categories: categories,
    totalSentences: Object.values(sentencesData).reduce((sum, cat) => sum + (cat ? cat.length : 0), 0)
  });
});

// 健康检查
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong' });
});

app.listen(port, () => {
  console.log(`Hitokoto API server is running on port ${port}`);
  console.log(`API endpoints:`);
  console.log(`  - / (获取随机句子)`);
  console.log(`  - /?c=a (指定分类)`);
  console.log(`  - /?min=10&max=30 (指定长度)`);
  console.log(`  - /status (查看状态)`);
  console.log(`  - /ping (健康检查)`);
  console.log(`  - /sentences/a.json (直接访问数据)`);
});