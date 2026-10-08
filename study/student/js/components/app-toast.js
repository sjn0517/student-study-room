/**
 * components/app-toast —— 学生端全局提示组件
 *
 * 用法：
 *   <app-toast variant="bottom" colorize duration="3000"></app-toast>   // 首页 / 个人中心
 *   <app-toast variant="corner"></app-toast>                           // 签到页右上角堆叠提示
 *
 * 页面里统一通过全局函数调用：
 *   showToast('保存成功', 'success');
 *
 * 说明：light DOM 渲染，`bottom` 变体复用页面样式表里的 .toast-message；
 *      `corner` 变体自带样式与进出场动画，与原签到页实现保持一致。
 */
(function (global) {
    'use strict';

    var COLORIZE_COLORS = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    var CORNER_ICONS = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };

    var CORNER_COLORS = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };

    /** 右上角堆叠提示所需的进出场动画，只注入一次 */
    function ensureKeyframes() {
        if (document.getElementById('appToastAnimations')) return;
        var style = document.createElement('style');
        style.id = 'appToastAnimations';
        style.textContent =
            '@keyframes appToastSlideIn {' +
                'from { transform: translateX(100%); opacity: 0; }' +
                'to { transform: translateX(0); opacity: 1; }' +
            '}' +
            '@keyframes appToastSlideOut {' +
                'from { transform: translateX(0); opacity: 1; }' +
                'to { transform: translateX(100%); opacity: 0; }' +
            '}';
        document.head.appendChild(style);
    }

    class AppToast extends HTMLElement {
        connectedCallback() {
            if (this._ready) return;
            this._ready = true;
            this.variant = this.getAttribute('variant') || 'bottom';
            this.duration = parseInt(this.getAttribute('duration'), 10) || 3000;
            this.colorize = this.hasAttribute('colorize');

            if (this.variant === 'corner') {
                ensureKeyframes();
                this.stack = document.createElement('div');
                this.stack.id = this.getAttribute('stack-id') || 'toastContainer';
                this.stack.style.cssText =
                    'position: fixed; top: 20px; right: 20px; z-index: 10000;' +
                    'display: flex; flex-direction: column; gap: 10px;';
                this.appendChild(this.stack);
            } else {
                this.box = this.querySelector('.toast-message');
                if (!this.box) {
                    this.box = document.createElement('div');
                    this.box.className = 'toast-message';
                    this.appendChild(this.box);
                }
            }
        }

        /** 展示一条提示 */
        show(message, type) {
            type = type || 'info';
            if (this.variant === 'corner') return this._showCorner(message, type);
            return this._showBottom(message, type);
        }

        _showBottom(message, type) {
            if (!this.box) return;
            this.box.textContent = message;
            if (this.colorize) {
                this.box.className = 'toast-message';
                this.box.style.backgroundColor = COLORIZE_COLORS[type] || COLORIZE_COLORS.info;
            }
            this.box.classList.add('show');
            clearTimeout(this._timer);
            this._timer = setTimeout(function () {
                this.box.classList.remove('show');
            }.bind(this), this.duration);
        }

        _showCorner(message, type) {
            var toast = document.createElement('div');
            toast.style.cssText =
                'background: ' + (CORNER_COLORS[type] || CORNER_COLORS.info) + ';' +
                'color: white; padding: 12px 20px; border-radius: 12px;' +
                'box-shadow: 0 8px 20px rgba(0,0,0,0.2);' +
                'animation: appToastSlideIn 0.3s ease;' +
                'display: flex; align-items: center; gap: 10px;';
            toast.innerHTML =
                '<i class="fas fa-' + (CORNER_ICONS[type] || CORNER_ICONS.info) + '"></i>' +
                '<span>' + message + '</span>';
            this.stack.appendChild(toast);

            setTimeout(function () {
                toast.style.animation = 'appToastSlideOut 0.3s ease';
                setTimeout(function () { toast.remove(); }, 300);
            }, this.duration);
        }
    }

    if (!global.customElements.get('app-toast')) {
        global.customElements.define('app-toast', AppToast);
    }

    /**
     * 全局提示入口，供各页面脚本直接调用
     */
    global.showToast = function (message, type, duration) {
        var toast = document.querySelector('app-toast');
        if (!toast || typeof toast.show !== 'function') {
            console.warn('未找到 <app-toast> 组件，提示被忽略:', message);
            return;
        }
        if (duration) toast.duration = duration;
        toast.show(message, type);
    };

    global.AppToast = AppToast;
})(window);
