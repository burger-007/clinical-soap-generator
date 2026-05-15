from enum import Enum

class SoapStatus(str, Enum):
    IDLE = "IDLE"
    READY = "READY"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    NEEDS_REVIEW = "NEEDS_REVIEW"