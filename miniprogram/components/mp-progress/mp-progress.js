// import MpProgress from "../progress.min.js";
import MpProgress from "./progress.js";

Component({
    options: {
        addGlobalClass: true,
    },
    properties: {
        config: {
            type: Object,
            value: {}
        },
        percentage: {
            type: Number,
            value: 0
        },
        reset: {
            type: Boolean,
            value: false
        },
        isStop: {
            type: Boolean,
            value: false
        }
    },
    data: {
        customOptions: {
            // canvasSize: {
            //     width: 100,
            //     height: 100
            // },
            percent: 100
        },
        percentage: 100,
        canvasId: `mp_progress_${new Date().getTime()}`
    },
    attached() {
        // const customOptions = Object.assign({}, this.data.customOptions, this.data.config);
        // this.setData({
        //     customOptions,
        // });
        // let canvasId = `mp_progress_${new Date().getTime()}`;
        // this.setData({
        //     canvasId,
        // });
    },
    ready() {
        // this._mpprogress = new MpProgress(Object.assign({}, this.data.customOptions, { canvasId: this.data.canvasId, target: this }));
        // this._mpprogress.draw(this.data.percentage || 0);
    },
    observers: {
        'config': function (config) {
            // console.log('Get Config')
            if (JSON.stringify(config) == "{}") return;
            // console.log("go init");
            // const customOptions = Object.assign({}, this.data.customOptions, this.data.config);
            const customOptions = config;
            // let canvasId = `mp_progress_${new Date().getTime()}`;
            this.setData({
                customOptions,
                // canvasId,
            });
            let options = JSON.parse(JSON.stringify(this.data.customOptions));
            options.canvasId = this.data.canvasId;
            options.target = this;
            this._mpprogress = new MpProgress(options);
            // this._mpprogress = new MpProgress(Object.assign({}, this.data.customOptions, { canvasId: this.data.canvasId, target: this }));
            this._mpprogress.draw(this.data.percentage || 0);
        },
        'reset': function (reset) {
            if (reset) {
                if (this._mpprogress) {
                    this._mpprogress.stopAnimation(true);
                }
                // let canvasId = `mp_progress_${new Date().getTime()}`;
                // this.setData({
                //     canvasId,
                // });
                let options = JSON.parse(JSON.stringify(this.data.customOptions));
                options.canvasId = this.data.canvasId;
                options.target = this;
                this._mpprogress = new MpProgress(options);
                // this._mpprogress = new MpProgress(Object.assign({}, this.data.customOptions, { canvasId: this.data.canvasId, target: this }));
                // delete this._mpprogress
                this._mpprogress.draw(this.data.percentage || 0);
            }
        },
        'isStop': function (isStop) {
            if (isStop && this._mpprogress) { this._mpprogress.stopAnimation(isStop); }
            // this._mpprogress.stopAnimation();
        },
        // 'percentage': function (percentage) {
        //     if (this._mpprogress) {
        //         // 第一次进来的时候还没有初始化完成
        //         this._mpprogress.draw(percentage);
        //     }
        // },
    }
});
