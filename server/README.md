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
- Keep refresh tokens in HTTP-only cookies, not localStorage.
- Add Redis later for feed caching, rate limiting, and background jobs.
