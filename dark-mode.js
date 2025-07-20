/**
 * 统一的暗黑模式管理模块
 * Somehow的百宝箱 - 所有页面通用的主题切换功能
 */
class DarkModeManager {
    constructor() {
        this.init();
    }

    /**
     * 初始化暗黑模式管理器
     */
    init() {
        this.loadSavedTheme();
        this.setupThemeToggleButton();
        this.setupSystemThemeListener();
        this.addTransitionStyles();
    }

    /**
     * 加载保存的主题偏好
     */
    loadSavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        } else {
            // 检测系统偏好
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.setTheme(prefersDark ? 'dark' : 'light');
        }
    }

    /**
     * 设置主题
     * @param {string} theme - 'light' 或 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // 触发自定义事件，允许页面监听主题变化
        const event = new CustomEvent('themeChange', { detail: { theme } });
        document.dispatchEvent(event);
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.addToggleAnimation();
    }

    /**
     * 获取当前主题
     * @returns {string} 当前主题 ('light' 或 'dark')
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    /**
     * 设置主题切换按钮事件
     */
    setupThemeToggleButton() {
        // 查找主题切换按钮
        const toggleButton = document.querySelector('.theme-toggle, [data-theme-toggle]');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => this.toggleTheme());
        }
    }

    /**
     * 监听系统主题变化
     */
    setupSystemThemeListener() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            // 只有在用户没有手动设置主题时才跟随系统
            if (!localStorage.getItem('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * 添加主题切换动画
     */
    addToggleAnimation() {
        document.body.style.transition = 'background-color 0.3s ease, color 0.3s ease';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
    }

    /**
     * 添加过渡样式
     */
    addTransitionStyles() {
        const style = document.createElement('style');
        style.textContent = `
            * {
                transition: background-color 0.3s ease, 
                           border-color 0.3s ease, 
                           box-shadow 0.3s ease,
                           color 0.3s ease !important;
            }
            
            *:hover {
                transition: all 0.2s ease !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 创建主题切换按钮HTML
     * @param {Object} options - 按钮配置选项
     * @returns {string} 按钮HTML字符串
     */
    static createToggleButtonHTML(options = {}) {
        const {
            className = 'theme-toggle',
            sunIcon = '☀️',
            moonIcon = '🌙',
            title = '切换主题'
        } = options;

        return `
            <button class="${className}" data-theme-toggle title="${title}">
                <span class="theme-icon sun">${sunIcon}</span>
                <span class="theme-icon moon">${moonIcon}</span>
            </button>
        `;
    }

    /**
     * 创建主题切换按钮CSS
     * @param {Object} options - 样式配置选项
     * @returns {string} CSS字符串
     */
    static createToggleButtonCSS(options = {}) {
        const {
            size = '40px',
            borderRadius = '50%',
            fontSize = '1.2rem'
        } = options;

        return `
            .theme-toggle {
                background: var(--container-bg, #ffffff);
                border: 1px solid var(--border-color, #e1e8ed);
                border-radius: ${borderRadius};
                width: ${size};
                height: ${size};
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .theme-toggle:hover {
                background: var(--primary-color, #4A90E2);
                color: white;
                transform: scale(1.1);
            }

            .theme-icon {
                font-size: ${fontSize};
                transition: transform 0.3s ease;
                position: absolute;
            }

            [data-theme="dark"] .theme-icon.sun {
                opacity: 0;
                transform: rotate(180deg) scale(0);
            }

            [data-theme="dark"] .theme-icon.moon {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }

            [data-theme="light"] .theme-icon.moon,
            :not([data-theme]) .theme-icon.moon {
                opacity: 0;
                transform: rotate(-180deg) scale(0);
            }

            [data-theme="light"] .theme-icon.sun,
            :not([data-theme]) .theme-icon.sun {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }
        `;
    }

    /**
     * 获取通用的暗黑模式CSS变量
     * @returns {string} CSS变量定义
     */
    static getCommonDarkModeCSS() {
        return `
            :root {
                --primary-color: #4A90E2;
                --primary-hover: #4281CB;
                --secondary-color: #6C5CE7;
                --accent-color: #00CDB7;
                --success-color: #28a745;
                --warning-color: #FFA726;
                --danger-color: #e74c3c;
                --background-color: #F8FAFD;
                --container-bg: #FFFFFF;
                --text-color: #2C3E50;
                --subtle-text: #7B8794;
                --border-color: #E1E8ED;
                --shadow-light: 0 4px 20px rgba(74, 144, 226, 0.08);
                --shadow-medium: 0 8px 30px rgba(74, 144, 226, 0.12);
                --shadow-heavy: 0 15px 40px rgba(74, 144, 226, 0.15);
                --border-radius: 16px;
                --gradient-primary: linear-gradient(135deg, #4A90E2 0%, #6C5CE7 100%);
                --gradient-accent: linear-gradient(135deg, #00CDB7 0%, #4A90E2 100%);
            }

            /* 暗黑模式变量 */
            [data-theme="dark"] {
                --background-color: #0D1117;
                --container-bg: #161B22;
                --text-color: #F0F6FC;
                --subtle-text: #7D8590;
                --border-color: #30363D;
                --shadow-light: 0 4px 20px rgba(0, 0, 0, 0.3);
                --shadow-medium: 0 8px 30px rgba(0, 0, 0, 0.4);
                --shadow-heavy: 0 15px 40px rgba(0, 0, 0, 0.5);
            }

            /* 导航栏暗黑模式适配 */
            [data-theme="dark"] .navbar {
                background: rgba(22, 27, 34, 0.95) !important;
                backdrop-filter: blur(20px);
            }

            /* 卡片和容器暗黑模式适配 */
            [data-theme="dark"] .card,
            [data-theme="dark"] .panel,
            [data-theme="dark"] .feature-card {
                background: var(--container-bg);
                border-color: var(--border-color);
            }

            /* 输入框暗黑模式适配 */
            [data-theme="dark"] input,
            [data-theme="dark"] textarea,
            [data-theme="dark"] select {
                background: var(--container-bg);
                color: var(--text-color);
                border-color: var(--border-color);
            }

            [data-theme="dark"] input:focus,
            [data-theme="dark"] textarea:focus,
            [data-theme="dark"] select:focus {
                border-color: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
            }

            /* 按钮暗黑模式适配 */
            [data-theme="dark"] .btn-secondary {
                background: var(--container-bg);
                color: var(--text-color);
                border-color: var(--border-color);
            }

            [data-theme="dark"] .btn-secondary:hover {
                background: var(--border-color);
            }
        `;
    }
}

// 自动初始化暗黑模式管理器
let darkModeManager;

// 当DOM加载完成时初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        darkModeManager = new DarkModeManager();
    });
} else {
    darkModeManager = new DarkModeManager();
}

// 导出供全局使用
window.DarkModeManager = DarkModeManager;
window.darkModeManager = darkModeManager;