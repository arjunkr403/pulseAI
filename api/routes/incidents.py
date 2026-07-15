from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from db.database import get_db, Incident

router = APIRouter()

@router.get("/incidents")
def get_incidents(db: Session = Depends(get_db)): # "Depends" tell FastAPI: Before running this function, execute another function and give me its result.
    # 1. Call get_db()
    # 2. Create a database session
    # 3. Pass that session to db
    # 4. Close it after the request finishes
    
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(20).all() 
    
    #.all() eSQLAlchemy sends SQL to PostgreSQL and returns a list of SQLAlchemy objects
    # SELECT *
    # FROM incidents
    # ORDER BY created_at DESC
    # LIMIT 20;

    return incidents