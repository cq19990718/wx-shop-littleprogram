Page({
  data: {
    menuPosition: wx.getMenuButtonBoundingClientRect(),
    menuItems: [
      {
        key: 1,
        title: "添加商品"
      },
      {
        key: 2,
        title: "删除商品"
      },
      {
        key: 3,
        title: "广告管理"
      }
    ],
    selectedItemIndex: 1,
    productName: '',
    productDesc: '',
    productPrice: '',
    imageUrl: '',
    productList: [],
    adList: [], // 广告列表
  },

  onLoad() {
    this.loadProducts()
    this.loadAds()
  },

  // 加载商品列表
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

  // 加载广告列表
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

  // 切换标签页
  onChangeTab(e) {
    const key = parseInt(e.currentTarget.dataset.key)
    this.setData({
      selectedItemIndex: key
    })
    
    // 当切换到删除商品或广告管理标签时，重新加载数据
    if (key === 2) {
      this.loadProducts()
    } else if (key === 3) {
      this.loadAds()
    }
  },

  goBack() {
    wx.redirectTo({
      url: '/pages/index/index'
    })
  },

  // 添加商品相关函数
  onNameInput(e) {
    this.setData({
      productName: e.detail.value
    })
  },

  onDescInput(e) {
    this.setData({
      productDesc: e.detail.value
    })
  },

  onPriceInput(e) {
    this.setData({
      productPrice: e.detail.value
    })
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadImage(tempFilePath)
      }
    })
  },

  uploadImage(tempFilePath) {
    wx.showLoading({
      title: '上传中',
    })
    
    const cloudPath = `products/${Date.now()}-${Math.floor(Math.random()*1000)}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath,
      filePath: tempFilePath,
      success: res => {
        this.setData({
          imageUrl: res.fileID
        })
        wx.hideLoading()
      },
      fail: err => {
        wx.showToast({
          icon: 'none',
          title: '上传失败',
        })
      }
    })
  },

  submitProduct() {
    if (!this.data.productName || !this.data.productDesc || !this.data.productPrice || !this.data.imageUrl) {
      wx.showToast({
        icon: 'none',
        title: '请填写完整商品信息'
      })
      return
    }

    wx.showLoading({
      title: '提交中',
    })

    wx.cloud.database().collection('products').add({
      data: {
        name: this.data.productName,
        desc: this.data.productDesc,
        price: parseFloat(this.data.productPrice),
        imageUrl: this.data.imageUrl,
        createTime: new Date()
      },
      success: res => {
        wx.hideLoading()
        wx.showToast({
          title: '添加成功',
        })
        this.setData({
          productName: '',
          productDesc: '',
          productPrice: '',
          imageUrl: ''
        })
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/index/index'
          })
        }, 1000)
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({
          icon: 'none',
          title: '添加失败'
        })
      }
    })
  },

  // 删除商品
  deleteProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      success: res => {
        if (res.confirm) {
          wx.cloud.database().collection('products').doc(id).remove({
            success: () => {
              wx.showToast({
                title: '删除成功',
              })
              this.loadProducts() // 重新加载商品列表
            },
            fail: () => {
              wx.showToast({
                icon: 'none',
                title: '删除失败',
              })
            }
          })
        }
      }
    })
  },

  // 上传广告图片
  uploadAd() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        
        wx.showLoading({
          title: '上传中',
        })
        
        // 生成随机文件名
        const cloudPath = `advertisements/${Date.now()}-${Math.floor(Math.random()*1000)}.jpg`
        
        // 先上传图片到云存储
        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: res => {
            const fileID = res.fileID
            console.log('图片上传成功，fileID:', fileID)
            
            // 将广告信息保存到数据库
            const db = wx.cloud.database()
            db.collection('advertisements').add({
              data: {
                imageUrl: fileID,
                createTime: db.serverDate()  // 使用服务器时间
              },
              success: () => {
                wx.hideLoading()
                wx.showToast({
                  title: '上传成功',
                  icon: 'success',
                  duration: 2000
                })
                // 重新加载广告列表
                this.loadAds()
              },
              fail: err => {
                console.error('保存到数据库失败：', err)
                wx.hideLoading()
                wx.showToast({
                  title: '上传失败',
                  icon: 'error'
                })
              }
            })
          },
          fail: err => {
            console.error('上传图片失败：', err)
            wx.hideLoading()
            wx.showToast({
              title: '上传失败',
              icon: 'error'
            })
          }
        })
      },
      fail: err => {
        console.error('选择图片失败：', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'error'
        })
      }
    })
  },

  // 删除广告
  deleteAd(e) {
    const { id, fileId } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个广告吗？',
      success: res => {
        if (res.confirm) {
          wx.showLoading({
            title: '删除中',
          })
          // 删除云存储中的图片
          wx.cloud.deleteFile({
            fileList: [fileId],
            success: () => {
              // 删除数据库中的记录
              wx.cloud.database().collection('advertisements').doc(id).remove({
                success: () => {
                  wx.hideLoading()
                  wx.showToast({
                    title: '删除成功',
                  })
                  this.loadAds() // 重新加载广告列表
                },
                fail: () => {
                  wx.hideLoading()
                  wx.showToast({
                    icon: 'none',
                    title: '删除失败',
                  })
                }
              })
            }
          })
        }
      }
    })
  }
}) 
