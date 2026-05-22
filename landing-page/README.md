# SpendSync Landing Page

A modern, premium SaaS landing page for SpendSync - Expense & Reimbursement Management System.

## 🎨 Design Features

- **Dark futuristic aesthetic** with navy background (#030712, #020617)
- **Glassmorphism effects** on navbar and cards
- **Gradient glows** with cyan (#22d3ee), teal (#14b8a6), and lime (#84cc16) accents
- **Smooth animations** powered by Framer Motion
- **Fully responsive** design (mobile, tablet, desktop)
- **Premium SaaS feel** with floating cards and animated elements

## 🚀 Tech Stack

- **React** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Heroicons** - Icon library

## 📁 Project Structure

```
landing-page/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx          # Sticky glassmorphism navbar
│   │   ├── Hero.jsx            # Hero section with animated background
│   │   ├── HeroImage.jsx       # Floating dashboard visualization
│   │   ├── Features.jsx        # 6 feature cards
│   │   ├── Modules.jsx         # 6 module cards
│   │   ├── Workflow.jsx        # 4-step workflow timeline
│   │   ├── Roles.jsx           # 4 role-based access cards
│   │   ├── TechStack.jsx       # Technology stack grid
│   │   ├── CTA.jsx             # Call-to-action section
│   │   ├── Footer.jsx          # Footer with branding
│   │   └── LandingPage.jsx     # Main page component
│   ├── main.jsx                # App entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 🎯 Sections

### 1. **Navbar**
- Sticky floating navbar with glassmorphism
- Smooth scroll navigation
- Mobile-responsive menu
- "Sign in" and "Open app" CTAs

### 2. **Hero Section**
- Large bold headline with gradient text
- Animated grid background
- Radial gradient glows
- Two CTA buttons
- Stats row (70% faster, JWT+RBAC, AI-assisted)

### 3. **Hero Image**
- Futuristic dashboard visualization
- Floating animated cards
- Pending claims and approved stats
- 3D chart mockup with glow effects

### 4. **Features**
- 6 feature cards with icons
- Smart expense capture
- Multi-level approvals
- Reimbursement engine
- Reports & analytics
- Enterprise security
- Role-based access

### 5. **Modules**
- 6 numbered module cards
- User Management
- Expense Management
- Approval Workflow
- Reimbursement
- Reports
- Security

### 6. **Workflow**
- 4-step connected timeline
- Submit → Route → Approve → Reimburse
- Animated icons and descriptions

### 7. **Roles**
- 4 role cards (Admin, Employee, Finance, Auditor)
- Responsibilities and permissions
- Hover glow effects

### 8. **Tech Stack**
- 6 technology cards
- ASP.NET Core, React, SQL Server, JWT, LLM, REST APIs
- Premium grid layout

### 9. **CTA Section**
- Large glass card with gradient background
- "Ready to sync your spend?" headline
- Two CTA buttons (Get started free, Book a demo)

### 10. **Footer**
- SpendSync branding
- Copyright and tagline

## 🛠️ Installation

```bash
cd landing-page
npm install
```

## 🚀 Development

```bash
npm run dev
```

The landing page will be available at **http://localhost:3001**

## 📦 Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background Dark | `#030712` | Main background |
| Background Darker | `#020617` | Sections |
| Cyan | `#22d3ee` | Primary accent |
| Teal | `#14b8a6` | Secondary accent |
| Lime | `#84cc16` | Highlight accent |
| Slate 900 | `#0f172a` | Cards |
| Slate 800 | `#1e293b` | Borders |
| White | `#ffffff` | Text |
| Slate 300 | `#cbd5e1` | Secondary text |

## ✨ Animations

All animations are powered by **Framer Motion**:

- **Fade up on scroll** - Section reveals
- **Stagger animations** - Sequential card reveals
- **Hover scale** - Interactive elements
- **Glow pulse** - Background gradients
- **Floating cards** - Hero image section
- **Smooth transitions** - All interactions

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🔗 Links

- **Main App**: http://localhost:3000
- **Landing Page**: http://localhost:3001
- **Backend API**: http://localhost:5256

## 📝 Notes

- All components are production-ready
- No placeholder lorem ipsum text
- Fully accessible with semantic HTML
- Optimized for performance
- Clean, maintainable code structure

## 🎯 Features Implemented

✅ Glassmorphism navbar with smooth scroll  
✅ Animated hero section with gradient text  
✅ Floating dashboard visualization  
✅ 6 feature cards with hover effects  
✅ 6 module cards with numbered badges  
✅ 4-step workflow timeline  
✅ 4 role-based access cards  
✅ Technology stack grid  
✅ Large CTA section with glass effect  
✅ Professional footer  
✅ Fully responsive design  
✅ Framer Motion animations  
✅ Premium SaaS aesthetic  

## 🚀 Deployment

To deploy to production:

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting service
3. Configure your domain to point to the landing page
4. Update the CTA links to your production URLs

## 📄 License

This project is part of the SpendSync Expense & Reimbursement Management System.

---

**Built with ❤️ for modern finance teams**
