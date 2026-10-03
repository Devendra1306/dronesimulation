import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings

logger = logging.getLogger(__name__)

class MongoDBManager:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self._connected: bool = False

    async def connect(self) -> bool:
        """Connects to MongoDB using configured URI with graceful fallback."""
        if not settings.mongodb_uri:
            logger.warning("MongoDB URI not set. Historical persistence disabled.")
            self._connected = False
            return False

        try:
            logger.info("Connecting to MongoDB...")
            self.client = AsyncIOMotorClient(
                settings.mongodb_uri,
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000
            )
            # Verify connectivity with ping
            await self.client.admin.command("ping")
            self.db = self.client[settings.mongodb_database]
            self._connected = True
            logger.info(f"MongoDB connection established to database: '{settings.mongodb_database}'")
            return True
        except Exception as e:
            logger.warning(f"MongoDB connection failed: {e}. Running in non-persistent demo mode.")
            self._connected = False
            self.client = None
            self.db = None
            return False

    async def disconnect(self):
        """Closes MongoDB connection cleanly."""
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("MongoDB connection closed.")

    @property
    def is_connected(self) -> bool:
        return self._connected and self.db is not None

    def get_database(self) -> Optional[AsyncIOMotorDatabase]:
        return self.db if self.is_connected else None

    async def check_health(self) -> dict:
        """Returns database connectivity status."""
        if not self.is_connected or not self.client:
            return {
                "connected": False,
                "database": settings.mongodb_database,
                "provider": "mongodb",
                "message": "MongoDB unavailable — historical persistence disabled; live simulation remains available."
            }

        try:
            await self.client.admin.command("ping")
            return {
                "connected": True,
                "database": settings.mongodb_database,
                "provider": "mongodb",
                "message": "Operational"
            }
        except Exception as e:
            self._connected = False
            return {
                "connected": False,
                "database": settings.mongodb_database,
                "provider": "mongodb",
                "error": str(e),
                "message": "MongoDB connection lost"
            }

mongodb_manager = MongoDBManager()
