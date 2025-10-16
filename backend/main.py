from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from decimal import Decimal
from dotenv import load_dotenv
from pathlib import Path
import json

# Load environment variables from a .env file if present (makes local dev easier)
load_dotenv()

# File-backed fallback campaigns used when DB is unavailable (local dev convenience)
FALLBACK_FILE = Path(__file__).parent / "fallback_data.json"
if FALLBACK_FILE.exists():
    try:
        with open(FALLBACK_FILE, "r", encoding="utf-8") as f:
            FALLBACK_CAMPAIGNS = json.load(f)
    except Exception:
        # If file is corrupted or unreadable, start with defaults
        FALLBACK_CAMPAIGNS = [
            {"id": 1, "campaign_name": "Sample Campaign A", "status": "Active", "clicks": 100, "cost": 50.0, "impressions": 1000},
            {"id": 2, "campaign_name": "Sample Campaign B", "status": "Paused", "clicks": 50, "cost": 25.0, "impressions": 500},
            {"id": 3, "campaign_name": "Sample Campaign C", "status": "Active", "clicks": 200, "cost": 120.0, "impressions": 3000},
        ]
else:
    FALLBACK_CAMPAIGNS = [
        {"id": 1, "campaign_name": "Sample Campaign A", "status": "Active", "clicks": 100, "cost": 50.0, "impressions": 1000},
        {"id": 2, "campaign_name": "Sample Campaign B", "status": "Paused", "clicks": 50, "cost": 25.0, "impressions": 500},
        {"id": 3, "campaign_name": "Sample Campaign C", "status": "Active", "clicks": 200, "cost": 120.0, "impressions": 3000},
    ]

app = FastAPI(title="Campaign Analytics API")

# Enable CORS so frontend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection function
def get_db_connection():
    """
    Connects to PostgreSQL database using environment variables
    DATABASE_URL format: postgresql://user:password@host:port/dbname
    """
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        # Fallback for local development
        database_url = "postgresql://localhost/cam"
    
    conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
    return conn

# Pydantic model for response validation
class Campaign(BaseModel):
    id: int
    campaign_name: str
    status: str
    clicks: int
    cost: float
    impressions: int

    class Config:
        from_attributes = True


class CampaignCreate(BaseModel):
    campaign_name: str
    status: str
    clicks: int = 0
    cost: float = 0.0
    impressions: int = 0

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"message": "Campaign Analytics API is running", "status": "healthy"}

@app.get("/campaigns", response_model=List[Campaign])
def get_campaigns(status: Optional[str] = None):
    """
    Get all campaigns or filter by status
    
    Parameters:
    - status (optional): Filter by 'Active' or 'Paused'
    
    Returns:
    - List of campaigns with all details
    """
    # Use the global FALLBACK_CAMPAIGNS defined at module level so created items persist in-memory
    # (local dev convenience)
    fallback_campaigns = FALLBACK_CAMPAIGNS

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Build query based on filter
        if status and status in ['Active', 'Paused']:
            query = "SELECT * FROM campaigns WHERE status = %s ORDER BY id"
            cursor.execute(query, (status,))
        else:
            query = "SELECT * FROM campaigns ORDER BY id"
            cursor.execute(query)

        campaigns = cursor.fetchall()

        # Convert Decimal to float for JSON serialization and build plain dicts
        serializable = []
        for campaign in campaigns:
            c = dict(campaign)
            if isinstance(c.get('cost'), Decimal):
                c['cost'] = float(c['cost'])
            serializable.append(c)

        # Update fallback cache on successful DB read
        try:
            FALLBACK_CAMPAIGNS.clear()
            FALLBACK_CAMPAIGNS.extend(serializable)
            with open(FALLBACK_FILE, 'w', encoding='utf-8') as f:
                json.dump(FALLBACK_CAMPAIGNS, f)
        except Exception:
            pass

        cursor.close()
        conn.close()

        return serializable

    except psycopg2.Error as e:
        # Log the error server-side and return fallback data for development
        app.logger = getattr(app, 'logger', None)
        if app.logger:
            app.logger.error(f"Database error: {str(e)}")
        # Filter fallback if status provided
        if status and status in ['Active', 'Paused']:
            return [c for c in fallback_campaigns if c['status'] == status]
        return fallback_campaigns
    except Exception as e:
        app.logger = getattr(app, 'logger', None)
        if app.logger:
            app.logger.error(f"Server error: {str(e)}")
        # Return fallback dataset on unexpected errors too
        if status and status in ['Active', 'Paused']:
            return [c for c in fallback_campaigns if c['status'] == status]
        return fallback_campaigns

@app.get("/campaigns/{campaign_id}", response_model=Campaign)
def get_campaign(campaign_id: int):
    """Get a single campaign by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM campaigns WHERE id = %s", (campaign_id,))
        campaign = cursor.fetchone()
        
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        # Convert Decimal to float
        if isinstance(campaign['cost'], Decimal):
            campaign['cost'] = float(campaign['cost'])
        
        cursor.close()
        conn.close()
        
        return campaign
    
    except psycopg2.Error as e:
        # If DB is unavailable, try to find campaign in fallback list
        app.logger = getattr(app, 'logger', None)
        if app.logger:
            app.logger.error(f"Database error: {str(e)}")
        for c in FALLBACK_CAMPAIGNS:
            if c['id'] == campaign_id:
                # Convert cost if necessary (already float in fallback)
                return c
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/campaigns", response_model=Campaign)
def create_campaign(payload: CampaignCreate):
    """Create a new campaign. Tries DB insert, falls back to in-memory list on DB error."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        insert_q = "INSERT INTO campaigns (campaign_name, status, clicks, cost, impressions) VALUES (%s, %s, %s, %s, %s) RETURNING id"
        cursor.execute(insert_q, (payload.campaign_name, payload.status, payload.clicks, payload.cost, payload.impressions))
        new_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()

        new_obj = {
            "id": new_id,
            "campaign_name": payload.campaign_name,
            "status": payload.status,
            "clicks": payload.clicks,
            "cost": payload.cost,
            "impressions": payload.impressions,
        }
        # Also update fallback cache to keep it in sync with DB
        try:
            FALLBACK_CAMPAIGNS.append(new_obj)
            with open(FALLBACK_FILE, 'w', encoding='utf-8') as f:
                json.dump(FALLBACK_CAMPAIGNS, f)
        except Exception:
            pass

        return new_obj

    except psycopg2.Error as e:
        # Fallback: add to in-memory list
        max_id = max([c['id'] for c in FALLBACK_CAMPAIGNS]) if FALLBACK_CAMPAIGNS else 0
        new_id = max_id + 1
        new_c = {
            "id": new_id,
            "campaign_name": payload.campaign_name,
            "status": payload.status,
            "clicks": payload.clicks,
            "cost": payload.cost,
            "impressions": payload.impressions,
        }
        FALLBACK_CAMPAIGNS.append(new_c)
        # Persist fallback list to disk so created items survive restarts
        try:
            with open(FALLBACK_FILE, "w", encoding="utf-8") as f:
                json.dump(FALLBACK_CAMPAIGNS, f)
        except Exception:
            pass
        return new_c


@app.get("/fallback")
def read_fallback():
    """Debug: return current fallback campaigns"""
    return FALLBACK_CAMPAIGNS

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)