--
-- PostgreSQL database dump
--

\restrict EMndJf06AlCj98NYeYqofOuKPVU5AGjaGDlMFBtfsIRqpNIsCcEm27JlrGg6tN1

-- Dumped from database version 14.24
-- Dumped by pg_dump version 14.24

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bik_directory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bik_directory (
    id bigint NOT NULL,
    bik character varying(255),
    bank_name character varying(255),
    corr_account character varying(255),
    city character varying(255)
);


--
-- Name: bik_directory_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bik_directory_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bik_directory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bik_directory_id_seq OWNED BY public.bik_directory.id;


--
-- Name: completed_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.completed_contracts (
    id bigint NOT NULL,
    contract_number character varying(255),
    date_signed character varying(255),
    date_act character varying(255),
    object_name character varying(255),
    tenant_name character varying(255),
    area_sqm character varying(255),
    email character varying(255),
    phone character varying(255),
    tenant_fio character varying(255),
    end_date character varying(255),
    termination_date character varying(255),
    purpose character varying(255),
    rooms_list character varying(255),
    room_ids character varying(255),
    rent_per_sqm character varying(255),
    utility_per_sqm character varying(255),
    deposit_amount character varying(255),
    rent_amount character varying(255),
    utility_amount character varying(255),
    inn character varying(255),
    contact_person character varying(255),
    bank_account character varying(255),
    bik character varying(255),
    contract_scan_url character varying(255),
    act_scan_url character varying(255),
    notes text,
    bank_name character varying(255),
    corr_account character varying(255)
);


--
-- Name: completed_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.completed_contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: completed_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.completed_contracts_id_seq OWNED BY public.completed_contracts.id;


--
-- Name: contract_addendums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_addendums (
    id bigint NOT NULL,
    contract_type character varying(255) DEFAULT 'forming'::character varying,
    contract_ref_id bigint,
    title character varying(255),
    description text,
    file_id bigint,
    author_id bigint,
    created_at timestamp with time zone
);


--
-- Name: contract_addendums_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_addendums_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_addendums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_addendums_id_seq OWNED BY public.contract_addendums.id;


--
-- Name: contract_chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_chat_messages (
    id bigint NOT NULL,
    message text,
    contract_id bigint,
    author_id bigint,
    created_at timestamp with time zone,
    owner_contract_id bigint,
    source character varying(255) DEFAULT 'active'::character varying,
    attachment_id bigint
);


--
-- Name: contract_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_chat_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_chat_messages_id_seq OWNED BY public.contract_chat_messages.id;


--
-- Name: contract_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_contacts (
    id bigint NOT NULL,
    contract_type character varying(255),
    contract_ref_id bigint,
    name character varying(255),
    "position" character varying(255),
    phone character varying(255),
    email character varying(255)
);


--
-- Name: contract_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_contacts_id_seq OWNED BY public.contract_contacts.id;


--
-- Name: contract_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_notifications (
    id bigint NOT NULL,
    user_id bigint,
    contract_id bigint,
    title character varying(255),
    text text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone,
    source character varying(255) DEFAULT 'active'::character varying
);


--
-- Name: contract_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_notifications_id_seq OWNED BY public.contract_notifications.id;


--
-- Name: contract_objects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contract_objects (
    id bigint NOT NULL,
    name character varying(255),
    count integer
);


--
-- Name: contract_objects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contract_objects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contract_objects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contract_objects_id_seq OWNED BY public.contract_objects.id;


--
-- Name: forming_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forming_contracts (
    id bigint NOT NULL,
    contract_number character varying(255),
    date_signed character varying(255),
    date_act character varying(255),
    object_name character varying(255),
    tenant_name character varying(255),
    area_sqm character varying(255),
    email character varying(255),
    phone character varying(255),
    tenant_fio character varying(255),
    current_stage bigint,
    rent_per_sqm character varying(255),
    utility_per_sqm character varying(255),
    comment_stage0 text,
    avito_url character varying(255),
    cian_url character varying(255),
    other_url character varying(255),
    purpose character varying(255),
    comment_stage2 text,
    end_date character varying(255),
    notes text,
    signing_method character varying(255),
    inn character varying(255),
    bank_account character varying(255),
    bik character varying(255),
    deposit_amount character varying(255),
    deposit_invoiced boolean,
    deposit_paid boolean,
    rent_amount character varying(255),
    rent_invoiced boolean,
    rent_paid boolean,
    utility_amount character varying(255),
    utility_invoiced boolean,
    utility_paid boolean,
    comment_stage4 text,
    actual_start_date character varying(255),
    contract_scan_url character varying(255),
    act_scan_url character varying(255),
    bank_name character varying(255),
    corr_account character varying(255)
);


--
-- Name: forming_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.forming_contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: forming_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.forming_contracts_id_seq OWNED BY public.forming_contracts.id;


--
-- Name: rental_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rental_contracts (
    id bigint NOT NULL,
    contract_number character varying(255),
    date_signed character varying(255),
    date_act character varying(255),
    object_name character varying(255),
    tenant_name character varying(255),
    area_sqm character varying(255),
    email character varying(255),
    phone character varying(255),
    tenant_fio character varying(255),
    termination_date character varying(255),
    purpose character varying(255),
    rooms_list character varying(255),
    room_ids character varying(255),
    rent_per_sqm character varying(255),
    utility_per_sqm character varying(255),
    deposit_amount character varying(255),
    rent_amount character varying(255),
    utility_amount character varying(255),
    inn character varying(255),
    contact_person character varying(255),
    bank_account character varying(255),
    bik character varying(255),
    contract_scan_url character varying(255),
    act_scan_url character varying(255),
    notes text,
    end_date character varying(255),
    bank_name character varying(255),
    corr_account character varying(255)
);


--
-- Name: rental_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rental_contracts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rental_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rental_contracts_id_seq OWNED BY public.rental_contracts.id;


--
-- Name: t_contract_scan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_contract_scan (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    f_7v7b5y7s2ig bigint NOT NULL,
    f_b8nptmc4moz bigint NOT NULL
);


--
-- Name: bik_directory id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bik_directory ALTER COLUMN id SET DEFAULT nextval('public.bik_directory_id_seq'::regclass);


--
-- Name: completed_contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.completed_contracts ALTER COLUMN id SET DEFAULT nextval('public.completed_contracts_id_seq'::regclass);


--
-- Name: contract_addendums id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_addendums ALTER COLUMN id SET DEFAULT nextval('public.contract_addendums_id_seq'::regclass);


--
-- Name: contract_chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.contract_chat_messages_id_seq'::regclass);


--
-- Name: contract_contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_contacts ALTER COLUMN id SET DEFAULT nextval('public.contract_contacts_id_seq'::regclass);


--
-- Name: contract_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_notifications ALTER COLUMN id SET DEFAULT nextval('public.contract_notifications_id_seq'::regclass);


--
-- Name: contract_objects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_objects ALTER COLUMN id SET DEFAULT nextval('public.contract_objects_id_seq'::regclass);


--
-- Name: forming_contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forming_contracts ALTER COLUMN id SET DEFAULT nextval('public.forming_contracts_id_seq'::regclass);


--
-- Name: rental_contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_contracts ALTER COLUMN id SET DEFAULT nextval('public.rental_contracts_id_seq'::regclass);


--
-- Name: bik_directory bik_directory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bik_directory
    ADD CONSTRAINT bik_directory_pkey PRIMARY KEY (id);


--
-- Name: completed_contracts completed_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.completed_contracts
    ADD CONSTRAINT completed_contracts_pkey PRIMARY KEY (id);


--
-- Name: contract_addendums contract_addendums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_addendums
    ADD CONSTRAINT contract_addendums_pkey PRIMARY KEY (id);


--
-- Name: contract_chat_messages contract_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_chat_messages
    ADD CONSTRAINT contract_chat_messages_pkey PRIMARY KEY (id);


--
-- Name: contract_contacts contract_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_contacts
    ADD CONSTRAINT contract_contacts_pkey PRIMARY KEY (id);


--
-- Name: contract_notifications contract_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_notifications
    ADD CONSTRAINT contract_notifications_pkey PRIMARY KEY (id);


--
-- Name: contract_objects contract_objects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contract_objects
    ADD CONSTRAINT contract_objects_pkey PRIMARY KEY (id);


--
-- Name: forming_contracts forming_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forming_contracts
    ADD CONSTRAINT forming_contracts_pkey PRIMARY KEY (id);


--
-- Name: rental_contracts rental_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rental_contracts
    ADD CONSTRAINT rental_contracts_pkey PRIMARY KEY (id);


--
-- Name: t_contract_scan t_contract_scan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_contract_scan
    ADD CONSTRAINT t_contract_scan_pkey PRIMARY KEY (f_7v7b5y7s2ig, f_b8nptmc4moz);


--
-- Name: bik_directory_bik_uq; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bik_directory_bik_uq ON public.bik_directory USING btree (bik);


--
-- Name: contract_addendums_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_addendums_author_id ON public.contract_addendums USING btree (author_id);


--
-- Name: contract_addendums_file_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_addendums_file_id ON public.contract_addendums USING btree (file_id);


--
-- Name: contract_chat_messages_attachment_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_chat_messages_attachment_id ON public.contract_chat_messages USING btree (attachment_id);


--
-- Name: contract_chat_messages_author_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_chat_messages_author_id ON public.contract_chat_messages USING btree (author_id);


--
-- Name: contract_chat_messages_contract_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX contract_chat_messages_contract_id ON public.contract_chat_messages USING btree (contract_id);


--
-- Name: t_contract_scan_f_b8nptmc4moz; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX t_contract_scan_f_b8nptmc4moz ON public.t_contract_scan USING btree (f_b8nptmc4moz);


--
-- PostgreSQL database dump complete
--

\unrestrict EMndJf06AlCj98NYeYqofOuKPVU5AGjaGDlMFBtfsIRqpNIsCcEm27JlrGg6tN1

