# EQUIPORA — Client Application

**Rent Smarter. Build Better.**

EQUIPORA is a modern equipment rental platform that connects customers who need equipment with equipment owners who list and manage rental inventory.

## Live Application

- **Frontend:** https://equipora-client-gules.vercel.app/
- **Backend API:** https://equipora-server-chi.vercel.app/

## Features

### Public Experience
- Responsive landing page.
- Browse equipment and view equipment details.
- Equipment categories and rental information.
- Search, filtering, sorting, and pagination where enabled.

### Authentication
- Better Auth email/password authentication.
- Google and GitHub OAuth integration.
- Session-aware application experience.
- Role-based access for customers, equipment owners, and administrators.

### Customer Dashboard
- Create equipment rental bookings.
- View booking history.
- Track booking and payment statuses.
- Manage favorite equipment.
- Manage profile information.
- Start Stripe Checkout for eligible bookings.
- Check payment status after returning from checkout.

### Owner Dashboard
- Add and manage equipment listings.
- Review customer booking requests.
- Approve or reject bookings.
- Manage booking review deadlines.
- Extend review deadlines.
- View rental and booking information.

### Admin Dashboard
- Platform management.
- Manage users, equipment, and bookings.
- Monitor payment records.
- Initiate supported refund workflows.
- View financial and operational information.

## Technology Stack

- Next.js 16 — App Router
- React
- TypeScript
- Tailwind CSS
- Reusable UI components
- shadcn/ui-style components
- Better Auth
- JWT authentication
- Stripe Checkout
- Fetch API
- Vercel

## Getting Started

### Clone Repository

```bash
git clone <YOUR_CLIENT_REPOSITORY_URL>
cd equipora-client
```

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create `.env.local` in the project root.

For local development:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

For production deployment, configure this in Vercel:

```env
NEXT_PUBLIC_API_URL=https://equipora-server-chi.vercel.app
```

**Note:** Never commit `.env.local` or expose secret keys through `NEXT_PUBLIC_` variables.

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000.

Restart the development server after changing environment variables.

## Backend Integration

The application communicates with the backend through a shared API utility.

- `src/lib/api.ts`
- `src/lib/auth-client.ts`

Authenticated requests obtain a JWT through Better Auth and send it using the Bearer authorization header.

## Payment Workflow

1. Customer creates a booking.
2. Owner reviews and approves the booking.
3. Customer initiates payment.
4. Backend creates a Stripe Checkout Session.
5. Customer completes payment through Stripe.
6. Stripe sends a webhook event to the backend.
7. Backend verifies the payment and updates booking/payment records.
8. Frontend retrieves the verified payment status.

The frontend redirect alone is not proof of payment. The backend's verified payment state is authoritative.

## Build

```bash
npm run build
npm run start
```

## Deployment

The frontend is deployed using Vercel.

Before deployment:

1. Configure the production API URL.
2. Configure backend CORS and Better Auth trusted origins.
3. Configure Google and GitHub OAuth callback URLs.
4. Verify Stripe success and cancel URLs.
5. Run a production build.

## Security

- Never commit credentials or environment files.
- Do not expose Stripe secret keys.
- Do not rely exclusively on frontend route protection.
- Backend authorization must protect all restricted operations.
- Use HTTPS in production.

## Related Repository

**Backend:** `<YOUR_SERVER_REPOSITORY_URL>`

---

**EQUIPORA — Equipment Rental Platform**

*Rent Smarter. Build Better.*
