from pydantic import BaseModel


class Demand(BaseModel):
    client_id: str
    demand_type: str
    payload: dict = {}
