# --------- builder -----------
FROM node:20.14.0-alpine AS builder
WORKDIR /app

ARG proxy
ARG base_url

# copy common node_modules and one project node_modules
RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

COPY . .

RUN apk add --no-cache libc6-compat && npm install -g pnpm@9.4.0
ENV NEXT_PUBLIC_BASE_URL=$base_url
RUN pnpm install --frozen-lockfile
RUN pnpm build

# --------- runner -----------
FROM node:20.14.0-alpine AS runner
WORKDIR /app

ARG proxy
ARG base_url

# create user and use it
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN [ -z "$proxy" ] || sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories

RUN apk add --no-cache curl ca-certificates \
  && update-ca-certificates

# copy running files
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static .next/static
# copy server chunks
COPY --from=builder --chown=nextjs:nodejs /app/.next/server/chunks .next/server/chunks

# copy package.json to version file
COPY --from=builder /app/package.json ./package.json 

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV NEXT_PUBLIC_BASE_URL=$base_url

EXPOSE 3000

USER nextjs

ENV serverPath=server.js

ENTRYPOINT ["sh","-c","node ${serverPath}"]

