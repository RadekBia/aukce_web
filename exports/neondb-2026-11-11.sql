--
-- PostgreSQL database dump
--

\restrict 5BWQilF4g0XT9oGqtqfCaivgeIOcXMKKaiJbTJcnnKwO1G2lNmbKeNnI2lP6jFx

-- Dumped from database version 18.6 (ac70818)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-1.pgdg24.04+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Bid" DROP CONSTRAINT IF EXISTS "Bid_auctionId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuctionImage" DROP CONSTRAINT IF EXISTS "AuctionImage_auctionId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS "session_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_userId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS "member_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_organizationId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS "invitation_inviterId_fkey";
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS "account_userId_fkey";
DROP INDEX IF EXISTS public."Bid_auctionId_amount_idx";
DROP INDEX IF EXISTS public."Auction_status_endsAt_idx";
DROP INDEX IF EXISTS public."Auction_category_idx";
DROP INDEX IF EXISTS public."AuctionImage_auctionId_sortOrder_idx";
DROP INDEX IF EXISTS neon_auth.verification_identifier_idx;
DROP INDEX IF EXISTS neon_auth."session_userId_idx";
DROP INDEX IF EXISTS neon_auth."member_userId_idx";
DROP INDEX IF EXISTS neon_auth."member_organizationId_idx";
DROP INDEX IF EXISTS neon_auth."invitation_organizationId_idx";
DROP INDEX IF EXISTS neon_auth.invitation_email_idx;
DROP INDEX IF EXISTS neon_auth."account_userId_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Bid" DROP CONSTRAINT IF EXISTS "Bid_pkey";
ALTER TABLE IF EXISTS ONLY public."Auction" DROP CONSTRAINT IF EXISTS "Auction_pkey";
ALTER TABLE IF EXISTS ONLY public."AuctionImage" DROP CONSTRAINT IF EXISTS "AuctionImage_pkey";
ALTER TABLE IF EXISTS ONLY neon_auth.verification DROP CONSTRAINT IF EXISTS verification_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth."user" DROP CONSTRAINT IF EXISTS user_email_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_token_key;
ALTER TABLE IF EXISTS ONLY neon_auth.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.project_config DROP CONSTRAINT IF EXISTS project_config_endpoint_id_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_slug_key;
ALTER TABLE IF EXISTS ONLY neon_auth.organization DROP CONSTRAINT IF EXISTS organization_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.member DROP CONSTRAINT IF EXISTS member_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.jwks DROP CONSTRAINT IF EXISTS jwks_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.invitation DROP CONSTRAINT IF EXISTS invitation_pkey;
ALTER TABLE IF EXISTS ONLY neon_auth.account DROP CONSTRAINT IF EXISTS account_pkey;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."Bid";
DROP TABLE IF EXISTS public."AuctionImage";
DROP TABLE IF EXISTS public."Auction";
DROP TABLE IF EXISTS neon_auth.verification;
DROP TABLE IF EXISTS neon_auth."user";
DROP TABLE IF EXISTS neon_auth.session;
DROP TABLE IF EXISTS neon_auth.project_config;
DROP TABLE IF EXISTS neon_auth.organization;
DROP TABLE IF EXISTS neon_auth.member;
DROP TABLE IF EXISTS neon_auth.jwks;
DROP TABLE IF EXISTS neon_auth.invitation;
DROP TABLE IF EXISTS neon_auth.account;
DROP TYPE IF EXISTS public."AuctionStatus";
DROP SCHEMA IF EXISTS neon_auth;
--
-- Name: neon_auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA neon_auth;


--
-- Name: AuctionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuctionStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'ENDED',
    'CANCELLED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.account (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "accountId" text NOT NULL,
    "providerId" text NOT NULL,
    "userId" uuid NOT NULL,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp with time zone,
    "refreshTokenExpiresAt" timestamp with time zone,
    scope text,
    password text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: invitation; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.invitation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    email text NOT NULL,
    role text,
    status text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "inviterId" uuid NOT NULL
);


--
-- Name: jwks; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.jwks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "expiresAt" timestamp with time zone,
    alg text,
    crv text
);


--
-- Name: member; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.member (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "organizationId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    role text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL
);


--
-- Name: organization; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.organization (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    "createdAt" timestamp with time zone NOT NULL,
    metadata text
);


--
-- Name: project_config; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.project_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    endpoint_id text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    trusted_origins jsonb NOT NULL,
    social_providers jsonb NOT NULL,
    email_provider jsonb,
    email_and_password jsonb,
    allow_localhost boolean NOT NULL,
    plugin_configs jsonb,
    webhook_config jsonb,
    auth_logs_export_enabled boolean DEFAULT false
);


--
-- Name: session; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.session (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "ipAddress" text,
    "userAgent" text,
    "userId" uuid NOT NULL,
    "impersonatedBy" text,
    "activeOrganizationId" text
);


--
-- Name: user; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "emailVerified" boolean NOT NULL,
    image text,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role text,
    banned boolean,
    "banReason" text,
    "banExpires" timestamp with time zone
);


--
-- Name: verification; Type: TABLE; Schema: neon_auth; Owner: -
--

CREATE TABLE neon_auth.verification (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier text NOT NULL,
    value text NOT NULL,
    "expiresAt" timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Auction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Auction" (
    id text NOT NULL,
    title character varying(120) NOT NULL,
    description text NOT NULL,
    category character varying(60) NOT NULL,
    condition character varying(40) NOT NULL,
    "imageUrl" text,
    "startingPrice" integer NOT NULL,
    "currentPrice" integer NOT NULL,
    status public."AuctionStatus" DEFAULT 'ACTIVE'::public."AuctionStatus" NOT NULL,
    "startsAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endsAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "imageUrls" text[] DEFAULT ARRAY[]::text[],
    "sellerFirstName" character varying(40) DEFAULT 'Neuvedeno'::character varying NOT NULL,
    "sellerLastName" character varying(40) DEFAULT ''::character varying NOT NULL,
    "winnerFirstName" character varying(40),
    "winnerLastName" character varying(40)
);


--
-- Name: AuctionImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuctionImage" (
    id text NOT NULL,
    "auctionId" text,
    "mimeType" character varying(64) NOT NULL,
    data bytea NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Bid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Bid" (
    id text NOT NULL,
    "auctionId" text NOT NULL,
    "bidderId" text NOT NULL,
    amount integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: account; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.account (id, "accountId", "providerId", "userId", "accessToken", "refreshToken", "idToken", "accessTokenExpiresAt", "refreshTokenExpiresAt", scope, password, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: invitation; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.invitation (id, "organizationId", email, role, status, "expiresAt", "createdAt", "inviterId") FROM stdin;
\.


--
-- Data for Name: jwks; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.jwks (id, "publicKey", "privateKey", "createdAt", "expiresAt", alg, crv) FROM stdin;
\.


--
-- Data for Name: member; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.member (id, "organizationId", "userId", role, "createdAt") FROM stdin;
\.


--
-- Data for Name: organization; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.organization (id, name, slug, logo, "createdAt", metadata) FROM stdin;
\.


--
-- Data for Name: project_config; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.project_config (id, name, endpoint_id, created_at, updated_at, trusted_origins, social_providers, email_provider, email_and_password, allow_localhost, plugin_configs, webhook_config, auth_logs_export_enabled) FROM stdin;
ee6255d8-9acb-49f9-924b-41645f6be489	neon-violet-cloud	ep-shiny-bread-b9ufrgqa	2026-10-21 18:54:38.664+00	2026-10-21 18:54:38.664+00	[]	[{"id": "google", "isShared": true}]	{"type": "shared"}	{"enabled": true, "disableSignUp": false, "emailVerificationMethod": "otp", "requireEmailVerification": false, "autoSignInAfterVerification": true, "sendVerificationEmailOnSignIn": false, "sendVerificationEmailOnSignUp": false}	t	{"magicLink": {"config": {"expiresIn": 5, "disableSignUp": false}, "enabled": false}, "phoneNumber": {"config": {"otp_expires_in": 300}, "enabled": false}, "organization": {"config": {"creatorRole": "owner", "membershipLimit": 100, "organizationLimit": 10, "sendInvitationEmail": false}, "enabled": true}, "oauthProvider": {"config": {"mcp": {"resource": "", "dynamicRegistration": false, "clientIdMetadataDocuments": true}, "loginPage": "", "resources": [], "consentPage": ""}, "enabled": false}}	{"enabled": false, "enabledEvents": [], "timeoutSeconds": 5}	f
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.session (id, "expiresAt", token, "createdAt", "updatedAt", "ipAddress", "userAgent", "userId", "impersonatedBy", "activeOrganizationId") FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt", role, banned, "banReason", "banExpires") FROM stdin;
\.


--
-- Data for Name: verification; Type: TABLE DATA; Schema: neon_auth; Owner: -
--

COPY neon_auth.verification (id, identifier, value, "expiresAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Auction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Auction" (id, title, description, category, condition, "imageUrl", "startingPrice", "currentPrice", status, "startsAt", "endsAt", "createdAt", "updatedAt", "imageUrls", "sellerFirstName", "sellerLastName", "winnerFirstName", "winnerLastName") FROM stdin;
\.


--
-- Data for Name: AuctionImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuctionImage" (id, "auctionId", "mimeType", data, "sortOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: Bid; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Bid" (id, "auctionId", "bidderId", amount, "createdAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7f512c40-f28b-4ab7-bf27-95e26be436a1	23f611273515954e89e205d8077dc2bc54350f60f11a33ffdd46d0be7ce8596d	2026-10-21 19:54:52.678408+00	20261021081056_init	\N	\N	2026-10-21 19:54:52.119604+00	1
fd9bf1f3-fb84-464b-988e-7385e4d64d90	3f7ab48e465c43158f124c717faf5cdb3981280291d9baee1f50904e61a0b29d	2026-10-22 10:05:43.446075+00	20261022095000_auction_image_urls	\N	\N	2026-10-22 10:05:42.957347+00	1
2f086a7e-f067-4b80-ae3a-89cb92e2171f	ca20ad127bb230cc1b005487c4f96f74522c626968d6d28357bc3416fdca71d1	2026-10-22 10:22:43.022813+00	20261022102000_auction_image_bytes	\N	\N	2026-10-22 10:22:42.443722+00	1
2afeb49e-77e9-424a-84b0-14be395531c6	198ddd3de8ea732266c4c630faba2d7c50b5c73bdfc15f6a247d3c7e4fce9867	2026-10-23 10:04:00.588326+00	20261023100000_seller_and_fixed_end	\N	\N	2026-10-23 10:04:00.037717+00	1
3fe939fb-abfa-4b00-a066-30862bddd7ab	3af56a0d4f5ccb8a33b358897c3efbf989ea5d29cc45b8884aeac231d9ead791	2026-10-23 11:07:51.18924+00	20261023120000_auction_winner	\N	\N	2026-10-23 11:07:50.706402+00	1
\.


--
-- Name: account account_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT account_pkey PRIMARY KEY (id);


--
-- Name: invitation invitation_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT invitation_pkey PRIMARY KEY (id);


--
-- Name: jwks jwks_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.jwks
    ADD CONSTRAINT jwks_pkey PRIMARY KEY (id);


--
-- Name: member member_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_pkey PRIMARY KEY (id);


--
-- Name: organization organization_slug_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.organization
    ADD CONSTRAINT organization_slug_key UNIQUE (slug);


--
-- Name: project_config project_config_endpoint_id_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_endpoint_id_key UNIQUE (endpoint_id);


--
-- Name: project_config project_config_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.project_config
    ADD CONSTRAINT project_config_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (id);


--
-- Name: session session_token_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT session_token_key UNIQUE (token);


--
-- Name: user user_email_key; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_email_key UNIQUE (email);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: verification verification_pkey; Type: CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.verification
    ADD CONSTRAINT verification_pkey PRIMARY KEY (id);


--
-- Name: AuctionImage AuctionImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuctionImage"
    ADD CONSTRAINT "AuctionImage_pkey" PRIMARY KEY (id);


--
-- Name: Auction Auction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auction"
    ADD CONSTRAINT "Auction_pkey" PRIMARY KEY (id);


--
-- Name: Bid Bid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: account_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "account_userId_idx" ON neon_auth.account USING btree ("userId");


--
-- Name: invitation_email_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX invitation_email_idx ON neon_auth.invitation USING btree (email);


--
-- Name: invitation_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "invitation_organizationId_idx" ON neon_auth.invitation USING btree ("organizationId");


--
-- Name: member_organizationId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_organizationId_idx" ON neon_auth.member USING btree ("organizationId");


--
-- Name: member_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "member_userId_idx" ON neon_auth.member USING btree ("userId");


--
-- Name: session_userId_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX "session_userId_idx" ON neon_auth.session USING btree ("userId");


--
-- Name: verification_identifier_idx; Type: INDEX; Schema: neon_auth; Owner: -
--

CREATE INDEX verification_identifier_idx ON neon_auth.verification USING btree (identifier);


--
-- Name: AuctionImage_auctionId_sortOrder_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuctionImage_auctionId_sortOrder_idx" ON public."AuctionImage" USING btree ("auctionId", "sortOrder");


--
-- Name: Auction_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Auction_category_idx" ON public."Auction" USING btree (category);


--
-- Name: Auction_status_endsAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Auction_status_endsAt_idx" ON public."Auction" USING btree (status, "endsAt");


--
-- Name: Bid_auctionId_amount_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bid_auctionId_amount_idx" ON public."Bid" USING btree ("auctionId", amount);


--
-- Name: account account_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.account
    ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_inviterId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: invitation invitation_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.invitation
    ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_organizationId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES neon_auth.organization(id) ON DELETE CASCADE;


--
-- Name: member member_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.member
    ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: session session_userId_fkey; Type: FK CONSTRAINT; Schema: neon_auth; Owner: -
--

ALTER TABLE ONLY neon_auth.session
    ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES neon_auth."user"(id) ON DELETE CASCADE;


--
-- Name: AuctionImage AuctionImage_auctionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuctionImage"
    ADD CONSTRAINT "AuctionImage_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES public."Auction"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bid Bid_auctionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES public."Auction"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 5BWQilF4g0XT9oGqtqfCaivgeIOcXMKKaiJbTJcnnKwO1G2lNmbKeNnI2lP6jFx

