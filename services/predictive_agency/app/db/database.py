from app.core.supabase_client import get_supabase_admin


def get_db():
    return get_supabase_admin()
