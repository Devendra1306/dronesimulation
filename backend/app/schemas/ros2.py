from pydantic import BaseModel
from typing import List

class Ros2Node(BaseModel):
    name: str
    namespace: str
    status: str
    published_topics: List[str]
    subscribed_topics: List[str]
    source: str

class Ros2Topic(BaseModel):
    name: str
    type: str
    publisher: str
    subscribers: List[str]
    rate: float
    status: str
    last_received: float
    source: str
