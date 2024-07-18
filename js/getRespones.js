// 命名空间
let ajaxResponse = {
  settings: {
    ajaxInterceptor_switchOn: true,
    ajaxInterceptor_rules: []
  },
  caches: new Map(),
  // 检查规则
  checkRules: url => {
    let boolean = false
    ajaxResponse.settings.ajaxInterceptor_rules.forEach((el, i) => {
      if (typeof url === 'string' && url.indexOf(el) > -1) {
        boolean = true
        return false
      }
    })
    return boolean
  },
  originalXHR: window.XMLHttpRequest,
  myXHR: function() {
    const modifyResponse = () => {
      // console.log('this.responseURL', this)
    }
    const xhr = new ajaxResponse.originalXHR()
    for (let attr in xhr) {
      if (attr === 'onreadystatechange') {
        xhr.onreadystatechange = (...args) => {
          if (this.readyState == 4) {
            modifyResponse()
          }
          this.onreadystatechange && this.onreadystatechange.apply(this, args)
        }
        continue
      } else if (attr === 'onload') {
        xhr.onload = (...args) => {
          modifyResponse()
          this.onload && this.onload.apply(this, args)
        }
        continue
      }

      if (typeof xhr[attr] === 'function') {
        this[attr] = xhr[attr].bind(xhr)
      } else {
        if (attr === 'responseText' || attr === 'response') {
          Object.defineProperty(this, attr, {
            get: () => {
              this[`_${attr}`] == undefined ? xhr[attr] : this[`_${attr}`]
            },
            enumerable: true
          })
        } else {
          Object.defineProperty(this, attr, {
            get: () => {
              xhr[attr]
            },
            enumerable: true
          })
        }
      }
    }
  },

  originalFetch: window.fetch.bind(window),
  myFetch: function(...args) {
    return ajaxResponse.originalFetch(...args).then(response => {
      const proxy = new Proxy(response, {
        get: function(target, name) {
          switch (name) {
            case 'ok':
            case 'redirected':
            case 'type':
            case 'url':
            case 'useFinalURL':
            case 'body':
            case 'bodyUsed':
              let match = 'marketOfferResultViewService'
              if (typeof response.url === 'string' && response.url.indexOf(match) > -1) {
                // to do

                sessionStorage.setItem('marketOfferResultViewService', args[0])
                ajaxResponse.caches.set('marketOfferResultViewService', args[0])
              }
              return response[name]
          }
          return target[name]
        }
      })
      for (let key in proxy) {
        if (typeof proxy[key] === 'function') {
          proxy[key] = proxy[key].bind(response)
        }
      }
      return proxy
    })
  }
}

window.XMLHttpRequest = ajaxResponse.myXHR
window.fetch = ajaxResponse.myFetch

// window.addEventListener(
//   'message',
//   function(event) {
//     const data = event.data

//     if (data.type === 'ajaxInterceptor' && data.to === 'pageScript') {
//       ajaxResponse.settings[data.key] = data.value
//     }
//     console.log('i am init')
//     // 重写  XMLHttpRequest and  fetch
//     if (ajaxResponse.settings.ajaxInterceptor_switchOn) {
//       window.XMLHttpRequest = ajaxResponse.myXHR
//       window.fetch = ajaxResponse.myFetch
//     } else {
//       window.XMLHttpRequest = ajaxResponse.originalXHR
//       window.fetch = ajaxResponse.originalFetch
//     }
//   },
//   false
// )
