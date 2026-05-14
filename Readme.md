# Flux Video Streaming Platform

A full-stack video streaming platform built with **Next.js**, **NestJS**, **TypeScript**, and **MongoDB** in a **monorepo** architecture.

Flux is designed as a modern streaming-style web application inspired by platforms like Netflix, while focusing on a **studio/creator-oriented workflow** where studio accounts can upload, manage, and stream video content, while regular users can browse and watch content.

This project also demonstrates a practical **DevOps deployment workflow** using Docker, GitHub Actions, GitHub Container Registry, AWS EC2, Nginx reverse proxy, MongoDB Atlas, health checks, automated deployment, and backup automation.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [DevOps Features](#devops-features)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Deployment Architecture](#deployment-architecture)
- [Quick Start](#quick-start)
- [How to Run Locally](#how-to-run-locally)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Security and Ownership Model](#security-and-ownership-model)
- [Backup Strategy](#backup-strategy)
- [Completed Features](#completed-features)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [Portfolio Summary](#portfolio-summary)
- [License](#license)

---

## Overview

Flux Video Streaming Platform is a production-style full-stack application that combines:

- secure JWT authentication
- Google authentication
- email verification using Gmail SMTP
- protected studio upload workflows
- ownership-based creator APIs
- video playback and media serving
- modular NestJS backend architecture
- modern Next.js frontend
- Dockerized deployment
- CI/CD automation
- cloud deployment on AWS EC2

The goal is not only to build a good-looking streaming UI, but also to demonstrate realistic software engineering and DevOps practices such as:

- protected APIs
- role-based access control
- backend-driven ownership validation
- file upload handling
- persistent database storage
- environment-based configuration
- Docker image publishing
- automated deployment pipeline
- reverse proxy routing
- production health checks
- server backup automation

---

## Features

### Authentication

- User registration
- User login
- Google login integration
- Gmail/email verification flow
- Password hashing with bcrypt
- JWT token generation
- JWT-based protected routes
- Protected studio/admin features

### User and Studio Roles

- Regular user accounts for watching content
- Studio accounts for uploading and managing content
- Admin account support
- Backend-enforced role validation
- Users cannot upload videos unless allowed by role
- Studios can upload films and TV-show-style content

### Video Platform

- Upload videos with thumbnails, posters, tags, genres, and metadata
- Browse videos on a streaming-style homepage
- Watch individual videos
- Increment video views
- Fetch all videos
- Fetch a single video by ID
- Featured videos
- New releases/categories support
- Rating-related fields support

### Creator / Studio Features

- Protected upload page
- Authenticated publishing flow
- Ownership stored on each video
- Secure `my videos` API
- Backend-enforced ownership logic
- Studio profile ownership support

### Media Handling

- Static serving of uploaded files
- Video upload support
- Thumbnail upload support
- Poster upload support
- Persistent Docker volume for uploaded media

### Admin / Platform Management

- Admin account support
- Admin email configuration
- Email-related environment configuration
- Foundation for moderation and management features

---

## DevOps Features

This project includes a practical DevOps workflow suitable for portfolio demonstration.

### Docker

- Dockerized frontend
- Dockerized backend
- Docker Compose support
- Production Docker Compose setup
- Persistent Docker volume for uploaded media

### CI/CD Pipeline

GitHub Actions pipeline includes:

- frontend linting
- frontend build
- backend tests
- backend build
- Docker image build
- Docker image publishing to GitHub Container Registry
- automatic deployment to AWS EC2

### Docker Image Registry

Images are published to GitHub Container Registry:

```txt
ghcr.io/supunss/flux-frontend
ghcr.io/supunss/flux-backend
