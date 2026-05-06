# Pet Reward System — 小学生学习激励系统

## 项目概览

| 项目 | 详情 |
|------|------|
| 技术栈 | React 18 + TypeScript + Vite (前端), Node.js + Express + Mongoose (后端), MongoDB (数据库), Docker (部署) |
| 文件总数 | 53 files |
| TypeScript/CSS | 39 files |
| 最终审查 | PASS — 零TS错误, 零API路径不匹配, 零响应格式不匹配 |

---

## 架构

```
pet-reward-system/
├── src/
│   ├── shared/types.ts          # 共享类型 + 常量 + API接口定义
│   ├── server/
│   │   ├── models/              # Mongoose数据模型 (5个)
│   │   │   ├── User.ts          # 3角色: student/teacher/parent
│   │   │   ├── Homework.ts      # 作业: pre-save自动算coinReward
│   │   │   ├── CheckIn.ts       # 签到: calculateStreak() + pre-save计算奖励
│   │   │   ├── Pet.ts           # 宠物: 进化检测/喂食/饥饿衰减(批量)
│   │   │   ├── Transaction.ts   # 交易账本: record()原子更新余额
│   │   │   └── index.ts
│   │   ├── routes/              # API路由 (6个)
│   │   │   ├── auth.ts          # 登录/注册 (bcrypt + JWT)
│   │   │   ├── homework.ts      # 作业CRUD + 评分
│   │   │   ├── checkin.ts       # 签到 + 连续打卡
│   │   │   ├── pet.ts           # 宠物/商店/喂食/进化
│   │   │   ├── transaction.ts   # 交易记录查询
│   │   │   └── user.ts          # 用户信息 (脱敏)
│   │   ├── middleware/auth.ts   # JWT验证 + requireRole()
│   │   ├── jobs/hungerDecay.ts  # Cron: 每5分钟宠物饥饿衰减
│   │   ├── app.ts               # Express入口
│   │   └── seed.ts              # 测试数据初始化
│   └── client/
│       ├── src/
│       │   ├── hooks/           # useAuth (AuthContext) + useApi (fetch封装)
│       │   ├── pages/           # 9个页面
│       │   │   ├── LoginPage.tsx         # 三角色登录/注册
│       │   │   ├── Dashboard.tsx         # 学生主页 (金币+宠物+签到)
│       │   │   ├── HomeworkList.tsx      # 作业列表
│       │   │   ├── CheckInCalendar.tsx   # 签到月历 + 连续天数
│       │   │   ├── PetDetail.tsx         # 宠物详情 (喂食+进化时间线)
│       │   │   ├── PetShop.tsx           # 宠物商店 (装饰品/皮肤)
│       │   │   ├── TeacherHomework.tsx   # 教师管理 (布置+评分)
│       │   │   └── ParentDashboard.tsx   # 家长只读面板
│       │   ├── components/      # 9个组件
│       │   │   ├── PetCard / CoinDisplay / HungerMoodBar
│       │   │   ├── Calendar / StreakBadge / HomeworkCard
│       │   │   ├── EvolutionTimeline / ShopItem / MobileNav
│       │   └── App.tsx          # 路由表
│       └── vite.config.ts
├── Dockerfile                    # 多阶段构建 (server编译+client构建+production)
├── docker-compose.yml            # MongoDB + Backend
├── nginx.conf                    # 反向代理 (限流+gzip+安全头)
├── .dockerignore
└── .env.example
```

---

## 核心业务规则

### 金币体系
| 事件 | 金币 | 实现 |
|------|------|------|
| 满分作业 (score=100) | +50 | COIN_REWARDS.PERFECT_HOMEWORK, Homework pre-save |
| 每日签到 | +10 | COIN_REWARDS.DAILY_CHECKIN, CheckIn pre-save |
| 连续签到7天 | 额外+50 | streak%7===0, CheckIn pre-save |
| 喂食宠物 | -5 | COIN_REWARDS.FEED_PET_COST, Pet feed route |
| 购买装饰品 | -价格 | Transaction.record() |
| 管理员调整 | ±任意 | Transaction.record() |

**所有金币操作通过 Transaction.record() 保证原子性** (findByIdAndUpdate + create in sequence)

### 宠物进化路线
| 等级阈值 | 形态 |
|----------|------|
| Lv 1-2 | 基础形态 (base) |
| Lv 3-5 | 第二形态 (stage2) |
| Lv 6-9 | 第三形态 (stage3) |
| Lv 10-49 | 第四形态 (stage4) |
| Lv 50-100 | 终极形态 (ultimate) |

- 升级时 pre-save 自动检测跨阈值 → 记录 evolutionHistory
- 饥饿值: 初始100, 每24h cron -20, 喂食+20
- 心情值: 初始100, 喂食+10, 签到+5

---

## 角色权限矩阵

| 端点 | Student | Teacher | Parent |
|------|---------|---------|--------|
| 作业列表 | 查看自己的 | 管理+评分 | 只读孩子的 |
| 签到 | 打卡+查看 | — | 查看孩子的 |
| 宠物 | 领养/喂食/购物 | — | 查看孩子的 |
| 交易记录 | 查看自己的 | — | 查看孩子的 |
| 用户信息 | 自己的 | — | 脱敏查看孩子 |

---

## 部署

```bash
# 开发环境
cd src/server && npm install && npm run seed && npm run dev
cd src/client && npm install && npm run dev

# Docker 生产环境
docker-compose up -d
# 访问: http://localhost:3001
```

---

## 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 教师 | teacher1 | password123 |
| 学生 | student1 | password123 |
| 学生 | student2 | password123 |
| 家长 | parent1 | password123 |

---

## 审查历史

| 轮次 | 结果 | 问题数 | 关键修复 |
|------|------|--------|----------|
| R1 | FAIL | 5 | seed.ts import路径, User.ts TS类型, 3个缺失家长端点, PetShop请求体, Shop items结构 |
| R2 | FAIL | 1 | checkin家长端点路径/child/:id不匹配 + 响应格式{checkInDates}→{checkins} |
| R3 | PASS | 0 | — |

最终: 零TS编译错误, 零API路径不匹配, 零响应格式不匹配, 6路由组全部注册并验证。
