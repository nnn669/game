export const PROPERTIES = [
  { id: 'jianzhujia', name: '简筑家',   price: 300000,   downPayment: 100000,  monthly: 2000, periods: 100, rent: 2000 },
  { id: 'yunjing',    name: '云境雅居', price: 800000,   downPayment: 300000,  monthly: 5000, periods: 100, rent: 5000 },
  { id: 'jingsixuan', name: '静思轩',   price: 1500000,  downPayment: 800000,  monthly: 8000, periods: 100, rent: 8000 },
  { id: 'villa',      name: '顶级别墅', price: 20000000, downPayment: 20000000, monthly: 0,  periods: 0,   rent: 0,
    noInstall: true, noRent: true, desc: '解锁期货50x杠杆 + 银行贵宾服务' },
]

export const FUNDS = [
  { id: 'growth',  name: '🚀 成长基金', desc: '科创/电力，高风险高收益', rate: 0.01,  minInvest: 10000, type: 'commercial' },
  { id: 'stable',  name: '🏦 稳健基金', desc: '多元化配置，低波动稳定',  rate: 0.003, minInvest: 5000,  type: 'commercial' },
  { id: 'quant',   name: '🤖 量化基金', desc: '算法择时，跟踪趋势',      rate: 0.005, minInvest: 20000, type: 'commercial' },
  { id: 'charity', name: '❤️ 公益基金', desc: '助力社会，仅支持捐赠',    rate: 0,    minInvest: 100,   type: 'charity' },
]

export const LOAN_OPTIONS = [
  { id: 'micro',  label: '微型贷款', amount: 50000,    rate: 0.08, duration: '30天', icon: '💰' },
  { id: 'small',  label: '小额贷款', amount: 200000,   rate: 0.10, duration: '60天', icon: '🏧' },
  { id: 'medium', label: '中型贷款', amount: 1000000,  rate: 0.12, duration: '90天', icon: '🏦' },
  { id: 'large',  label: '大额贷款', amount: 5000000,  rate: 0.15, duration: '180天', icon: '🏛️' },
  { id: 'mega',   label: '巨额贷款', amount: 20000000, rate: 0.18, duration: '365天', icon: '💎' },
]
