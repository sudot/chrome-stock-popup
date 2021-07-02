// openWindow
function openWindow(e) {
  var code = e.target.parentElement.parentElement.attributes.name.value
  // https://xueqiu.com/S/SH601318
  chrome.tabs.create({ url: `https://xueqiu.com/S/${code}` });
}

// query
function httpRequest(callback, url) {
  var stocks = loadStocks()
  if (stocks.length === 0) {
    stocks.push('SH000001')
  }
  // https://stock.xueqiu.com/v5/stock/batch/quote.json?symbol=SH000001,SH000002&extend=detail&is_delay_hk=false
  // 响应样例数据查看 demo.json
  url = url || `https://stock.xueqiu.com/v5/stock/batch/quote.json?symbol=${stocks.join(',')}&extend=detail&is_delay_hk=false`

  var xhr = new XMLHttpRequest()
  xhr.open("GET", url, true)
  if (callback) {
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4) {
        try {
          var json = JSON.parse(xhr.responseText)
          if (json.error_code == '400016') {
            httpRequest(callback, 'https://xueqiu.com')
          } else {
            callback(json.data || { items: [] })
          }
        } catch (e) {
          httpRequest(callback)
        }
      }
    }
  }
  xhr.send()
}

// render
function showResult(data) {
  var table = []
  data.items.forEach(function (item) {
    var quote = item.quote
    table.push(`<tr name="${quote.symbol}">`)
    table.push(`<td><a href="javascript:void(0)">${quote.symbol}</a></td>`) // 编号
    table.push(`<td>${quote.name}</td>`) // 名称
    table.push(`<td class="text-right">${quote.current}</td>`) // 当前价
    table.push(`<td class="text-right">${quote.chg}(${quote.percent}%)</td>`) // 涨跌幅
    table.push(`<td><input type="button" value="移除"></input></td>`)
    table.push('</tr>')
  })

  // 移除原 dom 绑定的事件
  document.querySelectorAll('#stocks input').forEach((dom) => {
    dom.removeEventListener('click', remove)
  })
  document.querySelectorAll('#stocks a').forEach((dom) => {
    dom.removeEventListener('click', openWindow)
  })
  // 写入新 dom
  document.querySelector('#stocks').innerHTML = table.join('\n')
  // 添加事件绑定
  document.querySelectorAll('#stocks input').forEach((dom) => {
    dom.addEventListener('click', remove)
  })
  document.querySelectorAll('#stocks a').forEach((dom) => {
    dom.addEventListener('click', openWindow)
  })
}

// remove
function remove(e) {
  var code = e.target.parentElement.parentElement.attributes.name.value
  removeStock(code)
  e.target.removeEventListener('click', remove)
  e.target.parentElement.parentElement.remove()
}

// add
function add() {
  document.querySelector('#inputDiv').classList.remove('hidden')
  document.querySelector('#addDiv').classList.add('hidden')
}

// save
function save(e) {
  var input = document.querySelector('#input')
  var value = input.value
  if (!value) { return }
  addStock(value.toUpperCase())
  httpRequest(showResult)
  document.querySelector('#addDiv').classList.remove('hidden')
  document.querySelector('#inputDiv').classList.add('hidden')
  input.value = ''
}

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

document.querySelector('#addDiv input').addEventListener('click', add)
document.querySelector('#inputDiv input[type=button]').addEventListener('click', save)
httpRequest(showResult)


