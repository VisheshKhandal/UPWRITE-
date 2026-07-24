# Upwrite Backend

This is the backend implementation for Upwrite, a knowledge-first social platform with articles, posts, follows, feeds, notifications, collections, search, and Cloudinary uploads.

## Why The Backend Is Structured This Way

- `routes` define API URLs.
- `validations` protect the API boundary.
- `controllers` handle HTTP input/output.
- `services` contain business rules.
- `models` define MongoDB collections and indexes.
- `middleware` handles reusable concerns like auth, errors, validation, rate limits, and uploads.

That separation is what keeps a startup backend maintainable as features grow.

## Setup

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

## Main API Groups

```txt
/api/v1/auth
/api/v1/users
/api/v1/profiles
/api/v1/follows
/api/v1/posts
/api/v1/articles
/api/v1/comments
/api/v1/bookmarks
/api/v1/collections
/api/v1/feed
/api/v1/notifications
/api/v1/uploads
/api/v1/search
```

## Production Notes

- Use MongoDB Atlas in production.
- Use strong JWT secrets.
- Set `CLIENT_ORIGIN` to your frontend URL.
- Set Cloudinary credentials before using uploads.
- Set `EMAIL_MODE`, `RESEND_API_KEY`, `ADMIN_EMAIL`, and `REPLY_TO_EMAIL` before enabling Contact & Feedback emails.
- Keep refresh tokens in HTTP-only cookies, not localStorage.
- Add Redis later for feed caching, rate limiting, and background jobs.

## Contact & Feedback

Submissions are handled through `/api/v1/contact/submissions` and follow the same route -> validation -> controller -> service -> model flow as the rest of Upwrite.

Required email configuration:

Development mode uses Resend's test sender automatically. Replies go to your Gmail through `REPLY_TO_EMAIL`.

```txt
EMAIL_MODE=development
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_NAME=Upwrite
EMAIL_FROM_ADDRESS=onboarding@resend.dev
REPLY_TO_EMAIL=you@gmail.com
ADMIN_EMAIL=you@gmail.com
```

Production mode uses your verified Resend domain. No code changes are required; only environment variables change.

```txt
EMAIL_MODE=production
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM_NAME=Upwrite
EMAIL_FROM_ADDRESS=hello@your-verified-domain.com
REPLY_TO_EMAIL=you@gmail.com
ADMIN_EMAIL=you@gmail.com
```

`EMAIL_FROM_ADDRESS` must be a Resend-approved sender. Do not use a personal Gmail/Yahoo/Outlook address as the sender; Resend will reject it because those domains are not verified for your account. In production mode, the backend refuses to start with a personal email sender so the failure is caught early.

`REPLY_TO_EMAIL` can be your Gmail. This means emails appear from Upwrite, but pressing Reply opens a message to your Gmail.

Resend's `onboarding@resend.dev` sender is useful for local testing, but it can be limited by Resend account rules. To send reliably to arbitrary users, verify a real domain in Resend and switch `EMAIL_MODE` to `production`.

MongoDB remains the source of truth. If email delivery fails after a submission is saved, the request still succeeds and the submission stores the email delivery failure for later review.
