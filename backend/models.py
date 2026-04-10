from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    password_hash = Column(String)
    role = Column(String) # 'Customer', 'Pharmacy Owner', 'Admin'
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    prescriptions = relationship("Prescription", back_populates="user")
    # Added relationship to Pharmacy profile
    pharmacy_profile = relationship("Pharmacy", uselist=False, back_populates="user")


class Pharmacy(Base):
    __tablename__ = "pharmacies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True)
    name = Column(String, index=True)
    location = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    phone = Column(String)
    opening_hours = Column(String)
    rating = Column(Float, default=4.5)
    status = Column(String, default="Approved") # 'Approved', 'Pending', 'Suspended'
    is_active = Column(Boolean, default=True)
    
    user = relationship("User", back_populates="pharmacy_profile")
    inventory = relationship("InventoryItem", back_populates="pharmacy")
    requests = relationship("MedicineRequest", back_populates="pharmacy")


class InventoryItem(Base):
    __tablename__ = "inventory_items"
    
    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"))
    medicine_name = Column(String, index=True)
    composition = Column(String)
    price = Column(Float)
    quantity = Column(Integer, default=0)
    expiry_date = Column(String)
    status = Column(String, default="Available") # 'Available', 'Out of Stock'
    
    pharmacy = relationship("Pharmacy", back_populates="inventory")


class MedicineRequest(Base):
    __tablename__ = "medicine_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    pharmacy_id = Column(Integer, ForeignKey("pharmacies.id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    prescription_id = Column(Integer, ForeignKey("prescriptions.prescription_id"), nullable=True)
    requested_medicines = Column(String) # JSON or comma-separated list
    status = Column(String, default="Pending") # 'Pending', 'accepted', 'rejected'
    request_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    pharmacy = relationship("Pharmacy", back_populates="requests")
    user = relationship("User")
    prescription = relationship("Prescription")


class Prescription(Base):
    __tablename__ = "prescriptions"
    
    prescription_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    image_path = Column(String)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="prescriptions")
    extracted_medicines = relationship("ExtractedMedicine", back_populates="prescription")


class MedicineDataset(Base):
    __tablename__ = "medicines_dataset"
    
    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String, index=True)
    generic_name = Column(String)
    strength = Column(String)
    medicine_type = Column(String)


class ExtractedMedicine(Base):
    __tablename__ = "extracted_medicines"
    
    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.prescription_id"))
    medicine_name = Column(String)
    dosage = Column(String)
    confidence_score = Column(Float)
    status = Column(String, default="Predicted") # 'Predicted', 'Confirmed'
    
    prescription = relationship("Prescription", back_populates="extracted_medicines")
