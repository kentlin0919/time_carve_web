SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict iBMoCjhz6Ki9LxUGDmYwmWaw3qpZKa4FblaLLxImoQ0MsYyXqNFAgfugn6ZJNzK

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '15100a3d-ef37-401c-b35d-6d463b3e1a12', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-01 15:00:30.512556+00', ''),
	('00000000-0000-0000-0000-000000000000', '27007c9c-f5b9-41cb-b127-c10b2e674383', '{"action":"token_refreshed","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-01 16:00:35.113816+00', ''),
	('00000000-0000-0000-0000-000000000000', '332f1fb8-7dca-4334-8fb7-8f7d0be7a79b', '{"action":"token_revoked","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-01 16:00:35.143117+00', ''),
	('00000000-0000-0000-0000-000000000000', '80943c66-0292-4f46-9c63-5771e9792d2b', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-02 00:31:57.764159+00', ''),
	('00000000-0000-0000-0000-000000000000', '9dfb260f-6109-4c22-a5df-4be2e6d7ca30', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-02 00:32:24.635094+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a78145dc-77bc-491b-9b0a-ed06ad309ff2', '{"action":"login","actor_id":"81dfa150-6dec-41c2-bdeb-e65a780e4e0f","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-02 00:32:45.288311+00', ''),
	('00000000-0000-0000-0000-000000000000', '1e82ae81-617f-4530-b1aa-d7f6a2110495', '{"action":"token_refreshed","actor_id":"81dfa150-6dec-41c2-bdeb-e65a780e4e0f","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-03 04:12:43.352363+00', ''),
	('00000000-0000-0000-0000-000000000000', '0118830c-57e8-4478-b9da-004cc94a145d', '{"action":"token_revoked","actor_id":"81dfa150-6dec-41c2-bdeb-e65a780e4e0f","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-03 04:12:43.371715+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fee9946d-786c-4ec5-8286-8981e7c11356', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 04:12:49.41033+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f192a035-7db3-448d-a713-0ff02826fa86', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 04:13:22.50377+00', ''),
	('00000000-0000-0000-0000-000000000000', '716e114b-8904-43e6-bf06-ca19dc7dc72c', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"gpt.wang.lin@gmail.com","user_id":"95c3e6f7-17ec-4d98-98d4-97335dd74087","user_phone":""}}', '2026-01-03 04:15:01.291092+00', ''),
	('00000000-0000-0000-0000-000000000000', '0d86c1f0-f963-415c-ac1f-00c15485d716', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"linhome645@gmail.com","user_id":"81dfa150-6dec-41c2-bdeb-e65a780e4e0f","user_phone":""}}', '2026-01-03 04:15:01.29857+00', ''),
	('00000000-0000-0000-0000-000000000000', '966520ae-2319-4143-a50f-abd44ae3ca60', '{"action":"user_recovery_requested","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-03 04:15:25.331241+00', ''),
	('00000000-0000-0000-0000-000000000000', '62f428b2-f229-4eea-9976-e2838b5d1b08', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 04:17:00.986554+00', ''),
	('00000000-0000-0000-0000-000000000000', '2fe65b77-9ae3-43af-8b8b-179f8c65723f', '{"action":"user_confirmation_requested","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2026-01-03 04:17:48.07299+00', ''),
	('00000000-0000-0000-0000-000000000000', '86eabaf6-5505-4cac-a5c3-930da363c60d', '{"action":"user_signedup","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-01-03 04:18:09.933903+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e06e0e86-ef01-4430-beca-0777f43903fb', '{"action":"logout","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-03 04:21:19.015184+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c981a4ab-0bcf-4579-9a9b-d9eb7a4e8909', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 04:21:21.246072+00', ''),
	('00000000-0000-0000-0000-000000000000', '92a2f984-c64c-4135-a798-6d08277aadd4', '{"action":"token_refreshed","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-03 06:15:57.819245+00', ''),
	('00000000-0000-0000-0000-000000000000', '0f1bad76-5dfe-4b90-be38-0690b692a7e9', '{"action":"token_revoked","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-03 06:15:57.84265+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b64eec3e-2868-481a-b099-b613e8ffb7e2', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 06:16:08.907321+00', ''),
	('00000000-0000-0000-0000-000000000000', '13a3e5cb-098a-4994-abe8-fcbd0c78fe23', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-03 06:16:52.960938+00', ''),
	('00000000-0000-0000-0000-000000000000', 'efc8b420-bbb6-4809-9165-7f404c85d417', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 06:16:57.705481+00', ''),
	('00000000-0000-0000-0000-000000000000', '0322faef-42aa-458d-a5a8-1da23f710cdc', '{"action":"user_updated_password","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-03 06:17:09.205212+00', ''),
	('00000000-0000-0000-0000-000000000000', '2c0fe32a-4182-4d2c-8781-abf1e18ff8b5', '{"action":"user_modified","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-03 06:17:09.20725+00', ''),
	('00000000-0000-0000-0000-000000000000', '5f011b10-6ab6-4911-be65-9a651730bb54', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 06:22:15.992372+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e4977de5-28ad-4e09-a46b-d08226ced18a', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 06:22:34.612944+00', ''),
	('00000000-0000-0000-0000-000000000000', '511dadae-a2ee-4ddd-8015-1c4446e5e83c', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 06:25:00.183016+00', ''),
	('00000000-0000-0000-0000-000000000000', '712e7ed7-1342-4853-9ad1-562573993292', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 06:41:31.064689+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fcfcfa39-b12e-46fd-b86e-8486e81ecc40', '{"action":"token_refreshed","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-03 16:25:32.255216+00', ''),
	('00000000-0000-0000-0000-000000000000', 'eb225393-9cb9-4eb3-ae92-5a6f31f9730e', '{"action":"token_revoked","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-03 16:25:32.281704+00', ''),
	('00000000-0000-0000-0000-000000000000', '5397a194-9d7b-478d-b3fb-81b0c7ff2a8a', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:25:35.85591+00', ''),
	('00000000-0000-0000-0000-000000000000', '7634eea5-56a2-456b-91a6-d9287c49e455', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:26:03.608312+00', ''),
	('00000000-0000-0000-0000-000000000000', '40982ce3-cedb-4b57-b631-34b89e19253c', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:27:23.710313+00', ''),
	('00000000-0000-0000-0000-000000000000', '0cc0a742-6a68-401f-9fdc-b7b634d32fb2', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:27:49.358835+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ea3978ac-3a50-4493-9beb-88fdc2da6d68', '{"action":"user_confirmation_requested","actor_id":"bc521237-16d6-4434-b9e9-1cc875b4b42e","actor_username":"peggy9770106@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2026-01-03 16:29:04.553167+00', ''),
	('00000000-0000-0000-0000-000000000000', '20a18175-0e6b-4bbd-a0d4-f8368a2d7f60', '{"action":"user_confirmation_requested","actor_id":"21dab6f5-34e7-439d-81c9-eea6c0984f13","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2026-01-03 16:31:03.856802+00', ''),
	('00000000-0000-0000-0000-000000000000', '6745ce22-47da-40dd-a150-79e99ef3f269', '{"action":"user_signedup","actor_id":"21dab6f5-34e7-439d-81c9-eea6c0984f13","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-01-03 16:31:17.840152+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d81019f-e2bf-4b7d-8315-1292613e0db9', '{"action":"login","actor_id":"21dab6f5-34e7-439d-81c9-eea6c0984f13","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:33:18.749539+00', ''),
	('00000000-0000-0000-0000-000000000000', '5ff57554-df3f-4d2f-96a3-656afd65ccbf', '{"action":"login","actor_id":"21dab6f5-34e7-439d-81c9-eea6c0984f13","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:33:26.098731+00', ''),
	('00000000-0000-0000-0000-000000000000', '53408310-f9f4-42d8-ad6d-0580c5973955', '{"action":"user_updated_password","actor_id":"21dab6f5-34e7-439d-81c9-eea6c0984f13","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-03 16:33:52.059185+00', ''),
	('00000000-0000-0000-0000-000000000000', '3f3c25cf-871a-4961-9123-37908644d68a', '{"action":"user_modified","actor_id":"21dab6f5-34e7-439d-81c9-eea6c0984f13","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-03 16:33:52.059903+00', ''),
	('00000000-0000-0000-0000-000000000000', '6a8530b6-b6f9-45ec-8617-2f037416c43d', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:35:38.133185+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ca01782b-c3a9-476e-8513-5413b9941a5c', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 16:48:05.968602+00', ''),
	('00000000-0000-0000-0000-000000000000', '3ccb8af3-a0d5-492c-82f4-dccac39396db', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-03 17:27:26.525381+00', ''),
	('00000000-0000-0000-0000-000000000000', 'af73e0f0-0acf-4a73-ad79-989493882e43', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:18:47.811153+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e3fc213d-07de-49e2-8abc-5234fafbb013', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:19:54.199616+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c1b836a9-0fc1-4bc4-908a-7310fd3d6f09', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:38:46.063223+00', ''),
	('00000000-0000-0000-0000-000000000000', '76b3d9b6-7d40-45b3-a1b1-d231acceea9f', '{"action":"token_refreshed","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-04 03:38:58.815641+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dd9e2d1a-ce4e-48f6-b570-a745b4c721c6', '{"action":"token_revoked","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-04 03:38:58.818073+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dff39248-50f6-4804-9383-f8b01781a8f4', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-04 03:41:06.106384+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ead56d57-7d70-460e-8765-9b6aacd5da84', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:41:35.658108+00', ''),
	('00000000-0000-0000-0000-000000000000', '32447084-1912-4246-8472-3848ae578f97', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:43:07.279401+00', ''),
	('00000000-0000-0000-0000-000000000000', '4cf54b26-4bee-4338-ba34-da73296df2bc', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:43:34.66793+00', ''),
	('00000000-0000-0000-0000-000000000000', '4ff8ca68-82ba-42cc-83ba-e33f6bdeb60e', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:45:34.125797+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f384be0-4625-47cb-a3a6-9dbdf3f21543', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 03:46:08.642367+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd3666325-1357-41d2-ae72-d039d9e98d17', '{"action":"token_refreshed","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-04 05:55:29.351602+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bde24a95-0102-4962-8748-154562b7b9bc', '{"action":"token_revoked","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-04 05:55:29.36821+00', ''),
	('00000000-0000-0000-0000-000000000000', '32e51017-2d40-498b-afdd-2109a60ff215', '{"action":"login","actor_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 05:55:44.810109+00', ''),
	('00000000-0000-0000-0000-000000000000', '37de771e-0f38-442d-9873-6cc6cd522673', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"linhome645@gmail.com","user_id":"dac9e328-0ad1-48a6-8f6d-f6ba8af612fa","user_phone":""}}', '2026-01-04 06:05:21.012975+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c06085bc-4df8-48c6-91ef-cc0deece9255', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 06:15:41.808155+00', ''),
	('00000000-0000-0000-0000-000000000000', '4acaf114-0445-4a76-801f-2092ac73a9a7', '{"action":"user_confirmation_requested","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2026-01-04 06:26:25.674241+00', ''),
	('00000000-0000-0000-0000-000000000000', '34f47042-ba12-47aa-b4ab-2b1c52a39f1c', '{"action":"user_signedup","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-01-04 06:26:41.526778+00', ''),
	('00000000-0000-0000-0000-000000000000', '6ce24ec4-7fb9-4beb-9b09-69b5cdf6d1c5', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-04 06:26:53.787333+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c0ccb46a-0625-44e7-8d61-333983602d5c', '{"action":"login","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 06:27:03.007476+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b028cce0-6796-4f15-be4d-c99999728020', '{"action":"user_updated_password","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-04 06:27:31.064421+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f10183b3-7d1b-4d87-afe3-267008163467', '{"action":"user_modified","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-04 06:27:31.065555+00', ''),
	('00000000-0000-0000-0000-000000000000', 'da148eac-5c5e-4a55-b74c-6ee75b0e131a', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 06:29:07.531332+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a86365f0-3bb3-4d08-ba9f-9b12fadca640', '{"action":"logout","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-04 06:39:54.738297+00', ''),
	('00000000-0000-0000-0000-000000000000', '9f3389dc-4837-4324-b58d-db14cece8e10', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 06:51:51.491898+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d4d778b-7b4a-414e-8428-3ce2f2955266', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-04 06:52:57.600558+00', ''),
	('00000000-0000-0000-0000-000000000000', '4c65573a-7007-4fae-b23e-50f10697107d', '{"action":"login","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-04 06:53:01.36849+00', ''),
	('00000000-0000-0000-0000-000000000000', '9ef3dcdf-ca3e-424d-94ac-a74d91485166', '{"action":"token_refreshed","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-05 00:06:09.655884+00', ''),
	('00000000-0000-0000-0000-000000000000', '5cc7549b-d168-4fd6-bca9-0ea05609cf9b', '{"action":"token_revoked","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-05 00:06:09.681138+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb8d36a6-3824-4362-ba1e-78a88d100d19', '{"action":"token_refreshed","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-05 01:25:15.040408+00', ''),
	('00000000-0000-0000-0000-000000000000', '31781be7-c7e5-4b15-82cc-be52c54eb450', '{"action":"token_revoked","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-05 01:25:15.048811+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fe00d0b2-a619-41fd-94cf-65b02d3886c0', '{"action":"token_refreshed","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-07 13:35:31.170318+00', ''),
	('00000000-0000-0000-0000-000000000000', '6c5e7916-9644-4620-bc25-6d0c5ae3951a', '{"action":"token_revoked","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-07 13:35:31.189142+00', ''),
	('00000000-0000-0000-0000-000000000000', '332e2f3c-5a02-47d4-9297-e358b06d8c59', '{"action":"login","actor_id":"662aceaf-a40f-4acc-bed3-f074c9d62dc6","actor_username":"linhome645@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-07 13:35:47.422928+00', ''),
	('00000000-0000-0000-0000-000000000000', '4490b985-cb89-4d81-95fc-532c5cc3f85a', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-07 13:56:58.289083+00', ''),
	('00000000-0000-0000-0000-000000000000', '6e328311-d044-4edb-845b-e1f64609e6b4', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-07 13:57:46.491034+00', ''),
	('00000000-0000-0000-0000-000000000000', '44902bdd-e183-4f48-a105-967d47cf5ade', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-07 13:58:05.446022+00', ''),
	('00000000-0000-0000-0000-000000000000', 'aa865490-07d9-4d71-8160-f448f1af1a25', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-07 14:01:07.46322+00', ''),
	('00000000-0000-0000-0000-000000000000', '0695b341-22bd-40d5-b412-4b5c8b75df6d', '{"action":"user_confirmation_requested","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user","traits":{"provider":"email"}}', '2026-01-07 14:01:52.41748+00', ''),
	('00000000-0000-0000-0000-000000000000', '58a0ebc1-af47-4634-b8f9-2c4cd18c09d9', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-07 14:02:25.468304+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cff9b93a-9ab1-4fff-8086-fba1fd728557', '{"action":"user_signedup","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"email"}}', '2026-01-07 14:02:32.930773+00', ''),
	('00000000-0000-0000-0000-000000000000', '20c73725-f5c2-4455-8828-d3dfe4c5daee', '{"action":"login","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-07 14:02:37.290245+00', ''),
	('00000000-0000-0000-0000-000000000000', 'cb033c95-cd2d-43d2-8b3e-78b67dbe1697', '{"action":"user_updated_password","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-07 14:03:18.656483+00', ''),
	('00000000-0000-0000-0000-000000000000', '27eb8481-6897-413c-8452-e39c3ef8a0ee', '{"action":"user_modified","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-07 14:03:18.657889+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e324e1ea-ead4-49fd-8b96-664d344a1667', '{"action":"login","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-07 14:04:05.978976+00', ''),
	('00000000-0000-0000-0000-000000000000', '94afaa2e-fb18-44bb-9cb5-c19d22e9d4d8', '{"action":"user_updated_password","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-07 14:05:09.375197+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd5c1605d-5e8c-43f4-815a-d406f7965d0f', '{"action":"user_modified","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"user"}', '2026-01-07 14:05:09.377479+00', ''),
	('00000000-0000-0000-0000-000000000000', '80d27abc-70ab-4037-a3c2-f6cf8a4c4429', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:01.784265+00', ''),
	('00000000-0000-0000-0000-000000000000', '4b1d00fe-3bc2-4f94-87a2-82b185e44f71', '{"action":"token_revoked","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:01.809881+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ecb9fd5-7b8a-4e3f-a5ab-ea7a0e828294', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:01.893037+00', ''),
	('00000000-0000-0000-0000-000000000000', '53d97f4c-c50e-4d66-a284-112dda4a914d', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:05.16568+00', ''),
	('00000000-0000-0000-0000-000000000000', '862ddaa4-e376-449b-bbe7-ec53442b4bad', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:06.800624+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ccbb09f4-ef7f-4b44-84ad-2b10e562ee94', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:06.876784+00', ''),
	('00000000-0000-0000-0000-000000000000', '0292adbd-5eb5-4e56-b6c9-787757803237', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:06.902576+00', ''),
	('00000000-0000-0000-0000-000000000000', '70c4e5a2-c151-418b-b796-75666a14d926', '{"action":"token_refreshed","actor_id":"ed6fb196-790a-404d-901e-55188c0d7d5f","actor_username":"peggy19770106@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-01-08 08:19:06.913194+00', ''),
	('00000000-0000-0000-0000-000000000000', '8e09a0e2-12ae-4a0a-be9c-3ef98da3b811', '{"action":"login","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"email"}}', '2026-01-12 13:54:22.314513+00', ''),
	('00000000-0000-0000-0000-000000000000', '3710be1e-35bd-4ab6-aee2-68186a1be8ee', '{"action":"logout","actor_id":"8ae77cad-ee72-41e3-a97e-bf38067103a6","actor_username":"kent900919@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-01-12 13:55:22.442154+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '8ae77cad-ee72-41e3-a97e-bf38067103a6', 'authenticated', 'authenticated', 'kent900919@gmail.com', '$2a$06$Ig0ByA0/HkiYqBoj6.axvuJp9rUxUvRNA/YMGOMdQHIfcZBM7iPDW', '2025-12-24 11:58:00.602454+00', NULL, '', NULL, '0fe9d78f4afb5cb575b9402d352e7979d4914ab272d4bfd3d69fd66a', '2026-01-03 04:15:25.33325+00', '', '', NULL, '2026-01-12 13:54:22.332047+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Super Admin"}', false, '2025-12-24 11:58:00.602454+00', '2026-01-12 13:54:22.373464+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', 'authenticated', 'authenticated', 'linhome645@gmail.com', '$2a$10$lFEUArvXm9SBkrSK3BBLR.L8H6tmQsywKwEYzSf31yEzSYP/4X47.', '2026-01-04 06:26:41.527765+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-01-07 13:35:47.423642+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "662aceaf-a40f-4acc-bed3-f074c9d62dc6", "name": "test", "role": "teacher", "email": "linhome645@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-01-04 06:26:25.642598+00', '2026-01-07 13:35:47.436261+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', 'ed6fb196-790a-404d-901e-55188c0d7d5f', 'authenticated', 'authenticated', 'peggy19770106@gmail.com', '$2a$10$TROih9XwtCvxPsgRqe0ihOP3YldQeZIpzS6ogCnqm2UHbtiUmgh4W', '2026-01-07 14:02:32.931476+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-01-07 14:04:06.011305+00', '{"provider": "email", "providers": ["email"]}', '{"sub": "ed6fb196-790a-404d-901e-55188c0d7d5f", "name": "new", "role": "teacher", "email": "peggy19770106@gmail.com", "email_verified": true, "phone_verified": false}', NULL, '2026-01-07 14:01:52.398798+00', '2026-01-08 08:19:01.854061+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('662aceaf-a40f-4acc-bed3-f074c9d62dc6', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', '{"sub": "662aceaf-a40f-4acc-bed3-f074c9d62dc6", "name": "test", "role": "teacher", "email": "linhome645@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-01-04 06:26:25.667756+00', '2026-01-04 06:26:25.667807+00', '2026-01-04 06:26:25.667807+00', 'bf0ad726-b1a7-41af-8f8b-ba6bd4dc37b5'),
	('ed6fb196-790a-404d-901e-55188c0d7d5f', 'ed6fb196-790a-404d-901e-55188c0d7d5f', '{"sub": "ed6fb196-790a-404d-901e-55188c0d7d5f", "name": "new", "role": "teacher", "email": "peggy19770106@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-01-07 14:01:52.414061+00', '2026-01-07 14:01:52.414115+00', '2026-01-07 14:01:52.414115+00', '030beda9-f6b0-43e0-b133-ae09c76337db');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('bd6aaad3-0d83-4201-8c6c-3e6daa49486d', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', '2026-01-04 06:53:01.370002+00', '2026-01-07 13:35:31.242272+00', NULL, 'aal1', NULL, '2026-01-07 13:35:31.242159', 'Vercel Edge Functions', '18.139.162.164', NULL, NULL, NULL, NULL, NULL),
	('9deb0a24-abd3-4f04-9e0c-56d914660bfb', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', '2026-01-07 13:35:47.423757+00', '2026-01-07 13:35:47.423757+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36', '111.71.53.79', NULL, NULL, NULL, NULL, NULL),
	('331004ba-df8c-4535-8b6d-e094988751da', 'ed6fb196-790a-404d-901e-55188c0d7d5f', '2026-01-07 14:04:06.012102+00', '2026-01-08 08:19:06.915103+00', NULL, 'aal1', NULL, '2026-01-08 08:19:06.914999', 'Vercel Edge Functions', '13.212.72.50', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('331004ba-df8c-4535-8b6d-e094988751da', '2026-01-07 14:04:06.084323+00', '2026-01-07 14:04:06.084323+00', 'password', 'a8180d12-870c-416c-aab3-45222c6ccc45'),
	('bd6aaad3-0d83-4201-8c6c-3e6daa49486d', '2026-01-04 06:53:01.372754+00', '2026-01-04 06:53:01.372754+00', 'password', '4e22e0e4-dd55-4fdb-b6b1-d68ce59e26a7'),
	('9deb0a24-abd3-4f04-9e0c-56d914660bfb', '2026-01-07 13:35:47.436625+00', '2026-01-07 13:35:47.436625+00', 'password', '9f6d6f25-a508-43fd-afb4-eb786c63c415');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('eeebbf8c-4555-4d45-9454-3e98f45cafe5', '8ae77cad-ee72-41e3-a97e-bf38067103a6', 'recovery_token', '0fe9d78f4afb5cb575b9402d352e7979d4914ab272d4bfd3d69fd66a', 'kent900919@gmail.com', '2026-01-03 04:15:29.245685', '2026-01-03 04:15:29.245685');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 63, 'xjw3rq35gvrc', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', true, '2026-01-04 06:53:01.371024+00', '2026-01-05 00:06:09.681819+00', NULL, 'bd6aaad3-0d83-4201-8c6c-3e6daa49486d'),
	('00000000-0000-0000-0000-000000000000', 64, 'fdrfceiywbuk', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', true, '2026-01-05 00:06:09.703373+00', '2026-01-05 01:25:15.050085+00', 'xjw3rq35gvrc', 'bd6aaad3-0d83-4201-8c6c-3e6daa49486d'),
	('00000000-0000-0000-0000-000000000000', 65, 'psa4ua55bloj', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', true, '2026-01-05 01:25:15.059289+00', '2026-01-07 13:35:31.190909+00', 'fdrfceiywbuk', 'bd6aaad3-0d83-4201-8c6c-3e6daa49486d'),
	('00000000-0000-0000-0000-000000000000', 66, 'i7a6a4zm74b5', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', false, '2026-01-07 13:35:31.214974+00', '2026-01-07 13:35:31.214974+00', 'psa4ua55bloj', 'bd6aaad3-0d83-4201-8c6c-3e6daa49486d'),
	('00000000-0000-0000-0000-000000000000', 67, 'xrkcrncex6v6', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', false, '2026-01-07 13:35:47.435283+00', '2026-01-07 13:35:47.435283+00', NULL, '9deb0a24-abd3-4f04-9e0c-56d914660bfb'),
	('00000000-0000-0000-0000-000000000000', 73, 'knvj7fiqbg7b', 'ed6fb196-790a-404d-901e-55188c0d7d5f', true, '2026-01-07 14:04:06.045005+00', '2026-01-08 08:19:01.818142+00', NULL, '331004ba-df8c-4535-8b6d-e094988751da'),
	('00000000-0000-0000-0000-000000000000', 74, 'o3zhqd3btmux', 'ed6fb196-790a-404d-901e-55188c0d7d5f', false, '2026-01-08 08:19:01.841231+00', '2026-01-08 08:19:01.841231+00', 'knvj7fiqbg7b', '331004ba-df8c-4535-8b6d-e094988751da');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: booking_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."booking_statuses" ("id", "status_key", "label_zh", "color", "is_active", "created_at", "updated_at") VALUES
	(1, 'pending', '待確認', 'orange', true, '2026-01-11 08:18:12.115974+00', '2026-01-11 08:18:12.115974+00'),
	(2, 'confirmed', '已收款（待上課）', 'emerald', true, '2026-01-11 08:18:12.115974+00', '2026-01-11 08:18:12.115974+00'),
	(3, 'completed', '已完成', 'blue', true, '2026-01-11 08:18:12.115974+00', '2026-01-11 08:18:12.115974+00'),
	(4, 'cancelled', '已取消', 'red', true, '2026-01-11 08:18:12.115974+00', '2026-01-11 08:18:12.115974+00');


--
-- Data for Name: identity; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."identity" ("identity_id", "name") VALUES
	(1, 'Super Admin'),
	(2, 'Teacher'),
	(3, 'Student');


--
-- Data for Name: user_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_info" ("id", "name", "email", "identity_id", "created_at", "updated_at", "is_active", "disabled_at", "disabled_reason", "phone", "avatar_url", "is_first_login") VALUES
	('ed6fb196-790a-404d-901e-55188c0d7d5f', '陳姵綺', 'peggy19770106@gmail.com', 2, '2026-01-07 14:01:52.398449+00', '2026-01-07 14:01:58.415141+00', true, NULL, NULL, NULL, NULL, true),
	('8ae77cad-ee72-41e3-a97e-bf38067103a6', '林家明', 'kent900919@gmail.com', 1, '2025-12-24 11:58:00.602454+00', '2025-12-24 11:58:00.602454+00', true, NULL, NULL, NULL, NULL, true),
	('662aceaf-a40f-4acc-bed3-f074c9d62dc6', '林家明', 'linhome645@gmail.com', 2, '2026-01-04 06:26:25.640333+00', '2026-01-04 06:26:29.008432+00', true, NULL, NULL, '0970445365', NULL, true);


--
-- Data for Name: teacher_info; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."teacher_info" ("id", "bio", "specialties", "experience_years", "base_price", "is_public", "created_at", "updated_at", "teacher_code", "title", "booking_settings", "notification_settings", "google_calendar_enabled", "line_notify_enabled", "line_notify_token", "philosophy_items", "philosophy_subtitle") VALUES
	('662aceaf-a40f-4acc-bed3-f074c9d62dc6', '我的教學理念是學習', '{}', NULL, NULL, true, '2026-01-04 06:26:29.008432+00', '2026-01-04 06:26:29.008432+00', 'ZN9G', NULL, '{}', '{}', false, false, NULL, '[{"icon": "lightbulb", "title": "新教學理念", "description": "test2"}]', NULL),
	('ed6fb196-790a-404d-901e-55188c0d7d5f', NULL, '{}', NULL, NULL, true, '2026-01-07 14:01:58.415141+00', '2026-01-07 14:01:58.415141+00', '92N4', NULL, '{}', '{}', false, false, NULL, '[{"icon": "lightbulb", "title": "新教學理念", "description": "包你上國考\n"}]', NULL);


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: student_info; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: class_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."class_type" ("class_type_id", "name", "teacher_id", "label_zh", "is_active", "created_at") VALUES
	(1, '一對一指導', NULL, '一對一指導', true, '2026-01-03 06:18:47.65088+00'),
	(2, '小班制', NULL, '小班制', true, '2026-01-03 06:18:47.65088+00'),
	(3, '遠端課程', NULL, '遠端課程', true, '2026-01-03 06:18:47.65088+00');


--
-- Data for Name: course_class_type; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: course_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: education_statuses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."education_statuses" ("id", "status_key", "label_zh", "created_at") VALUES
	(1, 'studying', '就學中', '2025-12-25 07:42:42.722812+00'),
	(2, 'graduated', '已畢業', '2025-12-25 07:42:42.722812+00'),
	(3, 'dropped_out', '肄業', '2025-12-25 07:42:42.722812+00'),
	(4, 'suspended', '休學中', '2025-12-25 07:42:42.722812+00');


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: platform_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."platform_settings" ("key", "value", "label", "updated_at") VALUES
	('contact_address', '', '聯絡地址', '2026-01-04 06:40:57.916+00'),
	('contact_email', 'time.carve.studio@gmail.com', '聯絡信箱', '2026-01-04 06:40:57.916+00'),
	('contact_phone', '', '聯絡電話', '2026-01-04 06:40:57.916+00'),
	('facebook_url', '', 'Facebook 連結', '2026-01-04 06:40:57.916+00'),
	('instagram_url', '', 'Instagram 連結', '2026-01-04 06:40:57.916+00'),
	('line_url', '', 'Line 官方帳號', '2026-01-04 06:40:57.916+00'),
	('login_hero_image_url', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHhqJqS-VgLptXAcCrNziettbp0-KH-cAC-oY7-qxcwZYspiupMFZMYTZmQSJqGYokazzYf31feFqozjVqQF5HyHuvKkZGz64lFzSWHrbd5eSVqsgr25QOyYUyD0QmGQ68tOAX8JZeAFTu72ATHh7m-IF1bgfrMZBT5moP5QMWBSoWQVf4HJYudJAFQCKV6GS2gLZIw7EVw-bFeQ1EAfPoglVwm-NI69IRGWk7vQmqDnv-qp6kGs1pYiMiyOzxQHuaWhsmcU1SjQE', '登入頁左側圖片 URL', '2026-01-05 00:15:29.491628+00'),
	('login_hero_title_line1', '精選課程', '登入頁主標題（第一行）', '2026-01-05 00:15:29.491628+00'),
	('login_hero_title_line2', '成就非凡實力', '登入頁主標題（第二行）', '2026-01-05 00:15:29.491628+00'),
	('login_hero_subtitle', '專為學員量身打造的專業家教課程，在舒適的環境中，開始您的學習之旅。', '登入頁副標題', '2026-01-05 00:15:29.491628+00');


--
-- Data for Name: portfolios; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: portfolio_media; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: portfolio_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: schools; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."schools" ("id", "code", "name", "country", "city", "website", "created_at") VALUES
	('745fc871-ed0b-48ed-b937-a39e33cddf56', '0023', '國立雲林科技大學', 'Taiwan', NULL, NULL, '2026-01-01 14:12:44.826635+00'),
	('abe366c6-c267-4701-a9b7-544366a7c0ff', '1028', '臺北醫學大學', 'Taiwan', NULL, NULL, '2026-01-01 14:15:54.703562+00'),
	('046912ee-35a4-4a2b-bd4d-ad89bd568f90', '0001', '國立政治大學', 'Taiwan', NULL, NULL, '2026-01-01 14:17:44.480565+00'),
	('2e623d93-d823-4356-85a6-e240edddb773', '0017', '國立臺北大學', 'Taiwan', NULL, NULL, '2026-01-03 16:34:36.431241+00');


--
-- Data for Name: student_education; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: system_modules; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."system_modules" ("id", "key", "label", "is_active", "created_at", "updated_at", "route", "icon", "sequence", "parent_key", "badge", "identity_id") VALUES
	('261e4a9c-0a06-4717-9045-08219895b4ea', 'admin_dashboard', '儀表板', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/dashboard', 'dashboard', 10, NULL, NULL, 1),
	('c1b11a6a-547d-48f8-b635-18abc5d7f3e6', 'admin_courses', '課程管理', false, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', NULL, NULL, 0, NULL, NULL, 1),
	('521dca7f-3b53-4a64-a7e9-552ee023f4ed', 'admin_finance', '財務報表', false, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', NULL, NULL, 0, NULL, NULL, 1),
	('86f38e52-96e3-4f59-bb14-d1cd5a39db78', 'admin_teachers', '教師管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/teachers', 'school', 40, NULL, NULL, 1),
	('8154733f-019e-4f55-b703-cb2c51e86969', 'admin_course_types', '課程類型管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/course-types', 'category', 50, NULL, NULL, 1),
	('c131b0fc-4680-48a1-bb3a-06adc99be04e', 'admin_tags', '標籤管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/tags', 'label', 60, NULL, NULL, 1),
	('83c0e5c7-ac87-430a-aa43-487abf261f90', 'admin_students', '學生管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/students', 'groups', 70, NULL, NULL, 1),
	('609e3f16-4cf3-4aa6-9507-aae7954fe163', 'admin_users', '用戶管理', true, '2026-01-04 05:45:47.605563+00', '2026-01-04 05:45:47.605563+00', '/admin/users', 'people', 20, NULL, NULL, 1),
	('6162b9bd-eab6-4f02-9155-30ca715aa90c', 'admin_audit', '審核系統', true, '2026-01-04 05:45:47.605563+00', '2026-01-04 05:45:47.605563+00', '/admin/audit', 'fact_check', 30, NULL, NULL, 1),
	('b553e299-e33f-4f72-98d3-c70bb0fc3fc7', 'admin_modules', '模組管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/modules', 'extension', 80, NULL, NULL, 1),
	('273c2824-c2f0-4b6f-83c9-2dae540c47ce', 'admin_settings', '系統設定', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/admin/settings', 'settings', 90, NULL, NULL, 1),
	('e25d2bd0-193e-4ac2-a543-fbc01c97623c', 'teacher_dashboard', '儀表板總覽', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/dashboard', 'dashboard', 10, NULL, NULL, 2),
	('025f81aa-6050-4f19-807b-51b32c57dbb6', 'teacher_bookings', '預約管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/bookings', 'calendar_month', 20, NULL, '3', 2),
	('b0c2434f-e99e-49fb-93b7-52d082d7b1ab', 'teacher_courses', '課程方案', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/courses', 'school', 30, NULL, NULL, 2),
	('b9bd0d9d-c999-477e-b1f1-b87602674858', 'teacher_portfolio', '作品集管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/portfolio', 'photo_library', 40, NULL, NULL, 2),
	('2400d9c8-0b32-4419-bd82-1667568a0d93', 'teacher_students', '學生資訊', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/students', 'group', 50, NULL, NULL, 2),
	('6bfd5669-b44f-4769-94aa-8fd963be6a88', 'teacher_profile', '個人檔案', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/profile', 'person', 60, NULL, NULL, 2),
	('58275686-b8c0-446c-8157-6a1f3a81ddc0', 'teacher_payments', '收款管理', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/payments', 'payments', 70, NULL, NULL, 2),
	('7e9c6c80-ad81-4c52-b4da-bd37612177fa', 'teacher_reports', '營收報表', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/reports', 'monitoring', 80, NULL, NULL, 2),
	('7772d370-3c63-46db-bc5b-34e92b9a60a7', 'teacher_settings', '系統設定', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/teacher/settings', 'settings', 90, NULL, NULL, 2),
	('6a3e880d-ffa6-48a9-80b6-d876a161f674', 'student_dashboard', '儀表板', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/student/dashboard', 'dashboard', 10, NULL, NULL, 3),
	('a3fbf30e-d8be-4fa3-ae54-d02e4ae63277', 'student_courses', '課程方案', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/student/courses', 'menu_book', 20, NULL, NULL, 3),
	('21b9ad9f-ca4e-4cdc-a02d-a18e13138fff', 'student_booking', '預約記錄', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/student/booking', 'calendar_month', 30, NULL, NULL, 3),
	('554fb859-eecc-4480-906e-ffdc4be75180', 'student_progress', '學習進度', true, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '/student/progress', 'trending_up', 40, NULL, NULL, 3),
	('93c6a5b0-181e-4491-b63a-525dcbf50305', 'student_settings', '個人設定', false, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '#', 'settings', 90, NULL, NULL, 3),
	('fefa5889-1330-4b6a-a873-cf882a70e8ea', 'student_support', '支援中心', false, '2026-01-04 03:52:17.204326+00', '2026-01-04 03:52:17.204326+00', '#', 'help', 100, NULL, NULL, 3),
	('95ea3c43-e735-49ec-8763-28b7a7516f42', 'admin_bookings', '預約與營收', true, '2026-01-11 08:18:12.544151+00', '2026-01-11 08:18:12.544151+00', '/admin/bookings', 'payments', 15, NULL, NULL, 1);


--
-- Data for Name: teacher_availability_overrides; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: teacher_availability_weekly; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: teacher_education; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."teacher_education" ("id", "teacher_id", "school_id", "status_id", "degree", "department", "start_year", "end_year", "is_verified", "created_at", "updated_at", "degree_level", "study_year") VALUES
	('3afb8aaf-ce4b-44b8-b029-18f4d99a20cb', '662aceaf-a40f-4acc-bed3-f074c9d62dc6', '745fc871-ed0b-48ed-b937-a39e33cddf56', 1, NULL, '資訊管理', NULL, NULL, false, '2026-01-04 06:27:52.23712+00', '2026-01-04 06:27:52.23712+00', NULL, NULL),
	('d5c53917-c02c-434c-9f5f-cc7491b0d2e3', 'ed6fb196-790a-404d-901e-55188c0d7d5f', 'abe366c6-c267-4701-a9b7-544366a7c0ff', 1, NULL, '牙體技術科', NULL, NULL, false, '2026-01-07 14:06:14.181998+00', '2026-01-07 14:06:14.181998+00', NULL, NULL);


--
-- Data for Name: teacher_experience; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('avatars', 'avatars', NULL, '2026-01-03 06:18:46.042529+00', '2026-01-03 06:18:46.042529+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('course-images', 'course-images', NULL, '2026-01-04 14:52:48.092396+00', '2026-01-04 14:52:48.092396+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('portfolio-media', 'portfolio-media', NULL, '2026-01-21 00:06:56.82115+00', '2026-01-21 00:06:56.82115+00', true, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata", "level") VALUES
	('e188f4dc-876c-485e-808c-5905e493d0e2', 'avatars', 'dac9e328-0ad1-48a6-8f6d-f6ba8af612fa-1767421371684.jpg', 'dac9e328-0ad1-48a6-8f6d-f6ba8af612fa', '2026-01-03 06:23:11.98784+00', '2026-01-03 06:23:11.98784+00', '2026-01-03 06:23:11.98784+00', '{"eTag": "\"001fda67cc49f545cc6af4c2359d4c30\"", "size": 390759, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-01-03T06:23:12.000Z", "contentLength": 390759, "httpStatusCode": 200}', '0ea9121e-9b0d-40c0-ac15-f86404772b32', 'dac9e328-0ad1-48a6-8f6d-f6ba8af612fa', '{}', 1);


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 75, true);


--
-- Name: booking_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."booking_statuses_id_seq"', 4, true);


--
-- Name: class_type_class_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."class_type_class_type_id_seq"', 6, true);


--
-- Name: education_statuses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."education_statuses_id_seq"', 8, true);


--
-- Name: identity_identity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."identity_identity_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict iBMoCjhz6Ki9LxUGDmYwmWaw3qpZKa4FblaLLxImoQ0MsYyXqNFAgfugn6ZJNzK

RESET ALL;
