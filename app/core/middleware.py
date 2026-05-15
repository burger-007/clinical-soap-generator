# app/core/middleware.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def setup_middleware(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],   # 上線時改為指定域名
        allow_methods=["*"],
        allow_headers=["*"],
    )
