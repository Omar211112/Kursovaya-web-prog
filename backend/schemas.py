from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class AnimalBase(BaseModel):
    name: str
    species: str
    breed: Optional[str] = None
    birth_date: Optional[date] = None
    status: str

class AnimalCreate(AnimalBase):
    pass

class AnimalSchema(AnimalBase):
    id: int
    class Config:
        from_attributes = True

class CropBase(BaseModel):
    name: str
    area: float
    planting_date: Optional[date] = None
    expected_harvest_date: Optional[date] = None
    status: str

class CropCreate(CropBase):
    pass

class CropSchema(CropBase):
    id: int
    class Config:
        from_attributes = True

class SensorDataSchema(BaseModel):
    sensor_type: str
    value: Optional[float] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime
    device_id: str
    class Config:
        from_attributes = True

class VetRecordBase(BaseModel):
    animal_id: int
    description: str
    treatment: str
    cost: float = 0.0
    record_date: date

class VetRecordCreate(VetRecordBase):
    pass

class VetRecordSchema(VetRecordBase):
    id: int
    class Config:
        from_attributes = True

class WorkPlanBase(BaseModel):
    title: str
    description: Optional[str] = None
    planned_date: date
    is_completed: int = 0

class WorkPlanCreate(WorkPlanBase):
    pass

class WorkPlanSchema(WorkPlanBase):
    id: int
    class Config:
        from_attributes = True

class FinanceBase(BaseModel):
    category: str
    amount: float
    is_income: int
    record_date: date
    description: Optional[str] = None

class FinanceCreate(FinanceBase):
    pass

class FinanceSchema(FinanceBase):
    id: int
    class Config:
        from_attributes = True

class CalculationBase(BaseModel):
    item_type: str
    target_id: int
    quantity: float
    unit: str
    calculation_date: date

class CalculationCreate(CalculationBase):
    pass

class CalculationSchema(CalculationBase):
    id: int
    class Config:
        from_attributes = True
