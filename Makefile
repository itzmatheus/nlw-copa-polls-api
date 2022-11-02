run:
	npm run dev

migrate-dev:
	npx prisma migrate dev

prisma-web:
	npx prisma studio

generator-erd:
	npx prisma generate

seed-db:
	npx prisma db seed