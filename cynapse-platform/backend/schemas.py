from pydantic import BaseModel
from typing import Optional

class FeatureBase(BaseModel):
    id: str
    title: str
    description: str
    region: str
    industry: str
    status: str
    rice_score: float
    compliance_status: str

class FeatureCreate(FeatureBase):
    pass

class Feature(FeatureBase):
    node1_analysis: Optional[str] = None
    node2_analysis: Optional[str] = None

    class Config:
        from_attributes = True