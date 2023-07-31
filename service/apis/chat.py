from fastapi import APIRouter

rouetr = APIRouter(
    prefix="/chatany",
    tags=["多模型聊天"]
)

@rouetr.post("/")
async def chatAny():
    ...