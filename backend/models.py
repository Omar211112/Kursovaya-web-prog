import os
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://farm_user:farm_password@db:5432/farm_db")

from sqlalchemy import create_engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Модель для животных (Поголовье)
class Animal(Base):
    __tablename__ = "animals"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    species = Column(String)
    breed = Column(String)
    birth_date = Column(Date)
    status = Column(String)

# Модель для посевов
class Crop(Base):
    __tablename__ = "crops"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    area = Column(Float)
    planting_date = Column(Date)
    expected_harvest_date = Column(Date)
    status = Column(String)

# Данные датчиков
class SensorData(Base):
    __tablename__ = "sensor_data"
    id = Column(Integer, primary_key=True, index=True)
    sensor_type = Column(String)
    value = Column(Float, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    device_id = Column(String, index=True)

# Ветеринарный учет
class VetRecord(Base):
    __tablename__ = "vet_records"
    id = Column(Integer, primary_key=True, index=True)
    animal_id = Column(Integer, ForeignKey("animals.id"))
    record_date = Column(Date, default=datetime.utcnow)
    description = Column(Text)
    treatment = Column(String)
    cost = Column(Float, default=0.0)

# Планирование работ
class WorkPlan(Base):
    __tablename__ = "work_plans"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    planned_date = Column(Date)
    is_completed = Column(Integer, default=0)

# Финансовый модуль
class FinanceRecord(Base):
    __tablename__ = "finance"
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String)
    amount = Column(Float)
    is_income = Column(Integer)
    record_date = Column(Date, default=datetime.utcnow)
    description = Column(Text)

# Модель для кормов и удобрений (Расчеты)
class Calculation(Base):
    __tablename__ = "calculations"
    id = Column(Integer, primary_key=True, index=True)
    item_type = Column(String) # Корм, Удобрение
    target_id = Column(Integer) # ID животного или посева
    quantity = Column(Float)
    unit = Column(String)
    calculation_date = Column(Date, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
