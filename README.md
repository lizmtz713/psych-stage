# 🧠 Psych Stage

**Mental Wellness for Teens & Families**

A React Native (Expo) app that helps teens track their emotional wellbeing through daily check-ins, AI-powered roleplay practice, and guided journaling — while giving parents insights to stay connected without being intrusive.

**Domain:** [psychstage.com](https://psychstage.com)

---

## ✨ Features

### For Teens
- 🎭 **Mood Check-ins** — Quick daily emotional tracking with beautiful UI
- 📝 **Guided Journaling** — Prompts to help process feelings
- 🎮 **Roleplay Practice** — 100+ AI-powered scenarios to practice real-life situations
- 🏆 **Achievements** — Gamified progress tracking
- 🔒 **Private & Safe** — Parents see trends, never private entries

### For Parents
- 📊 **Smart Insights** — Pattern detection, mood trends, early warnings
- 💜 **Connection Hub** — Activities, weekly challenges, conversation starters
- 📚 **Learn Center** — Teen brain science, communication tips, when to get help
- 🚨 **Crisis Resources** — 988 Lifeline, Crisis Text Line info

---

## 🎮 Roleplay System (100+ Scenarios)

Practice real-life situations in a safe space:

| Track | Scenarios |
|-------|-----------|
| **Core (by age)** | 25+ — age-appropriate challenges |
| **LGBTQ+** | 15 — coming out, identity, finding community |
| **Neurodivergent** | 14 — ADHD, autism, sensory, advocacy |
| **Cultural** | 10 — code-switching, identity, family expectations |
| **Grief** | 14 — loss, complicated grief, supporting others |
| **Chronic Illness** | 15 — invisible illness, medical advocacy |
| **Recovery** | 12 — addiction, mental health, relapse prevention |

AI provides personalized feedback on assertiveness, communication style, and emotional intelligence.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo) + TypeScript
- **Backend:** Firebase (Auth, Firestore, Storage)
- **AI:** OpenAI/Anthropic for roleplay feedback
- **State:** React Context + AsyncStorage
- **Navigation:** React Navigation (tabs + stacks)

---

## 📱 Screens

### Teen App
- **HomeScreen** — Daily check-in, streak, quick actions
- **CheckInScreen** — Mood selection with context
- **JournalScreen** — Guided journaling with prompts
- **RoleplayScreen** — Interactive scenario practice
- **ProgressScreen** — Stats, achievements, history
- **SettingsScreen** — Privacy, notifications, account

### Parent App
- **DashboardScreen** — Overview, alerts, recent activity
- **InsightsScreen** — Patterns, trends, time analysis
- **ConnectionScreen** — Activities, challenges, conversation starters
- **LearnScreen** — Articles on teen development
- **SettingsScreen** — Family settings, notifications

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project

### Install & Run

```bash
cd app
npm install
npx expo start
```

### Firebase Setup

1. Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Add your config to `app/src/config/firebase.ts`

---

## 🔒 Privacy Model

- **Teens own their data** — Journal entries are private
- **Parents see trends only** — Mood patterns, not specifics
- **Crisis alerts** — Parents notified if concerning patterns detected
- **No social features** — This isn't social media

---

## 📊 Why Parents Keep Coming Back

1. **Insights update** with each teen check-in
2. **Weekly challenges** create connection habits
3. **Content is genuinely helpful** — not preachy
4. **Acknowledges that parenting teens is hard**

---

## 📄 License

MIT

---

*Built with 💜 for families navigating the teen years*
