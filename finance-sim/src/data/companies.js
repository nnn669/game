export const SECTOR_MACRO = {
  '能源化工':   { trend: 0, volatility: 0.025, cyclical: true  },
  '战略资源':   { trend: 0, volatility: 0.035, cyclical: false },
  '公用事业':   { trend: 0, volatility: 0.015, cyclical: false },
  '科技创新':   { trend: 0, volatility: 0.045, cyclical: false },
  '民生消费':   { trend: 0, volatility: 0.020, cyclical: true  },
  '互联网':     { trend: 0, volatility: 0.050, cyclical: false },
  '新能源汽车': { trend: 0, volatility: 0.055, cyclical: false },
  '消费电子':   { trend: 0, volatility: 0.040, cyclical: false },
  'AI芯片':     { trend: 0, volatility: 0.070, cyclical: false },
  '数字货币':   { trend: 0, volatility: 0.120, cyclical: false },
}

export const SECTOR_PE = {
  '能源化工': 12, '战略资源': 18, '公用事业': 14, '科技创新': 35,
  '民生消费': 20, '互联网': 28, '新能源汽车': 30, '消费电子': 22,
  'AI芯片': 45, '数字货币': 0,
}

export const INDUSTRY_POOLS = {
  '能源化工':   ['碳中和', '氢能源', 'LNG运输', '化工特材', '海上风电'],
  '战略资源':   ['锂矿开采', '固态电池', '量子材料', '芯片矿物', '永磁电机'],
  '公用事业':   ['核电站', '海水淡化', '智能电网', '储能电池', '绿电出口'],
  '科技创新':   ['大模型', '机器人', '量子计算', '6G通信', '脑机接口'],
  '民生消费':   ['预制菜', '咖啡连锁', '宠物经济', '国潮服饰', '健康食品'],
  '互联网':     ['元宇宙', '短视频', '电商AI化', '私域运营', '云游戏'],
  '新能源汽车': ['固态电池', '无人驾驶', '飞行汽车', '换电服务', '车载AI'],
  '消费电子':   ['AR眼镜', '折叠屏', '空间计算', '智能家居', '可穿戴'],
  'AI芯片':     ['推理芯片', '边缘AI', '光子计算', 'RISC-V', 'CoWoS封装'],
  '数字货币':   ['Layer2', 'DeFi', 'NFT', 'Web3钱包', 'RWA资产'],
}

// CEO 名字库
export const CEO_NAMES = [
  '张伟', '李强', '王芳', '刘洋', '陈杰', '赵磊', '孙明', '周静',
  '吴昊', '郑丽', '林峰', '黄涛', '许健', '何鑫', '邓超', '曾颖',
]

export const COMPANIES = [
  {
    code: 'X001', name: '中华石油', logo: '🛢️', sector: '能源化工',
    revenue: 5e10, profit: 3e9, cashFlow: 8e9, debtRatio: 0.35,
    peRatio: 12, dividendRate: 0.04, employees: 50000,
    aiMood: 'neutral', ceoStyle: '稳健型', ceoName: '张伟',
    isCrypto: false,
  },
  {
    code: 'J002', name: '华锐稀土', logo: '💎', sector: '战略资源',
    revenue: 1.5e10, profit: 2e9, cashFlow: 3e9, debtRatio: 0.28,
    peRatio: 18, dividendRate: 0.02, employees: 12000,
    aiMood: 'neutral', ceoStyle: '稳健型', ceoName: '李强',
    isCrypto: false,
  },
  {
    code: 'K003', name: '绿源电力', logo: '⚡', sector: '公用事业',
    revenue: 2e10, profit: 1.8e9, cashFlow: 4e9, debtRatio: 0.42,
    peRatio: 14, dividendRate: 0.05, employees: 30000,
    aiMood: 'neutral', ceoStyle: '保守型', ceoName: '王芳',
    isCrypto: false,
  },
  {
    code: 'R004', name: '星驰科技', logo: '🚀', sector: '科技创新',
    revenue: 8e9, profit: 1.2e9, cashFlow: 2e9, debtRatio: 0.20,
    peRatio: 35, dividendRate: 0.01, employees: 8000,
    aiMood: 'bull', ceoStyle: '激进型', ceoName: '刘洋',
    isCrypto: false,
  },
  {
    code: 'X005', name: '丰收粮油', logo: '🌾', sector: '民生消费',
    revenue: 1.2e10, profit: 8e8, cashFlow: 1.5e9, debtRatio: 0.30,
    peRatio: 20, dividendRate: 0.03, employees: 20000,
    aiMood: 'neutral', ceoStyle: '稳健型', ceoName: '陈杰',
    isCrypto: false,
  },
  {
    code: 'HK001', name: '腾讯控股', logo: '🐧', sector: '互联网',
    revenue: 6e11, profit: 1.5e11, cashFlow: 2e11, debtRatio: 0.15,
    peRatio: 28, dividendRate: 0.015, employees: 110000,
    aiMood: 'bull', ceoStyle: '激进型', ceoName: '马化腾',
    isCrypto: false,
  },
  {
    code: 'HK002', name: '比亚迪', logo: '🚗', sector: '新能源汽车',
    revenue: 4e11, profit: 3e10, cashFlow: 8e10, debtRatio: 0.40,
    peRatio: 30, dividendRate: 0.008, employees: 570000,
    aiMood: 'neutral', ceoStyle: '激进型', ceoName: '王传福',
    isCrypto: false,
  },
  {
    code: 'US001', name: '苹果公司', logo: '🍎', sector: '消费电子',
    revenue: 3.8e12, profit: 1e12, cashFlow: 1.1e12, debtRatio: 0.30,
    peRatio: 22, dividendRate: 0.005, employees: 164000,
    aiMood: 'bull', ceoStyle: '稳健型', ceoName: 'Tim Cook',
    isCrypto: false,
  },
  {
    code: 'US002', name: '英伟达', logo: '🎮', sector: 'AI芯片',
    revenue: 2.2e12, profit: 5e11, cashFlow: 6e11, debtRatio: 0.12,
    peRatio: 45, dividendRate: 0.003, employees: 36000,
    aiMood: 'bull', ceoStyle: '激进型', ceoName: 'Jensen Huang',
    isCrypto: false,
  },
  {
    code: 'BTC', name: '比特币', logo: '₿', sector: '数字货币',
    revenue: 0, profit: 0, cashFlow: 0, debtRatio: 0,
    peRatio: 0, dividendRate: 0, employees: 0,
    aiMood: 'bull', ceoStyle: '激进型', ceoName: 'Satoshi',
    isCrypto: true,
  },
  {
    code: 'ETH', name: '以太坊', logo: '🔷', sector: '数字货币',
    revenue: 0, profit: 0, cashFlow: 0, debtRatio: 0,
    peRatio: 0, dividendRate: 0, employees: 0,
    aiMood: 'neutral', ceoStyle: '稳健型', ceoName: 'Vitalik',
    isCrypto: true,
  },
  {
    code: 'XCOIN', name: '星驰币', logo: '⭐', sector: '数字货币',
    revenue: 0, profit: 0, cashFlow: 0, debtRatio: 0,
    peRatio: 0, dividendRate: 0, employees: 0,
    aiMood: 'neutral', ceoStyle: '保守型', ceoName: '匿名',
    isCrypto: true,
  },
]

export const UPGRADE_DEFS = [
  {
    id: 'rd', icon: '🔬', label: '追加研发', cd: 60, minPct: 1,
    desc: '加大研发投入，提升利润率与竞争力',
    costFn: co => Math.max(5e7, co.revenue * 0.03),
    apply: (co, stock) => {
      co.profit  *= (1.08 + Math.random() * 0.07)
      co.peRatio  = Math.max(10, co.peRatio * 0.95)
      stock.price = Math.max(0.5, stock.price * (1 + 0.04 + Math.random() * 0.06))
      return '研发投入成功，净利润↑，估值改善，股价上涨'
    },
  },
  {
    id: 'mkt', icon: '📢', label: '品牌推广', cd: 45, minPct: 1,
    desc: '投放市场营销，提升品牌影响力与销售额',
    costFn: co => Math.max(2e7, co.revenue * 0.015),
    apply: (co, stock, companyDynamic) => {
      co.revenue *= (1.05 + Math.random() * 0.06)
      if (companyDynamic[co.code]) companyDynamic[co.code].sentiment = Math.min(1, (companyDynamic[co.code].sentiment || 0) + 0.3)
      stock.price = Math.max(0.5, stock.price * (1 + 0.02 + Math.random() * 0.04))
      return '品牌推广奏效，营收↑，市场情绪改善'
    },
  },
  {
    id: 'cap', icon: '🏭', label: '扩大产能', cd: 60, minPct: 2,
    desc: '新建生产线，大幅提升营收天花板',
    costFn: co => Math.max(1e8, co.revenue * 0.05),
    apply: (co, stock) => {
      co.revenue *= (1.12 + Math.random() * 0.10)
      co.cashFlow = Math.max(1e6, co.cashFlow * (1 - 0.08))
      stock.price = Math.max(0.5, stock.price * (1 + 0.03 + Math.random() * 0.05))
      return '产能扩大，营收上限提升，短期现金流承压'
    },
  },
  {
    id: 'div', icon: '💰', label: '特别分红', cd: 120, minPct: 5,
    desc: '宣布特别股息，提振股东信心',
    costFn: co => Math.max(1e8, co.profit * 0.5),
    apply: (co, stock) => {
      stock.price = Math.max(0.5, stock.price * (1 + 0.05 + Math.random() * 0.05))
      return '特别分红宣布，股东回报提升，股价上涨'
    },
  },
]

export const STOCK_FLOAT_SHARES = {
  X001: 2000000000, J002: 800000000, K003: 3000000000, R004: 500000000, X005: 1500000000,
  HK001: 9500000000, HK002: 2700000000,
  US001: 15000000000, US002: 2400000000,
  BTC: 19700000, ETH: 120000000, XCOIN: 1000000000,
}
