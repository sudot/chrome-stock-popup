// loadStocks
function loadStocks() {
  return localStorage.stocks && localStorage.stocks.split(',') || []
}

// addStock
function addStock(stock) {
  if (typeof stock !== 'string' || !stock) { return }
  var stocks = loadStocks()
  stocks.push(stock)
  storageStocks(stocks)
}

// removeStock
function removeStock(stock) {
  if (typeof stock !== 'string' || !stock) { return }
  var stocks = loadStocks()
  stocks.splice(stocks.indexOf(stock), 1)
  storageStocks(stocks)
}

// storageStocks
function storageStocks(stocks) {
  localStorage.stocks = stocks.filter((v, i, arr) => arr.indexOf(v) === i).join(',')
}

Vue.createApp({
  data() {
    return {
      value: '',
      stocks: [],
      regionMap: {
        'CN': 'A股',
        'HK': '港股',
        'US': '美股',
      }
    }
  },
  mounted() {
    var stocks = loadStocks()
    if (stocks.length === 0) {
      addStock('SH000001')
    }
    this.getRemoteStocks()
    setTimeout(this.getRemoteStocks, 3000)
  },
  methods: {
    // query
    getRemoteStocks(url) {
      var stocks = loadStocks().join(',')
      // https://stock.xueqiu.com/v5/stock/batch/quote.json?symbol=SH000001,SH000002&extend=detail&is_delay_hk=false
      // 响应样例数据查看 demo.json
      url = url || `https://stock.xueqiu.com/v5/stock/batch/quote.json?symbol=${stocks}&extend=detail&is_delay_hk=false`

      var xhr = new XMLHttpRequest()
      xhr.open("GET", url, true)
      xhr.onreadystatechange = () => {
        if (xhr.readyState == 4) {
          try {
            var json = JSON.parse(xhr.responseText)
            if (json.error_code == '400016') {
              this.getRemoteStocks('https://xueqiu.com')
            } else {
              var stocks = (json.data || { items: [] }).items
                .filter(v => v.market && v.quote)
              this.stocks = stocks
              storageStocks(stocks.map(v => v.quote.symbol))
            }
          } catch (e) {
            this.getRemoteStocks()
          }
        }
      }
      xhr.send()
    },
    handleOpenWindow(value) {
      // https://xueqiu.com/S/SH601318
      chrome.tabs.create({ url: `https://xueqiu.com/S/${value}` });
    },
    handleSave() {
      var value = this.value
      if (!value) { return }
      addStock(value.toUpperCase())
      this.getRemoteStocks()
      this.value = ''
    },
    handleRemove(value) {
      removeStock(value)
      this.getRemoteStocks()
    },
    handleUp(value) {
      var stocks = this.stocks
      var stockSymbols = stocks.map(v => v.quote.symbol)
      var index = stockSymbols.indexOf(value)
      if (index <= 0 || index >= stocks.length) { return }
      var stock = stocks[index]
      stocks.splice(index - 1, 2, stock, stocks[index - 1])
      storageStocks(stocks.map(v => v.quote.symbol))
    },
    handleDown(value) {
      var stocks = this.stocks
      var stockSymbols = stocks.map(v => v.quote.symbol)
      var index = stockSymbols.indexOf(value)
      if (index < 0 || index >= stocks.length - 1) { return }
      var stock = stocks[index]
      stocks.splice(index, 2, stocks[index + 1], stock)
      storageStocks(stocks.map(v => v.quote.symbol))
    },
  }
}).mount('#app')
