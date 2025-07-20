# AI问答云同步配置指南

## 🎯 功能概述

AI问答应用现已支持聊天记录和配置的云同步功能，让您的对话数据在多设备间无缝同步。

## ☁️ 支持的功能

- ✅ **聊天记录云存储** - 所有对话自动保存到云端
- ✅ **配置云同步** - API配置在设备间同步
- ✅ **多会话管理** - 创建、重命名、删除对话会话
- ✅ **跨设备访问** - 任何设备都能访问您的对话历史
- ✅ **自动备份** - 数据安全存储，永不丢失

## 🔧 配置步骤

### 第一步：创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com/)
2. 注册账号并登录
3. 点击"New Project"创建新项目
4. 填写项目信息：
   - **Name**: `ai-chat-sync` (或您喜欢的名称)
   - **Database Password**: 设置强密码
   - **Region**: 选择距离您最近的区域

### 第二步：设置数据库

1. 等待项目创建完成（约2分钟）
2. 进入项目Dashboard
3. 点击左侧菜单的"SQL Editor"
4. 复制以下SQL代码并执行：

```sql
-- 创建用户配置表
CREATE TABLE user_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    api_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建聊天会话表
CREATE TABLE chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT DEFAULT '新对话',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 创建聊天消息表
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    message_order INTEGER NOT NULL
);

-- 创建索引
CREATE INDEX idx_user_configs_user_id ON user_configs(user_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON chat_messages(timestamp DESC);

-- 启用行级安全
ALTER TABLE user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
```

### 第三步：获取API凭据

1. 在Supabase项目中，点击左侧菜单的"Settings"
2. 点击"API"选项
3. 复制以下信息：
   - **Project URL** (类似: `https://xxxxx.supabase.co`)
   - **anon public** key (以`eyJhbGciOiJIUzI1NiIs`开头的长字符串)

### 第四步：在AI问答应用中配置

1. 打开AI问答页面
2. 在左侧面板找到"云同步配置"部分
3. 填入刚才获取的信息：
   - **Supabase URL**: 粘贴Project URL
   - **Supabase Key**: 粘贴anon public key
4. 点击"配置云同步"按钮
5. 看到"云同步已启用"提示即表示配置成功

## 🚀 使用方法

### 创建新会话
- 点击"➕ 新对话"按钮创建新的聊天会话
- 每个会话都会自动保存到云端

### 管理会话
- **重命名**: 点击会话项的"✏️"按钮
- **删除**: 点击会话项的"🗑️"按钮
- **切换**: 直接点击会话项切换对话

### 同步配置
- API配置会自动在设备间同步
- 首次使用新设备时，点击"📁 加载配置"获取云端配置

## 🔒 安全说明

- **数据加密**: API Key使用Base64编码存储
- **访问控制**: 每个用户只能访问自己的数据
- **本地备份**: 配置同时保存在本地和云端
- **隐私保护**: 所有数据仅您可见，Supabase提供企业级安全

## 💡 使用技巧

1. **多设备同步**: 在每台设备上都配置相同的Supabase信息
2. **定期备份**: 云端数据自动备份，无需手动操作
3. **离线使用**: 未配置云同步时，数据仍保存在本地
4. **会话管理**: 删除不需要的会话可节省存储空间

## ❗ 常见问题

### Q: 配置后显示"云同步配置中..."
A: 请等待1-2秒让连接建立，然后检查URL和Key是否正确

### Q: 无法加载历史会话
A: 检查网络连接和Supabase项目状态，确认数据库表已正确创建

### Q: 数据安全性如何？
A: 使用Supabase企业级安全，支持SSL加密传输，行级安全策略保护数据

### Q: 免费版有限制吗？
A: Supabase免费版提供：
- 500MB数据库存储
- 50MB文件存储  
- 2GB带宽
- 对个人使用完全足够

## 📞 技术支持

如遇问题，请检查：
1. Supabase项目是否正常运行
2. 网络连接是否稳定
3. API凭据是否正确
4. 数据库表是否已创建

---

*最后更新时间: 2025-07-20*