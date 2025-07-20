-- Supabase 数据库表结构设计
-- AI问答应用聊天记录和配置云同步

-- 1. 用户配置表
CREATE TABLE user_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL, -- 用户标识（基于浏览器指纹或自定义ID）
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL, -- 加密存储
    model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 聊天会话表
CREATE TABLE chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT DEFAULT '新对话',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 3. 聊天消息表
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    message_order INTEGER NOT NULL -- 消息在会话中的顺序
);

-- 索引优化
CREATE INDEX idx_user_configs_user_id ON user_configs(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);

-- 行级安全策略（RLS）
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can only access their own configs" ON user_configs
    FOR ALL USING (user_id = current_setting('app.user_id'));

CREATE POLICY "Users can only access their own sessions" ON chat_sessions
    FOR ALL USING (user_id = current_setting('app.user_id'));

CREATE POLICY "Users can only access messages from their sessions" ON chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM chat_sessions 
            WHERE user_id = current_setting('app.user_id')
        )
    );

-- 自动更新 updated_at 时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_configs_updated_at 
    BEFORE UPDATE ON user_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at 
    BEFORE UPDATE ON chat_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();