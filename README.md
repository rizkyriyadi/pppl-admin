# Admin Panel - Ujian Online System

Admin panel untuk mengelola sistem ujian online SDN Pasir Gunung Selatan 1.

## Features

### Authentication
- Login dengan email dan password
- Role-based access control (admin & superadmin only)
- Auto-redirect untuk non-admin users

### Dashboard
- Overview statistics (total students, exams, attempts, average score)
- Recent exam attempts table
- Real-time data dari Firestore

### Exams Management
- Create, Read, Update, Delete exams
- Set exam details (title, subject, grade, duration, passing score)
- Activate/deactivate exams
- Direct link ke questions management

### Questions Management
- Select exam untuk manage questions
- Add, edit, delete questions
- Multiple choice dengan 4 options
- Set difficulty level (easy, medium, hard)
- Add explanations untuk jawaban
- Visual indicator untuk correct answer

### Students Management
- View all student accounts
- Add new students dengan auto-generated email
- Edit student information (name, class, NISN)
- Delete student accounts
- Email format: `{NISN}@student.sdnpgs1.sch.id`

### Results Viewing
- View all exam attempts
- Filter by class, exam, and status
- Statistics: average score, pass rate, total attempts
- Detailed information per attempt

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth

## Getting Started

### Prerequisites

```bash
Node.js 18+ installed
Firebase project dengan Firestore enabled
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
File `.env.local` sudah configured dengan Firebase project yang sama dengan student app.

3. Run development server:
```bash
npm run dev
```

4. Open browser:
```
http://localhost:3000
```

## Default Admin Credentials

```
Email: admin@sdnpgs1.sch.id
Password: admin123
```

**Note**: Pastikan admin account sudah dibuat di Firebase (bisa via seeding script di folder `ujian`).

## Project Structure

```
admin-panel/
├── app/
│   ├── components/
│   │   ├── ProtectedRoute.tsx    # HOC untuk protected routes
│   │   └── Sidebar.tsx            # Navigation sidebar
│   ├── dashboard/                 # Dashboard page
│   ├── exams/                     # Exams management
│   ├── questions/                 # Questions management
│   ├── students/                  # Students management
│   ├── results/                   # Results viewing
│   ├── login/                     # Login page
│   ├── layout.tsx                 # Root layout dengan AuthProvider
│   └── page.tsx                   # Auto-redirect page
├── lib/
│   ├── firebase.ts               # Firebase configuration
│   ├── AuthContext.tsx           # Auth state management
│   └── types.ts                  # TypeScript interfaces
└── .env.local                    # Environment variables
```

## Design Principles

### Clean & Professional
- No emojis atau emoticons
- Warna professional: Blue (#2563eb), Slate grays
- Clean spacing dan typography
- Minimalist interface

### User-Friendly
- Clear navigation dengan sidebar
- Visual feedback untuk actions
- Confirmation dialogs untuk delete operations
- Helpful error messages
- Loading states

### Responsive
- Mobile-friendly layout
- Responsive tables
- Touch-friendly buttons

## Database Integration

Admin panel terintegrasi penuh dengan Firestore collections:

- `users` - Full CRUD untuk students, read-only untuk admins
- `exams` - Full CRUD operations
- `questions` - Full CRUD operations, linked ke exams
- `examAttempts` - Read-only, untuk viewing results
- `analytics` - Future: untuk AI insights

## Security

- Protected routes dengan ProtectedRoute HOC
- Role checking di AuthContext
- Server-side validation via Firestore rules
- No direct access ke Firebase config di client

## Future Enhancements

Potential features untuk development selanjutnya:

1. **Analytics Dashboard**
   - Charts dan graphs untuk exam performance
   - AI-powered insights dengan Gemini API
   - Per-question analytics

2. **Bulk Operations**
   - Import students via CSV
   - Bulk exam creation
   - Export results ke Excel

3. **Advanced Features**
   - Schedule exams untuk specific date/time
   - Question bank untuk reuse across exams
   - Image upload untuk questions
   - Rich text editor untuk explanations

4. **Notifications**
   - Email notifications ke students
   - Exam reminders
   - Result notifications

## Troubleshooting

### "Access denied" saat login
- Pastikan user role di Firestore adalah `admin` atau `superadmin`
- Check Firebase Authentication untuk user tersebut

### Data tidak muncul
- Check Firebase Console untuk Firestore data
- Verify .env.local configuration
- Check browser console untuk errors

### Build errors
- Delete .next folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`

## Deployment

### Deploy ke Vercel

1. Push ke GitHub:
```bash
git add .
git commit -m "Complete admin panel"
git push
```

2. Import project di Vercel:
- Go to vercel.com
- Import GitHub repository
- Add environment variables dari .env.local
- Deploy

3. Configure domain (optional):
- Custom domain di Vercel settings
- Update Firebase Auth authorized domains

## Support

Untuk issues atau questions, check:
- Firebase Console untuk database issues
- Browser DevTools console untuk client errors
- Server logs untuk API errors

---

**Built with**: Next.js 15 + Firebase + Tailwind CSS
**For**: SDN Pasir Gunung Selatan 1
**Version**: 1.0.0
