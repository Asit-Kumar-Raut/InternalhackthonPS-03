from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base


class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    from_junction_id = Column(Integer, ForeignKey("junctions.id"), nullable=False)
    to_junction_id = Column(Integer, ForeignKey("junctions.id"), nullable=False)
    length_m = Column(Float, nullable=False)
    lanes = Column(Integer, default=2)
    capacity = Column(Integer, default=100)
    name = Column(String, nullable=True)
