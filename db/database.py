from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, UTC
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/pulseai"
)

engine = create_engine(
    DATABASE_URL
)  # create connection bw Python and database (FastAPI -> SQLAlchemy Engine -> PostgreSQL )

SessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)  # Creates a factory that can generate database sessions. Every request gets its own session.

Base = declarative_base()  # Every table defined should inherit from this.


class Incident(
    Base
):  # without Base as argument SQLAlchemy wont know that this class represents a database table
    __tablename__ = "incidents"  # SQLAlchemy creates CREATE TABLE incidents (...)

    id = Column(
        Integer, primary_key=True, index=True      # id INTEGER PRIMARY KEY,
    )  # create database index as well for efficient searching
    thread_id = Column(String, index=True)         # thread_id VARCHAR,
    cpu_usage = Column(Float)                      # cpu_usage FLOAT,
    rps = Column(Float)                            # rps FLOAT,
    latency_p95 = Column(Float)                    # latency_p95 FLOAT,
    pod_status = Column(String)                    # pod_status VARCHAR,
    suggested_fix = Column(String)                 # suggested_fix VARCHAR,
    fix_type = Column(String, default="")          # fix_type VARCHAR,
    fix_result = Column(String, default="")        # fix_result VARCHAR,
    approved = Column(Boolean, default=False)      # approved BOOLEAN,
    executed = Column(Boolean, default=False)      # executed BOOLEAN,
    created_at = Column(                           # created_at TIMESTAMP
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )

def get_db(): # create database session for each request and ensure it is closed afterward
    db=SessionLocal()
    try:
        yield db #yield pauses the function instead of ending it.
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine) # creates all database tables defined by your SQLAlchemy models.