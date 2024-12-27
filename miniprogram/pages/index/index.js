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
    adList: []
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
      wx.navigateTo({
        url: '/pages/admin/admin'
      })
    }
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
