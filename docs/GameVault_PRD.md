# GameVault — Product Requirements Document

**Product:** GameVault  
**Version:** 2.0 → Long-term platform  
**Product type:** Personal gaming library, backlog management, analytics and recommendation platform  
**Primary platform:** Web  
**Owner:** Nitin  
**Development model:** Solo developer  
**Status:** Existing V1 → Major rebuild / expansion  
**Long-term objective:** Build a technically substantial, continuously evolving gaming platform suitable as a flagship portfolio project.

---

# 1. Product Vision

## 1.1 Vision

GameVault should become a **single personal system for managing and understanding a user's gaming life**.

It should answer questions such as:

> What games do I own?

> What games have I played?

> What should I play next?

> How large is my backlog?

> How much time would it take me to finish it?

> What genres do I actually play?

> Which games did I enjoy most?

> Which games have I abandoned?

> What games should I buy?

> Is this game worth buying at its current price?

> What have I spent on gaming?

> How has my gaming activity changed over time?

The product should eventually move beyond being a database of games and become an **intelligent personal gaming data platform**.

---

# 2. Problem Statement

Gamers commonly have fragmented information across:

- Steam
- Epic Games
- PlayStation
- Xbox
- GOG
- physical games
- personal spreadsheets
- wishlists
- notes
- screenshots
- memory

A user may own hundreds of games but have no unified understanding of:

- what they own
- what they have completed
- what remains unfinished
- how much time the backlog represents
- what they actually enjoy
- which games they repeatedly abandon
- what they should play next
- when they should buy a game
- how much they spend on games

GameVault attempts to consolidate this information into one system.

---

# 3. Product Principles

GameVault should follow six principles.

### 3.1 User-owned data

The user's collection is the center of the system.

### 3.2 Automation over manual entry

The user should **not** have to type:

> Game name  
> Description  
> Developer  
> Publisher  
> Image URL  
> Genre  
> Platform  
> Release date

for every game.

Game metadata should be imported automatically whenever possible.

### 3.3 Intelligence must use actual user data

AI/recommendation features should use:

- user's library
- play history
- ratings
- preferences
- backlog
- available time
- purchase history

rather than simply behaving like a generic chatbot.

### 3.4 Explainability

When GameVault recommends something, the user should understand **why**.

Example:

> Recommended because you rated 4 similar story-driven games above 8/10 and this game fits your preferred 10–20 hour playtime.

### 3.5 Modular architecture

External services must not become the entire application.

GameVault should use provider abstraction so that:

```text
Game Metadata Provider
        ↓
GameVault Normalization Layer
        ↓
GameVault Database
```

rather than having the UI directly depend on one provider.

### 3.6 Build incrementally

The system must remain usable at every major version.

---

# 4. Target Users

## Primary user

A gamer with:

- a large library
- an expanding backlog
- multiple platforms
- a wishlist
- interest in statistics
- difficulty deciding what to play next

## Secondary users

Potential future users:

- collectors
- achievement hunters
- completionists
- casual gamers
- gaming-content creators
- people tracking gaming spending

---

# 5. Core User Journey

A new user should eventually experience:

```text
Create account
      ↓
Connect/import games
      ↓
GameVault identifies games
      ↓
Library created
      ↓
User categorizes games
      ↓
User records play history
      ↓
GameVault learns preferences
      ↓
Analytics become available
      ↓
Backlog is analyzed
      ↓
GameVault recommends what to play
      ↓
User plays
      ↓
User records outcome
      ↓
Recommendation system improves
```

---

# 6. Product Architecture

High-level architecture:

```text
                    ┌────────────────────┐
                    │      Frontend      │
                    │ React / Next.js    │
                    └─────────┬──────────┘
                              │
                         REST / API
                              │
                    ┌─────────▼──────────┐
                    │    API Backend     │
                    │ Node + Express     │
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼────────────────────┐
          │                   │                    │
          ▼                   ▼                    ▼
     Game Service       User Service        Analytics Service
          │                   │                    │
          └──────────────┬────┴────────────────────┘
                         │
                   ┌─────▼──────┐
                   │  Database  │
                   │  MongoDB   │
                   └─────┬──────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
 Game Metadata       Price Data      External APIs
 Providers
```

Later:

```text
                 Recommendation Engine
                         │
                 Analytics Engine
                         │
                 ML / Ranking Layer
                         │
                  Notification System
```

---

# 7. Navigation

Primary navigation:

```text
GameVault
│
├── Dashboard
├── Library
├── Backlog
├── Wishlist
├── Currently Playing
├── Completed
├── Discover
├── Analytics
├── Recommendations
├── Prices
├── Activity
└── Settings
```

---

# 8. Dashboard

The dashboard is the user's gaming command center.

## 8.1 Overview cards

Display:

- Total games
- Games completed
- Currently playing
- Backlog count
- Wishlist count
- Total estimated playtime
- Total recorded playtime
- Average personal rating

Example:

```text
124 Games
43 Completed
7 Playing
51 Backlog
23 Wishlist
```

---

## 8.2 Continue Playing

Display currently active games.

Each card:

- cover
- title
- platform
- progress
- hours played
- estimated remaining time
- last played

---

## 8.3 Backlog snapshot

Example:

> You have 51 games in your backlog.

```text
<10 hours       12 games
10–30 hours     24 games
30–60 hours     10 games
60+ hours        5 games
```

---

## 8.4 Recently added

Show recently added games.

---

## 8.5 Recently completed

Show recent completions.

---

## 8.6 Recommendation

Dashboard should display one or more personalized suggestions.

Example:

> **Play Mafia: Definitive Edition**

Reason:

- Story-driven games are highly rated in your history.
- Estimated duration matches your typical play sessions.
- Similar games received high personal ratings.
- Currently in your backlog.

---

# 9. Game Entity

Every game should have a structured record.

## Core identity

```text
gameId
title
slug
description
releaseDate
developers
publishers
genres
tags
franchises
```

## Media

```text
coverImage
backgroundImage
screenshots[]
trailers[]
logos
```

## Platforms

```text
PC
PlayStation
Xbox
Nintendo
etc.
```

## External metadata

```text
externalProvider
externalId
externalUrls
```

---

# 10. User Game Record

Separate the global game from the user's relationship with that game.

This is extremely important architecturally.

### Game

Represents:

> What is Cyberpunk 2077?

### UserGame

Represents:

> What does Cyberpunk 2077 mean to Nitin?

Example:

```text
UserGame
├── userId
├── gameId
├── status
├── personalRating
├── hoursPlayed
├── purchasePrice
├── purchaseDate
├── platform
├── ownershipType
├── startedAt
├── completedAt
├── notes
├── review
└── progress
```

This allows the same game to exist globally while every user has their own relationship with it.

---

# 11. Game Status System

Replace the current simplistic library/wishlist approach with a proper lifecycle.

```text
Wishlist
   ↓
Owned
   ↓
Backlog
   ↓
Playing
   ↓
Completed
```

Additional states:

```text
Dropped
On Hold
Replay
Mastered
```

The user can manually change states.

---

# 12. Library

The library is the user's complete game collection.

## Filters

Users should be able to filter by:

- platform
- genre
- developer
- publisher
- release year
- status
- rating
- playtime
- completion state
- ownership type
- franchise

## Sorting

- title
- release date
- rating
- personal rating
- playtime
- recently added
- recently played

---

# 13. Wishlist

Wishlist entries should contain:

- game
- desired platform
- target price
- current price
- lowest known price
- date added
- priority
- notes

Example:

```text
Cyberpunk 2077

Current price: ₹1,999
Target price: ₹800
Wishlist since: May 2026

[Notify me below ₹800]
```

Price tracking can be introduced later.

---

# 14. Backlog System

The backlog should be treated as a major product feature rather than a simple filter.

## Backlog information

For every game:

- estimated completion time
- user's estimated time
- hours already played
- remaining time
- genre
- personal priority
- last played
- status

---

# 15. Backlog Analytics

GameVault should calculate:

### Total backlog

```text
51 games
```

### Estimated backlog time

```text
~682 hours
```

### Completion projection

Based on user-defined average gaming time.

Example:

> At 7 hours/week, your current backlog represents approximately X weeks of gameplay.

This is an estimate and should be clearly labeled as such.

---

# 16. Backlog Categories

Automatically categorize:

### Quick Wins

Under 10 hours.

### Medium

10–30 hours.

### Long

30–60 hours.

### Massive

60+ hours.

These thresholds should eventually be configurable.

---

# 17. Gaming Activity Tracking

Users should be able to record:

```text
Game
Date
Start time
End time
Duration
Platform
Session notes
```

Example:

```text
September 30
Cyberpunk 2077
2h 14m
Story mission
```

---

# 18. Play History

Timeline:

```text
Oct 1
Cyberpunk — 2h

Sep 30
RDR2 — 1h 42m

Sep 28
Mafia — 2h 10m
```

Users can edit/delete entries.

---

# 19. Gaming Analytics

This is one of the major long-term differentiators.

## Basic analytics

- Total hours
- Games completed
- Games abandoned
- Average rating
- Average completion time
- Most played genres
- Most played platforms
- Most played developers
- Most played franchises

---

# 20. Personal Gaming Profile

GameVault should eventually generate a data-driven profile.

Example:

```text
YOUR GAMING PROFILE

Story-driven       92%
Open-world         88%
Action             84%
RPG                78%
Racing             67%
Horror             42%
```

This is not a personality test.

It is simply derived from the user's actual gaming data.

---

# 21. Rating Analytics

Compare:

```text
Personal rating
        vs
External rating
```

Example:

```text
Game               You     External
RDR2                9.5       9.4
Mafia               9.0       8.2
Game X              6.0       8.7
```

This allows GameVault to learn:

> You frequently rate this type of game differently from the general audience.

That can eventually improve recommendations.

---

# 22. Recommendation Engine

This should NOT initially be an LLM.

Start with deterministic recommendation logic.

### Inputs

- genres
- tags
- personal ratings
- completion history
- playtime
- backlog
- platform
- recently played games
- dropped games
- preferred game length

### Example scoring

Conceptually:

```text
Recommendation Score =

Genre similarity
+ historical preference
+ rating similarity
+ backlog priority
+ playtime compatibility
+ recency adjustment
```

The exact formula can evolve.

---

# 23. "What Should I Play?"

The user can specify:

```text
Available time:
2 hours

Mood:
Story

Platform:
PC

Want:
Something from backlog
```

GameVault searches the user's backlog and ranks compatible games.

It should explain the result.

Example:

> **Mafia: Definitive Edition**

> Fits your story preference, is already in your backlog, and its estimated length fits your available playtime better than most other backlog titles.

---

# 24. Recommendation Modes

Eventually:

### Quick Session

> "I have 1–2 hours."

### Weekend

> "Give me something for this weekend."

### Long-Term

> "I want a game I can spend 50+ hours on."

### Story

> "Give me a story-heavy game."

### Chill

> "I don't want anything stressful."

### Finish the Backlog

> "Choose something I should finally complete."

---

# 25. AI Layer

AI should be introduced **after the underlying data system works**.

AI can eventually:

- summarize games
- summarize personal gaming history
- explain recommendations
- analyze reviews
- generate personalized game comparisons
- interpret natural-language queries

Example:

> "I want something like RDR2 but shorter."

GameVault translates that into structured search criteria.

---

# 26. Natural Language Search

Eventually:

> "Show me games under 20 hours that I own but haven't played."

or:

> "Which games have I abandoned twice?"

or:

> "What racing games do I own?"

or:

> "Which games did I rate higher than their general rating?"

The system converts natural language into database queries.

This becomes much more interesting than simply adding a chatbot.

---

# 27. Purchase Intelligence

Eventually track:

- purchase price
- current price
- historical low
- discount
- store
- purchase date

Then show factual information:

```text
Current: ₹1,299
Historical low: ₹599
Current discount: 35%

Your target: ₹700
```

The user decides.

---

# 28. Price Alerts

Users can define:

```text
Game: Cyberpunk 2077
Target: ₹700
Store: Steam
```

GameVault checks periodically.

When the target is reached:

> Cyberpunk 2077 has reached your target price.

---

# 29. Platform Integration

Long-term goal:

```text
Steam
Epic
GOG
PlayStation
Xbox
Nintendo
Manual
```

Each provider should have an adapter.

```text
PlatformAdapter
├── SteamAdapter
├── EpicAdapter
├── GOGAdapter
└── ...
```

This keeps the architecture modular.

---

# 30. Game Identity Resolution

One major technical challenge:

The same game may appear as:

```text
Cyberpunk 2077
Cyberpunk 2077 (PC)
Cyberpunk 2077 Ultimate Edition
Cyberpunk 2077 — Steam
```

GameVault should identify whether these represent:

- same base game
- different edition
- DLC
- remaster
- remake
- separate release

This becomes a serious data-normalization problem.

---

# 31. Editions and DLC

GameVault should eventually understand:

```text
Game
├── Standard Edition
├── Deluxe Edition
├── Ultimate Edition
├── DLC 1
├── DLC 2
└── Expansion
```

The user can track ownership separately.

---

# 32. Achievements

Future integration can track:

- achievement count
- completion percentage
- rare achievements
- platform
- completion date

Potential dashboard:

```text
Achievements
482 / 730

Completion
66%
```

---

# 33. Social Features

**Not part of V2.**

Potential future:

- public profile
- game collections
- reviews
- friends
- activity feed
- shared lists

But this should come much later.

The project should remain useful without becoming another social network.

---

# 34. Search & Discovery

Global search:

```text
Game
Developer
Publisher
Genre
Franchise
Platform
```

Search should support fuzzy matching.

Example:

> "cyber"

returns:

- Cyberpunk 2077
- Cyberpunk 2077: Phantom Liberty
- etc.

---

# 35. Game Detail Page

A game page should eventually contain:

```text
┌────────────────────────────────────┐
│ COVER       Cyberpunk 2077         │
│             ⭐ Personal: 9.2       │
│             Platform: PC           │
│                                    │
│             [Play] [Wishlist]     │
└────────────────────────────────────┘

Description

Your Progress
████████░░ 80%

Play History

Your Review

Analytics

DLC

Similar Games
```

---

# 36. Import System

Users should be able to import:

- CSV
- JSON
- spreadsheet

Example:

```text
Title
Platform
Status
Rating
Hours
Purchase Price
```

GameVault maps imported data into the internal schema.

---

# 37. Export System

Users must be able to export their data.

Formats:

- CSV
- JSON

Potential later:

- PDF gaming report

This reinforces the principle that **the user's data belongs to them**.

---

# 38. Authentication

Existing GameVault already has JWT authentication.

V2 should maintain:

- registration
- login
- logout
- password hashing
- token handling
- protected routes
- password reset
- session management

Potential future:

- Google OAuth
- passkeys

---

# 39. Security Requirements

Backend must include:

- input validation
- authentication
- authorization
- rate limiting
- secure password hashing
- API validation
- CORS configuration
- protection against injection
- secure environment variables
- no secrets committed to Git
- logging without sensitive data

---

# 40. Database Architecture

Suggested conceptual models:

```text
User
Game
GameEdition
Platform
Genre
Developer
Publisher

UserGame
Wishlist
PlaySession
Review
Rating
Purchase
PriceRecord
Achievement
Recommendation
Notification
ExternalGameMapping
```

Relationships should be carefully designed before implementation.

---

# 41. API Architecture

Example:

```text
/api/auth
/api/users
/api/games
/api/library
/api/wishlist
/api/backlog
/api/play-sessions
/api/reviews
/api/ratings
/api/analytics
/api/recommendations
/api/prices
/api/import
/api/export
```

---

# 42. API Requirements

Every endpoint should have:

- clear request schema
- response schema
- authentication requirements
- validation
- error handling
- status codes
- pagination where required

---

# 43. Error Handling

The frontend should never simply display:

> Something went wrong.

Instead:

```text
Unable to import game data.

The external game database did not respond.

[Retry]
```

Backend errors should be logged internally with useful diagnostic information.

---

# 44. Caching

External API calls should not happen unnecessarily.

Potential architecture:

```text
User
 ↓
GameVault
 ↓
Cache
 ↓
If missing/stale
 ↓
External API
```

Redis can eventually be introduced.

---

# 45. Background Jobs

Eventually use scheduled jobs for:

- price updates
- metadata refresh
- notifications
- analytics calculations
- external library synchronization

This lets you demonstrate backend engineering beyond basic REST APIs.

---

# 46. Observability

Long-term:

- application logs
- API latency
- error rates
- background-job status
- external API failures
- database performance

Admin/debug dashboard can show:

```text
API requests
External API failures
Average response time
Jobs completed
Jobs failed
```

---

# 47. Testing

GameVault should eventually contain:

### Unit tests

For:

- recommendation scoring
- game normalization
- backlog calculations
- analytics
- validation

### Integration tests

For:

- authentication
- library
- wishlist
- imports
- API interactions

### End-to-end tests

For:

```text
Register
→ Add game
→ Move to backlog
→ Start playing
→ Complete
→ Rate
→ Recommendation updates
```

---

# 48. Performance Requirements

Target:

- normal API response < 300 ms where practical
- paginated library queries
- indexed database searches
- cached external metadata
- asynchronous background jobs
- no unnecessary external API requests

Large collections should remain usable.

---

# 49. UI/UX Requirements

GameVault should feel like a **real gaming product**, not a college CRUD application.

Visual direction:

- dark gaming-oriented interface
- large artwork
- clean typography
- subtle animations
- responsive cards
- compact data visualization
- desktop-first but mobile-friendly

Avoid:

- excessive glowing effects
- unnecessary animations
- clutter
- huge dashboards with meaningless numbers

---

# 50. Responsive Design

Must support:

### Desktop

Primary experience.

### Tablet

Dashboard and library should remain usable.

### Mobile

Users should be able to:

- browse library
- update status
- add wishlist games
- check recommendations
- view statistics

---

# 51. Accessibility

Include:

- keyboard navigation
- semantic HTML
- readable contrast
- focus states
- alt text
- reduced-motion support
- accessible forms

---

# 52. Notifications

Future notification system:

```text
Price target reached
Game update
Wishlist discount
Backlog reminder
Achievement milestone
```

Users must control notification preferences.

---

# 53. Data Privacy

User data should be private by default.

Users should be able to:

- export data
- delete account
- delete game history
- manage connected platforms
- disconnect integrations

---

# 54. MVP — October 2–11

**This is extremely important.**

Do NOT attempt the entire PRD before your exam.

The first milestone should be:

# GameVault V2 Foundation

### Must have

**1. New database model**

Separate:

```text
Game
UserGame
Wishlist
PlaySession
```

**2. External game search**

Search a game and automatically retrieve metadata.

**3. Add to library**

One click.

**4. Status system**

```text
Backlog
Playing
Completed
Dropped
Wishlist
```

**5. Game detail page**

**6. Library filtering**

**7. Basic dashboard**

**8. Basic analytics**

**9. Clean REST API**

**10. Proper authentication**

**11. Documentation**

**12. Deployment**

That's enough.

---

# 55. V2 Roadmap

After the exam:

### Phase 1 — Foundation

- database redesign
- metadata API
- library
- wishlist
- backlog
- statuses
- authentication

### Phase 2 — Personal tracking

- play sessions
- ratings
- reviews
- completion tracking
- activity timeline

### Phase 3 — Analytics

- gaming statistics
- backlog analysis
- genre analysis
- platform analysis
- rating analysis

### Phase 4 — Recommendation engine

- rule-based recommendations
- similarity
- personalized ranking
- explainable recommendations

### Phase 5 — Intelligence

- natural-language queries
- AI-assisted analysis
- conversational search

### Phase 6 — Purchase intelligence

- prices
- historical prices
- price alerts
- purchase history

### Phase 7 — Platform integrations

- Steam
- Epic
- GOG
- PlayStation
- Xbox
- etc., subject to each platform's available APIs and terms

### Phase 8 — Advanced systems

- achievement tracking
- social profiles
- public collections
- advanced ML
- recommendation learning

---

# 56. Long-Term ML Possibilities

This is where your AI/ML background can eventually become relevant.

Don't add ML just to say:

> "This project uses AI."

Instead, use your accumulated user data.

Potential models:

### Game similarity

Find games similar to games the user liked.

### Preference prediction

Predict whether a user is likely to rate a game highly.

### Completion prediction

Estimate whether the user is likely to finish a game.

### Abandonment analysis

Identify patterns associated with games the user drops.

### Recommendation ranking

Rank games based on historical user behavior.

---

# 57. AI Architecture

Eventually:

```text
                User Query
                    ↓
             Intent Detection
                    ↓
             Query Planning
                    ↓
        ┌───────────┼───────────┐
        ↓           ↓           ↓
    Database     Analytics    Game API
        ↓           ↓           ↓
        └───────────┼───────────┘
                    ↓
              Result Builder
                    ↓
             Optional LLM
                    ↓
              Human-readable
                 response
```

The LLM should **not** be responsible for knowing everything.

GameVault's own database remains the source of truth for user-specific information.

---

# 58. Example Natural Language Queries

Eventually:

> "Show me all my unfinished games under 15 hours."

> "What are my five most played franchises?"

> "Which games did I rate below 7 but spend more than 30 hours on?"

> "I have three hours tonight. What should I play?"

> "Which games in my backlog are similar to Mafia?"

> "How much have I spent on games this year?"

> "Which games have I bought but never launched?"

---

# 59. Gamification

Optional future feature.

Examples:

- completion streaks
- monthly gaming goals
- backlog reduction
- achievement milestones

But avoid making the product addictive or manipulative.

---

# 60. Success Metrics

For your personal project, success isn't simply:

> Number of features.

Instead:

### Technical

- clean architecture
- documented API
- tests
- deployment
- scalable data model
- external integrations
- reliable background processing

### Product

- low manual entry
- useful recommendations
- useful analytics
- fast search
- intuitive library management

### Portfolio

The project should demonstrate:

**Frontend**

React / Next.js

**Backend**

Node / Express

**Database**

MongoDB

**Authentication**

JWT / OAuth

**API integration**

External game metadata

**Data engineering**

Normalization + synchronization

**Algorithms**

Recommendation/ranking

**Analytics**

Personal gaming statistics

**AI**

Natural-language interaction later

**DevOps**

Deployment / environment management

---

# 61. Resume Evolution

Your current resume says:

> **GameVault — Full-Stack Game Library**

with REST APIs, JWT, collections, wishlists and filtering.

Eventually, you could honestly describe it more like:

> **GameVault — Personal Gaming Intelligence Platform**  
> Built a full-stack gaming platform integrating external game metadata, personalized library management, backlog tracking, play-history analytics and explainable game recommendations.  
>  
> Designed a normalized game/user data model supporting libraries, editions, platforms, wishlists and play sessions.  
>  
> Developed analytics pipelines to derive gaming preferences, backlog statistics and personalized recommendations from user activity.

**Only claim the parts you actually implement.**

---

# 62. What NOT to Build Yet

This is just as important.

Don't start with:

❌ Social network  
❌ Chatbot  
❌ Mobile app  
❌ 15 platform integrations  
❌ ML recommendation model  
❌ AI agent  
❌ Achievement system  
❌ Price tracker  
❌ Complex microservices  
❌ Kubernetes  
❌ 50 dashboards  

You will drown in your own scope. 😭

---

# 63. Development Philosophy

GameVault should evolve like:

```text
V1
Simple CRUD library

        ↓

V2
Real game data + proper architecture

        ↓

V3
Personal tracking

        ↓

V4
Analytics

        ↓

V5
Recommendation engine

        ↓

V6
External platform integrations

        ↓

V7
AI + natural language

        ↓

V8
Advanced intelligence
```

**Not:**

```text
Day 1:
ADD AI
ADD ML
ADD 17 APIs
ADD SOCIAL
ADD MOBILE
ADD EVERYTHING
💀
```

---

# 64. Your October 2–11 Definition of Done

By **October 11**, I would consider this successful if you can open GameVault and do:

```text
Register
   ↓
Search "Cyberpunk 2077"
   ↓
Game metadata automatically appears
   ↓
Add to library
   ↓
Choose "Backlog"
   ↓
Open game page
   ↓
Start playing
   ↓
Record play session
   ↓
Mark completed
   ↓
Give personal rating
   ↓
Dashboard updates
   ↓
Analytics update
```

And everything is backed by **your own API + database**, not an AI coding platform.

Then stop.

**October 12 = exam.** 😂

---

# 65. Ultimate Vision

The eventual GameVault should feel like this:

> **Steam library + backlog tracker + gaming analytics + collection manager + recommendation engine + purchase tracker — built around the individual user's gaming history.**

And the really cool part is that **you don't need to decide today what GameVault will become in 2028.**

You only need to build the architecture today that **doesn't prevent it from becoming something bigger tomorrow.**

That makes GameVault a much better candidate for your "master project" than trying to rescue the Emergent learning system. Your resume already has breadth; this gives you a project where you can demonstrate **depth over a long period**.
