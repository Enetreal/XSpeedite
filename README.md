# QMS Change Control Application

A comprehensive Quality Management System (QMS) Change Control application that automates the change request process, approval workflows, and document management.

## Features

### Core Functionality

- **Automatic Date Generation**: Captures request dates automatically
- **Questionnaire System**: Automated forms for change determination
- **Approval Workflow**: Multi-stage approval process (HOD → QA Correspondent → CCT)
- **Change Control Numbers**: Automatic generation and assignment
- **Action Plan Management**: Comprehensive change planning and tracking
- **Evidence Management**: File upload and document management
- **Effectiveness Checks**: Post-implementation validation
- **Notifications**: Automated reminders and alerts
- **Timeline Management**: Extension requests and approvals
- **Audit Trail**: Complete activity logging

### User Roles

- **Change Requester**: Initiates and manages change requests
- **Head of Department (HOD)**: First-level approval
- **QA Correspondent**: Quality assurance review and effectiveness checks
- **Change Control Team (CCT)**: Final approval and oversight
- **Admin**: System administration and user management

### Technical Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React.js with Material-UI
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based with role-based access control
- **File Storage**: Multer for file uploads
- **Notifications**: Email notifications with Nodemailer

## Project Structure

```text
qms-change-control/
├── backend/                 # Node.js API server
│   ├── config/             # Database and app configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── uploads/           # File uploads directory
├── frontend/              # React.js application
│   ├── public/            # Static files
│   └── src/               # React source code
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       ├── hooks/         # Custom React hooks
│       ├── context/       # React context
│       └── utils/         # Utility functions
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd qms-change-control


1. Install dependencies

```bash
npm run install-all
```

Set up environment variables

```bash
# Create .env file in backend directory
cp backend/.env.example backend/.env
# Edit the .env file with your configuration
```

Start the development servers

```bash
npm run dev
```

This will start both the backend server (<http://localhost:5000>) and the frontend development server (<http://localhost:3000>).

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Change Request Endpoints

- `GET /api/change-requests` - Get all change requests
- `POST /api/change-requests` - Create new change request
- `GET /api/change-requests/:id` - Get specific change request
- `PUT /api/change-requests/:id` - Update change request
- `POST /api/change-requests/:id/approve` - Approve change request
- `POST /api/change-requests/:id/reject` - Reject change request

### File Upload Endpoints

- `POST /api/files/upload` - Upload evidence files
- `GET /api/files/:id` - Download file

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/qms_change_control
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

## Testing

Run the test suite:

```bash
npm test
```

## Deployment

### Using Docker

```bash
docker build -t qms-change-control .
docker run -p 5000:5000 qms-change-control
```

### Manual Deployment

1. Build the frontend

```bash
cd frontend && npm run build
```

Set production environment variables
Start the production server

```bash
cd backend && npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
