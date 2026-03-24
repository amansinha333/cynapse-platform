from sqlalchemy import Column, String, Text, Float
from database import Base

class Feature(Base):
    __tablename__ = "features"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    region = Column(String)
    industry = Column(String)
    status = Column(String, default="Discovery")
    rice_score = Column(Float, default=0.0)
    compliance_status = Column(String, default="Pending")
    
    node1_analysis = Column(Text, nullable=True)
    node2_analysis = Column(Text, nullable=True)