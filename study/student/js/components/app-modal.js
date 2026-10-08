/**
 * components/app-modal —— 学生端通用模态框组件
 *
 * 用法：
 *   <app-modal id="editProfileModal" box-class="modal-container" close-on-overlay>
 *       ... 弹窗里的内容（标题、表单、按钮）...
 *   </app-modal>
 *
 * 组件只负责"外框"这一层公共结构（遮罩 + 内容盒），弹窗内部的标题 / 表单 / 按钮
 * 仍写在页面标签里，通过 slot 内容放进内容盒，保证各页面原有的 class 与样式不变。
 *
 * 属性：
 *   box-class           内容盒的 class，默认 modal-container（登录页注册框传 modal）
 *   close-on-overlay    点击遮罩空白处关闭
 *
 * 方法（供页面脚本调用）：
 *   modal.open() / modal.close()
 * 事件：
 *   modal:open / modal:close
 */
(function (global) {
    'use strict';

    class AppModal extends HTMLElement {
        connectedCallback() {
            if (this._ready) return;
            if (document.readyState === 'loading') {
                // 标签内容还在解析中，等 DOM 解析完成后再取插槽内容
                document.addEventListener('DOMContentLoaded', this._render.bind(this), { once: true });
            } else {
                this._render();
            }
        }

        /** 保证弹窗外框已生成（open/close 可能先于渲染被调用） */
        ensureRendered() {
            if (!this._ready) this._render();
        }

        _render() {
            if (this._ready) return;
            this._ready = true;

            var boxClass = this.getAttribute('box-class') || 'modal-container';

            var overlay = document.createElement('div');
            overlay.className = 'modal-overlay';

            var box = document.createElement('div');
            box.className = boxClass;

            // 把页面里写在标签内的内容整体"搬"进内容盒。
            // 采用节点搬运而不是重写 innerHTML，可以保留原有节点与已绑定的事件。
            while (this.firstChild) {
                box.appendChild(this.firstChild);
            }

            overlay.appendChild(box);
            this.appendChild(overlay);

            this.overlay = overlay;

            if (this.hasAttribute('close-on-overlay')) {
                var self = this;
                overlay.addEventListener('click', function (e) {
                    if (e.target === overlay) self.close();
                });
            }

            if (this.hasAttribute('active')) this.open();
        }

        open() {
            this.ensureRendered();
            this.overlay.classList.add('active');
            this.dispatchEvent(new CustomEvent('modal:open'));
        }

        close() {
            this.ensureRendered();
            this.overlay.classList.remove('active');
            this.dispatchEvent(new CustomEvent('modal:close'));
        }

        isOpen() {
            return !!(this.overlay && this.overlay.classList.contains('active'));
        }
    }

    if (!global.customElements.get('app-modal')) {
        global.customElements.define('app-modal', AppModal);
    }

    /**
     * 便捷方法：按 id 打开 / 关闭弹窗
     */
    global.openModal = function (id) {
        var el = document.getElementById(id);
        if (el && typeof el.open === 'function') el.open();
    };

    global.closeModal = function (id) {
        var el = document.getElementById(id);
        if (el && typeof el.close === 'function') el.close();
    };

    global.AppModal = AppModal;
})(window);
