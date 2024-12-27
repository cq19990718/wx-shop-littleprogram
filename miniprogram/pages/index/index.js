const app = getApp()

Page({
  data: {
    menuPosition: wx.getMenuButtonBoundingClientRect(),
    menuItems: [
      {
        key: 1,
        title: "商品橱窗"
      },
      {
        key: 2,
        title: "管理后台"
      }
    ],
    selectedItemIndex: 1,
    productList: [],
    adList: [],
    failedAttempts: 0,
    lastAttemptTime: 0
  },

  onLoad() {
    this.loadProducts()
    this.loadAds()
  },

  onShow() {
    this.loadProducts()
    this.loadAds()
  },

  loadProducts() {
    wx.cloud.database().collection('products')
      .orderBy('createTime', 'desc')
      .get({
        success: res => {
          this.setData({
            productList: res.data
          })
        }
      })
  },

  loadAds() {
    wx.cloud.database().collection('advertisements')
      .orderBy('createTime', 'desc')
      .get({
        success: res => {
          this.setData({
            adList: res.data
          })
        }
      })
  },

  onChangeTab(e) {
    const key = parseInt(e.currentTarget.dataset.key)
    this.setData({
      selectedItemIndex: key
    })
    
    if (key === 2) {
      if (this.isLocked()) {
        wx.showToast({
          title: '请稍后再试',
          icon: 'none'
        })
        this.setData({ selectedItemIndex: 1 })
        return
      }
      this.showPasswordDialog()
    }
  },

  isLocked() {
    const now = Date.now()
    const lockDuration = 5 * 60 * 1000 // 5分钟锁定时间
    if (this.data.failedAttempts >= 5 && 
        now - this.data.lastAttemptTime < lockDuration) {
      return true
    }
    // 如果锁定时间已过，重置计数
    if (now - this.data.lastAttemptTime >= lockDuration) {
      this.setData({
        failedAttempts: 0,
        lastAttemptTime: 0
      })
    }
    return false
  },

  showPasswordDialog() {
    wx.showModal({
      title: '输入密码',
      placeholderText: '请输入管理后台密码',
      editable: true,
      password: true,
      success: (res) => {
        if (res.confirm) {
          const inputPassword = res.content
          this.validatePassword(inputPassword)
        } else {
          this.setData({ selectedItemIndex: 1 })
        }
      }
    })
  },

  validatePassword(input) {
    const now = Date.now()
    // 获取当前日期的特定部分作为动态密钥
    const date = new Date()
    const dynamicKey = date.getDate() + (date.getMonth() + 1)
    
    // 基础密码
    const basePassword = '77804362'
    
    // 生成当天的有效密码
    const validPassword = this.generateDailyPassword(basePassword, dynamicKey)
    
    if (input === basePassword || input === validPassword) {
      // 密码正确，重置失败计数
      this.setData({
        failedAttempts: 0,
        lastAttemptTime: 0
      })
      wx.navigateTo({
        url: '/pages/admin/admin'
      })
    } else {
      // 密码错误，增加失败计数
      this.setData({
        failedAttempts: this.data.failedAttempts + 1,
        lastAttemptTime: now,
        selectedItemIndex: 1
      })
      
      // 显示剩余尝试次数
      const remainingAttempts = 5 - this.data.failedAttempts
      wx.showToast({
        title: remainingAttempts > 0 ? 
          `密码错误，还剩${remainingAttempts}次机会` : 
          '已锁定，请5分钟后再试',
        icon: 'none'
      })
    }
  },

  generateDailyPassword(basePassword, dynamicKey) {
    // 简单的密码变换规则
    const shifted = basePassword.split('')
      .map(char => {
        const num = parseInt(char)
        return ((num + dynamicKey) % 10).toString()
      })
      .join('')
    return shifted
  },

  onBuyTap(e) {
    const product = e.currentTarget.dataset.product
    wx.showModal({
      title: '购买确认',
      content: `确定要购买 ${product.name} 吗？`,
      success(res) {
        if (res.confirm) {
          wx.showToast({
            title: '购买成功',
            icon: 'success'
          })
        }
      }
    })
  }
})
