# Flux Video Streaming Platform

A full-stack video streaming platform built with **Next.js**, **NestJS**, **TypeScript**, and **MongoDB** in a **monorepo** architecture.

Flux is designed as a modern streaming-style web application inspired by platforms like Netflix, while focusing on a **creator-oriented workflow** where authenticated users can upload, manage, and stream their own video content.

This project is built to showcase both:

- full-stack development
- secure backend architecture
- DevOps-ready project organization for future cloud deployment and scaling

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Quick Start](#quick-start)
- [Full Local Setup Guide](#full-local-setup-guide)
- [How to Run the Project](#how-to-run-the-project)
- [Project Map](#project-map)
- [Backend Architecture](#backend-architecture)
- [Frontend Architecture](#frontend-architecture)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Developer Workflow](#developer-workflow)
- [Security and Ownership Model](#security-and-ownership-model)
- [Completed Features](#completed-features)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [Portfolio Summary](#portfolio-summary)
- [License](#license)

---

## Overview

Flux Video Streaming Platform is a production-style full-stack application that combines:

- secure JWT authentication
- protected video uploads
- ownership-based creator APIs
- dynamic video playback
- modular backend architecture
- scalable monorepo organization

The goal is not just to build a nice-looking streaming UI, but to demonstrate realistic engineering practices such as:

- protected APIs
- backend-driven ownership validation
- file upload handling
- persistent database storage
- modular service design
- future-ready deployment structure

---

## Features

### Authentication

- User registration
- User login
- Password hashing with bcrypt
- JWT token generation
- JWT-based protected routes
- Protected creator-only features

### Video Platform

- Upload videos with thumbnails and metadata
- Browse videos on a streaming-style homepage
- Watch individual videos
- Increment video views
- Fetch all videos
- Fetch a single video by ID

### Creator Features

- Protected upload page
- Authenticated publishing flow
- Ownership stored on each video
- Secure `my videos` API for creators
- Backend-enforced creator ownership logic

### Media Handling

- Static serving of uploaded files
- Video and thumbnail upload flow
- Video metadata persistence in MongoDB

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Redux Toolkit
- Axios
- Framer Motion
- React Hook Form
- React Dropzone
- Zod

### Backend

- NestJS
- TypeScript
- MongoDB
- Mongoose
- Passport JWT
- bcrypt
- class-validator
- ValidationPipe

### Architecture Concepts

- Monorepo
- REST API design
- JWT authentication
- Protected routes
- Ownership-based authorization
- File upload handling
- Modular backend structure

---

## Monorepo Structure

```bash id="2l6s2v"
video-streaming-platform/
├── frontend/
└── backend/
```
