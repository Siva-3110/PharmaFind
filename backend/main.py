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
