This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Run with PM2

This project includes `pm2` in dependencies so you can run it as a managed process.

1. Install dependencies:

```bash
npm install
```

2. Build the app:

```bash
npm run build
```

3. Jalankan dengan PM2:

```bash
npm run pm2:start
```

Aplikasi akan berjalan di **http://localhost:3067**

4. Periksa status proses:

```bash
pm2 status
# atau
npm run pm2:status  # jika ditambahkan di package.json
```

5. Lihat logs aplikasi:

```bash
pm2 logs lms-page
```

6. Hentikan aplikasi jika perlu:

```bash
npm run pm2:stop
```

7. Restart aplikasi:

```bash
npm run pm2:restart
```

8. Hapus proses dari PM2:

```bash
npm run pm2:delete
```

**Catatan:** Konfigurasi PM2 ada di file `ecosystem.config.js` dengan PORT=3067 dan wrapper script di `start-pm2.sh`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
