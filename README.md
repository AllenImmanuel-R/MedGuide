# 🏥 MedGuide - AI-Powered Medical Assistant

MedGuide is an intelligent healthcare platform that combines artificial intelligence with medical expertise to provide personalized health insights, medical report analysis, and clinic recommendations.

## ✨ Features

- 🤖 **AI Medical Assistant** - Chat with Gemini AI for health insights and recommendations
- 📄 **Medical Report Analysis** - Upload and analyze medical reports (PDF/Images) with OCR
- 🏥 **Clinic Finder** - Find nearby clinics and hospitals using GPS and OpenStreetMap
- 🔐 **Secure Authentication** - JWT-based user authentication with encrypted passwords
- 🌍 **Multi-language Support** - English and Tamil language support
- 📊 **Health Dashboard** - Track your medical reports and health data
- 🎯 **Specialization Matching** - Get clinic suggestions based on symptoms

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **React Router** - Navigation
- **Framer Motion** - Animations
- **i18next** - Internationalization

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **Tesseract.js** - OCR for medical reports
- **Google Gemini AI** - AI chat and analysis

### Additional Services
- **Google Gemini API** - AI capabilities
- **Overpass API** - Real-time clinic data from OpenStreetMap
- **Geolocation API** - User location services

## 📦 Installation

### Prerequisites

- Node.js 16+ and npm
- MongoDB (local or Atlas)
- Google Gemini API key ([Get here](https://makersuite.google.com/app/apikey))

### Local Development Setup

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd MedGuide
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
cd ..
```

4. **Set up environment variables**

Frontend `.env`:
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

Backend `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/medguide
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
CLIENT_URL=http://localhost:8080
GEMINI_API_KEY=your_gemini_api_key_here
```

5. **Start development servers**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
cd backend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:8080
- Backend API: http://localhost:5000/api/v1

## 🌐 Deployment

### Deploy to Render.com

This project is configured for easy deployment to Render.com using Blueprint.

**Quick Deploy:**
1. Push code to GitHub
2. Connect to Render.com
3. Click "New" → "Blueprint"
4. Select your repository
5. Configure environment variables (see [RENDER_SETUP.md](./RENDER_SETUP.md))

**Detailed Guides:**
- 📘 [Quick Setup Guide](./RENDER_SETUP.md) - 5-minute deployment
- 📗 [Complete Deployment Guide](./DEPLOYMENT.md) - Detailed instructions
- ✅ [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification

### Environment Variables Required

**Backend:**
- `NODE_ENV`, `PORT`, `MONGODB_URI`
- `JWT_SECRET`, `JWT_EXPIRE`, `JWT_COOKIE_EXPIRE`
- `CLIENT_URL`, `GEMINI_API_KEY`

**Frontend:**
- `VITE_API_URL`, `VITE_GEMINI_API_KEY`

## 📚 Project Structure

```
MedGuide/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── context/           # React context
│   └── i18n/              # Translations
├── backend/               # Backend source
│   ├── config/            # Configuration
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── server.js          # Entry point
├── public/                # Static assets
├── render.yaml            # Render deployment config
└── package.json           # Dependencies
```

## 🔧 Available Scripts

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
npm start            # Start production server
npm run dev          # Start with nodemon (auto-reload)
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- 📖 [Documentation](./DEPLOYMENT.md)
- 🐛 [Report Issues](https://github.com/your-repo/issues)
- 💬 [Discussions](https://github.com/your-repo/discussions)

## 🙏 Acknowledgments

- Google Gemini AI for AI capabilities
- OpenStreetMap for clinic data
- shadcn/ui for beautiful components
- Render.com for hosting platform

---

**Made with ❤️ for better healthcare accessibility**
