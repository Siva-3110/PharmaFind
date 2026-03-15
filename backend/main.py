from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import timedelta

import models, schemas, auth, database
from ocr_engine import run_ocr_pipeline
from predictor import predict_unknown_medicine

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="PharmaFind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for prototype
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth Routes
@app.post("/signup", response_model=schemas.UserResponse)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    # Assuming email is passed as username
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "user_id": user.user_id}

# Prescription Routes
os.makedirs("uploads", exist_ok=True)

@app.post("/upload-prescription", response_model=schemas.PrescriptionResponse)
def upload_prescription(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    # Save Image
    file_location = f"uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # Create DB Entry
    db_prescription = models.Prescription(user_id=user_id, image_path=file_location)
    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)
    
    # Run OCR Pipeline
    extracted_data = run_ocr_pipeline(file_location)
    
    # Save extracted medicines
    for item in extracted_data:
        db_med = models.ExtractedMedicine(
            prescription_id=db_prescription.prescription_id,
            medicine_name=item["medicine_name"],
            dosage=item["dosage"],
            confidence_score=item["confidence_score"]
        )
        db.add(db_med)
        
    db.commit()
    db.refresh(db_prescription)
    
    return db_prescription

@app.get("/predict-unknown/{prescription_id}")
def predict_unknown(prescription_id: int, db: Session = Depends(database.get_db)):
    extracted = db.query(models.ExtractedMedicine).filter(models.ExtractedMedicine.prescription_id == prescription_id).all()
    
    # Find known medicines to base prediction on
    known_medicines = [m.medicine_name for m in extracted if m.medicine_name != "Unknown" and m.confidence_score > 60]
    
    predictions = predict_unknown_medicine(db, known_medicines)
    return {"predictions": predictions}

@app.post("/update-medicines/{prescription_id}")
def update_medicines(prescription_id: int, updates: List[schemas.MedicineEdit], db: Session = Depends(database.get_db)):
    # Clear existing
    db.query(models.ExtractedMedicine).filter(models.ExtractedMedicine.prescription_id == prescription_id).delete()
    
    for edit in updates:
        db_med = models.ExtractedMedicine(
            prescription_id=prescription_id,
            medicine_name=edit.medicine_name,
            dosage=edit.dosage,
            confidence_score=100.0,
            status=edit.status
        )
        db.add(db_med)
        
    db.commit()
    return {"message": "Medicines updated successfully"}

@app.get("/prescriptions/{user_id}", response_model=List[schemas.PrescriptionResponse])
def get_user_prescriptions(user_id: int, db: Session = Depends(database.get_db)):
    prescriptions = db.query(models.Prescription).filter(models.Prescription.user_id == user_id).all()
    return prescriptions


# ==========================================
# PHARMACY OWNER DASHBOARD ROUTES
# ==========================================

@app.get('/api/pharmacy/profile', response_model=schemas.PharmacyResponse)
def get_pharmacy_profile(user_id: int, db: Session = Depends(database.get_db)):
    pharmacy = db.query(models.Pharmacy).filter(models.Pharmacy.user_id == user_id).first()
    if not pharmacy:
        pharmacy = models.Pharmacy(user_id=user_id, name='My Pharmacy', location='', phone='', opening_hours='')
        db.add(pharmacy)
        db.commit()
        db.refresh(pharmacy)
    return pharmacy

@app.put('/api/pharmacy/profile', response_model=schemas.PharmacyResponse)
def update_pharmacy_profile(user_id: int, profile: schemas.PharmacyBase, db: Session = Depends(database.get_db)):
    pharmacy = db.query(models.Pharmacy).filter(models.Pharmacy.user_id == user_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail='Pharmacy profile not found')
    
    for key, value in profile.model_dump().items():
        setattr(pharmacy, key, value)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy

@app.get('/api/pharmacy/inventory', response_model=list[schemas.InventoryItemResponse])
def get_inventory(pharmacy_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.InventoryItem).filter(models.InventoryItem.pharmacy_id == pharmacy_id).all()

@app.post('/api/pharmacy/inventory', response_model=schemas.InventoryItemResponse)
def add_inventory_item(pharmacy_id: int, item: schemas.InventoryItemCreate, db: Session = Depends(database.get_db)):
    db_item = models.InventoryItem(**item.model_dump(), pharmacy_id=pharmacy_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.put('/api/pharmacy/inventory/{item_id}', response_model=schemas.InventoryItemResponse)
def update_inventory_item(item_id: int, item: schemas.InventoryItemUpdate, db: Session = Depends(database.get_db)):
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
        
    for key, value in item.model_dump().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete('/api/pharmacy/inventory/{item_id}')
def delete_inventory_item(item_id: int, db: Session = Depends(database.get_db)):
    db_item = db.query(models.InventoryItem).filter(models.InventoryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail='Item not found')
    db.delete(db_item)
    db.commit()
    return {'status': 'success'}

import json

@app.post('/create-request', response_model=schemas.MedicineRequestResponse)
def create_medicine_request(request: schemas.MedicineRequestCreate, db: Session = Depends(database.get_db)):
    # Validate customer and pharmacy
    customer = db.query(models.User).filter(models.User.user_id == request.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail='Customer not found')
        
    pharmacy = db.query(models.Pharmacy).filter(models.Pharmacy.id == request.pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail='Pharmacy not found')
        
    db_req = models.MedicineRequest(
        user_id=request.customer_id,
        pharmacy_id=request.pharmacy_id,
        prescription_id=request.prescription_id,
        requested_medicines=json.dumps(request.medicines),
        status='Pending'
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

@app.get('/api/pharmacy/requests/{pharmacy_id}', response_model=list[schemas.PharmacyMedicineRequestResponse])
def get_pharmacy_requests(pharmacy_id: int, db: Session = Depends(database.get_db)):
    requests = db.query(models.MedicineRequest, models.User).join(
        models.User, models.MedicineRequest.user_id == models.User.user_id
    ).filter(models.MedicineRequest.pharmacy_id == pharmacy_id).all()
    
    result = []
    for req, user in requests:
        resp_dict = schemas.MedicineRequestResponse.model_validate(req).model_dump()
        resp_dict['customer_name'] = user.name
        result.append(resp_dict)
        
    return result

@app.get('/customer/requests/{customer_id}', response_model=list[schemas.MedicineRequestResponse])
def get_customer_requests(customer_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.MedicineRequest).filter(models.MedicineRequest.user_id == customer_id).all()

@app.post('/request/accept/{request_id}')
def accept_request(request_id: int, db: Session = Depends(database.get_db)):
    req = db.query(models.MedicineRequest).filter(models.MedicineRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail='Request not found')
    req.status = 'Accepted'
    db.commit()
    return {'status': 'success'}

@app.post('/request/reject/{request_id}')
def reject_request(request_id: int, db: Session = Depends(database.get_db)):
    req = db.query(models.MedicineRequest).filter(models.MedicineRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail='Request not found')
    req.status = 'Rejected'
    db.commit()
    return {'status': 'success'}

# --- Admin Endpoints ---

@app.get('/api/admin/stats', response_model=schemas.AdminStatsResponse)
def get_admin_stats(db: Session = Depends(database.get_db)):
    users = db.query(models.User).count()
    pharmacies = db.query(models.Pharmacy).count()
    prescriptions = db.query(models.Prescription).count()
    medicines = db.query(models.MedicineDataset).count()
    return {
        "total_users": users,
        "total_pharmacies": pharmacies,
        "total_prescriptions": prescriptions,
        "total_medicines_dataset": medicines
    }

from sqlalchemy import func
from datetime import datetime, timedelta

@app.get('/api/admin/analytics', response_model=schemas.AdminAnalyticsResponse)
def get_admin_analytics(db: Session = Depends(database.get_db)):
    # 1. Weekly Upload Stats (last 7 days mapping)
    # Using python to group to be SQL dialect agnostic for SQLite
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_prescriptions = db.query(models.Prescription).filter(models.Prescription.upload_date >= seven_days_ago).all()
    
    # Map day names
    day_counts = { (datetime.utcnow() - timedelta(days=i)).strftime('%A')[:3]: 0 for i in range(6, -1, -1) }
    
    for p in recent_prescriptions:
        day_str = p.upload_date.strftime('%A')[:3]
        if day_str in day_counts:
            day_counts[day_str] += 1
            
    # Calculate heights relative to max
    max_uploads = max(day_counts.values()) if day_counts.values() else 1
    weekly_data = [
        {"day": day, "uploads": count, "height": f"{max(10, int((count / max_uploads) * 100))}%"}
        for day, count in day_counts.items()
    ]
    
    # 2. Top Extracted Medicines
    top_meds_query = db.query(
        models.ExtractedMedicine.medicine_name,
        func.count(models.ExtractedMedicine.id).label('count')
    ).group_by(models.ExtractedMedicine.medicine_name).order_by(func.count(models.ExtractedMedicine.id).desc()).limit(5).all()
    
    top_medicines = [{"name": name, "count": count} for name, count in top_meds_query]
    
    return {
        "weeklyData": weekly_data,
        "topMedicines": top_medicines
    }

@app.get('/api/admin/users', response_model=list[schemas.UserResponse])
def get_all_users(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@app.put('/api/admin/users/{user_id}/status')
def update_user_status(user_id: int, status_update: schemas.AdminUserUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = status_update.is_active
    db.commit()
    return {"status": "success"}

@app.delete('/api/admin/users/{user_id}')
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Cascade delete prescriptions and extracted medicines
    prescriptions = db.query(models.Prescription).filter(models.Prescription.user_id == user_id).all()
    for p in prescriptions:
        db.query(models.ExtractedMedicine).filter(models.ExtractedMedicine.prescription_id == p.prescription_id).delete()
        db.delete(p)
        
    # Cascade delete pharmacy content if owner
    if user.role == "Pharmacy Owner":
        pharmacy = db.query(models.Pharmacy).filter(models.Pharmacy.user_id == user_id).first()
        if pharmacy:
            db.query(models.InventoryItem).filter(models.InventoryItem.pharmacy_id == pharmacy.id).delete()
            db.query(models.MedicineRequest).filter(models.MedicineRequest.pharmacy_id == pharmacy.id).delete()
            db.delete(pharmacy)
            
    db.delete(user)
    db.commit()
    return {"status": "success"}

@app.get('/api/admin/pharmacies', response_model=list[schemas.PharmacyResponse])
def get_all_pharmacies(db: Session = Depends(database.get_db)):
    return db.query(models.Pharmacy).all()

@app.put('/api/admin/pharmacies/{pharmacy_id}/status')
def update_pharmacy_status(pharmacy_id: int, status_update: schemas.AdminPharmacyUpdate, db: Session = Depends(database.get_db)):
    pharm = db.query(models.Pharmacy).filter(models.Pharmacy.id == pharmacy_id).first()
    if not pharm:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    pharm.status = status_update.status
    db.commit()
    return {"status": "success"}

@app.delete('/api/admin/pharmacies/{pharmacy_id}')
def delete_pharmacy(pharmacy_id: int, db: Session = Depends(database.get_db)):
    pharm = db.query(models.Pharmacy).filter(models.Pharmacy.id == pharmacy_id).first()
    if not pharm:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    db.query(models.InventoryItem).filter(models.InventoryItem.pharmacy_id == pharmacy_id).delete()
    db.query(models.MedicineRequest).filter(models.MedicineRequest.pharmacy_id == pharmacy_id).delete()
    db.delete(pharm)
    db.commit()
    return {"status": "success"}

@app.get('/api/admin/prescriptions', response_model=list[schemas.PrescriptionResponse])
def get_all_prescriptions(db: Session = Depends(database.get_db)):
    return db.query(models.Prescription).all()

@app.post('/api/admin/dataset/upload')
async def upload_dataset(file: UploadFile = File(...)):
    file_location = f"data/{file.filename}"
    os.makedirs("data", exist_ok=True)
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # In a full production app, you would parse the CSV here and 
    # refresh the models.MedicineDataset entries in the DB.
    # For now, we simply save it to disk.
    import pandas as pd
    try:
        df = pd.read_csv(file_location)
        db = next(database.get_db())
        for _, row in df.head(500).iterrows(): # Add a chunk for demonstration
            med = models.MedicineDataset(
                medicine_name=str(row.get('Medicine Name', row.get('name', 'Unknown'))),
                generic_name=str(row.get('Composition', '')),
            )
            db.add(med)
        db.commit()
    except Exception as e:
        print("CSV processing skipped:", e)
        
    return {"info": f"file '{file.filename}' saved at '{file_location}' successfully."}

@app.get('/api/admin/medicines', response_model=list[schemas.MedicineDatasetResponse])
def get_medicines_list(skip: int = 0, limit: int = 50, db: Session = Depends(database.get_db)):
    return db.query(models.MedicineDataset).offset(skip).limit(limit).all()

@app.post('/api/admin/medicines', response_model=schemas.MedicineDatasetResponse)
def add_medicine(med: schemas.MedicineDatasetCreate, db: Session = Depends(database.get_db)):
    db_med = models.MedicineDataset(**med.model_dump())
    db.add(db_med)
    db.commit()
    db.refresh(db_med)
    return db_med

@app.delete('/api/admin/medicines/{med_id}')
def delete_medicine(med_id: int, db: Session = Depends(database.get_db)):
    db_med = db.query(models.MedicineDataset).filter(models.MedicineDataset.id == med_id).first()
    if not db_med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(db_med)
    db.commit()
    return {"status": "success"}
