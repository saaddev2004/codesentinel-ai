import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

raw_url = os.getenv("DATABASE_URL")
raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://")
raw_url = raw_url.split("?")[0]

DATABASE_URL = raw_url

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True, pool_recycle=300)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True)
    owner = Column(String, nullable=False)
    repo = Column(String, nullable=False)
    pull_number = Column(Integer, nullable=False)
    filename = Column(String, nullable=False)
    diff_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow())


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    review_id = Column(Integer, ForeignKey("reviews.id"), nullable=False)
    line = Column(Integer)
    severity = Column(String)
    category = Column(String)
    message = Column(Text)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)