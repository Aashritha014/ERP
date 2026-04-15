# Student ERP System

## Overview

A full-featured web-based Student ERP System with role-based access for Students, Admins, and Faculty. Built as a pnpm monorepo with a React + Vite frontend and Node.js/Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/student-erp)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Modules

### Admission Management
- Students can register and submit admission applications (public /apply route)
- Admin can review, approve, or reject applications
- On approval, student is automatically added to the central database with a unique Student UID

### Student Database
- Central repository of all student records
- Each student has a unique UID (e.g., STU20240001)
- Accessible across all modules

### Fee Management
- Admin can create fee records and update payment status
- Digital receipts with receipt numbers are auto-generated on payment
- Students can view their fees and download receipt details

### Hostel Management
- Admin can allocate hostel rooms to students
- Real-time room availability tracking
- Students can view their current allotment

### Examination Records
- Faculty can add and update exam results
- Grades computed automatically (O, A+, A, B+, B, C, F)
- Students can view academic results by semester
- Admin and faculty dashboards show pass rates by subject

## User Roles

### Admin Credentials
- Email: admin@erp.edu
- Password: admin123

### Faculty Credentials
- Email: faculty@erp.edu
- Password: faculty123

### Student Credentials
- Email: student@erp.edu
- Password: student123

## Architecture

```
artifacts/
  api-server/     # Express API server
    src/routes/   # auth, admissions, students, fees, hostel, exams, faculty, dashboard
  student-erp/    # React + Vite frontend
    src/pages/    # student/, admin/, faculty/ role-based pages
lib/
  api-spec/       # OpenAPI spec (openapi.yaml)
  api-client-react/ # Generated React Query hooks
  api-zod/        # Generated Zod schemas
  db/             # Drizzle ORM + PostgreSQL
    src/schema/   # users, admissions, students, faculty, fees, hostel, exams
```

## DB Schema

- **users**: id, name, email, password, role (admin/student/faculty), studentId?, facultyId?
- **admissions**: id, name, email, phone, dateOfBirth, gender, address, course, department, previousSchool, previousMarks, status (pending/approved/rejected), remarks
- **students**: id, studentUid, name, email, phone, ..., course, department, semester, rollNumber, enrollmentYear, admissionId
- **faculty**: id, name, email, phone, department, designation, subjects[]
- **fees**: id, studentId, feeType (tuition/hostel/exam/library/other), amount, dueDate, paidDate?, status (paid/pending/overdue), receiptNumber?, semester, academicYear
- **hostel_rooms**: id, roomNumber, block, floor, capacity, occupied, type (single/double/triple), amenities[]
- **hostel_allocations**: id, studentId, roomId, allocatedDate, vacatedDate?, active
- **exam_results**: id, studentId, subject, subjectCode, semester, academicYear, internalMarks, externalMarks, totalMarks, maxMarks, grade, result (pass/fail/absent), facultyId?
