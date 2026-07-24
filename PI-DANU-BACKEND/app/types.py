from sqlalchemy import String, TypeDecorator
import uuid as _uuid


class GUID(TypeDecorator):
    """Platform-independent GUID/UUID type. Uses CHAR(36) for SQLite, native UUID for Postgres."""
    impl = String
    cache_ok = True

    def __init__(self):
        super().__init__(length=36)

    def process_bind_param(self, value, dialect):
        if value is not None:
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            return _uuid.UUID(value) if not isinstance(value, _uuid.UUID) else value
        return value

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PG_UUID
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(36))
