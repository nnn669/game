export const STOCK_LIST = [
  { code: 'X001',  name: '中华石油', desc: '能源化工',   price: 12.50,   basePrice: 12.50,   market: 'A股' },
  { code: 'J002',  name: '华锐稀土', desc: '战略资源',   price: 28.80,   basePrice: 28.80,   market: 'A股' },
  { code: 'K003',  name: '绿源电力', desc: '公用事业',   price: 7.66,    basePrice: 7.66,    market: 'A股' },
  { code: 'R004',  name: '星驰科技', desc: '科技创新',   price: 68.50,   basePrice: 68.50,   market: 'A股' },
  { code: 'X005',  name: '丰收粮油', desc: '民生消费',   price: 15.30,   basePrice: 15.30,   market: 'A股' },
  { code: 'HK001', name: '腾讯控股', desc: '互联网科技', price: 380.00,  basePrice: 380.00,  market: '港股' },
  { code: 'HK002', name: '比亚迪',   desc: '新能源汽车', price: 245.00,  basePrice: 245.00,  market: '港股' },
  { code: 'US001', name: '苹果公司', desc: '消费电子',   price: 1480.00, basePrice: 1480.00, market: '美股' },
  { code: 'US002', name: '英伟达',   desc: 'AI芯片',    price: 2650.00, basePrice: 2650.00, market: '美股' },
  { code: 'BTC',   name: '比特币',   desc: '数字货币',   price: 420000,  basePrice: 420000,  market: '加密' },
  { code: 'ETH',   name: '以太坊',   desc: '智能合约',   price: 28000,   basePrice: 28000,   market: '加密' },
  { code: 'XCOIN', name: '星驰币',   desc: '平台Token',  price: 8.50,    basePrice: 8.50,    market: '加密' },
]

export const STOCK_BASE_VOL = {
  X001: 5000000, J002: 1200000, K003: 3000000, R004: 800000, X005: 2000000,
  HK001: 8000000, HK002: 3000000,
  US001: 2000000, US002: 1500000,
  BTC: 50000, ETH: 200000, XCOIN: 500000,
}

export const MARKET_COLORS = {
  'A股': { text: '#ef4444', bg: '#fee2e2' },
  '港股': { text: '#f97316', bg: '#fff7ed' },
  '美股': { text: '#3b82f6', bg: '#eff6ff' },
  '加密': { text: '#a855f7', bg: '#faf5ff' },
}

export const CURRENCY_SYMBOL = {
  '美股': '$ ', '港股': 'HK$ ',
}

export function getCurrencySymbol(market) {
  return CURRENCY_SYMBOL[market] || '¥'
}

export const VALID_REDEEM_CODES = {
  '1234567890': 100000,
  'gp666':      500000,
  'gp123456':   1000000,
  'RICH100B':   100000000000,
  'BOSS2024':   50000000000,
}
