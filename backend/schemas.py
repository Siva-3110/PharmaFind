from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: str

class UserResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int

class ExtractedMedicineResponse(BaseModel):
    id: int
    medicine_name: str
    dosage: str
    confidence_score: float
    status: str

    class Config:
        orm_mode = True

class PrescriptionResponse(BaseModel):
    prescription_id: int
    upload_date: datetime
    extracted_medicines: List[ExtractedMedicineResponse] = []

    class Config:
        orm_mode = True

class MedicineEdit(BaseModel):
    id: Optional[int] = None
    medicine_name: str
    dosage: str
    status: str
