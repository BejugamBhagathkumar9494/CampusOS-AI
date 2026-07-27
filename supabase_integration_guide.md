# Supabase Integration & Configuration Guide

This guide provides a comprehensive setup for **CampusOS AI – Intelligent Campus Platform** using Supabase as the backend database, authentication provider, and storage service.

---

## 1. Complete SQL Schema & RLS Policies

The database migration script defines **24 core tables** and **5 compatibility tables** (for AI and ML features) under the public schema. It is stored in:
- `backend/supabase/migrations/20260727000000_initial_supabase_schema.sql`
- `supabase_setup.sql`

### Row Level Security (RLS) Rules:
- **`profiles`**: Users can read/write their own profile; admins can read all.
- **`students`**: Students can only select their own student profile. Faculty and admins have full select access.
- **`attendance`**: Students can read only their own attendance data. Faculty and admins can read/write all.
- **`complaints`**: Users can read/insert their own complaints. Hostel wardens and admins have full access.
- **`placements`**: Active placements are visible to students. Placement officers and admins have full write access.
- **`resumes`**: Students can insert/update/delete their own resumes. Placement officers and admins can view them.

---

## 2. Authentication Setup (Email & Password)

Supabase Auth handles user signup, login, password resets, and session management. 

### Trigger for Syncing auth.users with public.profiles
When a user registers via Supabase auth, PostgreSQL automatically creates a profile row in the public schema:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role_enum, 'student'::user_role_enum),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. Storage Bucket Configuration

For user resumes and profile avatars, configure a Supabase Storage Bucket.

1. Navigate to the **Storage** section in your Supabase Dashboard.
2. Click **New Bucket**.
3. Set the Name to: **`campusos-media`**.
4. Toggle **Public** to `ON` (so avatar images and shared documents can be loaded via URLs).
5. Add the following **Storage RLS Policies** under Policies:
   * **Insert Policy:** Authenticated users can upload files if the folder name matches their `auth.uid()`.
   * **Select Policy:** Public access to read files from the bucket.
   * **Delete Policy:** Users can delete files if the path starts with their `auth.uid()`.

---

## 4. Environment Variables

Create or update the configuration files.

### Backend (`backend/.env`):
```ini
# Supabase General Connection
SUPABASE_URL="https://fgncpaoutqrvzbgbiqvh.supabase.co"
SUPABASE_KEY="[YOUR_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR_SERVICE_ROLE_KEY]"
SUPABASE_BUCKET_NAME="campusos-media"

# SQLAlchemy Direct Connection (For migrations & FastAPI DB operations)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

### Frontend (`frontend/.env`):
```ini
VITE_API_URL="http://localhost:8000/api/v1"
VITE_APP_NAME="CampusOS AI"

# Supabase Web SDK Connection
VITE_SUPABASE_URL="https://fgncpaoutqrvzbgbiqvh.supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR_ANON_KEY]"
```

---

## 5. Connecting React & FastAPI to Supabase

### React (Frontend) client setup
Install the Supabase client library:
```bash
npm install @supabase/supabase-js
```

Initialize the client in `src/services/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### FastAPI (Backend) SQLAlchemy setup
Configure `backend/app/core/database.py` to use the Supabase connection string. FastAPI will perform transactional CRUD queries directly against Postgres using SQLAlchemy, respecting the schema.

---

## 6. How to Deploy the Schema

Since PostgreSQL TCP direct connections are protected by your database password:

### Option A: Via Supabase SQL Editor (Dashboard)
1. Copy the full content of the file `supabase_setup.sql` in the project root.
2. Go to your **Supabase Dashboard** -> **SQL Editor** -> **New Query**.
3. Paste the contents and click **Run**.
4. All tables, triggers, indexes, and RLS policies will be deployed immediately.

### Option B: Programmatically via DB URL
If you set the `DATABASE_URL` with your database password in `backend/.env`, you can execute the migration using standard Alembic or connection scripts.
