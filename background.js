/* 
var ws = new WebSocket("ws://123.207.136.134:9010/ajaxchattest");

ws.onopen = function(evt) {  //绑定连接事件
　　console.log("Connection open ...");
　　ws.send("发送的数据");
};

ws.onmessage = function(evt) {//绑定收到消息事件
　　console.log( "Received Message: " + evt.data);
};

ws.onclose = function(evt) { //绑定关闭或断开连接事件
　　console.log("Connection closed.");
}; */
// content.js 处调用
/* 
//方式一： 短连接调用
 chrome.runtime.sendMessage({ method: 'examples', params: { key: '' } }, function(response) {
    console.log(response)
  })

// 方式二：长连接调用(1)
  var port = chrome.runtime.connect({ name: 'background' })
      port.postMessage({ method: 'downloadGoodsImages', params: detailImg ,requstId:''})
      port.onMessage.addListener(function(result) {
        console.log(result)
        if (result.method == 'downloadGoodsImages') {
          console.log(result)
      }
    })



    //方式三 长连接调用(2) 请求隔离 增加 requestId 隔离 ，'background'通道名称，默认为 'background'
    import { Bridge } from '../../../../utils/index'
    
    
    
   (1) 需要拆解的业务（多个接口请求+数据整合）应用 举例：downloadGoodsImages等

    const result = await Bridge({ method: 'downloadGoodsImages', params: detailImg },'background')
      if (result.code == 100) {
        console.log(result)
        // 业务
        _this.downloadImagesStatus = false
      }

    不是需要细致拆解的跨域网络请求，从background.html发起，可使用NetWork_Post，NetWork_Get
    (2) POST NetWork_Post

       const result =  await Bridge({ method: 'NetWork_Post', params: {url,ajaxData} },'background')

    (3) EGT NetWork_Get

        const result =  await Bridge({ method: 'NetWork_Get', params: {url,ajaxData} },'background')

*/

/* chrome.contextMenus.create({
  title: "竞店分析",
	onclick: function(){
		window.open('https://www.shuzhiniu.com/competeShop/myFollow/followShop/')
	}
});
chrome.contextMenus.create({
  title: "蓝海选词",
	onclick: function(){
		window.open('https://www.shuzhiniu.com/tools/helper/blueSeaDict/')
	}
}); */
// result Bean
import ResultCodeEnum from "./enum";
//  模块化
import * as account from "./account/index";
import * as platform from "./platform/index";
import * as douDian from "./platform/douDian";
import * as common from "./common/index";
import * as utils from "./utils";
import { GET, POST, ajax, GET2, ajax2 } from "../plugins/axios";
import Account from "./common/account";
import Platform from "./common/platform";
import DouDianPlatform from "./common/douDianPlatform";
import { getUrlKey, sendMessageToContentScript } from '../utils/index'
window.account = new Account();
window.platform = new Platform();
window.douDian = new DouDianPlatform();
// 创建 业务容器
var BusinessChainContainer = new Object({
  example: (...arg) => {
    // return a promise
    return new Promise((resolve, reject) => {
      try {
        // 业务逻辑编写
        console.log(arg[0]);
        console.log(arg[1]);
        console.log(ResultCodeEnum);
        // 方式一 枚举code   resolve(ResultCodeEnum.TemplateCreation('SUCCESS',arg[0].method))
        // 方式二 自定义code  resolve(ResultCodeEnum.CustomCreation(100, 'iam message', arg[0].method, { key: 'value' }))
        // 方式三 枚举code  resolve(ResultCodeEnum.TemplateCreation('ERR',arg[0].method))
        resolve(ResultCodeEnum.CustomCreation(100, "i am message", arg[0], { key: "value" }));
      } catch (E) {
        reject({
          code: 500,
          message: "catch err",
          method: arg[0].method,
          requestId: arg[0].requestId,
          data: " " + JSON.stringify(E),
        });
      }
    });
  },
  // To DO.....
});
// 注入 容器 BusinessChainContainer...

BusinessChainContainer = Object.assign(
  {},
  BusinessChainContainer,
  account,
  platform,
  douDian,
  utils,
  common
);

// 短连接 信息传输
chrome.runtime.onMessage.addListener(
  async (
    request = { method: "example", params: { key: "value" }, callBack: () => {} },
    sender,
    sendResponse
  ) => {
    if (request.method in BusinessChainContainer) {
      const result = await BusinessChainContainer[request.method](request, sender);
      if (result) {
        return sendResponse(result);
      }
    } else {
      return sendResponse(
        ResultCodeEnum.CustomCreation(
          500,
          `${request.method} is undefined,You need to come back and check the code`,
          request,
          null
        )
      );
    }
  }
);

//background 长连接 信息传输
chrome.runtime.onConnect.addListener(function (port) {
  if (port.name == "background") {
    port.onMessage.addListener(async (request) => {
      // if (request.method in window.account) {
      //   ;
      //   const result = await window.account[request.method](request, port);
      //   if (result) {
      //     return port.postMessage(result);
      //   }
      // } else
      if (request.method in BusinessChainContainer) {
        const result = await BusinessChainContainer[request.method](request, port);
        if (result) {
          return port.postMessage(result);
        }
      } else {
        return port.postMessage(
          ResultCodeEnum.CustomCreation(
            500,
            `${request.method} is undefined,You need to come back and check the code`,
            request,
            null
          )
        );
      }
    });
  }
});

// 注册请求监听器
chrome.webRequest.onCompleted.addListener(
   function (details) {
    // 在这里获取请求结果
    if (
      details.url.match(
        /\/mobile.yangkeduo.com\/proxy\/api\/api\/caterham\/query\/fenlei_gyl_group/
      ) ||
      details.url.match(/\/mobile.yangkeduo.com\/proxy\/api\/search/) || 
      details.url.match(/\/mobile.yangkeduo.com\/proxy\/api\/api\/turing\/mall\/query_cat_goods/) || 
      details.url.match(/\/mobile.yangkeduo.com\/proxy\/api\/api\/turing\/mall\/query_hot_sale_goods/) || 
      details.url.match(/\/mobile.yangkeduo.com\/proxy\/api\/api\/turing\/mall\/query_recommend_goods/)
    ) {
      let self = getUrlKey(details.url,'self')
      if(!self){
        window.platform.getPDDSearchList(details.url);
      }
      
    }
    if(details.url.indexOf("pc/search/v1/productList") > -1) {
      sendMessageToContentScript("ysbGetProductList")
    }
   if(details.url.indexOf("aweme/v2/shop/promotion/pack/h5/") > -1) {
   window.douDian.setDetaiUrl(details.url);
  }
  },
  { urls: ["<all_urls>"] }, // 监听所有URL的请求
  ["responseHeaders"]
);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    sendMessageToContentScript("reloadUrl")
  }
});

// 插件安装事件监控
// chrome.runtime.onInstalled.addListener(function(details) {
//   if (details.reason == "install") {
//     // 插件安装成功
//     chrome.tabs.create({
//       url: "https://www.shuzhiniu.com/successCompleted/",
//     });
//   } else if (details.reason == "update") {
//     // 插件升级成功
//   }
// });

// chrome.webRequest.onBeforeSendHeaders.addListener(
//   function(details) {
//     console.log(details);
//     var headers = details.requestHeaders;
//     headers.map((item) => {
//       if (item.name == "Cookie") {
//         console.log(item.value);
//       }
//     });
//   },
//   { urls: ["<all_urls>"], types: ["script"] },
//   ["requestHeaders", "extraHeaders"]
// );
