from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
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
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    prescriptions = relationship("Prescription", back_populates="user")


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
