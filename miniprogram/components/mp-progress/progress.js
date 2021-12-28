/*! mp-progress.js v1.2.13 https://www.npmjs.com/package/mp-progress */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["MpProgress"] = factory();
	else
		root["MpProgress"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * 渲染函数
 * @param {canvasId} String canvas标签的id
 * @param {percentage} Number 旋转百分比
 * @param {needDot} Boolean 是否需要纽扣
 * @param {dotStyle} Array 进度点样式，最多支持两种颜色，如：[{r: 3, fillStyle: '#56B37F'}]，r代表半径、fillStyle代表填充颜色
 * @param {gradientList} Array 渐变颜色定义数组
 */
var MpProgress = /*#__PURE__*/function () {
  function MpProgress(options) {
    _classCallCheck(this, MpProgress);

    var canvasId = options.canvasId,
        _options$canvasSize = options.canvasSize,
        canvasSize = _options$canvasSize === void 0 ? { width: 400, height: 400 } : _options$canvasSize,
        _options$percent = options.percent,
        percent = _options$percent === void 0 ? 100 : _options$percent,
        _options$barStyle = options.barStyle,
        barStyle = _options$barStyle === void 0 ? {} : _options$barStyle,
        _options$needDot = options.needDot,
        needDot = _options$needDot === void 0 ? false : _options$needDot,
        _options$dotStyle = options.dotStyle,
        dotStyle = _options$dotStyle === void 0 ? [] : _options$dotStyle,
        _options$totalTime = options.totalTime,
        totalTime = _options$totalTime === void 0 ? 2000 : _options$totalTime,
        _options$target = options.target,
        target = _options$target === void 0 ? null : _options$target;

    if (canvasId) {
      // 定义展示圆环的百分比，百分比不少于50%
      this._percent = percent < 50 ? 50 : percent > 100 ? 100 : percent;
      this._options = {
        canvasId: canvasId,
        needDot: needDot,
        dotStyle: dotStyle,
        canvasSize: canvasSize,
        barStyle: barStyle,
        totalTime: totalTime,
        target: target
      };
      this._barIndex = 0;
      this.isInit = false;
    } else {
      throw '[初始化失败]: 缺少canvasId';
    }
  }

  _createClass(MpProgress, [{
    key: "draw",
    value: function draw(percentage) {
      var _this = this;

      var version = wx.getSystemInfoSync().SDKVersion;

      if (this.compareVersion(version, '2.7.0') < 0) {
        console.error("\u8BF7\u57282.7.0\u4EE5\u4E0A\u7684SDK\u4E2D\u4F7F\u7528\uFF0C\u5F53\u524DSDK\u7248\u672C\uFF1A".concat(version));
        return;
      }

      if (typeof percentage === 'undefined') {
        console.warn('[绘图过程出现错误]: 调用draw方法必须传入百分比参数');
        return;
      }

      if (percentage < 0) {
        percentage = 0;
        console.warn('[参数percentagegit<0]: 已自动调整为0');
      }

      if (percentage > 100) {
        percentage = 100;
        console.warn('[参数percentage>100]: 已自动调整为100');
      }

      this._options.percentage = +percentage || 0;

      if (this._context) {
        // context初始化完毕
        this.drawFn();
      } else {
        try {
          var _target = this._options.target;
          var query = wx.createSelectorQuery()["in"](_target);

          if (_target.$wx && _target.$wx.$wepy) {
            // wepy不支持in的方式去查找
            query = wx.createSelectorQuery();
          }

          query.select("#".concat(this._options.canvasId)).node(function (res) {
            // console.log(res);
            // console.log('res', res);
            // console.log('res.node', res.node);
            var canvas = res.node;
            _this._requestAnimationFrame = canvas.requestAnimationFrame.bind(canvas);
            var ctx = canvas.getContext('2d');
            var dpr = wx.getSystemInfoSync().pixelRatio;
            canvas.width = canvas._width * dpr;
            canvas.height = canvas._height * dpr;
            ctx.scale(dpr, dpr);
            _this._context = ctx;

            _this.drawFn();
          }).exec();
        } catch (err) {
          // console.log('query err', err);
          console.warn(err);
        }
      }
    }
  }, {
    key: "drawFn",
    value: function drawFn() {
      var _this2 = this;

      try {
        var barStyle = this._options.barStyle;

        if (barStyle.length > 0) {
          if (this.isInit) {
            console.log(this._positionInfo); // 需要清除画布

            if (this._percent === 100) {
              this._context.clearRect(-this._positionInfo.originX, -this._positionInfo.originY, this.convertLength(this._options.canvasSize.width), this.convertLength(this._options.canvasSize.height));
            } else {
              this._context.clearRect(-this._positionInfo.originX, -this.convertLength(this._options.canvasSize.height) / 2, this.convertLength(this._options.canvasSize.width), this.convertLength(this._options.canvasSize.height));
            } // 重置shadow相关的参数，否则进度条会变粗


            this._context.shadowColor = 'transparent';
            this._context.shadowBlur = 0;
          } else {
            // console.log('init'); // 找到最大宽度的bar

            var maxBarWidth = 0;

            for (var j = 0; j < barStyle.length; j++) {
              var _width = barStyle[j].width;

              if (_width > maxBarWidth) {
                maxBarWidth = _width;
              }
            } // 取canvas的height计算圆圈半径取


            var _r = 0;
            var cosP = Math.cos(2 * Math.PI / 360 * ((100 - this._percent) / 2 / 100 * 360));

            if (this._percent === 100) {
              _r = ((Math.min(this._options.canvasSize.width, this._options.canvasSize.height) - 2 * maxBarWidth) / 2).toFixed(2);
            } else {
              _r = (Math.min(this._options.canvasSize.width / 2, (this._options.canvasSize.height - 2 * maxBarWidth) / (1 + cosP)) - maxBarWidth).toFixed(2);
            } // 更换原点


            var originX = Math.round(this._options.canvasSize.width / 2);
            var originY = 0;

            if (this._percent === 100) {
              originY = Math.round(this._options.canvasSize.height / 2);
            } else {
              originY = Math.round(this._options.canvasSize.height / (1 + cosP));
            } // 基础数据初始化完成


            this.isInit = true;

            if (this._options.needDot) {
              // 考虑剔除进度点的宽度差以及进度点阴影的宽度查
              if (this._options.dotStyle.length > 0) {
                var circleR = this._options.dotStyle[0].r;

                if (circleR * 2 > maxBarWidth) {
                  var shadowDiff = this._options.dotStyle[0].shadow ? circleR / 4 : 0;
                  _r -= circleR - maxBarWidth + shadowDiff;

                  if (this._percent !== 100) {
                    originY -= circleR + shadowDiff;
                  }
                }
              } else {
                console.warn('参数dotStyle不完整，请检查');
                return;
              }
            }

            // console.log(originX, originY, this.convertLength(originX), this.convertLength(originY)); // arc原点默认为3点钟方向，需要调整到12点

            var rotateDeg = this._percent === 100 ? -90 : ((100 - this._percent + (this._percent - 50) / 2) / 100).toFixed(2) * 360;
            this._positionInfo = {
              originX: this.convertLength(originX),
              originY: this.convertLength(originY)
            };

            this._context.translate(this._positionInfo.originX, this._positionInfo.originY);

            this._context.rotate(rotateDeg * Math.PI / 180);

            // console.log('_r', _r);
            this._r = this.convertLength(_r);
          } // 需要旋转的角度


          this.deg = (this._options.percentage / 100).toFixed(2) * 2 * Math.PI;
          (barStyle || []).forEach(function (item, index) {
            // 重置percent以免出现计算数据不归为的问题
            item.percent = 0;
            _this2._barIndex = index;
            if(index==1) _this2.stop = false
            // console.log('draw bar', index)

            _this2.drawBar();
          });

          if (this.hasAnimateBar && this._options.needDot) {
            console.warn('animate和dotStyle不可同时使用');
          } else {
            if (this._options.needDot) {
              this.drawBarCoordinateDot();
            }
          }
        } else {
          console.warn('参数barStyle不符合要求，请检查');
        }
      } catch (err) {
        console.warn('[绘图过程出现错误]: ', err);
      }
    }
  }, {
    key: "drawBar",
    value: function drawBar() {
      var currentBar = this._options.barStyle[this._barIndex];
      var isLastBar = (this._options.barStyle.length - 1 === this._barIndex)? true:false;
      var barDeg = (isLastBar ? this.deg : 2 * Math.PI) * this._percent / 100;  // 需要旋转到的最终角度
      var endAngle = barDeg;  // 先把本次需要旋转到的角度初始化为最终角度
      
      
      // var diff = 1; // let startAngle = 0; 每一帧动画的百分比（满是100）
      // 若是第二个Bar，即实际进度条，且设置了动画且百分比未到100则需要继续进行重设endAngle
      // if (isLastBar && currentBar.animate && currentBar.percent < 100) {
      //   this.hasAnimateBar = true;

      //   if (currentBar.percent) {
      //     currentBar.percent += diff;
      //   } else {
      //     currentBar.percent = diff;
      //   } // startAngle = barDeg*((currentBar.percent - diff)/100);


      //   endAngle = barDeg * (currentBar.percent / 100);
      // } // console.log(`startAngle: ${startAngle}, endAngle: ${endAngle}`);

      let elapsed
      let totalTime
      let timeStamp
      if (isLastBar && currentBar.animate) {
        timeStamp = new Date().getTime();
        totalTime = this._options.totalTime;
        if (this.start === undefined){
          this.start = timeStamp;
          // console.log('Start timeStamp:', timeStamp);
          // console.log(this);
        }

        elapsed = timeStamp - this.start;
        if(elapsed < totalTime){
          // 计算本次绘制应绘制的进度
          endAngle = barDeg * (elapsed / totalTime);
        }
        if(this.stop){
          // 若暂停，则保存当前进度
          this._options.totalTime = totalTime - elapsed;
          return;
        }
      }

      // console.log("endAngle: ".concat(endAngle));

      this._context.beginPath();
      this._context.arc(0, 0, this._r, 0, endAngle);
      this._context.lineWidth = this.convertLength(currentBar.width);
      // this._context.lineJoin = 'round'
      this._context.strokeStyle = this.generateBarFillStyle(currentBar.fillStyle);
      
      var barLineCap = currentBar.lineCap;
      if (barLineCap) {
        this._context.lineCap = barLineCap;
      }

      this._context.stroke();
      // let _thisn = this

      if (isLastBar && currentBar.animate) {
        if (elapsed < totalTime && !(this.stop)) {
          // 时间未到则调用requestAnimationFrame在下次重绘时再次调用绘制函数
          this._requestAnimationFrame(this.drawBar.bind(this));
        }else{
          // 时间到了则触发timingOut事件
          this._options.target.triggerEvent('timingOut', {timeout: true}, {})
        }
        // 旧版动画方案
        // if(!this.animationTimer){
            // this.animationTimer = setInterval(this.drawBar.bind(this), 20)
            // setTimeout(function(){
            //   clearInterval(_thisn.animationTimer)
            // }, 1000)
        // }
        // if (currentBar.percent < 100) {
        //   // this._requestAnimationFrame(this.drawBar.bind(this));
        //     setTimeout(this.drawBar.bind(this), 20);
        // }
      }
      
    }
  }, {
    key: "compareVersion",
    value: function compareVersion(v1, v2) {
      v1 = v1.split('.');
      v2 = v2.split('.');
      var len = Math.max(v1.length, v2.length);

      while (v1.length < len) {
        v1.push('0');
      }

      while (v2.length < len) {
        v2.push('0');
      }

      for (var i = 0; i < len; i++) {
        var num1 = parseInt(v1[i]);
        var num2 = parseInt(v2[i]);

        if (num1 > num2) {
          return 1;
        } else if (num1 < num2) {
          return -1;
        }
      }

      return 0;
    }
    /**
     * 计算填充颜色
     * @param {config} 传入的颜色配置
     */

  }, {
    key: "generateBarFillStyle",
    value: function generateBarFillStyle(config) {
      if (typeof config === 'string') {
        // 单一色彩
        return config;
      } else {
        // 渐变色彩
        var grd = this._context.createLinearGradient(0, 0, 100, 90);

        for (var i = 0; i < config.length; i++) {
          var item = config[i];
          grd.addColorStop(item.position, item.color);
        }

        return grd;
      }
    }
    /**
     * convertLength
     * 小程序长度单位转换函数
     */

  }, {
    key: "convertLength",
    value: function convertLength(length) {
      return +Math.round(wx.getSystemInfoSync().windowWidth * length / 750);
    }
    /**
     * drawCircleWithFillStyle
     * @param {context} Object canvas 2d context
     * @param {style} Object 圆的样式参数
     */

  }, {
    key: "drawCircleWithFillStyle",
    value: function drawCircleWithFillStyle(style) {
      console.log(style);

      this._context.beginPath();

      this._context.arc(style.x, style.y, this.convertLength(style.r), 0, 2 * Math.PI);

      this._context.fillStyle = style.fillStyle || '#ffffff';

      if (style.shadow) {
        this._context.shadowOffsetX = 0;
        this._context.shadowOffsetY = 0;
        this._context.shadowColor = style.shadow;
        this._context.shadowBlur = this.convertLength(style.r / 2);
      }

      this._context.fill();
    }
    /**
     * drawBarCoordinateDot
     * @param {percentage} Number 旋转百分比
     */

  }, {
    key: "drawBarCoordinateDot",
    value: function drawBarCoordinateDot() {
      // 数学夹脚
      var mathDeg = (this._options.percentage / 100 * this._percent / 100).toFixed(2) * 360; // 计算弧度

      var radian = ''; // 三角函数cos=y/r，sin=x/r，分别得到小点的x、y坐标

      var x = 0;
      var y = 0;

      if (mathDeg <= 90) {
        // 求弧度
        radian = 2 * Math.PI / 360 * mathDeg;
        x = (Math.cos(radian) * this._r).toFixed(2);
        y = (Math.sin(radian) * this._r).toFixed(2);
      } else if (mathDeg > 90 && mathDeg <= 180) {
        // 求弧度
        radian = 2 * Math.PI / 360 * (180 - mathDeg);
        x = -(Math.cos(radian) * this._r).toFixed(2);
        y = (Math.sin(radian) * this._r).toFixed(2);
      } else if (mathDeg > 180 && mathDeg <= 270) {
        // 求弧度
        radian = 2 * Math.PI / 360 * (mathDeg - 180);
        x = -(Math.cos(radian) * this._r).toFixed(2);
        y = -(Math.sin(radian) * this._r).toFixed(2);
      } else {
        // 求弧度
        radian = 2 * Math.PI / 360 * (360 - mathDeg);
        x = (Math.cos(radian) * this._r).toFixed(2);
        y = -(Math.sin(radian) * this._r).toFixed(2);
      } // console.log(x, y);


      if (this._options.dotStyle.length > 0) {
        // 画背景大点
        this.drawCircleWithFillStyle(_objectSpread({
          x: x,
          y: y
        }, this._options.dotStyle[0]));
      } else {
        console.warn('参数dotStyle不完整，请检查');
      }

      if (this._options.dotStyle.length > 1) {
        // 画前景小点
        this.drawCircleWithFillStyle(_objectSpread({
          x: x,
          y: y
        }, this._options.dotStyle[1]));
      }
    }
  }, {
    key: "stopAnimation",
    value: function stopAnimation(isStop) {
      // if(this.stop == undefined) return
      // console.log("stoppppppppppppp!")
      // this.stop = isStop
      this.stop = true

      // if(!isStop){
      //   this._barIndex = 1;
      //   this.start = new Date().getTime()
      //   this.drawBar();
      // }
    }
  }]);

  return MpProgress;
}();

/* harmony default export */ __webpack_exports__["default"] = (MpProgress);

/***/ })
/******/ ])["default"];
});