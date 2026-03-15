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
    is_active: bool
    
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

# --- Pharmacy Models ---

class PharmacyBase(BaseModel):
    name: str
    location: str
    phone: str
    opening_hours: str

class PharmacyCreate(PharmacyBase):
    pass

class PharmacyResponse(PharmacyBase):
    id: int
    user_id: int
    rating: float
    status: str
    
    class Config:
        from_attributes = True


class InventoryItemBase(BaseModel):
    medicine_name: str
    composition: str
    price: float
    quantity: int
    expiry_date: str
    status: str

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(InventoryItemBase):
    pass

class InventoryItemResponse(InventoryItemBase):
    id: int
    pharmacy_id: int
    
    class Config:
        from_attributes = True


class MedicineRequestBase(BaseModel):
    requested_medicines: str  # JSON string or comma-separated

class MedicineRequestCreate(MedicineRequestBase):
    pharmacy_id: int

class MedicineRequestResponse(MedicineRequestBase):
    id: int
    pharmacy_id: int
    user_id: int
    status: str
    request_date: datetime
    
    class Config:
        from_attributes = True

# --- Admin Models ---

class AdminStatsResponse(BaseModel):
    total_users: int
    total_pharmacies: int
    total_prescriptions: int
    total_medicines_dataset: int

class AdminUserUpdate(BaseModel):
    is_active: bool

class AdminPharmacyUpdate(BaseModel):
    status: str

class MedicineDatasetBase(BaseModel):
    medicine_name: str
    generic_name: str = ""
    strength: str = ""
    medicine_type: str = ""

class MedicineDatasetCreate(MedicineDatasetBase):
    pass

class MedicineDatasetResponse(MedicineDatasetBase):
    id: int
    
    class Config:
        from_attributes = True

class WeeklyUploadStats(BaseModel):
    day: str
    uploads: int
    height: str

class TopMedicineStats(BaseModel):
    name: str
    count: int

class AdminAnalyticsResponse(BaseModel):
    weeklyData: List[WeeklyUploadStats]
    topMedicines: List[TopMedicineStats]
