<p align="center">
  <img src="https://github.com/user-attachments/assets/0311fdf9-0e94-4fc1-8752-1e0ce0b74d97" alt="Strife Cover" width="100%">
</p>

# Project Overview

**Strife** is a modern full-stack web application built with **Node.js**, **Express**, **MongoDB**, and **React**. 

Its primary focus is on **secure, user-friendly authentication** and **profile management**.

The project is a work in progress and currently showcases:

- A robust **authentication system** with **JWT tokens**, **two-factor authentication (2FA)**, and **Google Sign-In**.
- **User profile features**, including registration, login, and customizable avatars stored via **MinIO**.
- A clean, responsive **frontend UI**, designed in Figma and built with React + Material UI.
- Modular **backend APIs** and a scalable project structure suitable for production environments.

Strife is both a **learning project** and a **production-style prototype**, simulating the workflows and best practices of real-world applications.

## Video Demonstrations

#### Registraton, Login and User Details Management:
[![Watch the video](https://img.youtube.com/vi/57_PZkTv1SM/maxresdefault.jpg)](https://www.youtube.com/watch?v=57_PZkTv1SM)

## **Future Plans**

Strife is currently focused on **secure authentication** and **user profiles**, but its long-term vision is to grow into a **community-driven platform** with rich communication and administration features.

### **Guilds and Channels**

- Implement a **guild (server) system** where each guild can contain multiple channels.
- Support **role-based permissions** with fine-grained access control per guild and channel.
- Provide **administration tools** for guild owners and moderators to define custom rulesets and automate management.
- Goal: an **easy-to-use platform** that balances simplicity with powerful administration.

#### **Tech considerations:**

- Schema design in **MongoDB** for hierarchical guild/channel/role structures.
- **Efficient permission resolution** logic (guild-level vs channel-level overrides).
- Real-time updates using **WebSockets** (e.g., Socket.IO) to propagate changes instantly.

### **Instant Messaging**

- Real-time **text messaging** in channels and direct messages.
- Focus on **low latency** and **reliable delivery**.
- Message persistence so history is stored and synchronized across devices.

#### **Tech considerations:**

- **WebSockets or WebRTC Data Channels** for real-time communication.
- **Message queueing** for scaling across multiple servers.
- **Database optimization** for storing messages (sharding, indexing, pagination).
- Potential **end-to-end encryption** for private messaging.

### **Audio and Video Calls**

- One-on-one and group voice/video calls.
- Channel-based voice rooms (similar to Discord).
- Reliable **media streaming** with low latency.

#### **Tech considerations:**

- **WebRTC** as the underlying technology for peer-to-peer audio/video.
- Bandwidth adaptation and codec handling for a smoother user experience.

### **Discover Page (Optional)**

- Personalized discovery page for users, similar to "For You Pages".
- Content recommendations based on user activity and interests (initial focus on gaming).
- Surfacing **articles, videos, and posts** from around the web.

#### **Tech considerations:**

- A lightweight **machine learning model** for interest tracking and recommendation.
- Backend pipeline for collecting and filtering content.
- Ranking algorithm balancing relevance, freshness, and diversity.
- Possible integration with **external APIs** for curated content sources.

This roadmap aims to position Strife as a **quickly rising platform** that combines **real-time communication**, **rich administration features**, and **personalized discovery** into a single, cohesive experience.

# Features

### Authentication & Security

- **JWT-based authentication** for secure sessions.
- **Two-factor authentication (2FA)** with QR codes and verification codes.
- **Google Sign-In integration** via Google Identity Services (GIS).
- **Email validation** step in 2FA reset flow.
- Password hashing and secure credential storage.

### User Management

- **User registration & login** with Joi-based input validation.
- **Profile view & editing**.
- **Avatar uploads** with MinIO (S3-compatible, publicly accessible).
- Image upload validation (size limits, collision avoidance).

### Frontend

- **Modern, responsive UI** built with React + Vite.
- **Material UI components** with custom theming.
- **Minimalist artwork backgrounds** inspired by Discord’s style.
- Form validation with live error messages.

### Backend & API

- Modular **Express routes** for clean API design.
- **MongoDB + Mongoose** for data persistence.
- Environment variable–based configuration.
- Ready for Postman testing & API exploration.

### Project Structure

- Clear separation between **frontend** and **backend**.
- Backend and frontend can be developed & run independently.
- Scalable design for future features.



# Tech Stack

### Frontend

- **React (Vite)** — fast build tooling and modern React features
- **Material UI (MUI)** — UI components with custom theming
- **Inter font** — clean, modern typography
- **Axios** — for API requests
- **Figma** — design and prototyping

### Backend

- **Node.js + Express** — REST API and server logic
- **MongoDB + Mongoose** — NoSQL database and schema modeling
- **JWT (JSON Web Tokens)** — authentication & session management
- **Joi** — schema-based input validation
- **MinIO** — S3-compatible object storage for avatars

### Authentication & Security

- **Google Identity Services (GIS)** — client-side sign-in with Google
- **Two-Factor Authentication (2FA)** — QR-based secret + verification codes
- **Password hashing** and secure credential storage

### Development & Tools

- **Postman** — API testing
- **IntelliJ IDEA** — primary development environment
- **Git & GitHub** — version control and collaboration
