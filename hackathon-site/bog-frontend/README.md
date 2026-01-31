# BOG Frontend - React + Tailwind CSS

Modern React frontend for the Board of Grievances (ديوان المظالم) website.

## 🎯 Overview

This is a complete refactoring of the hackathon-site frontend using:
- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Vite** - Fast build tool and dev server

## 🚀 Features

- ✅ Full Arabic RTL support
- ✅ Responsive design
- ✅ Official BOG branding and colors
- ✅ IBM Plex Sans Arabic fonts
- ✅ Smooth routing with React Router
- ✅ WebRTC integration (iframe)
- ✅ President's message section
- ✅ Services showcase
- ✅ Modern component-based architecture

## 📁 Project Structure

```
bog-frontend/
├── public/
│   └── assets/          # Static assets (fonts, images, logo)
├── src/
│   ├── components/
│   │   ├── Header.jsx   # Navigation header
│   │   └── Footer.jsx   # Footer component
│   ├── pages/
│   │   ├── Home.jsx     # Home page
│   │   ├── Services.jsx # Services page with president section
│   │   ├── About.jsx    # About page
│   │   ├── Contact.jsx  # Contact page
│   │   └── MaeenSessions.jsx # WebRTC iframe integration
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind + custom styles
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🛠️ Installation

```bash
npm install
```

## 📦 Development

```bash
npm run dev
```

The app will run on http://localhost:8001 (or next available port)

## 🏗️ Build

```bash
npm run build
```

## 🎨 Design System

### Colors
- **Primary (Green)**: `#1b8354`
- **Secondary (Gold)**: `#b8903b`

### Typography
- **Font**: IBM Plex Sans Arabic
- **Direction**: RTL (Right-to-Left)

## 📄 Pages

1. **Home** (`/`) - Hero, quick services, about, stats
2. **Services** (`/services`) - All services + president's message
3. **About** (`/about`) - About BOG
4. **Contact** (`/contact`) - Contact information
5. **Maeen Sessions** (`/maeen-sessions`) - WebRTC integration

## 🔗 Integration

The WebRTC sessions are integrated via iframe pointing to `http://localhost:5173`
Make sure the WebRTC frontend is running separately.

## ⚠️ Important Notes

- **No Git Operations**: This refactor does NOT include git commits
- **Logic Preservation**: All business logic remains unchanged
- **Backend Intact**: No backend modifications
- **Same Functionality**: Exact same features, just modernized UI layer

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📝 License

© 2026 Board of Grievances - All Rights Reserved
