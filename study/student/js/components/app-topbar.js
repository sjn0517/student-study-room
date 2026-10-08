/**
 * components/app-topbar —— 学生端顶部导航栏公共组件
 *
 * 用法：
 *   <app-topbar variant="home"></app-topbar>
 *   <app-topbar variant="center"></app-topbar>
 *   <app-topbar variant="checkin"></app-topbar>
 *
 * 设计说明：
 * 1. 使用 **light DOM** 渲染，组件内部的 class / id 与拆分前完全一致，
 *    因此各页面样式表（index.css / center.css / checkin.css）无需改动即可生效；
 * 2. 各页顶栏的差异集中在 variant 配置里，公共结构只维护一份；
 * 3. 可选属性：icon 覆盖 logo 图标，title 覆盖 logo 文案。
 */
(function (global) {
    'use strict';

    var VARIANTS = {
        // 首页：签到按钮 + 信用分 + 用户名 + 头像（可跳个人中心）
        home: {
            icon: 'fa-chalkboard-user',
            title: '智习空间 · 自习室管家',
            nav: [],
            userArea:
                '<div class="user-info">' +
                    '<button class="checkin-button" id="checkinBtn">' +
                        '<i class="fas fa-qrcode"></i>' +
                        '<span>签到</span>' +
                    '</button>' +
                    '<div class="credit-badge"><i class="fas fa-star"></i> 信用分 <span id="creditScoreDisplay">85</span></div>' +
                    '<div id="userDisplayName"><i class="fas fa-user-graduate"></i> 用户同学</div>' +
                    '<a href="./个人中心.html"><div id="userAvatar" class="avatar">用</div></a>' +
                '</div>'
        },
        // 个人中心：页面导航 + 信用分 + 用户名 + 大头像
        center: {
            icon: 'fa-chalkboard-user',
            title: '智习空间 · 个人中心',
            nav: [
                { href: './index.html', icon: 'fa-home', text: '首页' },
                { href: '#', icon: 'fa-user-circle', text: '个人中心', active: true }
            ],
            userArea:
                '<div class="user-quick-info">' +
                    '<div class="credit-badge"><i class="fas fa-star"></i> 信用分 <span id="creditScoreDisplay">85</span></div>' +
                    '<div id="quickInfoName"><i class="fas fa-user-graduate"></i> 用户同学</div>' +
                    '<div id="quickInfoAvatar" class="avatar-large">用</div>' +
                '</div>'
        },
        // 签到页：返回首页 + 信用分 + 头像
        checkin: {
            icon: 'fa-fingerprint',
            title: '智习空间 · 智能签到',
            nav: [
                { href: './index.html', icon: 'fa-home', text: '首页' }
            ],
            userArea:
                '<div class="user-info">' +
                    '<div class="credit-badge"><i class="fas fa-star"></i> 信用分: 85</div>' +
                    '<div class="avatar">张</div>' +
                '</div>'
        }
    };

    function renderNav(items) {
        if (!items || !items.length) return '';
        return '<div class="nav-buttons">' + items.map(function (item) {
            var cls = 'nav-btn' + (item.active ? ' active' : '');
            return '<a href="' + item.href + '" class="' + cls + '">' +
                '<i class="fas ' + item.icon + '"></i> ' + item.text +
            '</a>';
        }).join('') + '</div>';
    }

    class AppTopbar extends HTMLElement {
        static get observedAttributes() {
            return ['variant', 'title', 'icon'];
        }

        connectedCallback() {
            this.render();
        }

        attributeChangedCallback() {
            if (this.isConnected) this.render();
        }

        render() {
            var variant = VARIANTS[this.getAttribute('variant') || 'home'] || VARIANTS.home;
            var icon = this.getAttribute('icon') || variant.icon;
            var title = this.getAttribute('title') || variant.title;

            this.innerHTML =
                '<div class="top-bar">' +
                    '<div class="logo-area">' +
                        '<div class="logo-icon"><i class="fas ' + icon + '"></i></div>' +
                        '<div class="logo-text">' + title + '</div>' +
                    '</div>' +
                    renderNav(variant.nav) +
                    variant.userArea +
                '</div>';
        }
    }

    if (!global.customElements.get('app-topbar')) {
        global.customElements.define('app-topbar', AppTopbar);
    }

    global.AppTopbar = AppTopbar;
})(window);
