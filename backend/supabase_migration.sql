
CREATE TABLE organizations (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	cnpj VARCHAR, 
	phone VARCHAR, 
	email VARCHAR, 
	address VARCHAR, 
	default_tax_rate FLOAT NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	subscription_plan VARCHAR NOT NULL, 
	subscription_status VARCHAR NOT NULL, 
	trial_ends_at TIMESTAMP WITHOUT TIME ZONE, 
	subscription_ends_at TIMESTAMP WITHOUT TIME ZONE, 
	billing_id VARCHAR, 
	PRIMARY KEY (id)
)



CREATE INDEX ix_organizations_id ON organizations (id)


CREATE TABLE users (
	id SERIAL NOT NULL, 
	email VARCHAR NOT NULL, 
	hashed_password VARCHAR NOT NULL, 
	full_name VARCHAR, 
	organization_id INTEGER NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	role VARCHAR NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(organization_id) REFERENCES organizations (id)
)



CREATE INDEX ix_users_id ON users (id)

CREATE UNIQUE INDEX ix_users_email ON users (email)


CREATE TABLE clients (
	id SERIAL NOT NULL, 
	full_name VARCHAR NOT NULL, 
	email VARCHAR, 
	cnpj VARCHAR, 
	address VARCHAR, 
	phone VARCHAR, 
	organization_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(organization_id) REFERENCES organizations (id)
)



CREATE INDEX ix_clients_id ON clients (id)


CREATE TABLE services (
	id SERIAL NOT NULL, 
	name VARCHAR NOT NULL, 
	description TEXT, 
	default_price INTEGER NOT NULL, 
	unit VARCHAR, 
	organization_id INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(organization_id) REFERENCES organizations (id)
)



CREATE INDEX ix_services_id ON services (id)


CREATE TABLE productions (
	id SERIAL NOT NULL, 
	title VARCHAR NOT NULL, 
	organization_id INTEGER NOT NULL, 
	client_id INTEGER, 
	status VARCHAR NOT NULL, 
	deadline TIMESTAMP WITHOUT TIME ZONE, 
	priority VARCHAR, 
	shooting_sessions JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	subtotal INTEGER NOT NULL, 
	discount INTEGER NOT NULL, 
	tax_rate FLOAT NOT NULL, 
	tax_amount INTEGER NOT NULL, 
	total_value INTEGER NOT NULL, 
	total_cost INTEGER NOT NULL, 
	profit INTEGER NOT NULL, 
	payment_method VARCHAR, 
	payment_status VARCHAR NOT NULL, 
	due_date TIMESTAMP WITHOUT TIME ZONE, 
	notes VARCHAR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(organization_id) REFERENCES organizations (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id)
)



CREATE INDEX ix_productions_id ON productions (id)


CREATE TABLE production_items (
	id SERIAL NOT NULL, 
	production_id INTEGER NOT NULL, 
	service_id INTEGER, 
	name VARCHAR NOT NULL, 
	quantity FLOAT NOT NULL, 
	unit_price INTEGER NOT NULL, 
	total_price INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(production_id) REFERENCES productions (id) ON DELETE CASCADE, 
	FOREIGN KEY(service_id) REFERENCES services (id) ON DELETE SET NULL
)



CREATE INDEX ix_production_items_id ON production_items (id)


CREATE TABLE production_crew (
	id SERIAL NOT NULL, 
	production_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	role VARCHAR NOT NULL, 
	fee INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(production_id) REFERENCES productions (id) ON DELETE CASCADE, 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
)



CREATE INDEX ix_production_crew_id ON production_crew (id)


CREATE TABLE expenses (
	id SERIAL NOT NULL, 
	production_id INTEGER NOT NULL, 
	name VARCHAR NOT NULL, 
	value INTEGER NOT NULL, 
	category VARCHAR, 
	paid_by VARCHAR, 
	PRIMARY KEY (id), 
	FOREIGN KEY(production_id) REFERENCES productions (id) ON DELETE CASCADE
)



CREATE INDEX ix_expenses_id ON expenses (id)


        -- Create profiles table that extends auth.users
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            organization_id INTEGER REFERENCES public.organizations(id),
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
        );
        

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.productions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.production_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.production_crew ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


        -- Organizations: Users can only see their own organization
        CREATE POLICY "Users can view their own organization" ON public.organizations
            FOR SELECT USING (auth.uid() IN (
                SELECT user_id FROM public.users WHERE organization_id = organizations.id
            ));
        


        -- Profiles: Users can only see their own profile and profiles in their organization
        CREATE POLICY "Users can view profiles in their organization" ON public.profiles
            FOR SELECT USING (
                auth.uid() = id OR
                organization_id IN (
                    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
                )
            );
        