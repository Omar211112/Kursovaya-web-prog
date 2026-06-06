from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, mqtt_client
from models import SessionLocal, init_db
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Farm Management System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    init_db()
    mqtt_client.start_mqtt()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Поголовье
@app.get("/animals", response_model=List[schemas.AnimalSchema])
def get_animals(db: Session = Depends(get_db)):
    return db.query(models.Animal).all()

@app.post("/animals", response_model=schemas.AnimalSchema)
def create_animal(animal: schemas.AnimalCreate, db: Session = Depends(get_db)):
    db_animal = models.Animal(**animal.dict())
    db.add(db_animal)
    db.commit()
    db.refresh(db_animal)
    return db_animal

@app.delete("/animals/{item_id}")
def delete_animal(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Animal).filter(models.Animal.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Посевы
@app.get("/crops", response_model=List[schemas.CropSchema])
def get_crops(db: Session = Depends(get_db)):
    return db.query(models.Crop).all()

@app.post("/crops", response_model=schemas.CropSchema)
def create_crop(crop: schemas.CropCreate, db: Session = Depends(get_db)):
    db_crop = models.Crop(**crop.dict())
    db.add(db_crop)
    db.commit()
    db.refresh(db_crop)
    return db_crop

@app.delete("/crops/{item_id}")
def delete_crop(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Crop).filter(models.Crop.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Ветеринария
@app.get("/vet", response_model=List[schemas.VetRecordSchema])
def get_vet_records(db: Session = Depends(get_db)):
    return db.query(models.VetRecord).all()

@app.post("/vet", response_model=schemas.VetRecordSchema)
def create_vet_record(record: schemas.VetRecordCreate, db: Session = Depends(get_db)):
    db_record = models.VetRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.delete("/vet/{item_id}")
def delete_vet_record(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.VetRecord).filter(models.VetRecord.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Планирование
@app.get("/tasks", response_model=List[schemas.WorkPlanSchema])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.WorkPlan).all()

@app.post("/tasks", response_model=schemas.WorkPlanSchema)
def create_task(task: schemas.WorkPlanCreate, db: Session = Depends(get_db)):
    db_task = models.WorkPlan(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/tasks/{item_id}")
def delete_task(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.WorkPlan).filter(models.WorkPlan.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Финансы
@app.get("/finance", response_model=List[schemas.FinanceSchema])
def get_finance(db: Session = Depends(get_db)):
    return db.query(models.FinanceRecord).all()

@app.post("/finance", response_model=schemas.FinanceSchema)
def create_finance(record: schemas.FinanceCreate, db: Session = Depends(get_db)):
    db_record = models.FinanceRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.delete("/finance/{item_id}")
def delete_finance(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.FinanceRecord).filter(models.FinanceRecord.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Расчеты кормов/удобрений
@app.get("/calculations", response_model=List[schemas.CalculationSchema])
def get_calculations(db: Session = Depends(get_db)):
    return db.query(models.Calculation).all()

@app.post("/calculations", response_model=schemas.CalculationSchema)
def create_calculation(calc: schemas.CalculationCreate, db: Session = Depends(get_db)):
    db_calc = models.Calculation(**calc.dict())
    db.add(db_calc)
    db.commit()
    db.refresh(db_calc)
    return db_calc

@app.delete("/calculations/{item_id}")
def delete_calculation(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.Calculation).filter(models.Calculation.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"ok": True}

# Датчики
@app.get("/sensors", response_model=List[schemas.SensorDataSchema])
def get_sensor_data(sensor_type: str = None, db: Session = Depends(get_db)):
    query = db.query(models.SensorData)
    if sensor_type:
        query = query.filter(models.SensorData.sensor_type == sensor_type)
    return query.order_by(models.SensorData.timestamp.desc()).limit(100).all()
