/**
 * Supabase 云数据库配置和API服务
 * 用于聊天记录和配置的云同步功能
 */

class CloudSyncService {
    constructor() {
        // Supabase 配置 - 用户需要替换为自己的项目配置
        this.supabaseUrl = 'YOUR_SUPABASE_URL'; // 例如: https://xxxxx.supabase.co
        this.supabaseKey = 'YOUR_SUPABASE_ANON_KEY'; // 公开的匿名密钥
        this.supabase = null;
        this.userId = this.getUserId();
        this.currentSessionId = null;
        
        this.initSupabase();
    }

    /**
     * 初始化Supabase客户端
     */
    async initSupabase() {
        try {
            // 动态加载Supabase SDK
            if (!window.supabase) {
                await this.loadSupabaseSDK();
            }
            
            if (this.supabaseUrl !== 'YOUR_SUPABASE_URL' && this.supabaseKey !== 'YOUR_SUPABASE_ANON_KEY') {
                this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('Supabase 初始化成功');
            } else {
                console.warn('请配置Supabase项目信息');
            }
        } catch (error) {
            console.error('Supabase 初始化失败:', error);
        }
    }

    /**
     * 动态加载Supabase SDK
     */
    loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * 获取或生成用户ID
     */
    getUserId() {
        let userId = localStorage.getItem('ai_chat_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('ai_chat_user_id', userId);
        }
        return userId;
    }

    /**
     * 检查云同步是否可用
     */
    isCloudSyncAvailable() {
        return this.supabase && this.supabaseUrl !== 'YOUR_SUPABASE_URL';
    }

    /**
     * 保存用户配置到云端
     */
    async saveUserConfig(config) {
        if (!this.isCloudSyncAvailable()) {
            console.log('云同步不可用，使用本地存储');
            return false;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_configs')
                .upsert({
                    user_id: this.userId,
                    api_url: config.apiUrl,
                    api_key: this.encryptApiKey(config.apiKey),
                    model: config.model
                }, {
                    onConflict: 'user_id'
                });

            if (error) throw error;
            console.log('配置已同步到云端');
            return true;
        } catch (error) {
            console.error('保存配置失败:', error);
            return false;
        }
    }

    /**
     * 从云端加载用户配置
     */
    async loadUserConfig() {
        if (!this.isCloudSyncAvailable()) {
            return null;
        }

        try {
            const { data, error } = await this.supabase
                .from('user_configs')
                .select('*')
                .eq('user_id', this.userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                return {
                    apiUrl: data.api_url,
                    apiKey: this.decryptApiKey(data.api_key),
                    model: data.model
                };
            }
            return null;
        } catch (error) {
            console.error('加载配置失败:', error);
            return null;
        }
    }

    /**
     * 创建新的聊天会话
     */
    async createChatSession(title = '新对话') {
        if (!this.isCloudSyncAvailable()) {
            this.currentSessionId = 'local_' + Date.now();
            return this.currentSessionId;
        }

        try {
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .insert({
                    user_id: this.userId,
                    title: title
                })
                .select()
                .single();

            if (error) throw error;
            
            this.currentSessionId = data.id;
            console.log('创建会话:', this.currentSessionId);
            return data.id;
        } catch (error) {
            console.error('创建会话失败:', error);
            this.currentSessionId = 'local_' + Date.now();
            return this.currentSessionId;
        }
    }

    /**
     * 保存聊天消息
     */
    async saveChatMessage(role, content, sessionId = null) {
        const session = sessionId || this.currentSessionId;
        
        if (!this.isCloudSyncAvailable() || !session || session.startsWith('local_')) {
            console.log('本地会话，不同步消息');
            return false;
        }

        try {
            // 获取消息顺序
            const { count } = await this.supabase
                .from('chat_messages')
                .select('*', { count: 'exact', head: true })
                .eq('session_id', session);

            const { data, error } = await this.supabase
                .from('chat_messages')
                .insert({
                    session_id: session,
                    role: role,
                    content: content,
                    message_order: (count || 0) + 1
                });

            if (error) throw error;
            console.log('消息已同步到云端');
            return true;
        } catch (error) {
            console.error('保存消息失败:', error);
            return false;
        }
    }

    /**
     * 加载聊天会话列表
     */
    async loadChatSessions() {
        if (!this.isCloudSyncAvailable()) {
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('chat_sessions')
                .select('*')
                .eq('user_id', this.userId)
                .eq('is_active', true)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('加载会话列表失败:', error);
            return [];
        }
    }

    /**
     * 加载指定会话的消息
     */
    async loadChatMessages(sessionId) {
        if (!this.isCloudSyncAvailable() || sessionId.startsWith('local_')) {
            return [];
        }

        try {
            const { data, error } = await this.supabase
                .from('chat_messages')
                .select('*')
                .eq('session_id', sessionId)
                .order('message_order', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('加载消息失败:', error);
            return [];
        }
    }

    /**
     * 删除聊天会话
     */
    async deleteChatSession(sessionId) {
        if (!this.isCloudSyncAvailable() || sessionId.startsWith('local_')) {
            return false;
        }

        try {
            const { error } = await this.supabase
                .from('chat_sessions')
                .update({ is_active: false })
                .eq('id', sessionId);

            if (error) throw error;
            console.log('会话已删除');
            return true;
        } catch (error) {
            console.error('删除会话失败:', error);
            return false;
        }
    }

    /**
     * 更新会话标题
     */
    async updateSessionTitle(sessionId, title) {
        if (!this.isCloudSyncAvailable() || sessionId.startsWith('local_')) {
            return false;
        }

        try {
            const { error } = await this.supabase
                .from('chat_sessions')
                .update({ title: title })
                .eq('id', sessionId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('更新标题失败:', error);
            return false;
        }
    }

    /**
     * 简单的API Key加密（实际应用中应使用更安全的方法）
     */
    encryptApiKey(apiKey) {
        return btoa(apiKey); // 简单的base64编码
    }

    /**
     * 解密API Key
     */
    decryptApiKey(encryptedKey) {
        try {
            return atob(encryptedKey);
        } catch {
            return encryptedKey; // 如果解密失败，返回原值
        }
    }

    /**
     * 获取云同步状态
     */
    getCloudSyncStatus() {
        return {
            available: this.isCloudSyncAvailable(),
            userId: this.userId,
            currentSession: this.currentSessionId,
            configured: this.supabaseUrl !== 'YOUR_SUPABASE_URL'
        };
    }

    /**
     * 配置Supabase连接
     */
    configureSupabase(url, key) {
        this.supabaseUrl = url;
        this.supabaseKey = key;
        this.initSupabase();
    }
}

// 导出全局实例
window.CloudSyncService = CloudSyncService;
window.cloudSync = new CloudSyncService();