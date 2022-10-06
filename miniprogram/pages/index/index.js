// index.js
// const app = getApp()
const { envList } = require('../../envList.js');

Page({
  data: {
    showUploadTip: false,
    powerList: [{
      title: '云函数',
      tip: '安全、免鉴权运行业务代码',
      showItem: false,
      item: [{
        title: '获取OpenId',
        page: 'getOpenId'
      },
      //  {
      //   title: '微信支付'
      // },
       {
        title: '生成小程序码',
        page: 'getMiniProgramCode'
      },
      // {
      //   title: '发送订阅消息',
      // }
    ]
    }, {
      title: '数据库',
      tip: '安全稳定的文档型数据库',
      showItem: false,
      item: [{
        title: '创建集合',
        page: 'createCollection'
      }, {
        title: '更新记录',
        page: 'updateRecord'
      }, {
        title: '查询记录',
        page: 'selectRecord'
      }, {
        title: '聚合操作',
        page: 'sumRecord'
      }]
    }, {
      title: '云存储',
      tip: '自带CDN加速文件存储',
      showItem: false,
      item: [{
        title: '上传文件',
        page: 'uploadFile'
      }]
    }, {
      title: '云托管',
      tip: '不限语言的全托管容器服务',
      showItem: false,
      item: [{
        title: '部署服务',
        page: 'deployService'
      }]
    }],
    envList,
    selectedEnv: envList[0],
    haveCreateCollection: false
  },

  onClickPowerInfo(e) {
    const index = e.currentTarget.dataset.index;
    const powerList = this.data.powerList;
    powerList[index].showItem = !powerList[index].showItem;
    if (powerList[index].title === '数据库' && !this.data.haveCreateCollection) {
      this.onClickDatabase(powerList);
    } else {
      this.setData({
        powerList
      });
    }
  },

  onChangeShowEnvChoose() {
    wx.showActionSheet({
      itemList: this.data.envList.map(i => i.alias),
      success: (res) => {
        this.onChangeSelectedEnv(res.tapIndex);
      },
      fail (res) {
        console.log(res.errMsg);
      }
    });
  },

  onChangeSelectedEnv(index) {
    if (this.data.selectedEnv.envId === this.data.envList[index].envId) {
      return;
    }
    const powerList = this.data.powerList;
    powerList.forEach(i => {
      i.showItem = false;
    });
    this.setData({
      selectedEnv: this.data.envList[index],
      powerList,
      haveCreateCollection: false
    });
  },

  jumpPage(e) {
    wx.navigateTo({
      url: `/pages/${e.currentTarget.dataset.page}/index?envId=${this.data.selectedEnv.envId}`,
    });
  },

  onClickDatabase(powerList) {
    wx.showLoading({
      title: '',
    });
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      config: {
        env: this.data.selectedEnv.envId
      },
      data: {
        type: 'createCollection'
      }
    }).then((resp) => {
      if (resp.result.success) {
        this.setData({
          haveCreateCollection: true
        });
      }
      this.setData({
        powerList
      });
      wx.hideLoading();
    }).catch((e) => {
      console.log(e);
      this.setData({
        showUploadTip: true
      });
      wx.hideLoading();
    });
  },

  reqKoaApi() {
    let globalToken = ''
    let that = this
    wx.login({
      success (res) {
        console.log('>>>', res)
        // res
        // code: "033oG6000ezmGO1SH3400a4TS60oG60v"
        // errMsg: "login:ok"
        if (res.code) {
          //发起网络请求
          wx.request({
            method: 'POST',
            url: 'http://127.0.0.1:9000/mp/login',
            data: {
              code: res.code
            },
            success (res) {
              let { code, data, msg } = res.data
              if (code !== 0) {
                wx.showToast({
                  title: `获取token失败！${res.errMsg}`,
                  icon: 'error',
                  duration: 2000
                })
                return
              }
              let { token } = data
              globalToken = token
              that.testTokenVerify(globalToken)
            },
            fail(err) {
              console.log(err.errMsg)
            }
          })
        } else {
          wx.showToast({
            title: `登录失败！${res.errMsg}`,
            icon: 'error',
            duration: 2000
          })
        }
      }
    })
  },
  testTokenVerify(globalToken) {
    wx.request({
      method: 'POST',
      url: 'http://127.0.0.1:9000/mp/testTokenVerify',
      header: {
        token: globalToken
        // token: globalToken + 'xxxx' // 错误 token 测试提示
      },
      data: {
        a: 1
      },
      success (res) {
        let { code, data, msg } = res.data
        if (code !== 0) {
          wx.showModal({
            title: '提示',
            content: `解析token失败！${msg}`,
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } else if (res.cancel) {
                console.log('用户点击取消')
              }
            }
          })
          return
        }
        console.log(res.data)
      },
      fail(err) {
        console.log(err.errMsg)
      }
    })
  }
});
